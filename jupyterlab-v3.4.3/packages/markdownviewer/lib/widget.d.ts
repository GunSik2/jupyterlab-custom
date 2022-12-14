import { ABCWidgetFactory, DocumentRegistry, DocumentWidget } from '@jupyterlab/docregistry';
import { IRenderMime, IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ITranslator } from '@jupyterlab/translation';
import { Message } from '@lumino/messaging';
import { Widget } from '@lumino/widgets';
/**
 * A widget for markdown documents.
 */
export declare class MarkdownViewer extends Widget {
    /**
     * Construct a new markdown viewer widget.
     */
    constructor(options: MarkdownViewer.IOptions);
    /**
     * A promise that resolves when the markdown viewer is ready.
     */
    get ready(): Promise<void>;
    /**
     * Set URI fragment identifier.
     */
    setFragment(fragment: string): void;
    /**
     * Set a config option for the markdown viewer.
     */
    setOption<K extends keyof MarkdownViewer.IConfig>(option: K, value: MarkdownViewer.IConfig[K]): void;
    /**
     * Dispose of the resources held by the widget.
     */
    dispose(): void;
    /**
     * Handle an `update-request` message to the widget.
     */
    protected onUpdateRequest(msg: Message): void;
    /**
     * Handle `'activate-request'` messages.
     */
    protected onActivateRequest(msg: Message): void;
    /**
     * Render the mime content.
     */
    private _render;
    readonly context: DocumentRegistry.Context;
    readonly renderer: IRenderMime.IRenderer;
    protected translator: ITranslator;
    private _trans;
    private _config;
    private _fragment;
    private _monitor;
    private _ready;
    private _isRendering;
    private _renderRequested;
}
/**
 * The namespace for MarkdownViewer class statics.
 */
export declare namespace MarkdownViewer {
    /**
     * The options used to initialize a MarkdownViewer.
     */
    interface IOptions {
        /**
         * Context
         */
        context: DocumentRegistry.IContext<DocumentRegistry.IModel>;
        /**
         * The renderer instance.
         */
        renderer: IRenderMime.IRenderer;
        /**
         * The application language translator.
         */
        translator?: ITranslator;
    }
    interface IConfig {
        /**
         * User preferred font family for markdown viewer.
         */
        fontFamily: string | null;
        /**
         * User preferred size in pixel of the font used in markdown viewer.
         */
        fontSize: number | null;
        /**
         * User preferred text line height, as a multiplier of font size.
         */
        lineHeight: number | null;
        /**
         * User preferred text line width expressed in CSS ch units.
         */
        lineWidth: number | null;
        /**
         * Whether to hide the YALM front matter.
         */
        hideFrontMatter: boolean;
        /**
         * The render timeout.
         */
        renderTimeout: number;
    }
    /**
     * The default configuration options for an editor.
     */
    const defaultConfig: MarkdownViewer.IConfig;
}
/**
 * A document widget for markdown content.
 */
export declare class MarkdownDocument extends DocumentWidget<MarkdownViewer> {
    setFragment(fragment: string): void;
}
/**
 * A widget factory for markdown viewers.
 */
export declare class MarkdownViewerFactory extends ABCWidgetFactory<MarkdownDocument> {
    /**
     * Construct a new markdown viewer widget factory.
     */
    constructor(options: MarkdownViewerFactory.IOptions);
    /**
     * Create a new widget given a context.
     */
    protected createNewWidget(context: DocumentRegistry.Context): MarkdownDocument;
    private _fileType;
    private _rendermime;
}
/**
 * The namespace for MarkdownViewerFactory class statics.
 */
export declare namespace MarkdownViewerFactory {
    /**
     * The options used to initialize a MarkdownViewerFactory.
     */
    interface IOptions extends DocumentRegistry.IWidgetFactoryOptions {
        /**
         * The primary file type associated with the document.
         */
        primaryFileType: DocumentRegistry.IFileType | undefined;
        /**
         * The rendermime instance.
         */
        rendermime: IRenderMimeRegistry;
    }
}
