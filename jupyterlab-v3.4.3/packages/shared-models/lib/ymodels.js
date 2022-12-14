/* -----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
import { UUID } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';
import { Awareness } from 'y-protocols/awareness';
import * as Y from 'yjs';
const deepCopy = (o) => JSON.parse(JSON.stringify(o));
export class YDocument {
    constructor() {
        this.isDisposed = false;
        this.ydoc = new Y.Doc();
        this.source = this.ydoc.getText('source');
        this.ystate = this.ydoc.getMap('state');
        this.undoManager = new Y.UndoManager([this.source], {
            trackedOrigins: new Set([this])
        });
        this.awareness = new Awareness(this.ydoc);
        this._changed = new Signal(this);
    }
    get dirty() {
        return this.ystate.get('dirty');
    }
    set dirty(value) {
        this.transact(() => {
            this.ystate.set('dirty', value);
        }, false);
    }
    /**
     * Perform a transaction. While the function f is called, all changes to the shared
     * document are bundled into a single event.
     */
    transact(f, undoable = true) {
        this.ydoc.transact(f, undoable ? this : null);
    }
    /**
     * Dispose of the resources.
     */
    dispose() {
        this.isDisposed = true;
        this.ydoc.destroy();
    }
    /**
     * Whether the object can undo changes.
     */
    canUndo() {
        return this.undoManager.undoStack.length > 0;
    }
    /**
     * Whether the object can redo changes.
     */
    canRedo() {
        return this.undoManager.redoStack.length > 0;
    }
    /**
     * Undo an operation.
     */
    undo() {
        this.undoManager.undo();
    }
    /**
     * Redo an operation.
     */
    redo() {
        this.undoManager.redo();
    }
    /**
     * Clear the change stack.
     */
    clearUndoHistory() {
        this.undoManager.clear();
    }
    /**
     * The changed signal.
     */
    get changed() {
        return this._changed;
    }
}
export class YFile extends YDocument {
    constructor() {
        super();
        /**
         * Handle a change to the ymodel.
         */
        this._modelObserver = (event) => {
            const changes = {};
            changes.sourceChange = event.changes.delta;
            this._changed.emit(changes);
        };
        /**
         * Handle a change to the ystate.
         */
        this._onStateChanged = (event) => {
            const stateChange = [];
            event.keysChanged.forEach(key => {
                const change = event.changes.keys.get(key);
                if (change) {
                    stateChange.push({
                        name: key,
                        oldValue: change.oldValue,
                        newValue: this.ystate.get(key)
                    });
                }
            });
            this._changed.emit({ stateChange });
        };
        this.ysource = this.ydoc.getText('source');
        this.ysource.observe(this._modelObserver);
        this.ystate.observe(this._onStateChanged);
    }
    /**
     * Dispose of the resources.
     */
    dispose() {
        this.ysource.unobserve(this._modelObserver);
        this.ystate.unobserve(this._onStateChanged);
    }
    static create() {
        return new YFile();
    }
    /**
     * Gets cell's source.
     *
     * @returns Cell's source.
     */
    getSource() {
        return this.ysource.toString();
    }
    /**
     * Sets cell's source.
     *
     * @param value: New source.
     */
    setSource(value) {
        this.transact(() => {
            const ytext = this.ysource;
            ytext.delete(0, ytext.length);
            ytext.insert(0, value);
        });
    }
    /**
     * Replace content from `start' to `end` with `value`.
     *
     * @param start: The start index of the range to replace (inclusive).
     *
     * @param end: The end index of the range to replace (exclusive).
     *
     * @param value: New source (optional).
     */
    updateSource(start, end, value = '') {
        this.transact(() => {
            const ysource = this.ysource;
            // insert and then delete.
            // This ensures that the cursor position is adjusted after the replaced content.
            ysource.insert(start, value);
            ysource.delete(start + value.length, end - start);
        });
    }
}
/**
 * Shared implementation of the Shared Document types.
 *
 * Shared cells can be inserted into a SharedNotebook.
 * Shared cells only start emitting events when they are connected to a SharedNotebook.
 *
 * "Standalone" cells must not be inserted into a (Shared)Notebook.
 * Standalone cells emit events immediately after they have been created, but they must not
 * be included into a (Shared)Notebook.
 */
