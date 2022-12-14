/* -----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
import { marked } from 'marked';
import { AttachmentsResolver } from '@jupyterlab/attachments';
import { ActivityMonitor, URLExt } from '@jupyterlab/coreutils';
import { OutputArea, OutputPrompt, SimplifiedOutputArea, Stdin } from '@jupyterlab/outputarea';
import { imageRendererFactory, MimeModel } from '@jupyterlab/rendermime';
import { addIcon } from '@jupyterlab/ui-components';
import { PromiseDelegate, UUID } from '@lumino/coreutils';
import { filter, some, toArray } from '@lumino/algorithm';
import { Debouncer } from '@lumino/polling';
import { Signal } from '@lumino/signaling';
import { Panel, PanelLayout, Widget } from '@lumino/widgets';
import { InputCollapser, OutputCollapser } from './collapser';
import { CellFooter, CellHeader } from './headerfooter';
import { InputArea, InputPrompt } from './inputarea';
import { InputPlaceholder, OutputPlaceholder } from './placeholder';
import { ResizeHandle } from './resizeHandle';
/**
 * The CSS class added to cell widgets.
 */
const CELL_CLASS = 'jp-Cell';
/**
 * The CSS class added to the cell header.
 */
const CELL_HEADER_CLASS = 'jp-Cell-header';
/**
 * The CSS class added to the cell footer.
 */
const CELL_FOOTER_CLASS = 'jp-Cell-footer';
/**
 * The CSS class added to the cell input wrapper.
 */
const CELL_INPUT_WRAPPER_CLASS = 'jp-Cell-inputWrapper';
/**
 * The CSS class added to the cell output wrapper.
 */
const CELL_OUTPUT_WRAPPER_CLASS = 'jp-Cell-outputWrapper';
/**
 * The CSS class added to the cell input area.
 */
const CELL_INPUT_AREA_CLASS = 'jp-Cell-inputArea';
/**
 * The CSS class added to the cell output area.
 */
const CELL_OUTPUT_AREA_CLASS = 'jp-Cell-outputArea';
/**
 * The CSS class added to the cell input collapser.
 */
const CELL_INPUT_COLLAPSER_CLASS = 'jp-Cell-inputCollapser';
/**
 * The CSS class added to the cell output collapser.
 */
const CELL_OUTPUT_COLLAPSER_CLASS = 'jp-Cell-outputCollapser';
/**
 * The class name added to the cell when readonly.
 */
const READONLY_CLASS = 'jp-mod-readOnly';
/**
 * The class name added to the cell when dirty.
 */
const DIRTY_CLASS = 'jp-mod-dirty';
/**
 * The class name added to code cells.
 */
const CODE_CELL_CLASS = 'jp-CodeCell';
/**
 * The class name added to markdown cells.
 */
const MARKDOWN_CELL_CLASS = 'jp-MarkdownCell';
/**
 * The class name added to rendered markdown output widgets.
 */
const MARKDOWN_OUTPUT_CLASS = 'jp-MarkdownOutput';
export const MARKDOWN_HEADING_COLLAPSED = 'jp-MarkdownHeadingCollapsed';
const HEADING_COLLAPSER_CLASS = 'jp-collapseHeadingButton';
const SHOW_HIDDEN_CELLS_CLASS = 'jp-showHiddenCellsButton';
/**
 * The class name added to raw cells.
 */
const RAW_CELL_CLASS = 'jp-RawCell';
/**
 * The class name added to a rendered input area.
 */
const RENDERED_CLASS = 'jp-mod-rendered';
const NO_OUTPUTS_CLASS = 'jp-mod-noOutputs';
/**
 * The text applied to an empty markdown cell.
 */
const DEFAULT_MARKDOWN_TEXT = 'Type Markdown and LaTeX: $ ??^2 $';
/**
 * The timeout to wait for change activity to have ceased before rendering.
 */
const RENDER_TIMEOUT = 1000;
/**
 * The mime type for a rich contents drag object.
 */
const CONTENTS_MIME_RICH = 'application/x-jupyter-icontentsrich';
/** ****************************************************************************
 * Cell
 ******************************************************************************/
/**
 * A base cell widget.
 */
