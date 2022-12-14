import { CellModel, CodeCellModel, ICellModel, ICodeCellModel, IMarkdownCellModel, IRawCellModel } from '@jupyterlab/cells';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import * as nbformat from '@jupyterlab/nbformat';
import { IModelDB, IObservableJSON, IObservableUndoableList } from '@jupyterlab/observables';
import * as models from '@jupyterlab/shared-models';
import { ITranslator } from '@jupyterlab/translation';
import { ISignal } from '@lumino/signaling';
/**
 * The definition of a model object for a notebook widget.
 */
export interface INotebookModel extends DocumentRegistry.IModel {
    /**
     * The list of cells in the notebook.
     */
    readonly cells: IObservableUndoableList<ICellModel>;
    /**
     * The cell model factory for the notebook.
     */
    readonly contentFactory: NotebookModel.IContentFactory;
    /**
     * The major version number of the nbformat.
     */
    readonly nbformat: number;
    /**
     * The minor version number of the nbformat.
     */
    readonly nbformatMinor: number;
    /**
     * The metadata associated with the notebook.
     */
    readonly metadata: IObservableJSON;
    /**
     * The array of deleted cells since the notebook was last run.
     */
    readonly deletedCells: string[];
    /**
     * If the model is initialized or not.
     */
    isInitialized: boolean;
    readonly sharedModel: models.ISharedNotebook;
}
/**
 * An implementation of a notebook Model.
 */
export declare class NotebookModel implements INotebookModel {
    /**
     * Construct a new notebook model.
     */
    constructor(options?: NotebookModel.IOptions);
    /**
     * A signal emitted when the document content changes.
     */
    get contentChanged(): ISignal<this, void>;
    /**
     * A signal emitted when the document state changes.
     */
    get stateChanged(): ISignal<this, IChangedArgs<any>>;
    /**
     * The dirty state of the document.
     */
    get dirty(): boolean;
    set dirty(newValue: boolean);
    /**
     * The read only state of the document.
     */
    get readOnly(): boolean;
    set readOnly(newValue: boolean);
    /**
     * The metadata associated with the notebook.
     */
    get metadata(): IObservableJSON;
    /**
     * Get the observable list of notebook cells.
     */
    get cells(): IObservableUndoableList<ICellModel>;
    /**
     * The major version number of the nbformat.
     */
    get nbformat(): number;
    /**
     * The minor version number of the nbformat.
     */
    get nbformatMinor(): number;
    /**
     * The default kernel name of the document.
     */
    get defaultKernelName(): string;
    /**
     * A list of deleted cells for the notebook..
     */
    get deletedCells(): string[];
    /**
     * If the model is initialized or not.
     */
    get isInitialized(): boolean;
    /**
     * The default kernel language of the document.
     */
    get defaultKernelLanguage(): string;
    /**
     * Dispose of the resources held by the model.
     */
    dispose(): void;
    /**
     * Serialize the model to a string.
     */
    toString(): string;
    /**
     * Deserialize the model from a string.
     *
     * #### Notes
     * Should emit a [contentChanged] signal.
     */
    fromString(value: string): void;
    /**
     * Serialize the model to JSON.
     */
    toJSON(): nbformat.INotebookContent;
    /**
     * Deserialize the model from JSON.
     *
     * #### Notes
     * Should emit a [contentChanged] signal.
     */
    fromJSON(value: nbformat.INotebookContent): void;
    /**
     * Initialize the model with its current state.
     *
     * # Notes
     * Adds an empty code cell if the model is empty
     * and clears undo state.
     */
    initialize(): void;
    /**
     * Handle a change in the cells list.
     */
    private _onCellsChanged;
    private _onStateChanged;
    private _onMetadataChanged;
    /**
     * Make sure we have the required metadata fields.
     */
    private _ensureMetadata;
    /**
     * Trigger a state change signal.
     */
    protected triggerStateChange(args: IChangedArgs<any>): void;
    /**
     * Trigger a content changed signal.
     */
    protected triggerContentChange(): void;
    /**
     * Whether the model is disposed.
     */
    get isDisposed(): boolean;
    /**
     * The cell model factory for the notebook.
     */
    readonly contentFactory: NotebookModel.IContentFactory;
    /**
     * The shared notebook model.
     */
    readonly sharedModel: models.ISharedNotebook;
    /**
     * A mutex to update the shared model.
     */
    protected readonly _modelDBMutex: (f: () => void) => void;
    /**
     * The underlying `IModelDB` instance in which model
     * data is stored.
     */
    readonly modelDB: IModelDB;
    private _readOnly;
    private _contentChanged;
    private _stateChanged;
    private _trans;
    private _cells;
    private _nbformat;
    private _nbformatMinor;
    private _deletedCells;
    private _isInitialized;
    private _isDisposed;
}
/**
 * The namespace for the `NotebookModel` class statics.
 */
