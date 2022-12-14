// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { ObservableMap } from '@jupyterlab/observables';
import * as models from '@jupyterlab/shared-models';
import { ArrayExt, ArrayIterator, each, toArray } from '@lumino/algorithm';
import { Signal } from '@lumino/signaling';
/**
 * A cell list object that supports undo/redo.
 */
export class CellList {
    /**
     * Construct the cell list.
     */
    constructor(modelDB, factory, model) {
        /**
         * Prevents that the modeldb event handler is executed when the shared-model event handler is executed and vice-versa.
         */
        this._mutex = models.createMutex();
        this._isDisposed = false;
        this._changed = new Signal(this);
        this._factory = factory;
        this._cellOrder = modelDB.createList('cellOrder');
        this._cellMap = new ObservableMap();
        this._cellOrder.changed.connect(this._onOrderChanged, this);
        this.nbmodel = model;
        this.nbmodel.changed.connect(this.onSharedModelChanged, this);
        this.changed.connect(this.onModelDBChanged, this);
    }
    onModelDBChanged(self, change) {
        this._mutex(() => {
            const nbmodel = this.nbmodel;
            nbmodel.transact(() => {
                if (change.type === 'set' || change.type === 'remove') {
                    nbmodel.deleteCellRange(change.oldIndex, change.oldIndex + change.oldValues.length);
                }
                if (change.type === 'set' ||
                    change.type === 'add' ||
                    change.type === 'move') {
                    const cells = change.newValues.map(cell => {
                        return cell.sharedModel.clone();
                    });
                    let insertLocation = change.newIndex;
                    if (change.type === 'move' && insertLocation > change.oldIndex) {
                        insertLocation += change.oldValues.length;
                    }
                    nbmodel.insertCells(insertLocation, cells);
                    change.newValues.forEach((cell, index) => {
                        cell.switchSharedModel(cells[index], false);
                    });
                }
                if (change.type === 'move') {
                    let from = change.oldIndex;
                    if (from >= change.newIndex) {
                        from += change.oldValues.length;
                    }
                    nbmodel.deleteCellRange(from, from + change.oldValues.length);
                }
            });
        });
    }
    onSharedModelChanged(self, change) {
        this._mutex(() => {
            var _a;
            let currpos = 0;
            (_a = change.cellsChange) === null || _a === void 0 ? void 0 : _a.forEach(delta => {
                if (delta.insert != null) {
                    const cells = delta.insert.map(nbcell => {
                        const cell = this._factory.createCell(nbcell.cell_type, {});
                        cell.switchSharedModel(nbcell, true);
                        return cell;
                    });
                    this.insertAll(currpos, cells);
                    currpos += delta.insert.length;
                }
                else if (delta.delete != null) {
                    this.removeRange(currpos, currpos + delta.delete);
                }
                else if (delta.retain != null) {
                    currpos += delta.retain;
                }
            });
        });
    }
    /**
     * A signal emitted when the cell list has changed.
     */
    get changed() {
        return this._changed;
    }
    /**
     * Test whether the cell list has been disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Test whether the list is empty.
     *
     * @returns `true` if the cell list is empty, `false` otherwise.
     *
     * #### Notes
     * This is a read-only property.
     *
     * #### Complexity
     * Constant.
     *
     * #### Iterator Validity
     * No changes.
     */
    get isEmpty() {
        return this._cellOrder.length === 0;
    }
    /**
     * Get the length of the cell list.
     *
     * @return The number of cells in the cell list.
     *
     * #### Notes
     * This is a read-only property.
     *
     * #### Complexity
     * Constant.
     *
     * #### Iterator Validity
     * No changes.
     */
    get length() {
        return this._cellOrder.length;
    }
    /**
     * Create an iterator over the cells in the cell list.
     *
     * @returns A new iterator starting at the front of the cell list.
     *
     * #### Complexity
     * Constant.
     *
     * #### Iterator Validity
     * No changes.
     */
    iter() {
        const arr = [];
        for (const id of toArray(this._cellOrder)) {
            arr.push(this._cellMap.get(id));
        }
        return new ArrayIterator(arr);
    }
    /**
     * Dispose of the resources held by the cell list.
     */
    dispose() {
        if (this._isDisposed) {
            return;
        }
        this._isDisposed = true;
        Signal.clearData(this);
        // Clean up the cell map and cell order objects.
        for (const cell of this._cellMap.values()) {
            cell.dispose();
        }
        this._cellMap.dispose();
        this._cellOrder.dispose();
    }
    /**
     * Get the cell at the specified index.
     *
     * @param index - The positive integer index of interest.
     *
     * @returns The cell at the specified index.
     *
     * #### Complexity
     * Constant.
     *
     * #### Iterator Validity
     * No changes.
     *
     * #### Undefined Behavior
     * An `index` which is non-integral or out of range.
     */
    get(index) {
        return this._cellMap.get(this._cellOrder.get(index));
    }
    /**
     * Set the cell at the specified index.
     *
     * @param index - The positive integer index of interest.
     *
     * @param cell - The cell to set at the specified index.
     *
     * #### Complexity
     * Constant.
     *
     * #### Iterator Validity
     * No changes.
     *
     * #### Undefined Behavior
     * An `index` which is non-integral or out of range.
     *
     * #### Notes
     * This should be considered to transfer ownership of the
     * cell to the `CellList`. As such, `cell.dispose()` should
     * not be called by other actors.
     */
    set(index, cell) {
        // Set the internal data structures.
        this._cellMap.set(cell.id, cell);
        this._cellOrder.set(index, cell.id);
    }
    /**
     * Add a cell to the back of the cell list.
     *
     * @param cell - The cell to add to the back of the cell list.
     *
     * @returns The new length of the cell list.
     *
     * #### Complexity
     * Constant.
     *
     * #### Iterator Validity
     * No changes.
     *
     * #### Notes
     * This should be considered to transfer ownership of the
     * cell to the `CellList`. As such, `cell.dispose()` should
     * not be called by other actors.
     */
    push(cell) {
        // Set the internal data structures.
        this._cellMap.set(cell.id, cell);
        const num = this._cellOrder.push(cell.id);
        return num;
    }
    /**
     * Insert a cell into the cell list at a specific index.
     *
     * @param index - The index at which to insert the cell.
     *
     * @param cell - The cell to set at the specified index.
     *
     * @returns The new length of the cell list.
     *
     * #### Complexity
     * Linear.
     *
     * #### Iterator Validity
     * No changes.
     *
     * #### Notes
     * The `index` will be clamped to the bounds of the cell list.
     *
     * #### Undefined Behavior
     * An `index` which is non-integral.
     *
     * #### Notes
     * This should be considered to transfer ownership of the
     * cell to the `CellList`. As such, `cell.dispose()` should
     * not be called by other actors.
     */
    insert(index, cell) {
        // Set the internal data structures.
        this._cellMap.set(cell.id, cell);
        this._cellOrder.insert(index, cell.id);
    }
    /**
     * Remove the first occurrence of a cell from the cell list.
     *
     * @param cell - The cell of interest.
     *
     * @returns The index of the removed cell, or `-1` if the cell
     *   is not contained in the cell list.
     *
     * #### Complexity
     * Linear.
     *
     * #### Iterator Validity
     * Iterators pointing at the removed cell and beyond are invalidated.
     */
    removeValue(cell) {
        const index = ArrayExt.findFirstIndex(toArray(this._cellOrder), id => this._cellMap.get(id) === cell);
        this.remove(index);
        return index;
    }
    /**
     * Remove and return the cell at a specific index.
     *
     * @param index - The index of the cell of interest.
     *
     * @returns The cell at the specified index, or `undefined` if the
     *   index is out of range.
     *
     * #### Complexity
     * Constant.
     *
     * #### Iterator Validity
     * Iterators pointing at the removed cell and beyond are invalidated.
     *
     * #### Undefined Behavior
     * An `index` which is non-integral.
     */
    remove(index) {
        const id = this._cellOrder.get(index);
        this._cellOrder.remove(index);
        const cell = this._cellMap.get(id);
        return cell;
    }
    /**
     * Remove all cells from the cell list.
     *
     * #### Complexity
     * Linear.
     *
     * #### Iterator Validity
     * All current iterators are invalidated.
     */
    clear() {
        this._cellOrder.clear();
    }
    /**
     * Move a cell from one index to another.
     *
     * @parm fromIndex - The index of the element to move.
     *
     * @param toIndex - The index to move the element to.
     *
     * #### Complexity
     * Constant.
     *
     * #### Iterator Validity
     * Iterators pointing at the lesser of the `fromIndex` and the `toIndex`
     * and beyond are invalidated.
     *
     * #### Undefined Behavior
     * A `fromIndex` or a `toIndex` which is non-integral.
     */
    move(fromIndex, toIndex) {
        this._cellOrder.move(fromIndex, toIndex);
    }
    /**
     * Push a set of cells to the back of the cell list.
     *
     * @param cells - An iterable or array-like set of cells to add.
     *
     * @returns The new length of the cell list.
     *
     * #### Complexity
     * Linear.
     *
     * #### Iterator Validity
     * No changes.
     *
     * #### Notes
     * This should be considered to transfer ownership of the
     * cells to the `CellList`. As such, `cell.dispose()` should
     * not be called by other actors.
     */
    pushAll(cells) {
        const newValues = toArray(cells);
        each(newValues, cell => {
            // Set the internal data structures.
            this._cellMap.set(cell.id, cell);
            this._cellOrder.push(cell.id);
        });
        return this.length;
    }
    /**
     * Insert a set of items into the cell list at the specified index.
     *
     * @param index - The index at which to insert the cells.
     *
     * @param cells - The cells to insert at the specified index.
     *
     * @returns The new length of the cell list.
     *
     * #### Complexity.
     * Linear.
     *
     * #### Iterator Validity
     * No changes.
     *
     * #### Notes
     * The `index` will be clamped to the bounds of the cell list.
     *
     * #### Undefined Behavior.
     * An `index` which is non-integral.
     *
     * #### Notes
     * This should be considered to transfer ownership of the
     * cells to the `CellList`. As such, `cell.dispose()` should
     * not be called by other actors.
     */
    insertAll(index, cells) {
        const newValues = toArray(cells);
        each(newValues, cell => {
            this._cellMap.set(cell.id, cell);
            // @todo it looks like this compound operation shoult start before the `each` loop.
            this._cellOrder.beginCompoundOperation();
            this._cellOrder.insert(index++, cell.id);
            this._cellOrder.endCompoundOperation();
        });
        return this.length;
    }
    /**
     * Remove a range of items from the cell list.
     *
     * @param startIndex - The start index of the range to remove (inclusive).
     *
     * @param endIndex - The end index of the range to remove (exclusive).
     *
     * @returns The new length of the cell list.
     *
     * #### Complexity
     * Linear.
     *
     * #### Iterator Validity
     * Iterators pointing to the first removed cell and beyond are invalid.
     *
     * #### Undefined Behavior
     * A `startIndex` or `endIndex` which is non-integral.
     */
    removeRange(startIndex, endIndex) {
        this._cellOrder.removeRange(startIndex, endIndex);
        return this.length;
    }
    /**
     * Whether the object can redo changes.
     */
    get canRedo() {
        return this.nbmodel.canRedo();
    }
    /**
     * Whether the object can undo changes.
     */
    get canUndo() {
        return this.nbmodel.canUndo();
    }
    /**
     * Begin a compound operation.
     *
     * @param isUndoAble - Whether the operation is undoable.
     *   The default is `true`.
     */
    beginCompoundOperation(isUndoAble) {
        this._cellOrder.beginCompoundOperation(isUndoAble);
    }
    /**
     * End a compound operation.
     */
    endCompoundOperation() {
        this._cellOrder.endCompoundOperation();
    }
    /**
     * Undo an operation.
     */
    undo() {
        this.nbmodel.undo();
    }
    /**
     * Redo an operation.
     */
    redo() {
        this.nbmodel.redo();
    }
    /**
     * Clear the change stack.
     */
    clearUndo() {
        this.nbmodel.clearUndoHistory();
    }
    _onOrderChanged(order, change) {
        if (change.type === 'add' || change.type === 'set') {
            each(change.newValues, id => {
                const existingCell = this._cellMap.get(id);
                if (existingCell == null) {
                    const cellDB = this._factory.modelDB;
                    const cellType = cellDB.createValue(id + '.type');
                    let cell;
                    switch (cellType.get()) {
                        case 'code':
                            cell = this._factory.createCodeCell({ id: id });
                            break;
                        case 'markdown':
                            cell = this._factory.createMarkdownCell({ id: id });
                            break;
                        default:
                            cell = this._factory.createRawCell({ id: id });
                            break;
                    }
                    this._cellMap.set(id, cell);
                }
                else if (!existingCell.sharedModel.isStandalone) {
                    this._mutex(() => {
                        // it does already exist, probably because it was deleted previously and we introduced it
                        // copy it to a fresh codecell instance
                        const cell = existingCell.toJSON();
                        let freshCell = null;
                        switch (cell.cell_type) {
                            case 'code':
                                freshCell = this._factory.createCodeCell({ cell });
                                break;
                            case 'markdown':
                                freshCell = this._factory.createMarkdownCell({ cell });
                                break;
                            default:
                                freshCell = this._factory.createRawCell({ cell });
                                break;
                        }
                        this._cellMap.set(id, freshCell);
                    });
                }
            });
        }
        const newValues = [];
        const oldValues = [];
        each(change.newValues, id => {
            newValues.push(this._cellMap.get(id));
        });
        each(change.oldValues, id => {
            oldValues.push(this._cellMap.get(id));
        });
        this._changed.emit({
            type: change.type,
            oldIndex: change.oldIndex,
            newIndex: change.newIndex,
            oldValues,
            newValues
        });
    }
}
//# sourceMappingURL=celllist.js.map