export class Cell extends Widget {
    /**
     * Construct a new base cell widget.
     */
    constructor(options) {
        super();
        this._displayChanged = new Signal(this);
        this._readOnly = false;
        this._inputHidden = false;
        this._syncCollapse = false;
        this._syncEditable = false;
        this._resizeDebouncer = new Debouncer(() => {
            this._displayChanged.emit();
        }, 0);
        this.addClass(CELL_CLASS);
        const model = (this._model = options.model);
        const contentFactory = (this.contentFactory =
            options.contentFactory || Cell.defaultContentFactory);
        this.layout = new PanelLayout();
        // Header
        const header = contentFactory.createCellHeader();
        header.addClass(CELL_HEADER_CLASS);
        this.layout.addWidget(header);
        // Input
        const inputWrapper = (this._inputWrapper = new Panel());
        inputWrapper.addClass(CELL_INPUT_WRAPPER_CLASS);
        const inputCollapser = new InputCollapser();
        inputCollapser.addClass(CELL_INPUT_COLLAPSER_CLASS);
        const input = (this._input = new InputArea({
            model,
            contentFactory,
            updateOnShow: options.updateEditorOnShow,
            placeholder: options.placeholder
        }));
        input.addClass(CELL_INPUT_AREA_CLASS);
        inputWrapper.addWidget(inputCollapser);
        inputWrapper.addWidget(input);
        this.layout.addWidget(inputWrapper);
        this._inputPlaceholder = new InputPlaceholder(() => {
            this.inputHidden = !this.inputHidden;
        });
        // Footer
        const footer = this.contentFactory.createCellFooter();
        footer.addClass(CELL_FOOTER_CLASS);
        this.layout.addWidget(footer);
        // Editor settings
        if (options.editorConfig) {
            this.editor.setOptions(Object.assign({}, options.editorConfig));
        }
        model.metadata.changed.connect(this.onMetadataChanged, this);
    }
    /**
     * Initialize view state from model.
     *
     * #### Notes
     * Should be called after construction. For convenience, returns this, so it
     * can be chained in the construction, like `new Foo().initializeState();`
     */
    initializeState() {
        this.loadCollapseState();
        this.loadEditableState();
        return this;
    }
    /**
     * Signal to indicate that widget has changed visibly (in size, in type, etc)
     */
    get displayChanged() {
        return this._displayChanged;
    }
    /**
     * Get the prompt node used by the cell.
     */
    get promptNode() {
        if (!this._inputHidden) {
            return this._input.promptNode;
        }
        else {
            return this._inputPlaceholder.node
                .firstElementChild;
        }
    }
    /**
     * Get the CodeEditorWrapper used by the cell.
     */
    get editorWidget() {
        return this._input.editorWidget;
    }
    /**
     * Get the CodeEditor used by the cell.
     */
    get editor() {
        return this._input.editor;
    }
    /**
     * Get the model used by the cell.
     */
    get model() {
        return this._model;
    }
    /**
     * Get the input area for the cell.
     */
    get inputArea() {
        return this._input;
    }
    /**
     * The read only state of the cell.
     */
    get readOnly() {
        return this._readOnly;
    }
    set readOnly(value) {
        if (value === this._readOnly) {
            return;
        }
        this._readOnly = value;
        if (this.syncEditable) {
            this.saveEditableState();
        }
        this.update();
    }
    /**
     * Save view editable state to model
     */
    saveEditableState() {
        const { metadata } = this.model;
        const current = metadata.get('editable');
        if ((this.readOnly && current === false) ||
            (!this.readOnly && current === undefined)) {
            return;
        }
        if (this.readOnly) {
            this.model.metadata.set('editable', false);
        }
        else {
            this.model.metadata.delete('editable');
        }
    }
    /**
     * Load view editable state from model.
     */
    loadEditableState() {
        this.readOnly = this.model.metadata.get('editable') === false;
    }
    /**
     * A promise that resolves when the widget renders for the first time.
     */
    get ready() {
        return Promise.resolve(undefined);
    }
    /**
     * Set the prompt for the widget.
     */
    setPrompt(value) {
        this._input.setPrompt(value);
    }
    /**
     * The view state of input being hidden.
     */
    get inputHidden() {
        return this._inputHidden;
    }
    set inputHidden(value) {
        if (this._inputHidden === value) {
            return;
        }
        const layout = this._inputWrapper.layout;
        if (value) {
            this._input.parent = null;
            layout.addWidget(this._inputPlaceholder);
        }
        else {
            this._inputPlaceholder.parent = null;
            layout.addWidget(this._input);
        }
        this._inputHidden = value;
        if (this.syncCollapse) {
            this.saveCollapseState();
        }
        this.handleInputHidden(value);
    }
    /**
     * Save view collapse state to model
     */
    saveCollapseState() {
        const jupyter = Object.assign({}, this.model.metadata.get('jupyter'));
        if ((this.inputHidden && jupyter.source_hidden === true) ||
            (!this.inputHidden && jupyter.source_hidden === undefined)) {
            return;
        }
        if (this.inputHidden) {
            jupyter.source_hidden = true;
        }
        else {
            delete jupyter.source_hidden;
        }
        if (Object.keys(jupyter).length === 0) {
            this.model.metadata.delete('jupyter');
        }
        else {
            this.model.metadata.set('jupyter', jupyter);
        }
    }
    /**
     * Revert view collapse state from model.
     */
    loadCollapseState() {
        const jupyter = this.model.metadata.get('jupyter') || {};
        this.inputHidden = !!jupyter.source_hidden;
    }
    /**
     * Handle the input being hidden.
     *
     * #### Notes
     * This is called by the `inputHidden` setter so that subclasses
     * can perform actions upon the input being hidden without accessing
     * private state.
     */
    handleInputHidden(value) {
        return;
    }
    /**
     * Whether to sync the collapse state to the cell model.
     */
    get syncCollapse() {
        return this._syncCollapse;
    }
    set syncCollapse(value) {
        if (this._syncCollapse === value) {
            return;
        }
        this._syncCollapse = value;
        if (value) {
            this.loadCollapseState();
        }
    }
    /**
     * Whether to sync the editable state to the cell model.
     */
    get syncEditable() {
        return this._syncEditable;
    }
    set syncEditable(value) {
        if (this._syncEditable === value) {
            return;
        }
        this._syncEditable = value;
        if (value) {
            this.loadEditableState();
        }
    }
    /**
     * Clone the cell, using the same model.
     */
    clone() {
        const constructor = this.constructor;
        return new constructor({
            model: this.model,
            contentFactory: this.contentFactory,
            placeholder: false
        });
    }
    /**
     * Dispose of the resources held by the widget.
     */
    dispose() {
        // Do nothing if already disposed.
        if (this.isDisposed) {
            return;
        }
        this._input = null;
        this._model = null;
        this._inputWrapper = null;
        this._inputPlaceholder = null;
        super.dispose();
    }
    /**
     * Handle `after-attach` messages.
     */
    onAfterAttach(msg) {
        this.update();
    }
    /**
     * Handle `'activate-request'` messages.
     */
    onActivateRequest(msg) {
        this.editor.focus();
    }
    /**
     * Handle `fit-request` messages.
     */
    onFitRequest(msg) {
        // need this for for when a theme changes font size
        this.editor.refresh();
    }
    /**
     * Handle `resize` messages.
     */
    onResize(msg) {
        void this._resizeDebouncer.invoke();
    }
    /**
     * Handle `update-request` messages.
     */
    onUpdateRequest(msg) {
        if (!this._model) {
            return;
        }
        // Handle read only state.
        if (this.editor.getOption('readOnly') !== this._readOnly) {
            this.editor.setOption('readOnly', this._readOnly);
            this.toggleClass(READONLY_CLASS, this._readOnly);
        }
    }
    /**
     * Handle changes in the metadata.
     */
    onMetadataChanged(model, args) {
        switch (args.key) {
            case 'jupyter':
                if (this.syncCollapse) {
                    this.loadCollapseState();
                }
                break;
            case 'editable':
                if (this.syncEditable) {
                    this.loadEditableState();
                }
                break;
            default:
                break;
        }
    }
}
/**
 * The namespace for the `Cell` class statics.
 */
