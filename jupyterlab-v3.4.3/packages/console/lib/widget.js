// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { Cell, CellDragUtils, CodeCell, CodeCellModel, isCodeCellModel, RawCell, RawCellModel } from '@jupyterlab/cells';
import { ObservableList } from '@jupyterlab/observables';
import { each } from '@lumino/algorithm';
import { MimeData } from '@lumino/coreutils';
import { Drag } from '@lumino/dragdrop';
import { Signal } from '@lumino/signaling';
import { Panel, PanelLayout, Widget } from '@lumino/widgets';
import { ConsoleHistory } from './history';
/**
 * The data attribute added to a widget that has an active kernel.
 */
const KERNEL_USER = 'jpKernelUser';
/**
 * The data attribute added to a widget can run code.
 */
const CODE_RUNNER = 'jpCodeRunner';
/**
 * The class name added to console widgets.
 */
const CONSOLE_CLASS = 'jp-CodeConsole';
/**
 * The class added to console cells
 */
const CONSOLE_CELL_CLASS = 'jp-Console-cell';
/**
 * The class name added to the console banner.
 */
const BANNER_CLASS = 'jp-CodeConsole-banner';
/**
 * The class name of the active prompt cell.
 */
const PROMPT_CLASS = 'jp-CodeConsole-promptCell';
/**
 * The class name of the panel that holds cell content.
 */
const CONTENT_CLASS = 'jp-CodeConsole-content';
/**
 * The class name of the panel that holds prompts.
 */
const INPUT_CLASS = 'jp-CodeConsole-input';
/**
 * The timeout in ms for execution requests to the kernel.
 */
const EXECUTION_TIMEOUT = 250;
/**
 * The mimetype used for Jupyter cell data.
 */
const JUPYTER_CELL_MIME = 'application/vnd.jupyter.cells';
/**
 * A widget containing a Jupyter console.
 *
 * #### Notes
 * The CodeConsole class is intended to be used within a ConsolePanel
 * instance. Under most circumstances, it is not instantiated by user code.
 */
