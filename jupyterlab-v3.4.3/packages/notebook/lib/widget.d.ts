import { Cell, CodeCell, MarkdownCell, RawCell } from '@jupyterlab/cells';
import { CodeEditor, IEditorMimeTypeService } from '@jupyterlab/codeeditor';
import { IChangedArgs } from '@jupyterlab/coreutils';
import * as nbformat from '@jupyterlab/nbformat';
import { IObservableMap } from '@jupyterlab/observables';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ITranslator } from '@jupyterlab/translation';
import { ReadonlyPartialJSONValue } from '@lumino/coreutils';
import { Message } from '@lumino/messaging';
import { ISignal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import { INotebookModel } from './model';
declare type RenderingLayout = 'default' | 'side-by-side';
/**
 * The interactivity modes for the notebook.
 */
export declare type NotebookMode = 'command' | 'edit';
/**
 * A widget which renders static non-interactive notebooks.
 *
 * #### Notes
 * The widget model must be set separately and can be changed
 * at any time.  Consumers of the widget must account for a
 * `null` model, and may want to listen to the `modelChanged`
 * signal.
 */
export declare class StaticNotebook extends Widget {
    /**
     * Construct a notebook widget.
     */
    constructor(options: StaticNotebook.IOptions);
    /**
     * A signal emitted when the notebook is fully rendered.
     */
    get fullyRendered(): ISignal<this, boolean>;
    /**
     * A signal emitted when the a placeholder cell is rendered.
     */
    get placeholderCellRendered(): ISignal<this, Cell>;
    /**
     * A signal emitted when the model of the notebook changes.
     */
    get modelChanged(): ISignal<this, void>;
    /**
     * A signal emitted when the model content changes.
     *
     * #### Notes
     * This is a convenience signal that follows the current model.
     */
    get modelContentChanged(): ISignal<this, void>;
    /**
     * The cell factory used by the widget.
     */
    readonly contentFactory: StaticNotebook.IContentFactory;
    /**
     * The Rendermime instance used by the widget.
     */
    readonly rendermime: IRenderMimeRegistry;
    /**
     * Translator to be used by cell renderers
     */
    readonly translator: ITranslator;
    /**
     * The model for the widget.
     */
    get model(): INotebookModel | null;
    set model(newValue: INotebookModel | null);
    /**
     * Get the mimetype for code cells.
     */
    get codeMimetype(): string;
    /**
     * A read-only sequence of the widgets in the notebook.
     */
    get widgets(): ReadonlyArray<Cell>;
    /**
     * A configuration object for cell editor settings.
     */
    get editorConfig(): StaticNotebook.IEditorConfig;
    set editorConfig(value: StaticNotebook.IEditorConfig);
    /**
     * A configuration object for notebook settings.
     */
    get notebookConfig(): StaticNotebook.INotebookConfig;
    set notebookConfig(value: StaticNotebook.INotebookConfig);
    get renderingLayout(): RenderingLayout | undefined;
    set renderingLayout(value: RenderingLayout | undefined);
    /**
     * Dispose of the resources held by the widget.
     */
    dispose(): void;
    /**
     * Handle a new model.
     *
     * #### Notes
     * This method is called after the model change has been handled
     * internally and before the `modelChanged` signal is emitted.
     * The default implementation is a no-op.
     */
    protected onModelChanged(oldValue: INotebookModel | null, newValue: INotebookModel | null): void;
    /**
     * Handle changes to the notebook model content.
     *
     * #### Notes
     * The default implementation emits the `modelContentChanged` signal.
     */
    protected onModelContentChanged(model: INotebookModel, args: void): void;
    /**
     * Handle changes to the notebook model metadata.
     *
     * #### Notes
     * The default implementation updates the mimetypes of the code cells
     * when the `language_info` metadata changes.
     */
    protected onMetadataChanged(sender: IObservableMap<ReadonlyPartialJSONValue | undefined>, args: IObservableMap.IChangedArgs<ReadonlyPartialJSONValue>): void;
    /**
     * Handle a cell being inserted.
     *
     * The default implementation is a no-op
     */
    protected onCellInserted(index: number, cell: Cell): void;
    /**
     * Handle a cell being moved.
     *
     * The default implementation is a no-op
     */
    protected onCellMoved(fromIndex: number, toIndex: number): void;
    /**
     * Handle a cell being removed.
     *
     * The default implementation is a no-op
     */
    protected onCellRemoved(index: number, cell: Cell): void;
    /**
     * Handle a new model on the widget.
     */
    private _onModelChanged;
    /**
     * Handle a change cells event.
     */
    private _onCellsChanged;
    /**
     * Create a cell widget and insert into the notebook.
     */
    private _insertCell;
    private _scheduleCellRenderOnIdle;
    private _renderPlaceholderCells;
    private _renderPlaceholderCell;
    /**
     * Create a code cell widget from a code cell model.
     */
    private _createCodeCell;
    /**
     * Create a markdown cell widget from a markdown cell model.
     */
    private _createMarkdownCell;
    /**
     * Create a placeholder cell widget from a raw cell model.
     */
    private _createPlaceholderCell;
    /**
     * Create a raw cell widget from a raw cell model.
     */
    private _createRawCell;
    /**
     * Move a cell widget.
     */
    private _moveCell;
    /**
     * Remove a cell widget.
     */
    private _removeCell;
    /**
     * Update the mimetype of the notebook.
     */
    private _updateMimetype;
    /**
     * Handle an update to the collaborators.
     */
    private _onCollaboratorsChanged;
    /**
     * Update editor settings for notebook cells.
     */
    private _updateEditorConfig;
    /**
     * Apply updated notebook settings.
     */
    private _updateNotebookConfig;
    private _incrementRenderedCount;
    get remainingCellToRenderCount(): number;
    private _editorConfig;
    private _notebookConfig;
    private _mimetype;
    private _model;
    private _mimetypeService;
    private _modelChanged;
    private _modelContentChanged;
    private _fullyRendered;
    private _placeholderCellRendered;
    private _observer;
    private _renderedCellsCount;
    private _toRenderMap;
    private _idleCallBack;
    private _cellsArray;
    private _renderingLayout;
}
/**
 * The namespace for the `StaticNotebook` class statics.
 */
export declare namespace StaticNotebook {
    /**
     * An options object for initializing a static notebook.
     */
    interface IOptions {
        /**
         * The rendermime instance used by the widget.
         */
        rendermime: IRenderMimeRegistry;
        /**
         * The language preference for the model.
         */
        languagePreference?: string;
        /**
         * A factory for creating content.
         */
        contentFactory?: IContentFactory;
        /**
         * A configuration object for the cell editor settings.
         */
        editorConfig?: IEditorConfig;
        /**
         * A configuration object for notebook settings.
         */
        notebookConfig?: INotebookConfig;
        /**
         * The service used to look up mime types.
         */
        mimeTypeService: IEditorMimeTypeService;
        /**
         * The application language translator.
         */
        translator?: ITranslator;
    }
    /**
     * A factory for creating notebook content.
     *
     * #### Notes
     * This extends the content factory of the cell itself, which extends the content
     * factory of the output area and input area. The result is that there is a single
     * factory for creating all child content of a notebook.
     */
    interface IContentFactory extends Cell.IContentFactory {
        /**
         * Create a new code cell widget.
         */
        createCodeCell(options: CodeCell.IOptions, parent: StaticNotebook): CodeCell;
        /**
         * Create a new markdown cell widget.
         */
        createMarkdownCell(options: MarkdownCell.IOptions, parent: StaticNotebook): MarkdownCell;
        /**
         * Create a new raw cell widget.
         */
        createRawCell(options: RawCell.IOptions, parent: StaticNotebook): RawCell;
    }
    /**
     * A config object for the cell editors.
     */
    interface IEditorConfig {
        /**
         * Config options for code cells.
         */
        readonly code: Partial<CodeEditor.IConfig>;
        /**
         * Config options for markdown cells.
         */
        readonly markdown: Partial<CodeEditor.IConfig>;
        /**
         * Config options for raw cells.
         */
        readonly raw: Partial<CodeEditor.IConfig>;
    }
    /**
     * Default configuration options for cell editors.
     */
    const defaultEditorConfig: IEditorConfig;
    /**
     * A config object for the notebook widget
     */
    interface INotebookConfig {
        /**
         * Enable scrolling past the last cell
         */
        scrollPastEnd: boolean;
        /**
         * The default type for new notebook cells.
         */
        defaultCell: nbformat.CellType;
        /**
         * Should timing be recorded in metadata
         */
        recordTiming: boolean;
        numberCellsToRenderDirectly: number;
        remainingTimeBeforeRescheduling: number;
        /**
         * Defines if the placeholder cells should be rendered
         * when the browser is idle.
         */
        renderCellOnIdle: boolean;
        /**
         * Defines the observed top margin for the
         * virtual notebook, set a positive number of pixels
         * to render cells below the visible view.
         */
        observedTopMargin: string;
        /**
         * Defines the observed bottom margin for the
         * virtual notebook, set a positive number of pixels
         * to render cells below the visible view.
         */
        observedBottomMargin: string;
        /**
         * Defines the maximum number of outputs per cell.
         */
        maxNumberOutputs: number;
        /**
         * Should an editor be shown for read-only markdown
         */
        showEditorForReadOnlyMarkdown?: boolean;
        /**
         * Defines if the document can be undo/redo.
         */
        disableDocumentWideUndoRedo: boolean;
        /**
         * Defines the rendering layout to use.
         */
        renderingLayout: RenderingLayout;
        /**
         * Override the side-by-side left margin.
         */
        sideBySideLeftMarginOverride: string;
        /**
         * Override the side-by-side right margin.
         */
        sideBySideRightMarginOverride: string;
        /**
         * Side-by-side output ratio.
         */
        sideBySideOutputRatio: number;
    }
    /**
     * Default configuration options for notebooks.
     */
    const defaultNotebookConfig: INotebookConfig;
    /**
     * The default implementation of an `IContentFactory`.
     */
    class ContentFactory extends Cell.ContentFactory implements IContentFactory {
        /**
         * Create a new code cell widget.
         *
         * #### Notes
         * If no cell content factory is passed in with the options, the one on the
         * notebook content factory is used.
         */
        createCodeCell(options: CodeCell.IOptions, parent: StaticNotebook): CodeCell;
        /**
         * Create a new markdown cell widget.
         *
         * #### Notes
         * If no cell content factory is passed in with the options, the one on the
         * notebook content factory is used.
         */
        createMarkdownCell(options: MarkdownCell.IOptions, parent: StaticNotebook): MarkdownCell;
        /**
         * Create a new raw cell widget.
         *
         * #### Notes
         * If no cell content factory is passed in with the options, the one on the
         * notebook content factory is used.
         */
        createRawCell(options: RawCell.IOptions, parent: StaticNotebook): RawCell;
    }
    /**
     * A namespace for the static notebook content factory.
     */
    namespace ContentFactory {
        /**
         * Options for the content factory.
         */
        interface IOptions extends Cell.ContentFactory.IOptions {
        }
    }
    /**
     * Default content factory for the static notebook widget.
     */
    const defaultContentFactory: IContentFactory;
}
/**
 * A notebook widget that supports interactivity.
 */
export declare class Notebook extends StaticNotebook {
    /**
     * Construct a notebook widget.
     */
    constructor(options: Notebook.IOptions);
    /**
     * A signal emitted when the active cell changes.
     *
     * #### Notes
     * This can be due to the active index changing or the
     * cell at the active index changing.
     */
    get activeCellChanged(): ISignal<this, Cell>;
    /**
     * A signal emitted when the state of the notebook changes.
     */
    get stateChanged(): ISignal<this, IChangedArgs<any>>;
    /**
     * A signal emitted when the selection state of the notebook changes.
     */
    get selectionChanged(): ISignal<this, void>;
    /**
     * The interactivity mode of the notebook.
     */
    get mode(): NotebookMode;
    set mode(newValue: NotebookMode);
    /**
     * The active cell index of the notebook.
     *
     * #### Notes
     * The index will be clamped to the bounds of the notebook cells.
     */
    get activeCellIndex(): number;
    set activeCellIndex(newValue: number);
    /**
     * Get the active cell widget.
     *
     * #### Notes
     * This is a cell or `null` if there is no active cell.
     */
    get activeCell(): Cell | null;
    get lastClipboardInteraction(): 'copy' | 'cut' | 'paste' | null;
    set lastClipboardInteraction(newValue: 'copy' | 'cut' | 'paste' | null);
    /**
     * Dispose of the resources held by the widget.
     */
    dispose(): void;
    /**
     * Select a cell widget.
     *
     * #### Notes
     * It is a no-op if the value does not change.
     * It will emit the `selectionChanged` signal.
     */
    select(widget: Cell): void;
    /**
     * Deselect a cell widget.
     *
     * #### Notes
     * It is a no-op if the value does not change.
     * It will emit the `selectionChanged` signal.
     */
    deselect(widget: Cell): void;
    /**
     * Whether a cell is selected.
     */
    isSelected(widget: Cell): boolean;
    /**
     * Whether a cell is selected or is the active cell.
     */
    isSelectedOrActive(widget: Cell): boolean;
    /**
     * Deselect all of the cells.
     */
    deselectAll(): void;
    /**
     * Move the head of an existing contiguous selection to extend the selection.
     *
     * @param index - The new head of the existing selection.
     *
     * #### Notes
     * If there is no existing selection, the active cell is considered an
     * existing one-cell selection.
     *
     * If the new selection is a single cell, that cell becomes the active cell
     * and all cells are deselected.
     *
     * There is no change if there are no cells (i.e., activeCellIndex is -1).
     */
    extendContiguousSelectionTo(index: number): void;
    /**
     * Get the head and anchor of a contiguous cell selection.
     *
     * The head of a contiguous selection is always the active cell.
     *
     * If there are no cells selected, `{head: null, anchor: null}` is returned.
     *
     * Throws an error if the currently selected cells do not form a contiguous
     * selection.
     */
    getContiguousSelection(): {
        head: number;
        anchor: number;
    } | {
        head: null;
        anchor: null;
    };
    /**
     * Scroll so that the given position is centered.
     *
     * @param position - The vertical position in the notebook widget.
     *
     * @param threshold - An optional threshold for the scroll (0-50, defaults to
     * 25).
     *
     * #### Notes
     * If the position is within the threshold percentage of the widget height,
     * measured from the center of the widget, the scroll position will not be
     * changed. A threshold of 0 means we will always scroll so the position is
     * centered, and a threshold of 50 means scrolling only happens if position is
     * outside the current window.
     */
    scrollToPosition(position: number, threshold?: number): void;
    /**
     * Scroll so that the given cell is in view. Selects and activates cell.
     *
     * @param cell - A cell in the notebook widget.
     *
     */
    scrollToCell(cell: Cell): void;
    /**
     * Set URI fragment identifier.
     */
    setFragment(fragment: string): void;
    /**
     * Handle the DOM events for the widget.
     *
     * @param event - The DOM event sent to the widget.
     *
     * #### Notes
     * This method implements the DOM `EventListener` interface and is
     * called in response to events on the notebook panel's node. It should
     * not be called directly by user code.
     */
    handleEvent(event: Event): void;
    /**
     * Handle `after-attach` messages for the widget.
     */
    protected onAfterAttach(msg: Message): void;
    /**
     * Handle `before-detach` messages for the widget.
     */
    protected onBeforeDetach(msg: Message): void;
    /**
     * A message handler invoked on an `'after-show'` message.
     */
    protected onAfterShow(msg: Message): void;
    /**
     * A message handler invoked on a `'resize'` message.
     */
    protected onResize(msg: Widget.ResizeMessage): void;
    /**
     * A message handler invoked on an `'before-hide'` message.
     */
    protected onBeforeHide(msg: Message): void;
    /**
     * Handle `'activate-request'` messages.
     */
    protected onActivateRequest(msg: Message): void;
    /**
     * Handle `update-request` messages sent to the widget.
     */
    protected onUpdateRequest(msg: Message): void;
    /**
     * Handle a cell being inserted.
     */
    protected onCellInserted(index: number, cell: Cell): void;
    /**
     * Handle a cell being moved.
     */
    protected onCellMoved(fromIndex: number, toIndex: number): void;
    /**
     * Handle a cell being removed.
     */
    protected onCellRemoved(index: number, cell: Cell): void;
    /**
     * Handle a new model.
     */
    protected onModelChanged(oldValue: INotebookModel, newValue: INotebookModel): void;
    /**
     * Handle edge request signals from cells.
     */
    private _onEdgeRequest;
    /**
     * Ensure that the notebook has proper focus.
     */
    private _ensureFocus;
    /**
     * Find the cell index containing the target html element.
     *
     * #### Notes
     * Returns -1 if the cell is not found.
     */
    private _findCell;
    /**
     * Find the target of html mouse event and cell index containing this target.
     *
     * #### Notes
     * Returned index is -1 if the cell is not found.
     */
    private _findEventTargetAndCell;
    /**
     * Handle `contextmenu` event.
     */
    private _evtContextMenuCapture;
    /**
     * Handle `mousedown` event in the capture phase for the widget.
     */
    private _evtMouseDownCapture;
    /**
     * Handle `mousedown` events for the widget.
     */
    private _evtMouseDown;
    /**
     * Handle the `'mouseup'` event on the document.
     */
    private _evtDocumentMouseup;
    /**
     * Handle the `'mousemove'` event for the widget.
     */
    private _evtDocumentMousemove;
    /**
     * Handle the `'lm-dragenter'` event for the widget.
     */
    private _evtDragEnter;
    /**
     * Handle the `'lm-dragleave'` event for the widget.
     */
    private _evtDragLeave;
    /**
     * Handle the `'lm-dragover'` event for the widget.
     */
    private _evtDragOver;
    /**
     * Handle the `'lm-drop'` event for the widget.
     */
    private _evtDrop;
    /**
     * Start a drag event.
     */
    private _startDrag;
    /**
     * Handle `focus` events for the widget.
     */
    private _evtFocusIn;
    /**
     * Handle `focusout` events for the notebook.
     */
    private _evtFocusOut;
    /**
     * Handle `dblclick` events for the widget.
     */
    private _evtDblClick;
    /**
     * Remove selections from inactive cells to avoid
     * spurious cursors.
     */
    private _trimSelections;
    private _activeCellIndex;
    private _activeCell;
    private _mode;
    private _drag;
    private _fragment;
    private _dragData;
    private _mouseMode;
    private _activeCellChanged;
    private _stateChanged;
    private _selectionChanged;
    private _cellLayoutStateCache?;
    private _checkCacheOnNextResize;
    private _lastClipboardInteraction;
}
/**
 * The namespace for the `Notebook` class statics.
 */
export declare namespace Notebook {
    /**
     * An options object for initializing a notebook widget.
     */
    interface IOptions extends StaticNotebook.IOptions {
    }
    /**
     * The content factory for the notebook widget.
     */
    interface IContentFactory extends StaticNotebook.IContentFactory {
    }
    /**
     * The default implementation of a notebook content factory..
     *
     * #### Notes
     * Override methods on this class to customize the default notebook factory
     * methods that create notebook content.
     */
    class ContentFactory extends StaticNotebook.ContentFactory {
    }
    /**
     * A namespace for the notebook content factory.
     */
    namespace ContentFactory {
        /**
         * An options object for initializing a notebook content factory.
         */
        interface IOptions extends StaticNotebook.ContentFactory.IOptions {
        }
    }
    const defaultContentFactory: IContentFactory;
}
export {};
