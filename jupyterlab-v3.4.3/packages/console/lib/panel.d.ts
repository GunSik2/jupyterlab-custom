import { ISessionContext, MainAreaWidget } from '@jupyterlab/apputils';
import { IEditorMimeTypeService } from '@jupyterlab/codeeditor';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ServiceManager } from '@jupyterlab/services';
import { ITranslator } from '@jupyterlab/translation';
import { Token } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';
import { Message } from '@lumino/messaging';
import { Panel } from '@lumino/widgets';
import { CodeConsole } from './widget';
/**
 * A panel which contains a console and the ability to add other children.
 */
export declare class ConsolePanel extends MainAreaWidget<Panel> {
    /**
     * Construct a console panel.
     */
    constructor(options: ConsolePanel.IOptions);
    /**
     * The content factory used by the console panel.
     */
    readonly contentFactory: ConsolePanel.IContentFactory;
    /**
     * The console widget used by the panel.
     */
    console: CodeConsole;
    /**
     * The session used by the panel.
     */
    get sessionContext(): ISessionContext;
    /**
     * Dispose of the resources held by the widget.
     */
    dispose(): void;
    /**
     * Handle `'activate-request'` messages.
     */
    protected onActivateRequest(msg: Message): void;
    /**
     * Handle `'close-request'` messages.
     */
    protected onCloseRequest(msg: Message): void;
    /**
     * Handle a console execution.
     */
    private _onExecuted;
    /**
     * Update the console panel title.
     */
    private _updateTitlePanel;
    translator: ITranslator;
    private _executed;
    private _connected;
    private _sessionContext;
}
/**
 * A namespace for ConsolePanel statics.
 */
export declare namespace ConsolePanel {
    /**
     * The initialization options for a console panel.
     */
    interface IOptions {
        /**
         * The rendermime instance used by the panel.
         */
        rendermime: IRenderMimeRegistry;
        /**
         * The content factory for the panel.
         */
        contentFactory: IContentFactory;
        /**
         * The service manager used by the panel.
         */
        manager: ServiceManager.IManager;
        /**
         * The path of an existing console.
         */
        path?: string;
        /**
         * The base path for a new console.
         */
        basePath?: string;
        /**
         * The name of the console.
         */
        name?: string;
        /**
         * A kernel preference.
         */
        kernelPreference?: ISessionContext.IKernelPreference;
        /**
         * An existing session context to use.
         */
        sessionContext?: ISessionContext;
        /**
         * The model factory for the console widget.
         */
        modelFactory?: CodeConsole.IModelFactory;
        /**
         * The service used to look up mime types.
         */
        mimeTypeService: IEditorMimeTypeService;
        /**
         * The application language translator.
         */
        translator?: ITranslator;
        /**
         * A function to call when the kernel is busy.
         */
        setBusy?: () => IDisposable;
    }
    /**
     * The console panel renderer.
     */
    interface IContentFactory extends CodeConsole.IContentFactory {
        /**
         * Create a new console panel.
         */
        createConsole(options: CodeConsole.IOptions): CodeConsole;
    }
    /**
     * Default implementation of `IContentFactory`.
     */
    class ContentFactory extends CodeConsole.ContentFactory implements IContentFactory {
        /**
         * Create a new console panel.
         */
        createConsole(options: CodeConsole.IOptions): CodeConsole;
    }
    /**
     * A namespace for the console panel content factory.
     */
    namespace ContentFactory {
        /**
         * Options for the code console content factory.
         */
        interface IOptions extends CodeConsole.ContentFactory.IOptions {
        }
    }
    /**
     * A default code console content factory.
     */
    const defaultContentFactory: IContentFactory;
    /**
     * The console renderer token.
     */
    const IContentFactory: Token<IContentFactory>;
}