export class CodeConsole extends Widget {
    /**
     * Construct a console widget.
     */
    constructor(options) {
        super();
        this._banner = null;
        this._executed = new Signal(this);
        this._mimetype = 'text/x-ipython';
        this._msgIds = new Map();
        this._msgIdCells = new Map();
        this._promptCellCreated = new Signal(this);
        this._dragData = null;
        this._drag = null;
        this._focusedCell = null;
        this.addClass(CONSOLE_CLASS);
        this.node.dataset[KERNEL_USER] = 'true';
        this.node.dataset[CODE_RUNNER] = 'true';
        this.node.tabIndex = -1; // Allow the widget to take focus.
        // Create the panels that hold the content and input.
        const layout = (this.layout = new PanelLayout());
        this._cells = new ObservableList();
        this._content = new Panel();
        this._input = new Panel();
        this.contentFactory =
            options.contentFactory || CodeConsole.defaultContentFactory;
        this.modelFactory = options.modelFactory || CodeConsole.defaultModelFactory;
        this.rendermime = options.rendermime;
        this.sessionContext = options.sessionContext;
        this._mimeTypeService = options.mimeTypeService;
        // Add top-level CSS classes.
        this._content.addClass(CONTENT_CLASS);
        this._input.addClass(INPUT_CLASS);
        // Insert the content and input panes into the widget.
        layout.addWidget(this._content);
        layout.addWidget(this._input);
        this._history = new ConsoleHistory({
            sessionContext: this.sessionContext
        });
        void this._onKernelChanged();
        this.sessionContext.kernelChanged.connect(this._onKernelChanged, this);
        this.sessionContext.statusChanged.connect(this._onKernelStatusChanged, this);
    }
    /**
     * A signal emitted when the console finished executing its prompt cell.
     */
    get executed() {
        return this._executed;
    }
    /**
     * A signal emitted when a new prompt cell is created.
     */
    get promptCellCreated() {
        return this._promptCellCreated;
    }
    /**
     * The list of content cells in the console.
     *
     * #### Notes
     * This list does not include the current banner or the prompt for a console.
     * It may include previous banners as raw cells.
     */
    get cells() {
        return this._cells;
    }
    /*
     * The console input prompt cell.
     */
    get promptCell() {
        const inputLayout = this._input.layout;
        return inputLayout.widgets[0] || null;
    }
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
    addCell(cell, msgId) {
        cell.addClass(CONSOLE_CELL_CLASS);
        this._content.addWidget(cell);
        this._cells.push(cell);
        if (msgId) {
            this._msgIds.set(msgId, cell);
            this._msgIdCells.set(cell, msgId);
        }
        cell.disposed.connect(this._onCellDisposed, this);
        this.update();
    }
    /**
     * Add a banner cell.
     */
    addBanner() {
        if (this._banner) {
            // An old banner just becomes a normal cell now.
            const cell = this._banner;
            this._cells.push(this._banner);
            cell.disposed.connect(this._onCellDisposed, this);
        }
        // Create the banner.
        const model = this.modelFactory.createRawCell({});
        model.value.text = '...';
        const banner = (this._banner = new RawCell({
            model,
            contentFactory: this.contentFactory,
            placeholder: false
        })).initializeState();
        banner.addClass(BANNER_CLASS);
        banner.readOnly = true;
        this._content.addWidget(banner);
    }
    /**
     * Clear the code cells.
     */
    clear() {
        // Dispose all the content cells
        const cells = this._cells;
        while (cells.length > 0) {
            cells.get(0).dispose();
        }
    }
    /**
     * Create a new cell with the built-in factory.
     */
    createCodeCell() {
        const factory = this.contentFactory;
        const options = this._createCodeCellOptions();
        const cell = factory.createCodeCell(options);
        cell.readOnly = true;
        cell.model.mimeType = this._mimetype;
        return cell;
    }
    /**
     * Dispose of the resources held by the widget.
     */
    dispose() {
        // Do nothing if already disposed.
        if (this.isDisposed) {
            return;
        }
        this._cells.clear();
        this._msgIdCells = null;
        this._msgIds = null;
        this._history.dispose();
        super.dispose();
    }
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
    async execute(force = false, timeout = EXECUTION_TIMEOUT) {
        var _a, _b;
        if (((_b = (_a = this.sessionContext.session) === null || _a === void 0 ? void 0 : _a.kernel) === null || _b === void 0 ? void 0 : _b.status) === 'dead') {
            return;
        }
        const promptCell = this.promptCell;
        if (!promptCell) {
            throw new Error('Cannot execute without a prompt cell');
        }
        promptCell.model.trusted = true;
        if (force) {
            // Create a new prompt cell before kernel execution to allow typeahead.
            this.newPromptCell();
            await this._execute(promptCell);
            return;
        }
        // Check whether we should execute.
        const shouldExecute = await this._shouldExecute(timeout);
        if (this.isDisposed) {
            return;
        }
        if (shouldExecute) {
            // Create a new prompt cell before kernel execution to allow typeahead.
            this.newPromptCell();
            this.promptCell.editor.focus();
            await this._execute(promptCell);
        }
        else {
            // add a newline if we shouldn't execute
            promptCell.editor.newIndentedLine();
        }
    }
    /**
     * Get a cell given a message id.
     *
     * @param msgId - The message id.
     */
    getCell(msgId) {
        return this._msgIds.get(msgId);
    }
    /**
     * Inject arbitrary code for the console to execute immediately.
     *
     * @param code - The code contents of the cell being injected.
     *
     * @returns A promise that indicates when the injected cell's execution ends.
     */
    inject(code, metadata = {}) {
        const cell = this.createCodeCell();
        cell.model.value.text = code;
        for (const key of Object.keys(metadata)) {
            cell.model.metadata.set(key, metadata[key]);
        }
        this.addCell(cell);
        return this._execute(cell);
    }
    /**
     * Insert a line break in the prompt cell.
     */
    insertLinebreak() {
        const promptCell = this.promptCell;
        if (!promptCell) {
            return;
        }
        promptCell.editor.newIndentedLine();
    }
    /**
     * Replaces the selected text in the prompt cell.
     *
     * @param text - The text to replace the selection.
     */
    replaceSelection(text) {
        var _a, _b;
        const promptCell = this.promptCell;
        if (!promptCell) {
            return;
        }
        (_b = (_a = promptCell.editor).replaceSelection) === null || _b === void 0 ? void 0 : _b.call(_a, text);
    }
    /**
     * Serialize the output.
     *
     * #### Notes
     * This only serializes the code cells and the prompt cell if it exists, and
     * skips any old banner cells.
     */
    serialize() {
        const cells = [];
        each(this._cells, cell => {
            const model = cell.model;
            if (isCodeCellModel(model)) {
                cells.push(model.toJSON());
            }
        });
        if (this.promptCell) {
            cells.push(this.promptCell.model.toJSON());
        }
        return cells;
    }
    /**
     * Handle `mousedown` events for the widget.
     */
    _evtMouseDown(event) {
        const { button, shiftKey } = event;
        // We only handle main or secondary button actions.
        if (!(button === 0 || button === 2) ||
            // Shift right-click gives the browser default behavior.
            (shiftKey && button === 2)) {
            return;
        }
        let target = event.target;
        const cellFilter = (node) => node.classList.contains(CONSOLE_CELL_CLASS);
        let cellIndex = CellDragUtils.findCell(target, this._cells, cellFilter);
        if (cellIndex === -1) {
            // `event.target` sometimes gives an orphaned node in
            // Firefox 57, which can have `null` anywhere in its parent line. If we fail
            // to find a cell using `event.target`, try again using a target
            // reconstructed from the position of the click event.
            target = document.elementFromPoint(event.clientX, event.clientY);
            cellIndex = CellDragUtils.findCell(target, this._cells, cellFilter);
        }
        if (cellIndex === -1) {
            return;
        }
        const cell = this._cells.get(cellIndex);
        const targetArea = CellDragUtils.detectTargetArea(cell, event.target);
        if (targetArea === 'prompt') {
            this._dragData = {
                pressX: event.clientX,
                pressY: event.clientY,
                index: cellIndex
            };
            this._focusedCell = cell;
            document.addEventListener('mouseup', this, true);
            document.addEventListener('mousemove', this, true);
            event.preventDefault();
        }
    }
    /**
     * Handle `mousemove` event of widget
     */
    _evtMouseMove(event) {
        const data = this._dragData;
        if (data &&
            CellDragUtils.shouldStartDrag(data.pressX, data.pressY, event.clientX, event.clientY)) {
            void this._startDrag(data.index, event.clientX, event.clientY);
        }
    }
    /**
     * Start a drag event
     */
    _startDrag(index, clientX, clientY) {
        const cellModel = this._focusedCell.model;
        const selected = [cellModel.toJSON()];
        const dragImage = CellDragUtils.createCellDragImage(this._focusedCell, selected);
        this._drag = new Drag({
            mimeData: new MimeData(),
            dragImage,
            proposedAction: 'copy',
            supportedActions: 'copy',
            source: this
        });
        this._drag.mimeData.setData(JUPYTER_CELL_MIME, selected);
        const textContent = cellModel.value.text;
        this._drag.mimeData.setData('text/plain', textContent);
        this._focusedCell = null;
        document.removeEventListener('mousemove', this, true);
        document.removeEventListener('mouseup', this, true);
        return this._drag.start(clientX, clientY).then(() => {
            if (this.isDisposed) {
                return;
            }
            this._drag = null;
            this._dragData = null;
        });
    }
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
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                this._evtKeyDown(event);
                break;
            case 'mousedown':
                this._evtMouseDown(event);
                break;
            case 'mousemove':
                this._evtMouseMove(event);
                break;
            case 'mouseup':
                this._evtMouseUp(event);
                break;
            default:
                break;
        }
    }
    /**
     * Handle `after_attach` messages for the widget.
     */
    onAfterAttach(msg) {
        const node = this.node;
        node.addEventListener('keydown', this, true);
        node.addEventListener('click', this);
        node.addEventListener('mousedown', this);
        // Create a prompt if necessary.
        if (!this.promptCell) {
            this.newPromptCell();
        }
        else {
            this.promptCell.editor.focus();
            this.update();
        }
    }
    /**
     * Handle `before-detach` messages for the widget.
     */
    onBeforeDetach(msg) {
        const node = this.node;
        node.removeEventListener('keydown', this, true);
        node.removeEventListener('click', this);
    }
    /**
     * Handle `'activate-request'` messages.
     */
    onActivateRequest(msg) {
        const editor = this.promptCell && this.promptCell.editor;
        if (editor) {
            editor.focus();
        }
        this.update();
    }
    /**
     * Make a new prompt cell.
     */
    newPromptCell() {
        let promptCell = this.promptCell;
        const input = this._input;
        // Make the last prompt read-only, clear its signals, and move to content.
        if (promptCell) {
            promptCell.readOnly = true;
            promptCell.removeClass(PROMPT_CLASS);
            Signal.clearData(promptCell.editor);
            const child = input.widgets[0];
            child.parent = null;
            this.addCell(promptCell);
        }
        // Create the new prompt cell.
        const factory = this.contentFactory;
        const options = this._createCodeCellOptions();
        promptCell = factory.createCodeCell(options);
        promptCell.model.mimeType = this._mimetype;
        promptCell.addClass(PROMPT_CLASS);
        // Add the prompt cell to the DOM, making `this.promptCell` valid again.
        this._input.addWidget(promptCell);
        // Suppress the default "Enter" key handling.
        const editor = promptCell.editor;
        editor.addKeydownHandler(this._onEditorKeydown);
        this._history.editor = editor;
        this._promptCellCreated.emit(promptCell);
    }
    /**
     * Handle `update-request` messages.
     */
    onUpdateRequest(msg) {
        Private.scrollToBottom(this._content.node);
    }
    /**
     * Handle the `'keydown'` event for the widget.
     */
    _evtKeyDown(event) {
        const editor = this.promptCell && this.promptCell.editor;
        if (!editor) {
            return;
        }
        if (event.keyCode === 13 && !editor.hasFocus()) {
            event.preventDefault();
            editor.focus();
        }
        else if (event.keyCode === 27 && editor.hasFocus()) {
            // Set to command mode
            event.preventDefault();
            event.stopPropagation();
            this.node.focus();
        }
    }
    /**
     * Handle the `'mouseup'` event for the widget.
     */
    _evtMouseUp(event) {
        if (this.promptCell &&
            this.promptCell.node.contains(event.target)) {
            this.promptCell.editor.focus();
        }
    }
    /**
     * Execute the code in the current prompt cell.
     */
    _execute(cell) {
        const source = cell.model.value.text;
        this._history.push(source);
        // If the source of the console is just "clear", clear the console as we
        // do in IPython or QtConsole.
        if (source === 'clear' || source === '%clear') {
            this.clear();
            return Promise.resolve(void 0);
        }
        cell.model.contentChanged.connect(this.update, this);
        const onSuccess = (value) => {
            if (this.isDisposed) {
                return;
            }
            if (value && value.content.status === 'ok') {
                const content = value.content;
                // Use deprecated payloads for backwards compatibility.
                if (content.payload && content.payload.length) {
                    const setNextInput = content.payload.filter(i => {
                        return i.source === 'set_next_input';
                    })[0];
                    if (setNextInput) {
                        const text = setNextInput.text;
                        // Ignore the `replace` value and always set the next cell.
                        cell.model.value.text = text;
                    }
                }
            }
            else if (value && value.content.status === 'error') {
                each(this._cells, (cell) => {
                    if (cell.model.executionCount === null) {
                        cell.setPrompt('');
                    }
                });
            }
            cell.model.contentChanged.disconnect(this.update, this);
            this.update();
            this._executed.emit(new Date());
        };
        const onFailure = () => {
            if (this.isDisposed) {
                return;
            }
            cell.model.contentChanged.disconnect(this.update, this);
            this.update();
        };
        return CodeCell.execute(cell, this.sessionContext).then(onSuccess, onFailure);
    }
    /**
     * Update the console based on the kernel info.
     */
    _handleInfo(info) {
        if (info.status !== 'ok') {
            this._banner.model.value.text = 'Error in getting kernel banner';
            return;
        }
        this._banner.model.value.text = info.banner;
        const lang = info.language_info;
        this._mimetype = this._mimeTypeService.getMimeTypeByLanguage(lang);
        if (this.promptCell) {
            this.promptCell.model.mimeType = this._mimetype;
        }
    }
    /**
     * Create the options used to initialize a code cell widget.
     */
    _createCodeCellOptions() {
        const contentFactory = this.contentFactory;
        const modelFactory = this.modelFactory;
        const model = modelFactory.createCodeCell({});
        const rendermime = this.rendermime;
        const editorConfig = this.editorConfig;
        return {
            model,
            rendermime,
            contentFactory,
            editorConfig,
            placeholder: false
        };
    }
    /**
     * Handle cell disposed signals.
     */
    _onCellDisposed(sender, args) {
        if (!this.isDisposed) {
            this._cells.removeValue(sender);
            const msgId = this._msgIdCells.get(sender);
            if (msgId) {
                this._msgIdCells.delete(sender);
                this._msgIds.delete(msgId);
            }
        }
    }
    /**
     * Test whether we should execute the prompt cell.
     */
    _shouldExecute(timeout) {
        const promptCell = this.promptCell;
        if (!promptCell) {
            return Promise.resolve(false);
        }
        const model = promptCell.model;
        const code = model.value.text;
        return new Promise((resolve, reject) => {
            var _a;
            const timer = setTimeout(() => {
                resolve(true);
            }, timeout);
            const kernel = (_a = this.sessionContext.session) === null || _a === void 0 ? void 0 : _a.kernel;
            if (!kernel) {
                resolve(false);
                return;
            }
            kernel
                .requestIsComplete({ code })
                .then(isComplete => {
                clearTimeout(timer);
                if (this.isDisposed) {
                    resolve(false);
                }
                if (isComplete.content.status !== 'incomplete') {
                    resolve(true);
                    return;
                }
                resolve(false);
            })
                .catch(() => {
                resolve(true);
            });
        });
    }
    /**
     * Handle a keydown event on an editor.
     */
    _onEditorKeydown(editor, event) {
        // Suppress "Enter" events.
        return event.keyCode === 13;
    }
    /**
     * Handle a change to the kernel.
     */
    async _onKernelChanged() {
        var _a;
        this.clear();
        if (this._banner) {
            this._banner.dispose();
            this._banner = null;
        }
        this.addBanner();
        if ((_a = this.sessionContext.session) === null || _a === void 0 ? void 0 : _a.kernel) {
            this._handleInfo(await this.sessionContext.session.kernel.info);
        }
    }
    /**
     * Handle a change to the kernel status.
     */
    async _onKernelStatusChanged() {
        var _a;
        const kernel = (_a = this.sessionContext.session) === null || _a === void 0 ? void 0 : _a.kernel;
        if ((kernel === null || kernel === void 0 ? void 0 : kernel.status) === 'restarting') {
            this.addBanner();
            this._handleInfo(await (kernel === null || kernel === void 0 ? void 0 : kernel.info));
        }
    }
}
/**
 * A namespace for CodeConsole statics.
 */
