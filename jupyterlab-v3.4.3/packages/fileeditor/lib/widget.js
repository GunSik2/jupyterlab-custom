// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { CodeEditor, CodeEditorWrapper } from '@jupyterlab/codeeditor';
import { ABCWidgetFactory, DocumentWidget } from '@jupyterlab/docregistry';
import { textEditorIcon } from '@jupyterlab/ui-components';
import { PromiseDelegate } from '@lumino/coreutils';
import { StackedLayout, Widget } from '@lumino/widgets';
/**
 * The data attribute added to a widget that can run code.
 */
const CODE_RUNNER = 'jpCodeRunner';
/**
 * The data attribute added to a widget that can undo.
 */
const UNDOER = 'jpUndoer';
/**
 * A code editor wrapper for the file editor.
 *
 * @deprecated since v3.4
 * Note: This class will be removed in v4.0.
 * From now on, you can directly use the class
 * `CodeEditorWrapper` instead on `FileEditorCodeWrapper`.
 */
export class FileEditorCodeWrapper extends CodeEditorWrapper {
    /**
     * Construct a new editor widget.
     */
    constructor(options) {
        super({
            factory: options.factory,
            model: options.context.model
        });
        this._ready = new PromiseDelegate();
        const context = (this._context = options.context);
        // TODO: move this to the FileEditor when removing the
        // `FileEditorCodeWrapper`
        this.addClass('jp-FileEditorCodeWrapper');
        this.node.dataset[CODE_RUNNER] = 'true';
        this.node.dataset[UNDOER] = 'true';
        void context.ready.then(() => {
            this._onContextReady();
        });
        if (context.model.modelDB.isCollaborative) {
            const modelDB = context.model.modelDB;
            void modelDB.connected.then(() => {
                const collaborators = modelDB.collaborators;
                if (!collaborators) {
                    return;
                }
                // Setup the selection style for collaborators
                const localCollaborator = collaborators.localCollaborator;
                this.editor.uuid = localCollaborator.sessionId;
                this.editor.selectionStyle = Object.assign(Object.assign({}, CodeEditor.defaultSelectionStyle), { color: localCollaborator.color });
                collaborators.changed.connect(this._onCollaboratorsChanged, this);
                // Trigger an initial onCollaboratorsChanged event.
                this._onCollaboratorsChanged();
            });
        }
    }
    /**
     * Get the context for the editor widget.
     */
    get context() {
        return this._context;
    }
    /**
     * A promise that resolves when the file editor is ready.
     */
    get ready() {
        return this._ready.promise;
    }
    /**
     * Handle actions that should be taken when the context is ready.
     */
    _onContextReady() {
        if (this.isDisposed) {
            return;
        }
        // Prevent the initial loading from disk from being in the editor history.
        this.editor.clearHistory();
        // Resolve the ready promise.
        this._ready.resolve(undefined);
    }
    /**
     * Handle a change to the collaborators on the model
     * by updating UI elements associated with them.
     */
    _onCollaboratorsChanged() {
        // If there are selections corresponding to non-collaborators,
        // they are stale and should be removed.
        const collaborators = this._context.model.modelDB.collaborators;
        if (!collaborators) {
            return;
        }
        for (const key of this.editor.model.selections.keys()) {
            if (!collaborators.has(key)) {
                this.editor.model.selections.delete(key);
            }
        }
    }
}
/**
 * A widget for editors.
 */
export class FileEditor extends Widget {
    /**
     * Construct a new editor widget.
     */
    constructor(options) {
        super();
        this.addClass('jp-FileEditor');
        const context = (this._context = options.context);
        this._mimeTypeService = options.mimeTypeService;
        const editorWidget = (this.editorWidget = new FileEditorCodeWrapper(options));
        this.editor = editorWidget.editor;
        this.model = editorWidget.model;
        // Listen for changes to the path.
        context.pathChanged.connect(this._onPathChanged, this);
        this._onPathChanged();
        const layout = (this.layout = new StackedLayout());
        layout.addWidget(editorWidget);
    }
    /**
     * Get the context for the editor widget.
     */
    get context() {
        return this.editorWidget.context;
    }
    /**
     * A promise that resolves when the file editor is ready.
     */
    get ready() {
        return this.editorWidget.ready;
    }
    /**
     * Handle the DOM events for the widget.
     *
     * @param event - The DOM event sent to the widget.
     *
     * #### Notes
     * This method implements the DOM `EventListener` interface and is
     * called in response to events on the widget's node. It should
     * not be called directly by user code.
     */
    handleEvent(event) {
        if (!this.model) {
            return;
        }
        switch (event.type) {
            case 'mousedown':
                this._ensureFocus();
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
        node.addEventListener('mousedown', this);
    }
    /**
     * Handle `before-detach` messages for the widget.
     */
    onBeforeDetach(msg) {
        const node = this.node;
        node.removeEventListener('mousedown', this);
    }
    /**
     * Handle `'activate-request'` messages.
     */
    onActivateRequest(msg) {
        this._ensureFocus();
    }
    /**
     * Ensure that the widget has focus.
     */
    _ensureFocus() {
        if (!this.editor.hasFocus()) {
            this.editor.focus();
        }
    }
    /**
     * Handle a change to the path.
     */
    _onPathChanged() {
        const editor = this.editor;
        const localPath = this._context.localPath;
        editor.model.mimeType = this._mimeTypeService.getMimeTypeByFilePath(localPath);
    }
}
/**
 * A widget factory for editors.
 */
export class FileEditorFactory extends ABCWidgetFactory {
    /**
     * Construct a new editor widget factory.
     */
    constructor(options) {
        super(options.factoryOptions);
        this._services = options.editorServices;
    }
    /**
     * Create a new widget given a context.
     */
    createNewWidget(context) {
        const func = this._services.factoryService.newDocumentEditor;
        const factory = options => {
            return func(options);
        };
        const content = new FileEditor({
            factory,
            context,
            mimeTypeService: this._services.mimeTypeService
        });
        content.title.icon = textEditorIcon;
        const widget = new DocumentWidget({ content, context });
        return widget;
    }
}
//# sourceMappingURL=widget.js.map