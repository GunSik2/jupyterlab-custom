/* -----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
import { PanelLayout } from '@lumino/widgets';
import { Widget } from '@lumino/widgets';
import { CodeEditorWrapper } from '@jupyterlab/codeeditor';
import { CodeMirrorEditorFactory } from '@jupyterlab/codemirror';
/**
 * The class name added to input area widgets.
 */
const INPUT_AREA_CLASS = 'jp-InputArea';
/**
 * The class name added to the prompt area of cell.
 */
const INPUT_AREA_PROMPT_CLASS = 'jp-InputArea-prompt';
/**
 * The class name added to OutputPrompt.
 */
const INPUT_PROMPT_CLASS = 'jp-InputPrompt';
/**
 * The class name added to the editor area of the cell.
 */
const INPUT_AREA_EDITOR_CLASS = 'jp-InputArea-editor';
/** ****************************************************************************
 * InputArea
 ******************************************************************************/
/**
 * An input area widget, which hosts a prompt and an editor widget.
 */
export class InputArea extends Widget {
    /**
     * Construct an input area widget.
     */
    constructor(options) {
        super();
        this.addClass(INPUT_AREA_CLASS);
        const model = (this.model = options.model);
        const contentFactory = (this.contentFactory =
            options.contentFactory || InputArea.defaultContentFactory);
        // Prompt
        const prompt = (this._prompt = contentFactory.createInputPrompt());
        prompt.addClass(INPUT_AREA_PROMPT_CLASS);
        // Editor
        const editorOptions = {
            model,
            factory: contentFactory.editorFactory,
            updateOnShow: options.updateOnShow
        };
        const editor = (this._editor = new CodeEditorWrapper(editorOptions));
        editor.addClass(INPUT_AREA_EDITOR_CLASS);
        const layout = (this.layout = new PanelLayout());
        layout.addWidget(prompt);
        if (!options.placeholder) {
            layout.addWidget(editor);
        }
    }
    /**
     * Get the CodeEditorWrapper used by the cell.
     */
    get editorWidget() {
        return this._editor;
    }
    /**
     * Get the CodeEditor used by the cell.
     */
    get editor() {
        return this._editor.editor;
    }
    /**
     * Get the prompt node used by the cell.
     */
    get promptNode() {
        return this._prompt.node;
    }
    /**
     * Get the rendered input area widget, if any.
     */
    get renderedInput() {
        return this._rendered;
    }
    /**
     * Render an input instead of the text editor.
     */
    renderInput(widget) {
        const layout = this.layout;
        if (this._rendered) {
            this._rendered.parent = null;
        }
        this._editor.hide();
        this._rendered = widget;
        layout.addWidget(widget);
    }
    /**
     * Show the text editor.
     */
    showEditor() {
        if (this._rendered) {
            this._rendered.parent = null;
        }
        this._editor.show();
    }
    /**
     * Set the prompt of the input area.
     */
    setPrompt(value) {
        this._prompt.executionCount = value;
    }
    /**
     * Dispose of the resources held by the widget.
     */
    dispose() {
        // Do nothing if already disposed.
        if (this.isDisposed) {
            return;
        }
        this._prompt = null;
        this._editor = null;
        this._rendered = null;
        super.dispose();
    }
}
/**
 * A namespace for `InputArea` statics.
 */
(function (InputArea) {
    /**
     * Default implementation of `IContentFactory`.
     *
     * This defaults to using an `editorFactory` based on CodeMirror.
     */
    class ContentFactory {
        /**
         * Construct a `ContentFactory`.
         */
        constructor(options = {}) {
            this._editor = options.editorFactory || InputArea.defaultEditorFactory;
        }
        /**
         * Return the `CodeEditor.Factory` being used.
         */
        get editorFactory() {
            return this._editor;
        }
        /**
         * Create an input prompt.
         */
        createInputPrompt() {
            return new InputPrompt();
        }
    }
    InputArea.ContentFactory = ContentFactory;
    /**
     * A function to create the default CodeMirror editor factory.
     */
    function _createDefaultEditorFactory() {
        const editorServices = new CodeMirrorEditorFactory();
        return editorServices.newInlineEditor;
    }
    /**
     * The default editor factory singleton based on CodeMirror.
     */
    InputArea.defaultEditorFactory = _createDefaultEditorFactory();
    /**
     * The default `ContentFactory` instance.
     */
    InputArea.defaultContentFactory = new ContentFactory({});
})(InputArea || (InputArea = {}));
/**
 * The default input prompt implementation.
 */
export class InputPrompt extends Widget {
    /*
     * Create an output prompt widget.
     */
    constructor() {
        super();
        this._executionCount = null;
        this.addClass(INPUT_PROMPT_CLASS);
    }
    /**
     * The execution count for the prompt.
     */
    get executionCount() {
        return this._executionCount;
    }
    set executionCount(value) {
        this._executionCount = value;
        if (value === null) {
            this.node.textContent = ' ';
        }
        else {
            this.node.textContent = `[${value || ' '}]:`;
        }
    }
}
//# sourceMappingURL=inputarea.js.map