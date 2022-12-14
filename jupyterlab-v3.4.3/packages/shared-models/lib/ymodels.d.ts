import * as nbformat from '@jupyterlab/nbformat';
import { ISignal, Signal } from '@lumino/signaling';
import { Awareness } from 'y-protocols/awareness';
import * as Y from 'yjs';
import * as models from './api';
import { ISharedNotebook } from './api';
/**
 * Abstract interface to define Shared Models that can be bound to a text editor using any existing
 * Yjs-based editor binding.
 */
export interface IYText extends models.ISharedText {
    readonly ysource: Y.Text;
    readonly awareness: Awareness | null;
    readonly undoManager: Y.UndoManager | null;
}
export declare type YCellType = YRawCell | YCodeCell | YMarkdownCell;
export declare class YDocument<T> implements models.ISharedDocument {
    get dirty(): boolean;
    set dirty(value: boolean);
    /**
     * Perform a transaction. While the function f is called, all changes to the shared
     * document are bundled into a single event.
     */
    transact(f: () => void, undoable?: boolean): void;
    /**
     * Dispose of the resources.
     */
    dispose(): void;
    /**
     * Whether the object can undo changes.
     */
    canUndo(): boolean;
    /**
     * Whether the object can redo changes.
     */
    canRedo(): boolean;
    /**
     * Undo an operation.
     */
    undo(): void;
    /**
     * Redo an operation.
     */
    redo(): void;
    /**
     * Clear the change stack.
     */
    clearUndoHistory(): void;
    /**
     * The changed signal.
     */
    get changed(): ISignal<this, T>;
    isDisposed: boolean;
    ydoc: Y.Doc;
    source: Y.Text;
    ystate: Y.Map<any>;
    undoManager: Y.UndoManager;
    awareness: Awareness;
    protected _changed: Signal<this, T>;
}
export declare class YFile extends YDocument<models.FileChange> implements models.ISharedFile, models.ISharedText, IYText {
    constructor();
    /**
     * Dispose of the resources.
     */
    dispose(): void;
    /**
     * Handle a change to the ymodel.
     */
    private _modelObserver;
    /**
     * Handle a change to the ystate.
     */
    private _onStateChanged;
    static create(): YFile;
    /**
     * Gets cell's source.
     *
     * @returns Cell's source.
     */
    getSource(): string;
    /**
     * Sets cell's source.
     *
     * @param value: New source.
     */
    setSource(value: string): void;
    /**
     * Replace content from `start' to `end` with `value`.
     *
     * @param start: The start index of the range to replace (inclusive).
     *
     * @param end: The end index of the range to replace (exclusive).
     *
     * @param value: New source (optional).
     */
    updateSource(start: number, end: number, value?: string): void;
    ysource: Y.Text;
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
export declare class YNotebook extends YDocument<models.NotebookChange> implements models.ISharedNotebook {
    constructor(options: ISharedNotebook.IOptions);
    get nbformat(): number;
    set nbformat(value: number);
    get nbformat_minor(): number;
    set nbformat_minor(value: number);
    /**
     * Dispose of the resources.
     */
    dispose(): void;
    /**
     * Get a shared cell by index.
     *
     * @param index: Cell's position.
     *
     * @returns The requested shared cell.
     */
    getCell(index: number): YCellType;
    /**
     * Insert a shared cell into a specific position.
     *
     * @param index: Cell's position.
     *
     * @param cell: Cell to insert.
     */
    insertCell(index: number, cell: YCellType): void;
    /**
     * Insert a list of shared cells into a specific position.
     *
     * @param index: Position to insert the cells.
     *
     * @param cells: Array of shared cells to insert.
     */
    insertCells(index: number, cells: YCellType[]): void;
    /**
     * Move a cell.
     *
     * @param fromIndex: Index of the cell to move.
     *
     * @param toIndex: New position of the cell.
     */
    moveCell(fromIndex: number, toIndex: number): void;
    /**
     * Remove a cell.
     *
     * @param index: Index of the cell to remove.
     */
    deleteCell(index: number): void;
    /**
     * Remove a range of cells.
     *
     * @param from: The start index of the range to remove (inclusive).
     *
     * @param to: The end index of the range to remove (exclusive).
     */
    deleteCellRange(from: number, to: number): void;
    /**
     * Returns the metadata associated with the notebook.
     *
     * @returns Notebook's metadata.
     */
    getMetadata(): nbformat.INotebookMetadata;
    /**
     * Sets the metadata associated with the notebook.
     *
     * @param metadata: Notebook's metadata.
     */
    setMetadata(value: nbformat.INotebookMetadata): void;
    /**
     * Updates the metadata associated with the notebook.
     *
     * @param value: Metadata's attribute to update.
     */
    updateMetadata(value: Partial<nbformat.INotebookMetadata>): void;
    /**
     * Create a new YNotebook.
     */
    static create(disableDocumentWideUndoRedo: boolean): models.ISharedNotebook;
    /**
     * Wether the the undo/redo logic should be
     * considered on the full document across all cells.
     *
     * @return The disableDocumentWideUndoRedo setting.
     */
    get disableDocumentWideUndoRedo(): boolean;
    /**
     * Handle a change to the list of cells.
     */
    private _onYCellsChanged;
    /**
     * Handle a change to the ystate.
     */
    private _onMetadataChanged;
    /**
     * Handle a change to the ystate.
     */
    private _onStateChanged;
    ycells: Y.Array<Y.Map<any>>;
    ymeta: Y.Map<any>;
    ymodel: Y.Map<any>;
    undoManager: Y.UndoManager;
    private _disableDocumentWideUndoRedo;
    private _ycellMapping;
    cells: YCellType[];
}
/**
 * Create a new shared cell given the type.
 */
export declare const createCellFromType: (type: Y.Map<any>) => YCellType;
/**
 * Create a new standalone cell given the type.
 */
export declare const createStandaloneCell: (cellType: 'raw' | 'code' | 'markdown', id?: string | undefined) => YCellType;
export declare class YBaseCell<Metadata extends models.ISharedBaseCellMetadata> implements models.ISharedBaseCell<Metadata>, IYText {
    constructor(ymodel: Y.Map<any>);
    get ysource(): Y.Text;
    get awareness(): Awareness | null;
    /**
     * Perform a transaction. While the function f is called, all changes to the shared
     * document are bundled into a single event.
     */
    transact(f: () => void, undoable?: boolean): void;
    /**
     * The notebook that this cell belongs to.
     */
    get undoManager(): Y.UndoManager | null;
    /**
     * Set the undoManager when adding new cells.
     */
    set undoManager(undoManager: Y.UndoManager | null);
    /**
     * Undo an operation.
     */
    undo(): void;
    /**
     * Redo an operation.
     */
    redo(): void;
    /**
     * Whether the object can undo changes.
     */
    canUndo(): boolean;
    /**
     * Whether the object can redo changes.
     */
    canRedo(): boolean;
    /**
     * Clear the change stack.
     */
    clearUndoHistory(): void;
    /**
     * The notebook that this cell belongs to.
     */
    get notebook(): YNotebook | null;
    /**
     * The notebook that this cell belongs to.
     */
    protected _notebook: YNotebook | null;
    /**
     * Whether the cell is standalone or not.
     *
     * If the cell is standalone. It cannot be
     * inserted into a YNotebook because the Yjs model is already
     * attached to an anonymous Y.Doc instance.
     */
    isStandalone: boolean;
    /**
     * Create a new YRawCell that can be inserted into a YNotebook
     */
    static create(id?: string): YBaseCell<any>;
    /**
     * Create a new YRawCell that works standalone. It cannot be
     * inserted into a YNotebook because the Yjs model is already
     * attached to an anonymous Y.Doc instance.
     */
    static createStandalone(id?: string): YBaseCell<any>;
    /**
     * Clone the cell.
     *
     * @todo clone should only be available in the specific implementations i.e. ISharedCodeCell
     */
    clone(): YBaseCell<any>;
    /**
     * Handle a change to the ymodel.
     */
    private _modelObserver;
    /**
     * The changed signal.
     */
    get changed(): ISignal<this, models.CellChange<Metadata>>;
    /**
     * Dispose of the resources.
     */
    dispose(): void;
    /**
     * Gets the cell attachments.
     *
     * @returns The cell attachments.
     */
    getAttachments(): nbformat.IAttachments | undefined;
    /**
     * Sets the cell attachments
     *
     * @param attachments: The cell attachments.
     */
    setAttachments(attachments: nbformat.IAttachments | undefined): void;
    /**
     * Get cell id.
     *
     * @returns Cell id
     */
    getId(): string;
    /**
     * Gets cell's source.
     *
     * @returns Cell's source.
     */
    getSource(): string;
    /**
     * Sets cell's source.
     *
     * @param value: New source.
     */
    setSource(value: string): void;
    /**
     * Replace content from `start' to `end` with `value`.
     *
     * @param start: The start index of the range to replace (inclusive).
     *
     * @param end: The end index of the range to replace (exclusive).
     *
     * @param value: New source (optional).
     */
    updateSource(start: number, end: number, value?: string): void;
    /**
     * The type of the cell.
     */
    get cell_type(): any;
    /**
     * Returns the metadata associated with the notebook.
     *
     * @returns Notebook's metadata.
     */
    getMetadata(): Partial<Metadata>;
    /**
     * Sets the metadata associated with the notebook.
     *
     * @param metadata: Notebook's metadata.
     */
    setMetadata(value: Partial<Metadata>): void;
    /**
     * Serialize the model to JSON.
     */
    toJSON(): nbformat.IBaseCell;
    isDisposed: boolean;
    ymodel: Y.Map<any>;
    private _undoManager;
    private _changed;
    private _prevSourceLength;
    private _awareness;
}
export declare class YCodeCell extends YBaseCell<models.ISharedBaseCellMetadata> implements models.ISharedCodeCell {
    /**
     * The type of the cell.
     */
    get cell_type(): 'code';
    /**
     * The code cell's prompt number. Will be null if the cell has not been run.
     */
    get execution_count(): number | null;
    /**
     * The code cell's prompt number. Will be null if the cell has not been run.
     */
    set execution_count(count: number | null);
    /**
     * Execution, display, or stream outputs.
     */
    getOutputs(): Array<nbformat.IOutput>;
    /**
     * Replace all outputs.
     */
    setOutputs(outputs: Array<nbformat.IOutput>): void;
    /**
     * Replace content from `start' to `end` with `outputs`.
     *
     * @param start: The start index of the range to replace (inclusive).
     *
     * @param end: The end index of the range to replace (exclusive).
     *
     * @param outputs: New outputs (optional).
     */
    updateOutputs(start: number, end: number, outputs?: Array<nbformat.IOutput>): void;
    /**
     * Create a new YCodeCell that can be inserted into a YNotebook
     */
    static create(id?: string): YCodeCell;
    /**
     * Create a new YCodeCell that works standalone. It cannot be
     * inserted into a YNotebook because the Yjs model is already
     * attached to an anonymous Y.Doc instance.
     */
    static createStandalone(id?: string): YCodeCell;
    /**
     * Create a new YCodeCell that can be inserted into a YNotebook
     *
     * @todo clone should only be available in the specific implementations i.e. ISharedCodeCell
     */
    clone(): YCodeCell;
    /**
     * Serialize the model to JSON.
     */
    toJSON(): nbformat.ICodeCell;
}
export declare class YRawCell extends YBaseCell<models.ISharedBaseCellMetadata> implements models.ISharedRawCell {
    /**
     * Create a new YRawCell that can be inserted into a YNotebook
     */
    static create(id?: string): YRawCell;
    /**
     * Create a new YRawCell that works standalone. It cannot be
     * inserted into a YNotebook because the Yjs model is already
     * attached to an anonymous Y.Doc instance.
     */
    static createStandalone(id?: string): YRawCell;
    /**
     * String identifying the type of cell.
     */
    get cell_type(): 'raw';
    /**
     * Serialize the model to JSON.
     */
    toJSON(): nbformat.IRawCell;
}
export declare class YMarkdownCell extends YBaseCell<models.ISharedBaseCellMetadata> implements models.ISharedMarkdownCell {
    /**
     * Create a new YMarkdownCell that can be inserted into a YNotebook
     */
    static create(id?: string): YMarkdownCell;
    /**
     * Create a new YMarkdownCell that works standalone. It cannot be
     * inserted into a YNotebook because the Yjs model is already
     * attached to an anonymous Y.Doc instance.
     */
    static createStandalone(id?: string): YMarkdownCell;
    /**
     * String identifying the type of cell.
     */
    get cell_type(): 'markdown';
    /**
     * Serialize the model to JSON.
     */
    toJSON(): nbformat.IMarkdownCell;
}
export default YNotebook;