export class YNotebook extends YDocument {
    constructor(options) {
        super();
        /**
         * Handle a change to the list of cells.
         */
        this._onYCellsChanged = (event) => {
            // update the type???cell mapping by iterating through the added/removed types
            event.changes.added.forEach(item => {
                const type = item.content.type;
                if (!this._ycellMapping.has(type)) {
                    this._ycellMapping.set(type, createCellFromType(type));
                }
                const cell = this._ycellMapping.get(type);
                cell._notebook = this;
                if (!this.disableDocumentWideUndoRedo) {
                    cell._undoManager = this.undoManager;
                }
                else {
                    cell._undoManager = new Y.UndoManager([cell.ymodel], {});
                }
            });
            event.changes.deleted.forEach(item => {
                const type = item.content.type;
                const model = this._ycellMapping.get(type);
                if (model) {
                    model.dispose();
                    this._ycellMapping.delete(type);
                }
            });
            let index = 0;
            // this reflects the event.changes.delta, but replaces the content of delta.insert with ycells
            const cellsChange = [];
            event.changes.delta.forEach((d) => {
                if (d.insert != null) {
                    const insertedCells = d.insert.map((ycell) => this._ycellMapping.get(ycell));
                    cellsChange.push({ insert: insertedCells });
                    this.cells.splice(index, 0, ...insertedCells);
                    index += d.insert.length;
                }
                else if (d.delete != null) {
                    cellsChange.push(d);
                    this.cells.splice(index, d.delete);
                }
                else if (d.retain != null) {
                    cellsChange.push(d);
                    index += d.retain;
                }
            });
            this._changed.emit({
                cellsChange: cellsChange
            });
        };
        /**
         * Handle a change to the ystate.
         */
        this._onMetadataChanged = (event) => {
            if (event.keysChanged.has('metadata')) {
                const change = event.changes.keys.get('metadata');
                const metadataChange = {
                    oldValue: (change === null || change === void 0 ? void 0 : change.oldValue) ? change.oldValue : undefined,
                    newValue: this.getMetadata()
                };
                this._changed.emit({ metadataChange });
            }
        };
        /**
         * Handle a change to the ystate.
         */
        this._onStateChanged = (event) => {
            const stateChange = [];
            event.keysChanged.forEach(key => {
                const change = event.changes.keys.get(key);
                if (change) {
                    stateChange.push({
                        name: key,
                        oldValue: change.oldValue,
                        newValue: this.ystate.get(key)
                    });
                }
            });
            this._changed.emit({ stateChange });
        };
        this.ycells = this.ydoc.getArray('cells');
        this.ymeta = this.ydoc.getMap('meta');
        this.ymodel = this.ydoc.getMap('model');
        this.undoManager = new Y.UndoManager([this.ycells], {
            trackedOrigins: new Set([this])
        });
        this._ycellMapping = new Map();
        this._disableDocumentWideUndoRedo = options.disableDocumentWideUndoRedo;
        this.ycells.observe(this._onYCellsChanged);
        this.cells = this.ycells.toArray().map(ycell => {
            if (!this._ycellMapping.has(ycell)) {
                this._ycellMapping.set(ycell, createCellFromType(ycell));
            }
            return this._ycellMapping.get(ycell);
        });
        this.ymeta.observe(this._onMetadataChanged);
        this.ystate.observe(this._onStateChanged);
    }
    get nbformat() {
        return this.ystate.get('nbformat');
    }
    set nbformat(value) {
        this.transact(() => {
            this.ystate.set('nbformat', value);
        }, false);
    }
    get nbformat_minor() {
        return this.ystate.get('nbformatMinor');
    }
    set nbformat_minor(value) {
        this.transact(() => {
            this.ystate.set('nbformatMinor', value);
        }, false);
    }
    /**
     * Dispose of the resources.
     */
    dispose() {
        this.ycells.unobserve(this._onYCellsChanged);
        this.ymeta.unobserve(this._onMetadataChanged);
        this.ystate.unobserve(this._onStateChanged);
    }
    /**
     * Get a shared cell by index.
     *
     * @param index: Cell's position.
     *
     * @returns The requested shared cell.
     */
    getCell(index) {
        return this.cells[index];
    }
    /**
     * Insert a shared cell into a specific position.
     *
     * @param index: Cell's position.
     *
     * @param cell: Cell to insert.
     */
    insertCell(index, cell) {
        this.insertCells(index, [cell]);
    }
    /**
     * Insert a list of shared cells into a specific position.
     *
     * @param index: Position to insert the cells.
     *
     * @param cells: Array of shared cells to insert.
     */
    insertCells(index, cells) {
        cells.forEach(cell => {
            this._ycellMapping.set(cell.ymodel, cell);
            if (!this.disableDocumentWideUndoRedo) {
                cell.undoManager = this.undoManager;
            }
        });
        this.transact(() => {
            this.ycells.insert(index, cells.map(cell => cell.ymodel));
        });
    }
    /**
     * Move a cell.
     *
     * @param fromIndex: Index of the cell to move.
     *
     * @param toIndex: New position of the cell.
     */
    moveCell(fromIndex, toIndex) {
        this.transact(() => {
            const fromCell = this.getCell(fromIndex).clone();
            this.deleteCell(fromIndex);
            this.insertCell(toIndex, fromCell);
        });
    }
    /**
     * Remove a cell.
     *
     * @param index: Index of the cell to remove.
     */
    deleteCell(index) {
        this.deleteCellRange(index, index + 1);
    }
    /**
     * Remove a range of cells.
     *
     * @param from: The start index of the range to remove (inclusive).
     *
     * @param to: The end index of the range to remove (exclusive).
     */
    deleteCellRange(from, to) {
        this.transact(() => {
            this.ycells.delete(from, to - from);
        });
    }
    /**
     * Returns the metadata associated with the notebook.
     *
     * @returns Notebook's metadata.
     */
    getMetadata() {
        const meta = this.ymeta.get('metadata');
        return meta ? deepCopy(meta) : {};
    }
    /**
     * Sets the metadata associated with the notebook.
     *
     * @param metadata: Notebook's metadata.
     */
    setMetadata(value) {
        this.ymeta.set('metadata', deepCopy(value));
    }
    /**
     * Updates the metadata associated with the notebook.
     *
     * @param value: Metadata's attribute to update.
     */
    updateMetadata(value) {
        // TODO: Maybe modify only attributes instead of replacing the whole metadata?
        this.ymeta.set('metadata', Object.assign({}, this.getMetadata(), value));
    }
    /**
     * Create a new YNotebook.
     */
    static create(disableDocumentWideUndoRedo) {
        return new YNotebook({ disableDocumentWideUndoRedo });
    }
    /**
     * Wether the the undo/redo logic should be
     * considered on the full document across all cells.
     *
     * @return The disableDocumentWideUndoRedo setting.
     */
    get disableDocumentWideUndoRedo() {
        return this._disableDocumentWideUndoRedo;
    }
}
/**
 * Create a new shared cell given the type.
 */