(function (Cell) {
    /**
     * The default implementation of an `IContentFactory`.
     *
     * This includes a CodeMirror editor factory to make it easy to use out of the box.
     */
    class ContentFactory {
        /**
         * Create a content factory for a cell.
         */
        constructor(options = {}) {
            this._editorFactory =
                options.editorFactory || InputArea.defaultEditorFactory;
        }
        /**
         * The readonly editor factory that create code editors
         */
        get editorFactory() {
            return this._editorFactory;
        }
        /**
         * Create a new cell header for the parent widget.
         */
        createCellHeader() {
            return new CellHeader();
        }
        /**
         * Create a new cell header for the parent widget.
         */
        createCellFooter() {
            return new CellFooter();
        }
        /**
         * Create an input prompt.
         */
        createInputPrompt() {
            return new InputPrompt();
        }
        /**
         * Create the output prompt for the widget.
         */
        createOutputPrompt() {
            return new OutputPrompt();
        }
        /**
         * Create an stdin widget.
         */
        createStdin(options) {
            return new Stdin(options);
        }
    }
    Cell.ContentFactory = ContentFactory;
    /**
     * The default content factory for cells.
     */
    Cell.defaultContentFactory = new ContentFactory();
})(Cell || (Cell = {}));
/** ****************************************************************************
 * CodeCell
 ******************************************************************************/
/**
 * A widget for a code cell.
 */