export declare namespace NotebookModel {
    /**
     * An options object for initializing a notebook model.
     */
    interface IOptions {
        /**
         * The language preference for the model.
         */
        languagePreference?: string;
        /**
         * A factory for creating cell models.
         *
         * The default is a shared factory instance.
         */
        contentFactory?: IContentFactory;
        /**
         * A modelDB for storing notebook data.
         */
        modelDB?: IModelDB;
        /**
         * Language translator.
         */
        translator?: ITranslator;
        /**
         * If the model is initialized or not.
         */
        isInitialized?: boolean;
        /**
         * Defines if the document can be undo/redo.
         */
        disableDocumentWideUndoRedo?: boolean;
    }
    /**
     * A factory for creating notebook model content.
     */
    interface IContentFactory {
        /**
         * The factory for output area models.
         */
        readonly codeCellContentFactory: CodeCellModel.IContentFactory;
        /**
         * The IModelDB in which to put data for the notebook model.
         */
        modelDB: IModelDB | undefined;
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
        createCell(type: nbformat.CellType, options: CellModel.IOptions): ICellModel;
        /**
         * Create a new code cell.
         *
         * @param options - The options used to create the cell.
         *
         * @returns A new code cell. If a source cell is provided, the
         *   new cell will be initialized with the data from the source.
         */
        createCodeCell(options: CodeCellModel.IOptions): ICodeCellModel;
        /**
         * Create a new markdown cell.
         *
         * @param options - The options used to create the cell.
         *
         * @returns A new markdown cell. If a source cell is provided, the
         *   new cell will be initialized with the data from the source.
         */
        createMarkdownCell(options: CellModel.IOptions): IMarkdownCellModel;
        /**
         * Create a new raw cell.
         *
         * @param options - The options used to create the cell.
         *
         * @returns A new raw cell. If a source cell is provided, the
         *   new cell will be initialized with the data from the source.
         */
        createRawCell(options: CellModel.IOptions): IRawCellModel;
        /**
         * Clone the content factory with a new IModelDB.
         */
        clone(modelDB: IModelDB): IContentFactory;
    }
    /**
     * The default implementation of an `IContentFactory`.
     */
    class ContentFactory {
        /**
         * Create a new cell model factory.
         */
        constructor(options: ContentFactory.IOptions);
        /**
         * The factory for code cell content.
         */
        readonly codeCellContentFactory: CodeCellModel.IContentFactory;
        /**
         * The IModelDB in which to put the notebook data.
         */
        readonly modelDB: IModelDB | undefined;
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
        createCell(type: nbformat.CellType, options: CellModel.IOptions): ICellModel;
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
        createCodeCell(options: CodeCellModel.IOptions): ICodeCellModel;
        /**
         * Create a new markdown cell.
         *
         * @param source - The data to use for the original source data.
         *
         * @returns A new markdown cell. If a source cell is provided, the
         *   new cell will be initialized with the data from the source.
         */
        createMarkdownCell(options: CellModel.IOptions): IMarkdownCellModel;
        /**
         * Create a new raw cell.
         *
         * @param source - The data to use for the original source data.
         *
         * @returns A new raw cell. If a source cell is provided, the
         *   new cell will be initialized with the data from the source.
         */
        createRawCell(options: CellModel.IOptions): IRawCellModel;
        /**
         * Clone the content factory with a new IModelDB.
         */
        clone(modelDB: IModelDB): ContentFactory;
    }
    /**
     * A namespace for the notebook model content factory.
     */
    namespace ContentFactory {
        /**
         * The options used to initialize a `ContentFactory`.
         */
        interface IOptions {
            /**
             * The factory for code cell model content.
             */
            codeCellContentFactory?: CodeCellModel.IContentFactory;
            /**
             * The modelDB in which to place new content.
             */
            modelDB?: IModelDB;
        }
    }
    /**
     * The default `ContentFactory` instance.
     */
    const defaultContentFactory: ContentFactory;
}