(function (CodeConsole) {
    /**
     * Default implementation of `IContentFactory`.
     */
    class ContentFactory extends Cell.ContentFactory {
        /**
         * Create a new code cell widget.
         *
         * #### Notes
         * If no cell content factory is passed in with the options, the one on the
         * notebook content factory is used.
         */
        createCodeCell(options) {
            if (!options.contentFactory) {
                options.contentFactory = this;
            }
            return new CodeCell(options).initializeState();
        }
        /**
         * Create a new raw cell widget.
         *
         * #### Notes
         * If no cell content factory is passed in with the options, the one on the
         * notebook content factory is used.
         */
        createRawCell(options) {
            if (!options.contentFactory) {
                options.contentFactory = this;
            }
            return new RawCell(options).initializeState();
        }
    }
    CodeConsole.ContentFactory = ContentFactory;
    /**
     * A default content factory for the code console.
     */
    CodeConsole.defaultContentFactory = new ContentFactory();
    /**
     * The default implementation of an `IModelFactory`.
     */
    class ModelFactory {
        /**
         * Create a new cell model factory.
         */
        constructor(options = {}) {
            this.codeCellContentFactory =
                options.codeCellContentFactory || CodeCellModel.defaultContentFactory;
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
            if (!options.contentFactory) {
                options.contentFactory = this.codeCellContentFactory;
            }
            return new CodeCellModel(options);
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
            return new RawCellModel(options);
        }
    }
    CodeConsole.ModelFactory = ModelFactory;
    /**
     * The default `ModelFactory` instance.
     */
    CodeConsole.defaultModelFactory = new ModelFactory({});
})(CodeConsole || (CodeConsole = {}));
/**
 * A namespace for console widget private data.
 */
var Private;
(function (Private) {
    /**
     * Jump to the bottom of a node.
     *
     * @param node - The scrollable element.
     */
    function scrollToBottom(node) {
        node.scrollTop = node.scrollHeight - node.clientHeight;
    }
    Private.scrollToBottom = scrollToBottom;
})(Private || (Private = {}));
//# sourceMappingURL=widget.js.map