export class CodeCell extends Cell {
    /**
     * Construct a code cell widget.
     */
    constructor(options) {
        super(options);
        this._outputHidden = false;
        this._syncScrolled = false;
        this._savingMetadata = false;
        this.addClass(CODE_CELL_CLASS);
        // Only save options not handled by parent constructor.
        const rendermime = (this._rendermime = options.rendermime);
        const contentFactory = this.contentFactory;
        const model = this.model;
        if (!options.placeholder) {
            // Insert the output before the cell footer.
            const outputWrapper = (this._outputWrapper = new Panel());
            outputWrapper.addClass(CELL_OUTPUT_WRAPPER_CLASS);
            const outputCollapser = new OutputCollapser();
            outputCollapser.addClass(CELL_OUTPUT_COLLAPSER_CLASS);
            const output = (this._output = new OutputArea({
                model: model.outputs,
                rendermime,
                contentFactory: contentFactory,
                maxNumberOutputs: options.maxNumberOutputs
            }));
            output.addClass(CELL_OUTPUT_AREA_CLASS);
            // Set a CSS if there are no outputs, and connect a signal for future
            // changes to the number of outputs. This is for conditional styling
            // if there are no outputs.
            if (model.outputs.length === 0) {
                this.addClass(NO_OUTPUTS_CLASS);
            }
            output.outputLengthChanged.connect(this._outputLengthHandler, this);
            outputWrapper.addWidget(outputCollapser);
            outputWrapper.addWidget(output);
            this.layout.insertWidget(2, new ResizeHandle(this.node));
            this.layout.insertWidget(3, outputWrapper);
            if (model.isDirty) {
                this.addClass(DIRTY_CLASS);
            }
            this._outputPlaceholder = new OutputPlaceholder(() => {
                this.outputHidden = !this.outputHidden;
            });
        }
        model.stateChanged.connect(this.onStateChanged, this);
    }
    /**
     * Initialize view state from model.
     *
     * #### Notes
     * Should be called after construction. For convenience, returns this, so it
     * can be chained in the construction, like `new Foo().initializeState();`
     */
    initializeState() {
        super.initializeState();
        this.loadScrolledState();
        this.setPrompt(`${this.model.executionCount || ''}`);
        return this;
    }
    /**
     * Get the output area for the cell.
     */
    get outputArea() {
        return this._output;
    }
    /**
     * The view state of output being collapsed.
     */
    get outputHidden() {
        return this._outputHidden;
    }
    set outputHidden(value) {
        if (this._outputHidden === value) {
            return;
        }
        const layout = this._outputWrapper.layout;
        if (value) {
            layout.removeWidget(this._output);
            layout.addWidget(this._outputPlaceholder);
            if (this.inputHidden && !this._outputWrapper.isHidden) {
                this._outputWrapper.hide();
            }
        }
        else {
            if (this._outputWrapper.isHidden) {
                this._outputWrapper.show();
            }
            layout.removeWidget(this._outputPlaceholder);
            layout.addWidget(this._output);
        }
        this._outputHidden = value;
        if (this.syncCollapse) {
            this.saveCollapseState();
        }
    }
    /**
     * Save view collapse state to model
     */
    saveCollapseState() {
        // Because collapse state for a code cell involves two different pieces of
        // metadata (the `collapsed` and `jupyter` metadata keys), we block reacting
        // to changes in metadata until we have fully committed our changes.
        // Otherwise setting one key can trigger a write to the other key to
        // maintain the synced consistency.
        this._savingMetadata = true;
        try {
            super.saveCollapseState();
            const metadata = this.model.metadata;
            const collapsed = this.model.metadata.get('collapsed');
            if ((this.outputHidden && collapsed === true) ||
                (!this.outputHidden && collapsed === undefined)) {
                return;
            }
            // Do not set jupyter.outputs_hidden since it is redundant. See
            // and https://github.com/jupyter/nbformat/issues/137
            if (this.outputHidden) {
                metadata.set('collapsed', true);
            }
            else {
                metadata.delete('collapsed');
            }
        }
        finally {
            this._savingMetadata = false;
        }
    }
    /**
     * Revert view collapse state from model.
     *
     * We consider the `collapsed` metadata key as the source of truth for outputs
     * being hidden.
     */
    loadCollapseState() {
        super.loadCollapseState();
        this.outputHidden = !!this.model.metadata.get('collapsed');
    }
    /**
     * Whether the output is in a scrolled state?
     */
    get outputsScrolled() {
        return this._outputsScrolled;
    }
    set outputsScrolled(value) {
        this.toggleClass('jp-mod-outputsScrolled', value);
        this._outputsScrolled = value;
        if (this.syncScrolled) {
            this.saveScrolledState();
        }
    }
    /**
     * Save view collapse state to model
     */
    saveScrolledState() {
        const { metadata } = this.model;
        const current = metadata.get('scrolled');
        if ((this.outputsScrolled && current === true) ||
            (!this.outputsScrolled && current === undefined)) {
            return;
        }
        if (this.outputsScrolled) {
            metadata.set('scrolled', true);
        }
        else {
            metadata.delete('scrolled');
        }
    }
    /**
     * Revert view collapse state from model.
     */
    loadScrolledState() {
        const metadata = this.model.metadata;
        // We don't have the notion of 'auto' scrolled, so we make it false.
        if (metadata.get('scrolled') === 'auto') {
            this.outputsScrolled = false;
        }
        else {
            this.outputsScrolled = !!metadata.get('scrolled');
        }
    }
    /**
     * Whether to sync the scrolled state to the cell model.
     */
    get syncScrolled() {
        return this._syncScrolled;
    }
    set syncScrolled(value) {
        if (this._syncScrolled === value) {
            return;
        }
        this._syncScrolled = value;
        if (value) {
            this.loadScrolledState();
        }
    }
    /**
     * Handle the input being hidden.
     *
     * #### Notes
     * This method is called by the case cell implementation and is
     * subclasses here so the code cell can watch to see when input
     * is hidden without accessing private state.
     */
    handleInputHidden(value) {
        if (!value && this._outputWrapper.isHidden) {
            this._outputWrapper.show();
        }
        else if (value && !this._outputWrapper.isHidden && this._outputHidden) {
            this._outputWrapper.hide();
        }
    }
    /**
     * Clone the cell, using the same model.
     */
    clone() {
        const constructor = this.constructor;
        return new constructor({
            model: this.model,
            contentFactory: this.contentFactory,
            rendermime: this._rendermime,
            placeholder: false
        });
    }
    /**
     * Clone the OutputArea alone, returning a simplified output area, using the same model.
     */
    cloneOutputArea() {
        return new SimplifiedOutputArea({
            model: this.model.outputs,
            contentFactory: this.contentFactory,
            rendermime: this._rendermime
        });
    }
    /**
     * Dispose of the resources used by the widget.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._output.outputLengthChanged.disconnect(this._outputLengthHandler, this);
        this._rendermime = null;
        this._output = null;
        this._outputWrapper = null;
        this._outputPlaceholder = null;
        super.dispose();
    }
    /**
     * Handle changes in the model.
     */
    onStateChanged(model, args) {
        switch (args.name) {
            case 'executionCount':
                this.setPrompt(`${model.executionCount || ''}`);
                break;
            case 'isDirty':
                if (model.isDirty) {
                    this.addClass(DIRTY_CLASS);
                }
                else {
                    this.removeClass(DIRTY_CLASS);
                }
                break;
            default:
                break;
        }
    }
    /**
     * Handle changes in the metadata.
     */
    onMetadataChanged(model, args) {
        if (this._savingMetadata) {
            // We are in middle of a metadata transaction, so don't react to it.
            return;
        }
        switch (args.key) {
            case 'scrolled':
                if (this.syncScrolled) {
                    this.loadScrolledState();
                }
                break;
            case 'collapsed':
                if (this.syncCollapse) {
                    this.loadCollapseState();
                }
                break;
            default:
                break;
        }
        super.onMetadataChanged(model, args);
    }
    /**
     * Handle changes in the number of outputs in the output area.
     */
    _outputLengthHandler(sender, args) {
        const force = args === 0 ? true : false;
        this.toggleClass(NO_OUTPUTS_CLASS, force);
    }
}
/**
 * The namespace for the `CodeCell` class statics.
 */
