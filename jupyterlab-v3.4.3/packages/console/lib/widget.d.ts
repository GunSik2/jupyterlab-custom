import { ISessionContext } from '@jupyterlab/apputils';
import { Cell, CellModel, CodeCell, CodeCellModel, ICodeCellModel, IRawCellModel, RawCell } from '@jupyterlab/cells';
import { CodeEditor, IEditorMimeTypeService } from '@jupyterlab/codeeditor';
import * as nbformat from '@jupyterlab/nbformat';
import { IObservableList } from '@jupyterlab/observables';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { JSONObject } from '@lumino/coreutils';
import { Message } from '@lumino/messaging';
import { ISignal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
/**
 * A widget containing a Jupyter console.
 *
 * #### Notes
 * The CodeConsole class is intended to be used within a ConsolePanel
 * instance. Under most circumstances, it is not instantiated by user code.
 */
export declare class CodeConsole extends Widget {
    /**
     * Construct a console widget.
     */
    constructor(options: CodeConsole.IOptions);
    /**
     * A signal emitted when the console finished executing its prompt cell.
     */
    get executed(): ISignal<this, Date>;
    /**
     * A signal emitted when a new prompt cell is created.
     */
    get promptCellCreated(): ISignal<this, CodeCell>;
    /**
     * The content factory used by the console.
     */
    readonly contentFactory: CodeConsole.IContentFactory;
    /**
     * The model factory for the console widget.
     */
    readonly modelFactory: CodeConsole.IModelFactory;
    /**
     * The rendermime instance used by the console.
     */
    readonly rendermime: IRenderMimeRegistry;
    /**
     * The client session used by the console.
     */
    readonly sessionContext: ISessionContext;
    /**
     * The configuration options for the text editor widget.
     */
    editorConfig?: Partial<CodeEditor.IConfig>;
    /**
     * The list of content cells in the console.
     *
     * #### Notes
     * This list does not include the current banner or the prompt for a console.
     * It may include previous banners as raw cells.
     */
    get cells(): IObservableList<Cell>;
    get promptCell(): CodeCell | null;
    /**
     * Add a new cell to the content panel.
     *
     * @param cell - The code cell widget being added to the content panel.
     *
     * @param msgId - The optional execution message id for the cell.
     *
     * #### Notes
     * This method is meant for use by outside classes that want to add cells to a
     * console. It is distinct from the `inject` method in that it requires
     * rendered code cell widgets and does not execute them (though it can store
     * the execution message id).
     */
    addCell(cell: CodeCell, msgId?: string): void;
    /**
     * Add a banner cell.
     */
    addBanner(): void;
    /**
     * Clear the code cells.
     */
    clear(): void;
    /**
     * Create a new cell with the built-in factory.
     */
    createCodeCell(): CodeCell;
    /**
     * Dispose of the resources held by the widget.
     */
    dispose(): void;
    /**
     * Execute the current prompt.
     *
     * @param force - Whether to force execution without checking code
     * completeness.
     *
     * @param timeout - The length of time, in milliseconds, that the execution
     * should wait for the API to determine whether code being submitted is
     * incomplete before attempting submission anyway. The default value is `250`.
     */
    execute(force?: boolean, timeout?: number): Promise<void>;
    /**
     * Get a cell given a message id.
     *
     * @param msgId - The message id.
     */
    getCell(msgId: string): CodeCell | undefined;
    /**
     * Inject arbitrary code for the console to execute immediately.
     *
     * @param code - The code contents of the cell being injected.
     *
     * @returns A promise that indicates when the injected cell's execution ends.
     */
    inject(code: string, metadata?: JSONObject): Promise<void>;
    /**
     * Insert a line break in the prompt cell.
     */
    insertLinebreak(): void;
    /**
     * Replaces the selected text in the prompt cell.
     *
     * @param text - The text to replace the selection.
     */
    replaceSelection(text: string): void;
    /**
     * Serialize the output.
     *
     * #### Notes
     * This only serializes the code cells and the prompt cell if it exists, and
     * skips any old banner cells.
     */
    serialize(): nbformat.ICodeCell[];
    /**
     * Handle `mousedown` events for the widget.
     */
    private _evtMouseDown;
    /**
     * Handle `mousemove` event of widget
     */
    private _evtMouseMove;
    /**
     * Start a drag event
     */
    private _startDrag;
    /**
     * Handle the DOM events for the widget.
     *
     * @param event -The DOM event sent to the widget.
     *
     * #### Notes
     * This method implements the DOM `EventListener` interface and is
     * called in response to events on the notebook panel's node. It should
     * not be called directly by user code.
     */
    handleEvent(event: Event): void;
    /**
     * Handle `after_attach` messages for the widget.
     */
    protected onAfterAttach(msg: Message): void;
    /**
     * Handle `before-detach` messages for the widget.
     */
    protected onBeforeDetach(msg: Message): void;
    /**
     * Handle `'activate-request'` messages.
     */
    protected onActivateRequest(msg: Message): void;
    /**
     * Make a new prompt cell.
     */
    protected newPromptCell(): void;
    /**
     * Handle `update-request` messages.
     */
    protected onUpdateRequest(msg: Message): void;
    /**
     * Handle the `'keydown'` event for the widget.
     */
    private _evtKeyDown;
    /**
     * Handle the `'mouseup'` event for the widget.
     */
    private _evtMouseUp;
    /**
     * Execute the code in the current prompt cell.
     */
    private _execute;
    /**
     * Update the console based on the kernel info.
     */
    private _handleInfo;
    /**
     * Create the options used to initialize a code cell widget.
     */
    private _createCodeCellOptions;
    /**
     * Handle cell disposed signals.
     */
    private _onCellDisposed;
    /**
     * Test whether we should execute the prompt cell.
     */
    private _shouldExecute;
    /**
     * Handle a keydown event on an editor.
     */
    private _onEditorKeydown;
    /**
     * Handle a change to the kernel.
     */
    private _onKernelChanged;
    /**
     * Handle a change to the kernel status.
     */
    private _onKernelStatusChanged;
    private _banner;
    private _cells;
    private _content;
    private _executed;
    private _history;
    private _input;
    private _mimetype;
    private _mimeTypeService;
    private _msgIds;
    private _msgIdCells;
    private _promptCellCreated;
    private _dragData;
    private _drag;
    private _focusedCell;
}
/**
 * A namespace for CodeConsole statics.
 */
export declare namespace CodeConsole {
    /**
     * The initialization options for a console widget.
     */
    interface IOptions {
        /**
         * The content factory for the console widget.
         */
        contentFactory: IContentFactory;
        /**
         * The model factory for the console widget.
         */
        modelFactory?: IModelFactory;
        /**
         * The mime renderer for the console widget.
         */
        rendermime: IRenderMimeRegistry;
        /**
         * The client session for the console widget.
         */
        sessionContext: ISessionContext;
        /**
         * The service used to look up mime types.
         */
        mimeTypeService: IEditorMimeTypeService;
    }
    /**
     * A content factory for console children.
     */
    interface IContentFactory extends Cell.IContentFactory {
        /**
         * Create a new code cell widget.
         */
        createCodeCell(options: CodeCell.IOptions): CodeCell;
        /**
         * Create a new raw cell widget.
         */
        createRawCell(options: RawCell.IOptions): RawCell;
    }
    /**
     * Default implementation of `IContentFactory`.
     */
    class ContentFactory extends Cell.ContentFactory implements IContentFactory {
        /**
         * Create a new code cell widget.
         *
         * #### Notes
         * If no cell content factory is passed in with the options, the one on the
         * notebook content factory is used.
         */
        createCodeCell(options: CodeCell.IOptions): CodeCell;
        /**
         * Create a new raw cell widget.
         *
         * #### Notes
         * If no cell content factory is passed in with the options, the one on the
         * notebook content factory is used.
         */
        createRawCell(options: RawCell.IOptions): RawCell;
    }
    /**
     * A namespace for the code console content factory.
     */
    namespace ContentFactory {
        /**
         * An initialize options for `ContentFactory`.
         */
        interface IOptions extends Cell.IContentFactory {
        }
    }
    /**
     * A default content factory for the code console.
     */
    const defaultContentFactory: IContentFactory;
    /**
     * A model factory for a console widget.
     */
    interface IModelFactory {
        /**
         * The factory for code cell content.
         */
        readonly codeCellContentFactory: CodeCellModel.IContentFactory;
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
         * Create a new raw cell.
         *
         * @param options - The options used to create the cell.
         *
         * @returns A new raw cell. If a source cell is provided, the
         *   new cell will be initialized with the data from the source.
         */
        createRawCell(options: CellModel.IOptions): IRawCellModel;
    }
    /**
     * The default implementation of an `IModelFactory`.
     */
    class ModelFactory {
        /**
         * Create a new cell model factory.
         */
        constructor(options?: IModelFactoryOptions);
        /**
         * The factory for output area models.
         */
        readonly codeCellContentFactory: CodeCellModel.IContentFactory;
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
         * Create a new raw cell.
         *
         * @param source - The data to use for the original source data.
         *
         * @returns A new raw cell. If a source cell is provided, the
         *   new cell will be initialized with the data from the source.
         */
        createRawCell(options: CellModel.IOptions): IRawCellModel;
    }
    /**
     * The options used to initialize a `ModelFactory`.
     */
    interface IModelFactoryOptions {
        /**
         * The factory for output area models.
         */
        codeCellContentFactory?: CodeCellModel.IContentFactory;
    }
    /**
     * The default `ModelFactory` instance.
     */
    const defaultModelFactory: ModelFactory;
}
