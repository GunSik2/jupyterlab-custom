// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { CodeCellModel, MarkdownCellModel, RawCellModel } from '@jupyterlab/cells';
import * as nbformat from '@jupyterlab/nbformat';
import { ModelDB } from '@jupyterlab/observables';
import * as models from '@jupyterlab/shared-models';
import { nullTranslator } from '@jupyterlab/translation';
import { UUID } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';
import { CellList } from './celllist';
const UNSHARED_KEYS = ['kernelspec', 'language_info'];
/**
 * An implementation of a notebook Model.
 */
export class NotebookModel {
    /**
     * Construct a new notebook model.
     */
    constructor(options = {}) {
        /**
         * A mutex to update the shared model.
         */
        this._modelDBMutex = models.createMutex();
        this._readOnly = false;
        this._contentChanged = new Signal(this);
        this._stateChanged = new Signal(this);
        this._nbformat = nbformat.MAJOR_VERSION;
        this._nbformatMinor = nbformat.MINOR_VERSION;
        this._isDisposed = false;
        if (options.modelDB) {
            this.modelDB = options.modelDB;
        }
        else {
            this.modelDB = new ModelDB();
        }
        this.sharedModel = models.YNotebook.create(options.disableDocumentWideUndoRedo || false);
        this._isInitialized = options.isInitialized === false ? false : true;
        const factory = options.contentFactory || NotebookModel.defaultContentFactory;
        this.contentFactory = factory.clone(this.modelDB.view('cells'));
        this._cells = new CellList(this.modelDB, this.contentFactory, this.sharedModel);
        this._trans = (options.translator || nullTranslator).load('jupyterlab');
        this._cells.changed.connect(this._onCellsChanged, this);
        // Handle initial metadata.
        const metadata = this.modelDB.createMap('metadata');
        if (!metadata.has('language_info')) {
            const name = options.languagePreference || '';
            metadata.set('language_info', { name });
        }
        this._ensureMetadata();
        metadata.changed.connect(this._onMetadataChanged, this);
        this._deletedCells = [];
        this.sharedModel.dirty = false;
        this.sharedModel.changed.connect(this._onStateChanged, this);
    }
    /**
     * A signal emitted when the document content changes.
     */
    get contentChanged() {
        return this._contentChanged;
    }
    /**
     * A signal emitted when the document state changes.
     */
    get stateChanged() {
        return this._stateChanged;
    }
    /**
     * The dirty state of the document.
     */
    get dirty() {
        return this.sharedModel.dirty;
    }
    set dirty(newValue) {
        if (newValue === this.dirty) {
            return;
        }
        this.sharedModel.dirty = newValue;
    }
    /**
     * The read only state of the document.
     */
    get readOnly() {
        return this._readOnly;
    }
    set readOnly(newValue) {
        if (newValue === this._readOnly) {
            return;
        }
        const oldValue = this._readOnly;
        this._readOnly = newValue;
        this.triggerStateChange({ name: 'readOnly', oldValue, newValue });
    }
    /**
     * The metadata associated with the notebook.
     */
    get metadata() {
        return this.modelDB.get('metadata');
    }
    /**
     * Get the observable list of notebook cells.
     */
    get cells() {
        return this._cells;
    }
    /**
     * The major version number of the nbformat.
     */
    get nbformat() {
        return this._nbformat;
    }
    /**
     * The minor version number of the nbformat.
     */
    get nbformatMinor() {
        return this._nbformatMinor;
    }
    /**
     * The default kernel name of the document.
     */
    get defaultKernelName() {
        const spec = this.metadata.get('kernelspec');
        return spec ? spec.name : '';
    }
    /**
     * A list of deleted cells for the notebook..
     */
    get deletedCells() {
        return this._deletedCells;
    }
    /**
     * If the model is initialized or not.
     */
    get isInitialized() {
        return this._isInitialized;
    }
    /**
     * The default kernel language of the document.
     */
    get defaultKernelLanguage() {
        const info = this.metadata.get('language_info');
        return info ? info.name : '';
    }
    /**
     * Dispose of the resources held by the model.
     */
    dispose() {
        // Do nothing if already disposed.
        if (this.isDisposed) {
            return;
        }
        const cells = this.cells;
        this._cells = null;
        cells.dispose();
        this._isDisposed = true;
        Signal.clearData(this);
    }
    /**
     * Serialize the model to a string.
     */
    toString() {
        return JSON.stringify(this.toJSON());
    }
    /**
     * Deserialize the model from a string.
     *
     * #### Notes
     * Should emit a [contentChanged] signal.
     */
    fromString(value) {
        this.fromJSON(JSON.parse(value));
    }
    /**
     * Serialize the model to JSON.
     */
    toJSON() {
        var _a, _b;
        const cells = [];
        for (let i = 0; i < ((_b = (_a = this.cells) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0); i++) {
            const cell = this.cells.get(i).toJSON();
            if (this._nbformat === 4 && this._nbformatMinor <= 4) {
                // strip cell ids if we have notebook format 4.0-4.4
                delete cell.id;
            }
            cells.push(cell);
        }
        this._ensureMetadata();
        const metadata = this.sharedModel.getMetadata();
        for (const key of this.metadata.keys()) {
            metadata[key] = JSON.parse(JSON.stringify(this.metadata.get(key)));
        }
        return {
            metadata,
            nbformat_minor: this._nbformatMinor,
            nbformat: this._nbformat,
            cells
        };
    }
    /**
     * Deserialize the model from JSON.
     *
     * #### Notes
     * Should emit a [contentChanged] signal.
     */
    fromJSON(value) {
        const cells = [];
        const factory = this.contentFactory;
        const useId = value.nbformat === 4 && value.nbformat_minor >= 5;
        for (const cell of value.cells) {
            const options = { cell };
            if (useId) {
                options.id = cell.id;
            }
            switch (cell.cell_type) {
                case 'code':
                    cells.push(factory.createCodeCell(options));
                    break;
                case 'markdown':
                    cells.push(factory.createMarkdownCell(options));
                    break;
                case 'raw':
                    cells.push(factory.createRawCell(options));
                    break;
                default:
                    continue;
            }
        }
        this.cells.beginCompoundOperation();
        this.cells.clear();
        this.cells.pushAll(cells);
        this.cells.endCompoundOperation();
        this.sharedModel.nbformat_minor =
            nbformat.MINOR_VERSION;
        this.sharedModel.nbformat = nbformat.MAJOR_VERSION;
        const origNbformat = value.metadata.orig_nbformat;
        if (value.nbformat !== this._nbformat) {
            this.sharedModel.nbformat = value.nbformat;
        }
        if (value.nbformat_minor > this._nbformatMinor) {
            this.sharedModel.nbformat_minor =
                value.nbformat_minor;
        }
        // Alert the user if the format changes.
        if (origNbformat !== undefined && this._nbformat !== origNbformat) {
            const newer = this._nbformat > origNbformat;
            let msg;
            if (newer) {
                msg = this._trans.__(`This notebook has been converted from an older notebook format (v%1)
to the current notebook format (v%2).
The next time you save this notebook, the current notebook format (v%2) will be used.
'Older versions of Jupyter may not be able to read the new format.' To preserve the original format version,
close the notebook without saving it.`, origNbformat, this._nbformat);
            }
            else {
                msg = this._trans.__(`This notebook has been converted from an newer notebook format (v%1)
to the current notebook format (v%2).
The next time you save this notebook, the current notebook format (v%2) will be used.
Some features of the original notebook may not be available.' To preserve the original format version,
close the notebook without saving it.`, origNbformat, this._nbformat);
            }
            void showDialog({
                title: this._trans.__('Notebook converted'),
                body: msg,
                buttons: [Dialog.okButton({ label: this._trans.__('Ok') })]
            });
        }
        // Update the metadata.
        this.metadata.clear();
        const metadata = value.metadata;
        for (const key in metadata) {
            // orig_nbformat is not intended to be stored per spec.
            if (key === 'orig_nbformat') {
                continue;
            }
            this.metadata.set(key, metadata[key]);
        }
        this._ensureMetadata();
        this.dirty = true;
    }
    /**
     * Initialize the model with its current state.
     *
     * # Notes
     * Adds an empty code cell if the model is empty
     * and clears undo state.
     */
    initialize() {
        if (!this.cells.length) {
            const factory = this.contentFactory;
            this.cells.push(factory.createCodeCell({}));
        }
        this._isInitialized = true;
        this.cells.clearUndo();
    }
    /**
     * Handle a change in the cells list.
     */
    _onCellsChanged(list, change) {
        switch (change.type) {
            case 'add':
                change.newValues.forEach(cell => {
                    cell.contentChanged.connect(this.triggerContentChange, this);
                });
                break;
            case 'remove':
                break;
            case 'set':
                change.newValues.forEach(cell => {
                    cell.contentChanged.connect(this.triggerContentChange, this);
                });
                break;
            default:
                break;
        }
        this.triggerContentChange();
    }
    _onStateChanged(sender, changes) {
        if (changes.stateChange) {
            changes.stateChange.forEach(value => {
                if (value.name === 'nbformat') {
                    this._nbformat = value.newValue;
                }
                if (value.name === 'nbformatMinor') {
                    this._nbformatMinor = value.newValue;
                }
                if (value.name !== 'dirty' || value.oldValue !== value.newValue) {
                    this.triggerStateChange(value);
                }
            });
        }
        if (changes.metadataChange) {
            const metadata = changes.metadataChange.newValue;
            this._modelDBMutex(() => {
                Object.entries(metadata).forEach(([key, value]) => {
                    this.metadata.set(key, value);
                });
            });
        }
    }
    _onMetadataChanged(metadata, change) {
        if (!UNSHARED_KEYS.includes(change.key)) {
            this._modelDBMutex(() => {
                this.sharedModel.updateMetadata(metadata.toJSON());
            });
        }
        this.triggerContentChange();
    }
    /**
     * Make sure we have the required metadata fields.
     */
    _ensureMetadata() {
        const metadata = this.metadata;
        if (!metadata.has('language_info')) {
            metadata.set('language_info', { name: '' });
        }
        if (!metadata.has('kernelspec')) {
            metadata.set('kernelspec', { name: '', display_name: '' });
        }
    }
    /**
     * Trigger a state change signal.
     */
    triggerStateChange(args) {
        this._stateChanged.emit(args);
    }
    /**
     * Trigger a content changed signal.
     */
    triggerContentChange() {
        this._contentChanged.emit(void 0);
        this.dirty = true;
    }
    /**
     * Whether the model is disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
}
/**
 * The namespace for the `NotebookModel` class statics.
 */
(function (NotebookModel) {
    /**
     * The default implementation of an `IContentFactory`.
     */
    class ContentFactory {
        /**
         * Create a new cell model factory.
         */
        constructor(options) {
            this.codeCellContentFactory =
                options.codeCellContentFactory || CodeCellModel.defaultContentFactory;
            this.modelDB = options.modelDB;
        }
        /**
         * Create a new cell by cell type.
         *
         * @param type:  the type of the cell to create.
         *
         * @param options: the cell creation options.
         *
         * #### Notes
         * This method is intended to be a convenience method to programmatically
         * call the other cell creation methods in the factory.
         */
        createCell(type, options) {
            switch (type) {
                case 'code':
                    return this.createCodeCell(options);
                case 'markdown':
                    return this.createMarkdownCell(options);
                case 'raw':
                default:
                    return this.createRawCell(options);
            }
        }
        /**
         * Create a new code cell.
         *
         * @param source - The data to use for the original source data.
         *
         * @returns A new code cell. If a source cell is provided, the
         *   new cell will be initialized with the data from the source.
         *   If the contentFactory is not provided, the instance
         *   `codeCellContentFactory` will be used.
         */
        createCodeCell(options) {
            if (options.contentFactory) {
                options.contentFactory = this.codeCellContentFactory;
            }
            if (this.modelDB) {
                if (!options.id) {
                    options.id = UUID.uuid4();
                }
                options.modelDB = this.modelDB.view(options.id);
            }
            return new CodeCellModel(options);
        }
        /**
         * Create a new markdown cell.
         *
         * @param source - The data to use for the original source data.
         *
         * @returns A new markdown cell. If a source cell is provided, the
         *   new cell will be initialized with the data from the source.
         */
        createMarkdownCell(options) {
            if (this.modelDB) {
                if (!options.id) {
                    options.id = UUID.uuid4();
                }
                options.modelDB = this.modelDB.view(options.id);
            }
            return new MarkdownCellModel(options);
        }
        /**
         * Create a new raw cell.
         *
         * @param source - The data to use for the original source data.
         *
         * @returns A new raw cell. If a source cell is provided, the
         *   new cell will be initialized with the data from the source.
         */
        createRawCell(options) {
            if (this.modelDB) {
                if (!options.id) {
                    options.id = UUID.uuid4();
                }
                options.modelDB = this.modelDB.view(options.id);
            }
            return new RawCellModel(options);
        }
        /**
         * Clone the content factory with a new IModelDB.
         */
        clone(modelDB) {
            return new ContentFactory({
                modelDB: modelDB,
                codeCellContentFactory: this.codeCellContentFactory
            });
        }
    }
    NotebookModel.ContentFactory = ContentFactory;
    /**
     * The default `ContentFactory` instance.
     */
    NotebookModel.defaultContentFactory = new ContentFactory({});
})(NotebookModel || (NotebookModel = {}));
//# sourceMappingURL=model.js.map