(function (CodeCell) {
    /**
     * Execute a cell given a client session.
     */
    async function execute(cell, sessionContext, metadata) {
        var _a;
        const model = cell.model;
        const code = model.value.text;
        if (!code.trim() || !((_a = sessionContext.session) === null || _a === void 0 ? void 0 : _a.kernel)) {
            model.clearExecution();
            return;
        }
        const cellId = { cellId: model.id };
        metadata = Object.assign(Object.assign(Object.assign({}, model.metadata.toJSON()), metadata), cellId);
        const { recordTiming } = metadata;
        model.clearExecution();
        cell.outputHidden = false;
        cell.setPrompt('*');
        model.trusted = true;
        let future;
        try {
            const msgPromise = OutputArea.execute(code, cell.outputArea, sessionContext, metadata);
            // cell.outputArea.future assigned synchronously in `execute`
            if (recordTiming) {
                const recordTimingHook = (msg) => {
                    let label;
                    switch (msg.header.msg_type) {
                        case 'status':
                            label = `status.${msg.content.execution_state}`;
                            break;
                        case 'execute_input':
                            label = 'execute_input';
                            break;
                        default:
                            return true;
                    }
                    // If the data is missing, estimate it to now
                    // Date was added in 5.1: https://jupyter-client.readthedocs.io/en/stable/messaging.html#message-header
                    const value = msg.header.date || new Date().toISOString();
                    const timingInfo = Object.assign({}, model.metadata.get('execution'));
                    timingInfo[`iopub.${label}`] = value;
                    model.metadata.set('execution', timingInfo);
                    return true;
                };
                cell.outputArea.future.registerMessageHook(recordTimingHook);
            }
            else {
                model.metadata.delete('execution');
            }
            // Save this execution's future so we can compare in the catch below.
            future = cell.outputArea.future;
            const msg = (await msgPromise);
            model.executionCount = msg.content.execution_count;
            if (recordTiming) {
                const timingInfo = Object.assign({}, model.metadata.get('execution'));
                const started = msg.metadata.started;
                // Started is not in the API, but metadata IPyKernel sends
                if (started) {
                    timingInfo['shell.execute_reply.started'] = started;
                }
                // Per above, the 5.0 spec does not assume date, so we estimate is required
                const finished = msg.header.date;
                timingInfo['shell.execute_reply'] =
                    finished || new Date().toISOString();
                model.metadata.set('execution', timingInfo);
            }
            return msg;
        }
        catch (e) {
            // If we started executing, and the cell is still indicating this
            // execution, clear the prompt.
            if (future && !cell.isDisposed && cell.outputArea.future === future) {
                cell.setPrompt('');
            }
            throw e;
        }
    }
    CodeCell.execute = execute;
})(CodeCell || (CodeCell = {}));
/**
 * `AttachmentsCell` - A base class for a cell widget that allows
 *  attachments to be drag/drop'd or pasted onto it
 */