export const createCellFromType = (type) => {
    switch (type.get('cell_type')) {
        case 'code':
            return new YCodeCell(type);
        case 'markdown':
            return new YMarkdownCell(type);
        case 'raw':
            return new YRawCell(type);
        default:
            throw new Error('Found unknown cell type');
    }
};
/**
 * Create a new standalone cell given the type.
 */
export const createStandaloneCell = (cellType, id) => {
    switch (cellType) {
        case 'markdown':
            return YMarkdownCell.createStandalone(id);
        case 'code':
            return YCodeCell.createStandalone(id);
        default:
            // raw
            return YRawCell.createStandalone(id);
    }
};
export class YBaseCell {
    constructor(ymodel) {
        /**
         * The notebook that this cell belongs to.
         */
        this._notebook = null;
        /**
         * Whether the cell is standalone or not.
         *
         * If the cell is standalone. It cannot be
         * inserted into a YNotebook because the Yjs model is already
         * attached to an anonymous Y.Doc instance.
         */
        this.isStandalone = false;
        /**
         * Handle a change to the ymodel.
         */
        this._modelObserver = (events) => {
            const changes = {};
            const sourceEvent = events.find(event => event.target === this.ymodel.get('source'));
            if (sourceEvent) {
                changes.sourceChange = sourceEvent.changes.delta;
            }
            const outputEvent = events.find(event => event.target === this.ymodel.get('outputs'));
            if (outputEvent) {
                changes.outputsChange = outputEvent.changes.delta;
            }
            const modelEvent = events.find(event => event.target === this.ymodel);
            if (modelEvent && modelEvent.keysChanged.has('metadata')) {
                const change = modelEvent.changes.keys.get('metadata');
                changes.metadataChange = {
                    oldValue: (change === null || change === void 0 ? void 0 : change.oldValue) ? change.oldValue : undefined,
                    newValue: this.getMetadata()
                };
            }
            if (modelEvent && modelEvent.keysChanged.has('execution_count')) {
                const change = modelEvent.changes.keys.get('execution_count');
                changes.executionCountChange = {
                    oldValue: change.oldValue,
                    newValue: this.ymodel.get('execution_count')
                };
            }
            // The model allows us to replace the complete source with a new string. We express this in the Delta format
            // as a replace of the complete string.
            const ysource = this.ymodel.get('source');
            if (modelEvent && modelEvent.keysChanged.has('source')) {
                changes.sourceChange = [
                    { delete: this._prevSourceLength },
                    { insert: ysource.toString() }
                ];
            }
            this._prevSourceLength = ysource.length;
            this._changed.emit(changes);
        };
        this.isDisposed = false;
        this._undoManager = null;
        this._changed = new Signal(this);
        this.ymodel = ymodel;
        const ysource = ymodel.get('source');
        this._prevSourceLength = ysource ? ysource.length : 0;
        this.ymodel.observeDeep(this._modelObserver);
        this._awareness = null;
    }
    get ysource() {
        return this.ymodel.get('source');
    }
    get awareness() {
        var _a, _b, _c;
        return (_c = (_a = this._awareness) !== null && _a !== void 0 ? _a : (_b = this.notebook) === null || _b === void 0 ? void 0 : _b.awareness) !== null && _c !== void 0 ? _c : null;
    }
    /**
     * Perform a transaction. While the function f is called, all changes to the shared
     * document are bundled into a single event.
     */
    transact(f, undoable = true) {
        this.notebook && undoable
            ? this.notebook.transact(f)
            : this.ymodel.doc.transact(f, this);
    }
    /**
     * The notebook that this cell belongs to.
     */
    get undoManager() {
        var _a;
        if (!this.notebook) {
            return this._undoManager;
        }
        return ((_a = this.notebook) === null || _a === void 0 ? void 0 : _a.disableDocumentWideUndoRedo) ? this._undoManager
            : this.notebook.undoManager;
    }
    /**
     * Set the undoManager when adding new cells.
     */
    set undoManager(undoManager) {
        this._undoManager = undoManager;
    }
    /**
     * Undo an operation.
     */
    undo() {
        var _a;
        (_a = this.undoManager) === null || _a === void 0 ? void 0 : _a.undo();
    }
    /**
     * Redo an operation.
     */
    redo() {
        var _a;
        (_a = this.undoManager) === null || _a === void 0 ? void 0 : _a.redo();
    }
    /**
     * Whether the object can undo changes.
     */
    canUndo() {
        return !!this.undoManager && this.undoManager.undoStack.length > 0;
    }
    /**
     * Whether the object can redo changes.
     */
    canRedo() {
        return !!this.undoManager && this.undoManager.redoStack.length > 0;
    }
    /**
     * Clear the change stack.
     */
    clearUndoHistory() {
        var _a;
        (_a = this.undoManager) === null || _a === void 0 ? void 0 : _a.clear();
    }
    /**
     * The notebook that this cell belongs to.
     */
    get notebook() {
        return this._notebook;
    }
    /**
     * Create a new YRawCell that can be inserted into a YNotebook
     */
    static create(id = UUID.uuid4()) {
        const ymodel = new Y.Map();
        const ysource = new Y.Text();
        ymodel.set('source', ysource);
        ymodel.set('metadata', {});
        ymodel.set('cell_type', this.prototype.cell_type);
        ymodel.set('id', id);
        return new this(ymodel);
    }
    /**
     * Create a new YRawCell that works standalone. It cannot be
     * inserted into a YNotebook because the Yjs model is already
     * attached to an anonymous Y.Doc instance.
     */
    static createStandalone(id) {
        const cell = this.create(id);
        cell.isStandalone = true;
        const doc = new Y.Doc();
        doc.getArray().insert(0, [cell.ymodel]);
        cell._awareness = new Awareness(doc);
        cell._undoManager = new Y.UndoManager([cell.ymodel], {
            trackedOrigins: new Set([cell])
        });
        return cell;
    }
    /**
     * Clone the cell.
     *
     * @todo clone should only be available in the specific implementations i.e. ISharedCodeCell
     */
    clone() {
        const ymodel = new Y.Map();
        const ysource = new Y.Text(this.getSource());
        ymodel.set('source', ysource);
        ymodel.set('metadata', this.getMetadata());
        ymodel.set('cell_type', this.cell_type);
        ymodel.set('id', this.getId());
        const Self = this.constructor;
        const clone = new Self(ymodel);
        // TODO The assignment of the undoManager does not work for a clone.
        // See https://github.com/jupyterlab/jupyterlab/issues/11035
        clone._undoManager = this.undoManager;
        return clone;
    }
    /**
     * The changed signal.
     */
    get changed() {
        return this._changed;
    }
    /**
     * Dispose of the resources.
     */
    dispose() {
        this.ymodel.unobserveDeep(this._modelObserver);
    }
    /**
     * Gets the cell attachments.
     *
     * @returns The cell attachments.
     */
    getAttachments() {
        return this.ymodel.get('attachments');
    }
    /**
     * Sets the cell attachments
     *
     * @param attachments: The cell attachments.
     */
    setAttachments(attachments) {
        this.transact(() => {
            if (attachments == null) {
                this.ymodel.delete('attachments');
            }
            else {
                this.ymodel.set('attachments', attachments);
            }
        });
    }
    /**
     * Get cell id.
     *
     * @returns Cell id
     */
    getId() {
        return this.ymodel.get('id');
    }
    /**
     * Gets cell's source.
     *
     * @returns Cell's source.
     */
    getSource() {
        return this.ymodel.get('source').toString();
    }
    /**
     * Sets cell's source.
     *
     * @param value: New source.
     */
    setSource(value) {
        const ytext = this.ymodel.get('source');
        this.transact(() => {
            ytext.delete(0, ytext.length);
            ytext.insert(0, value);
        });
        // @todo Do we need proper replace semantic? This leads to issues in editor bindings because they don't switch source.
        // this.ymodel.set('source', new Y.Text(value));
    }
    /**
     * Replace content from `start' to `end` with `value`.
     *
     * @param start: The start index of the range to replace (inclusive).
     *
     * @param end: The end index of the range to replace (exclusive).
     *
     * @param value: New source (optional).
     */
    updateSource(start, end, value = '') {
        this.transact(() => {
            const ysource = this.ysource;
            // insert and then delete.
            // This ensures that the cursor position is adjusted after the replaced content.
            ysource.insert(start, value);
            ysource.delete(start + value.length, end - start);
        });
    }
    /**
     * The type of the cell.
     */
    get cell_type() {
        throw new Error('A YBaseCell must not be constructed');
    }
    /**
     * Returns the metadata associated with the notebook.
     *
     * @returns Notebook's metadata.
     */
    getMetadata() {
        return deepCopy(this.ymodel.get('metadata'));
    }
    /**
     * Sets the metadata associated with the notebook.
     *
     * @param metadata: Notebook's metadata.
     */
    setMetadata(value) {
        this.transact(() => {
            this.ymodel.set('metadata', deepCopy(value));
        });
    }
    /**
     * Serialize the model to JSON.
     */
    toJSON() {
        return {
            id: this.getId(),
            cell_type: this.cell_type,
            source: this.getSource(),
            metadata: this.getMetadata()
        };
    }
}
export class YCodeCell extends YBaseCell {
    /**
     * The type of the cell.
     */
    get cell_type() {
        return 'code';
    }
    /**
     * The code cell's prompt number. Will be null if the cell has not been run.
     */
    get execution_count() {
        return this.ymodel.get('execution_count');
    }
    /**
     * The code cell's prompt number. Will be null if the cell has not been run.
     */
    set execution_count(count) {
        this.transact(() => {
            this.ymodel.set('execution_count', count);
        });
    }
    /**
     * Execution, display, or stream outputs.
     */
    getOutputs() {
        return deepCopy(this.ymodel.get('outputs').toArray());
    }
    /**
     * Replace all outputs.
     */
    setOutputs(outputs) {
        const youtputs = this.ymodel.get('outputs');
        this.transact(() => {
            youtputs.delete(0, youtputs.length);
            youtputs.insert(0, outputs);
        }, false);
    }
    /**
     * Replace content from `start' to `end` with `outputs`.
     *
     * @param start: The start index of the range to replace (inclusive).
     *
     * @param end: The end index of the range to replace (exclusive).
     *
     * @param outputs: New outputs (optional).
     */
    updateOutputs(start, end, outputs = []) {
        const youtputs = this.ymodel.get('outputs');
        const fin = end < youtputs.length ? end - start : youtputs.length - start;
        this.transact(() => {
            youtputs.delete(start, fin);
            youtputs.insert(start, outputs);
        }, false);
    }
    /**
     * Create a new YCodeCell that can be inserted into a YNotebook
     */
    static create(id) {
        const cell = super.create(id);
        cell.ymodel.set('execution_count', 0); // for some default value
        cell.ymodel.set('outputs', new Y.Array());
        return cell;
    }
    /**
     * Create a new YCodeCell that works standalone. It cannot be
     * inserted into a YNotebook because the Yjs model is already
     * attached to an anonymous Y.Doc instance.
     */
    static createStandalone(id) {
        const cell = super.createStandalone(id);
        cell.ymodel.set('execution_count', null); // for some default value
        cell.ymodel.set('outputs', new Y.Array());
        return cell;
    }
    /**
     * Create a new YCodeCell that can be inserted into a YNotebook
     *
     * @todo clone should only be available in the specific implementations i.e. ISharedCodeCell
     */
    clone() {
        const cell = super.clone();
        const youtputs = new Y.Array();
        youtputs.insert(0, this.getOutputs());
        cell.ymodel.set('execution_count', this.execution_count); // for some default value
        cell.ymodel.set('outputs', youtputs);
        return cell;
    }
    /**
     * Serialize the model to JSON.
     */
    toJSON() {
        return {
            id: this.getId(),
            cell_type: 'code',
            source: this.getSource(),
            metadata: this.getMetadata(),
            outputs: this.getOutputs(),
            execution_count: this.execution_count
        };
    }
}
export class YRawCell extends YBaseCell {
    /**
     * Create a new YRawCell that can be inserted into a YNotebook
     */
    static create(id) {
        return super.create(id);
    }
    /**
     * Create a new YRawCell that works standalone. It cannot be
     * inserted into a YNotebook because the Yjs model is already
     * attached to an anonymous Y.Doc instance.
     */
    static createStandalone(id) {
        return super.createStandalone(id);
    }
    /**
     * String identifying the type of cell.
     */
    get cell_type() {
        return 'raw';
    }
    /**
     * Serialize the model to JSON.
     */
    toJSON() {
        return {
            id: this.getId(),
            cell_type: 'raw',
            source: this.getSource(),
            metadata: this.getMetadata(),
            attachments: this.getAttachments()
        };
    }
}
export class YMarkdownCell extends YBaseCell {
    /**
     * Create a new YMarkdownCell that can be inserted into a YNotebook
     */
    static create(id) {
        return super.create(id);
    }
    /**
     * Create a new YMarkdownCell that works standalone. It cannot be
     * inserted into a YNotebook because the Yjs model is already
     * attached to an anonymous Y.Doc instance.
     */
    static createStandalone(id) {
        return super.createStandalone(id);
    }
    /**
     * String identifying the type of cell.
     */
    get cell_type() {
        return 'markdown';
    }
    /**
     * Serialize the model to JSON.
     */
    toJSON() {
        return {
            id: this.getId(),
            cell_type: 'markdown',
            source: this.getSource(),
            metadata: this.getMetadata(),
            attachments: this.getAttachments()
        };
    }
}
export default YNotebook;
//# sourceMappingURL=ymodels.js.map