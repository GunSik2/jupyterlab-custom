import { ISessionContext, SessionContext } from '@jupyterlab/apputils';
import { IDocumentProviderFactory } from '@jupyterlab/docprovider';
import { ModelDB } from '@jupyterlab/observables';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { Contents, ServiceManager } from '@jupyterlab/services';
import { ITranslator } from '@jupyterlab/translation';
import { IDisposable } from '@lumino/disposable';
import { ISignal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import { DocumentRegistry } from './registry';
/**
 * An implementation of a document context.
 *
 * This class is typically instantiated by the document manager.
 */
export declare class Context<T extends DocumentRegistry.IModel = DocumentRegistry.IModel> implements DocumentRegistry.IContext<T> {
    /**
     * Construct a new document context.
     */
    constructor(options: Context.IOptions<T>);
    /**
     * A signal emitted when the path changes.
     */
    get pathChanged(): ISignal<this, string>;
    /**
     * A signal emitted when the model is saved or reverted.
     */
    get fileChanged(): ISignal<this, Contents.IModel>;
    /**
     * A signal emitted on the start and end of a saving operation.
     */
    get saveState(): ISignal<this, DocumentRegistry.SaveState>;
    /**
     * A signal emitted when the context is disposed.
     */
    get disposed(): ISignal<this, void>;
    /**
     * Configurable margin used to detect document modification conflicts, in milliseconds
     */
    get lastModifiedCheckMargin(): number;
    set lastModifiedCheckMargin(value: number);
    /**
     * Get the model associated with the document.
     */
    get model(): T;
    /**
     * The client session object associated with the context.
     */
    readonly sessionContext: SessionContext;
    /**
     * The current path associated with the document.
     */
    get path(): string;
    /**
     * The current local path associated with the document.
     * If the document is in the default notebook file browser,
     * this is the same as the path.
     */
    get localPath(): string;
    /**
     * The current contents model associated with the document.
     *
     * #### Notes
     * The contents model will be null until the context is populated.
     * It will have an  empty `contents` field.
     */
    get contentsModel(): Contents.IModel | null;
    /**
     * Get the model factory name.
     *
     * #### Notes
     * This is not part of the `IContext` API.
     */
    get factoryName(): string;
    /**
     * Test whether the context is disposed.
     */
    get isDisposed(): boolean;
    /**
     * Dispose of the resources held by the context.
     */
    dispose(): void;
    /**
     * Whether the context is ready.
     */
    get isReady(): boolean;
    /**
     * A promise that is fulfilled when the context is ready.
     */
    get ready(): Promise<void>;
    /**
     * The url resolver for the context.
     */
    readonly urlResolver: IRenderMime.IResolver;
    /**
     * Initialize the context.
     *
     * @param isNew - Whether it is a new file.
     *
     * @returns a promise that resolves upon initialization.
     */
    initialize(isNew: boolean): Promise<void>;
    /**
     * Rename the document.
     *
     * @param newName - the new name for the document.
     */
    rename(newName: string): Promise<void>;
    /**
     * Save the document contents to disk.
     */
    save(): Promise<void>;
    /**
     * Save the document to a different path chosen by the user.
     */
    saveAs(): Promise<void>;
    /**
     * Download a file.
     *
     * @param path - The path of the file to be downloaded.
     *
     * @returns A promise which resolves when the file has begun
     *   downloading.
     */
    download(): Promise<void>;
    /**
     * Revert the document contents to disk contents.
     */
    revert(): Promise<void>;
    /**
     * Create a checkpoint for the file.
     */
    createCheckpoint(): Promise<Contents.ICheckpointModel>;
    /**
     * Delete a checkpoint for the file.
     */
    deleteCheckpoint(checkpointId: string): Promise<void>;
    /**
     * Restore the file to a known checkpoint state.
     */
    restoreCheckpoint(checkpointId?: string): Promise<void>;
    /**
     * List available checkpoints for a file.
     */
    listCheckpoints(): Promise<Contents.ICheckpointModel[]>;
    /**
     * Add a sibling widget to the document manager.
     *
     * @param widget - The widget to add to the document manager.
     *
     * @param options - The desired options for adding the sibling.
     *
     * @returns A disposable used to remove the sibling if desired.
     *
     * #### Notes
     * It is assumed that the widget has the same model and context
     * as the original widget.
     */
    addSibling(widget: Widget, options?: DocumentRegistry.IOpenOptions): IDisposable;
    /**
     * Handle a change on the contents manager.
     */
    private _onFileChanged;
    /**
     * Handle a change to a session property.
     */
    private _onSessionChanged;
    /**
     * Update our contents model, without the content.
     */
    private _updateContentsModel;
    /**
     * Handle an initial population.
     */
    private _populate;
    /**
     * Rename the document.
     *
     * @param newName - the new name for the document.
     */
    private _rename;
    /**
     * Save the document contents to disk.
     */
    private _save;
    /**
     * Revert the document contents to disk contents.
     *
     * @param initializeModel - call the model's initialization function after
     * deserializing the content.
     */
    private _revert;
    /**
     * Save a file, dealing with conflicts.
     */
    private _maybeSave;
    /**
     * Handle a save/load error with a dialog.
     */
    private _handleError;
    /**
     * Add a checkpoint the file is writable.
     */
    private _maybeCheckpoint;
    /**
     * Handle a time conflict.
     */
    private _timeConflict;
    /**
     * Handle a time conflict.
     */
    private _maybeOverWrite;
    /**
     * Finish a saveAs operation given a new path.
     */
    private _finishSaveAs;
    protected translator: ITranslator;
    private _trans;
    private _manager;
    private _opener;
    private _model;
    private _modelDB;
    private _path;
    private _lineEnding;
    private _factory;
    private _contentsModel;
    private _readyPromise;
    private _populatedPromise;
    private _isPopulated;
    private _isReady;
    private _isDisposed;
    private _pathChanged;
    private _fileChanged;
    private _saveState;
    private _disposed;
    private _dialogs;
    private _provider;
    private _ydoc;
    private _ycontext;
    private _lastModifiedCheckMargin;
    private _timeConflictModalIsOpen;
}
/**
 * A namespace for `Context` statics.
 */
export declare namespace Context {
    /**
     * The options used to initialize a context.
     */
    interface IOptions<T extends DocumentRegistry.IModel> {
        /**
         * A service manager instance.
         */
        manager: ServiceManager.IManager;
        /**
         * The model factory used to create the model.
         */
        factory: DocumentRegistry.IModelFactory<T>;
        /**
         * The initial path of the file.
         */
        path: string;
        /**
         * Whether the model is collaborative.
         */
        collaborative?: boolean;
        /**
         * The kernel preference associated with the context.
         */
        kernelPreference?: ISessionContext.IKernelPreference;
        /**
         * An factory method for the document provider.
         */
        docProviderFactory?: IDocumentProviderFactory;
        /**
         * An IModelDB factory method which may be used for the document.
         */
        modelDBFactory?: ModelDB.IFactory;
        /**
         * An optional callback for opening sibling widgets.
         */
        opener?: (widget: Widget) => void;
        /**
         * A function to call when the kernel is busy.
         */
        setBusy?: () => IDisposable;
        /**
         * The dialogs used for the session context.
         */
        sessionDialogs?: ISessionContext.IDialogs;
        /**
         * The application language translator.
         */
        translator?: ITranslator;
        /**
         * Max acceptable difference, in milliseconds, between last modified timestamps on disk and client
         */
        lastModifiedCheckMargin?: number;
    }
}