export class AttachmentsCell extends Cell {
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
    handleEvent(event) {
        switch (event.type) {
            case 'paste':
                this._evtPaste(event);
                break;
            case 'dragenter':
                event.preventDefault();
                break;
            case 'dragover':
                event.preventDefault();
                break;
            case 'drop':
                this._evtNativeDrop(event);
                break;
            case 'lm-dragover':
                this._evtDragOver(event);
                break;
            case 'lm-drop':
                this._evtDrop(event);
                break;
            default:
                break;
        }
    }
    /**
     * Handle `after-attach` messages for the widget.
     */
    onAfterAttach(msg) {
        super.onAfterAttach(msg);
        const node = this.node;
        node.addEventListener('lm-dragover', this);
        node.addEventListener('lm-drop', this);
        node.addEventListener('dragenter', this);
        node.addEventListener('dragover', this);
        node.addEventListener('drop', this);
        node.addEventListener('paste', this);
    }
    /**
     * A message handler invoked on a `'before-detach'`
     * message
     */
    onBeforeDetach(msg) {
        const node = this.node;
        node.removeEventListener('drop', this);
        node.removeEventListener('dragover', this);
        node.removeEventListener('dragenter', this);
        node.removeEventListener('paste', this);
        node.removeEventListener('lm-dragover', this);
        node.removeEventListener('lm-drop', this);
    }
    _evtDragOver(event) {
        const supportedMimeType = some(imageRendererFactory.mimeTypes, mimeType => {
            if (!event.mimeData.hasData(CONTENTS_MIME_RICH)) {
                return false;
            }
            const data = event.mimeData.getData(CONTENTS_MIME_RICH);
            return data.model.mimetype === mimeType;
        });
        if (!supportedMimeType) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        event.dropAction = event.proposedAction;
    }
    /**
     * Handle the `paste` event for the widget
     */
    _evtPaste(event) {
        if (event.clipboardData) {
            const items = event.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type === 'text/plain') {
                    // Skip if this text is the path to a file
                    if (i < items.length - 1 && items[i + 1].kind === 'file') {
                        continue;
                    }
                    items[i].getAsString(text => {
                        var _a, _b;
                        (_b = (_a = this.editor).replaceSelection) === null || _b === void 0 ? void 0 : _b.call(_a, text);
                    });
                }
                this._attachFiles(event.clipboardData.items);
            }
        }
        event.preventDefault();
    }
    /**
     * Handle the `drop` event for the widget
     */
    _evtNativeDrop(event) {
        if (event.dataTransfer) {
            this._attachFiles(event.dataTransfer.items);
        }
        event.preventDefault();
    }
    /**
     * Handle the `'lm-drop'` event for the widget.
     */
    _evtDrop(event) {
        const supportedMimeTypes = toArray(filter(event.mimeData.types(), mimeType => {
            if (mimeType === CONTENTS_MIME_RICH) {
                const data = event.mimeData.getData(CONTENTS_MIME_RICH);
                return (imageRendererFactory.mimeTypes.indexOf(data.model.mimetype) !== -1);
            }
            return imageRendererFactory.mimeTypes.indexOf(mimeType) !== -1;
        }));
        if (supportedMimeTypes.length === 0) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (event.proposedAction === 'none') {
            event.dropAction = 'none';
            return;
        }
        event.dropAction = 'copy';
        for (const mimeType of supportedMimeTypes) {
            if (mimeType === CONTENTS_MIME_RICH) {
                const { model, withContent } = event.mimeData.getData(CONTENTS_MIME_RICH);
                if (model.type === 'file') {
                    const URI = this._generateURI(model.name);
                    this.updateCellSourceWithAttachment(model.name, URI);
                    void withContent().then(fullModel => {
                        this.model.attachments.set(URI, {
                            [fullModel.mimetype]: fullModel.content
                        });
                    });
                }
            }
            else {
                // Pure mimetype, no useful name to infer
                const URI = this._generateURI();
                this.model.attachments.set(URI, {
                    [mimeType]: event.mimeData.getData(mimeType)
                });
                this.updateCellSourceWithAttachment(URI, URI);
            }
        }
    }
    /**
     * Attaches all DataTransferItems (obtained from
     * clipboard or native drop events) to the cell
     */
    _attachFiles(items) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const blob = item.getAsFile();
                if (blob) {
                    this._attachFile(blob);
                }
            }
        }
    }
    /**
     * Takes in a file object and adds it to
     * the cell attachments
     */
    _attachFile(blob) {
        const reader = new FileReader();
        reader.onload = evt => {
            const { href, protocol } = URLExt.parse(reader.result);
            if (protocol !== 'data:') {
                return;
            }
            const dataURIRegex = /([\w+\/\+]+)?(?:;(charset=[\w\d-]*|base64))?,(.*)/;
            const matches = dataURIRegex.exec(href);
            if (!matches || matches.length !== 4) {
                return;
            }
            const mimeType = matches[1];
            const encodedData = matches[3];
            const bundle = { [mimeType]: encodedData };
            const URI = this._generateURI(blob.name);
            if (mimeType.startsWith('image/')) {
                this.model.attachments.set(URI, bundle);
                this.updateCellSourceWithAttachment(blob.name, URI);
            }
        };
        reader.onerror = evt => {
            console.error(`Failed to attach ${blob.name}` + evt);
        };
        reader.readAsDataURL(blob);
    }
    /**
     * Generates a unique URI for a file
     * while preserving the file extension.
     */
    _generateURI(name = '') {
        const lastIndex = name.lastIndexOf('.');
        return lastIndex !== -1
            ? UUID.uuid4().concat(name.substring(lastIndex))
            : UUID.uuid4();
    }
}
/** ****************************************************************************
 * MarkdownCell
 ******************************************************************************/
/**
 * A widget for a Markdown cell.
 *
 * #### Notes
 * Things get complicated if we want the rendered text to update
 * any time the text changes, the text editor model changes,
 * or the input area model changes.  We don't support automatically
 * updating the rendered text in all of these cases.
 */
