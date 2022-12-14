import { ISessionContextDialogs } from '@jupyterlab/apputils';
import { IEditorMimeTypeService } from '@jupyterlab/codeeditor';
import { ABCWidgetFactory, DocumentRegistry } from '@jupyterlab/docregistry';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ITranslator } from '@jupyterlab/translation';
import { INotebookModel } from './model';
import { NotebookPanel } from './panel';
import { StaticNotebook } from './widget';
/**
 * A widget factory for notebook panels.
 */
export declare class NotebookWidgetFactory extends ABCWidgetFactory<NotebookPanel, INotebookModel> {
    /**
     * Construct a new notebook widget factory.
     *
     * @param options - The options used to construct the factory.
     */
    constructor(options: NotebookWidgetFactory.IOptions<NotebookPanel>);
    readonly rendermime: IRenderMimeRegistry;
    /**
     * The content factory used by the widget factory.
     */
    readonly contentFactory: NotebookPanel.IContentFactory;
    /**
     * The service used to look up mime types.
     */
    readonly mimeTypeService: IEditorMimeTypeService;
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
    /**
     * Create a new widget.
     *
     * #### Notes
     * The factory will start the appropriate kernel.
     */
    protected createNewWidget(context: DocumentRegistry.IContext<INotebookModel>, source?: NotebookPanel): NotebookPanel;
    /**
     * Default factory for toolbar items to be added after the widget is created.
     */
    protected defaultToolbarFactory(widget: NotebookPanel): DocumentRegistry.IToolbarItem[];
    private _editorConfig;
    private _notebookConfig;
    private _sessionDialogs;
}
/**
 * The namespace for `NotebookWidgetFactory` statics.
 */
export declare namespace NotebookWidgetFactory {
    /**
     * The options used to construct a `NotebookWidgetFactory`.
     */
    interface IOptions<T extends NotebookPanel> extends DocumentRegistry.IWidgetFactoryOptions<T> {
        rendermime: IRenderMimeRegistry;
        /**
         * A notebook panel content factory.
         */
        contentFactory: NotebookPanel.IContentFactory;
        /**
         * The service used to look up mime types.
         */
        mimeTypeService: IEditorMimeTypeService;
        /**
         * The notebook cell editor configuration.
         */
        editorConfig?: StaticNotebook.IEditorConfig;
        /**
         * The notebook configuration.
         */
        notebookConfig?: StaticNotebook.INotebookConfig;
        /**
         * The session context dialogs.
         */
        sessionDialogs?: ISessionContextDialogs;
        /**
         * The application language translator.
         */
        translator?: ITranslator;
    }
    /**
     * The interface for a notebook widget factory.
     */
    interface IFactory extends DocumentRegistry.IWidgetFactory<NotebookPanel, INotebookModel> {
        /**
         * A configuration object for cell editor settings.
         */
        editorConfig: StaticNotebook.IEditorConfig;
        /**
         * A configuration object for notebook settings.
         */
        notebookConfig: StaticNotebook.INotebookConfig;
        /**
         * Whether the kernel should be shutdown when the widget is closed.
         */
        shutdownOnClose: boolean;
    }
}