export class MarkdownCell extends AttachmentsCell {
    /**
     * Construct a Markdown cell widget.
     */
    constructor(options) {
        var _a, _b, _c;
        super(options);
        this._toggleCollapsedSignal = new Signal(this);
        this._renderer = null;
        this._rendered = true;
        this._prevText = '';
        this._ready = new PromiseDelegate();
        this._showEditorForReadOnlyMarkdown = true;
        this.addClass(MARKDOWN_CELL_CLASS);
        // Ensure we can resolve attachments:
        this._rendermime = options.rendermime.clone({
            resolver: new AttachmentsResolver({
                parent: (_a = options.rendermime.resolver) !== null && _a !== void 0 ? _a : undefined,
                model: this.model.attachments
            })
        });
        // Stop codemirror handling paste
        this.editor.setOption('handlePaste', false);
        // Check if heading cell is set to be collapsed
        this._headingCollapsed = ((_b = this.model.metadata.get(MARKDOWN_HEADING_COLLAPSED)) !== null && _b !== void 0 ? _b : false);
        // Throttle the rendering rate of the widget.
        this._monitor = new ActivityMonitor({
            signal: this.model.contentChanged,
            timeout: RENDER_TIMEOUT
        });
        this._monitor.activityStopped.connect(() => {
            if (this._rendered) {
                this.update();
            }
        }, this);
        void this._updateRenderedInput().then(() => {
            this._ready.resolve(void 0);
        });
        this.renderCollapseButtons(this._renderer);
        this.renderInput(this._renderer);
        this._showEditorForReadOnlyMarkdown = (_c = options.showEditorForReadOnlyMarkdown) !== null && _c !== void 0 ? _c : MarkdownCell.defaultShowEditorForReadOnlyMarkdown;
    }
    /**
     * A promise that resolves when the widget renders for the first time.
     */
    get ready() {
        return this._ready.promise;
    }
    /**
     * Text that represents the heading if cell is a heading.
     * Returns empty string if not a heading.
     */
    get headingInfo() {
        let text = this.model.value.text;
        const lines = marked.lexer(text);
        let line;
        for (line of lines) {
            if (line.type === 'heading') {
                return { text: line.text, level: line.depth };
            }
            else if (line.type === 'html') {
                let match = line.raw.match(/<h([1-6])(.*?)>(.*?)<\/h\1>/);
                if (match === null || match === void 0 ? void 0 : match[3]) {
                    return { text: match[3], level: parseInt(match[1]) };
                }
                return { text: '', level: -1 };
            }
        }
        return { text: '', level: -1 };
    }
    get headingCollapsed() {
        return this._headingCollapsed;
    }
    set headingCollapsed(value) {
        this._headingCollapsed = value;
        if (value) {
            this.model.metadata.set(MARKDOWN_HEADING_COLLAPSED, value);
        }
        else if (this.model.metadata.has(MARKDOWN_HEADING_COLLAPSED)) {
            this.model.metadata.delete(MARKDOWN_HEADING_COLLAPSED);
        }
        const collapseButton = this.inputArea.promptNode.getElementsByClassName(HEADING_COLLAPSER_CLASS)[0];
        if (collapseButton) {
            if (value) {
                collapseButton.classList.add('jp-mod-collapsed');
            }
            else {
                collapseButton.classList.remove('jp-mod-collapsed');
            }
        }
        this.renderCollapseButtons(this._renderer);
    }
    get numberChildNodes() {
        return this._numberChildNodes;
    }
    set numberChildNodes(value) {
        this._numberChildNodes = value;
        this.renderCollapseButtons(this._renderer);
    }
    get toggleCollapsedSignal() {
        return this._toggleCollapsedSignal;
    }
    /**
     * Whether the cell is rendered.
     */
    get rendered() {
        return this._rendered;
    }
    set rendered(value) {
        // Show cell as rendered when cell is not editable
        if (this.readOnly && this._showEditorForReadOnlyMarkdown === false) {
            value = true;
        }
        if (value === this._rendered) {
            return;
        }
        this._rendered = value;
        this._handleRendered();
        // Refreshing an editor can be really expensive, so we don't call it from
        // _handleRendered, since _handledRendered is also called on every update
        // request.
        if (!this._rendered) {
            this.editor.refresh();
        }
        // If the rendered state changed, raise an event.
        this._displayChanged.emit();
    }
    /*
     * Whether the Markdown editor is visible in read-only mode.
     */
    get showEditorForReadOnly() {
        return this._showEditorForReadOnlyMarkdown;
    }
    set showEditorForReadOnly(value) {
        this._showEditorForReadOnlyMarkdown = value;
        if (value === false) {
            this.rendered = true;
        }
    }
    maybeCreateCollapseButton() {
        if (this.headingInfo.level > 0 &&
            this.inputArea.promptNode.getElementsByClassName(HEADING_COLLAPSER_CLASS)
                .length == 0) {
            let collapseButton = this.inputArea.promptNode.appendChild(document.createElement('button'));
            collapseButton.className = `jp-Button ${HEADING_COLLAPSER_CLASS}`;
            collapseButton.setAttribute('data-heading-level', this.headingInfo.level.toString());
            if (this._headingCollapsed) {
                collapseButton.classList.add('jp-mod-collapsed');
            }
            else {
                collapseButton.classList.remove('jp-mod-collapsed');
            }
            collapseButton.onclick = (event) => {
                this.headingCollapsed = !this.headingCollapsed;
                this._toggleCollapsedSignal.emit(this._headingCollapsed);
            };
        }
    }
    maybeCreateOrUpdateExpandButton() {
        var _a, _b;
        const expandButton = this.node.getElementsByClassName(SHOW_HIDDEN_CELLS_CLASS);
        // Create the "show hidden" button if not already created
        if (this.headingCollapsed &&
            expandButton.length === 0 &&
            this._numberChildNodes > 0) {
            const numberChildNodes = document.createElement('button');
            numberChildNodes.className = `bp3-button bp3-minimal jp-Button ${SHOW_HIDDEN_CELLS_CLASS}`;
            addIcon.render(numberChildNodes);
            const numberChildNodesText = document.createElement('div');
            numberChildNodesText.nodeValue = `${this._numberChildNodes} cell${this._numberChildNodes > 1 ? 's' : ''} hidden`;
            numberChildNodes.appendChild(numberChildNodesText);
            numberChildNodes.onclick = () => {
                this.headingCollapsed = false;
                this._toggleCollapsedSignal.emit(this._headingCollapsed);
            };
            this.node.appendChild(numberChildNodes);
        }
        else if (((_b = (_a = expandButton === null || expandButton === void 0 ? void 0 : expandButton[0]) === null || _a === void 0 ? void 0 : _a.childNodes) === null || _b === void 0 ? void 0 : _b.length) > 1) {
            // If the heading is collapsed, update text
            if (this._headingCollapsed) {
                expandButton[0].childNodes[1].textContent = `${this._numberChildNodes} cell${this._numberChildNodes > 1 ? 's' : ''} hidden`;
                // If the heading isn't collapsed, remove the button
            }
            else {
                for (const el of expandButton) {
                    this.node.removeChild(el);
                }
            }
        }
    }
    /**
     * Render the collapse button for heading cells,
     * and for collapsed heading cells render the "expand hidden cells"
     * button.
     */
    renderCollapseButtons(widget) {
        this.node.classList.toggle(MARKDOWN_HEADING_COLLAPSED, this._headingCollapsed);
        this.maybeCreateCollapseButton();
        this.maybeCreateOrUpdateExpandButton();
    }
    /**
     * Render an input instead of the text editor.
     */
    renderInput(widget) {
        this.addClass(RENDERED_CLASS);
        this.renderCollapseButtons(widget);
        this.inputArea.renderInput(widget);
    }
    /**
     * Show the text editor instead of rendered input.
     */
    showEditor() {
        this.removeClass(RENDERED_CLASS);
        this.inputArea.showEditor();
    }
    /*
     * Handle `update-request` messages.
     */
    onUpdateRequest(msg) {
        // Make sure we are properly rendered.
        this._handleRendered();
        super.onUpdateRequest(msg);
    }
    /**
     * Modify the cell source to include a reference to the attachment.
     */
    updateCellSourceWithAttachment(attachmentName, URI) {
        var _a, _b;
        const textToBeAppended = `![${attachmentName}](attachment:${URI !== null && URI !== void 0 ? URI : attachmentName})`;
        (_b = (_a = this.editor).replaceSelection) === null || _b === void 0 ? void 0 : _b.call(_a, textToBeAppended);
    }
    /**
     * Handle the rendered state.
     */
    _handleRendered() {
        if (!this._rendered) {
            this.showEditor();
        }
        else {
            // TODO: It would be nice for the cell to provide a way for
            // its consumers to hook into when the rendering is done.
            void this._updateRenderedInput();
            this.renderInput(this._renderer);
        }
    }
    /**
     * Update the rendered input.
     */
    _updateRenderedInput() {
        const model = this.model;
        const text = (model && model.value.text) || DEFAULT_MARKDOWN_TEXT;
        // Do not re-render if the text has not changed.
        if (text !== this._prevText) {
            const mimeModel = new MimeModel({ data: { 'text/markdown': text } });
            if (!this._renderer) {
                this._renderer = this._rendermime.createRenderer('text/markdown');
                this._renderer.addClass(MARKDOWN_OUTPUT_CLASS);
            }
            this._prevText = text;
            return this._renderer.renderModel(mimeModel);
        }
        return Promise.resolve(void 0);
    }
    /**
     * Clone the cell, using the same model.
     */
    clone() {
        const constructor = this.constructor;
        return new constructor({
            model: this.model,
            contentFactory: this.contentFactory,
            rendermime: this._rendermime,
            placeholder: false
        });
    }
}
/**
 * The namespace for the `CodeCell` class statics.
 */
(function (MarkdownCell) {
    /**
     * Default value for showEditorForReadOnlyMarkdown.
     */
    MarkdownCell.defaultShowEditorForReadOnlyMarkdown = true;
})(MarkdownCell || (MarkdownCell = {}));
/** ****************************************************************************
 * RawCell
 ******************************************************************************/
/**
 * A widget for a raw cell.
 */
export class RawCell extends Cell {
    /**
     * Construct a raw cell widget.
     */
    constructor(options) {
        super(options);
        this.addClass(RAW_CELL_CLASS);
    }
    /**
     * Clone the cell, using the same model.
     */
    clone() {
        const constructor = this.constructor;
        return new constructor({
            model: this.model,
            contentFactory: this.contentFactory,
            placeholder: false
        });
    }
}
//# sourceMappingURL=widget.js.map