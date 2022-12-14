/**
 * @packageDocumentation
 * @module htmlviewer
 */
import { IFrame, IWidgetTracker } from '@jupyterlab/apputils';
import { ABCWidgetFactory, DocumentRegistry, DocumentWidget, IDocumentWidget } from '@jupyterlab/docregistry';
import { ITranslator } from '@jupyterlab/translation';
import { Token } from '@lumino/coreutils';
import { ISignal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
/**
 * A class that tracks HTML viewer widgets.
 */
export interface IHTMLViewerTracker extends IWidgetTracker<HTMLViewer> {
}
/**
 * The HTML viewer tracker token.
 */
export declare const IHTMLViewerTracker: Token<IHTMLViewerTracker>;
/**
 * A viewer widget for HTML documents.
 *
 * #### Notes
 * The iframed HTML document can pose a potential security risk,
 * since it can execute Javascript, and make same-origin requests
 * to the server, thereby executing arbitrary Javascript.
 *
 * Here, we sandbox the iframe so that it can't execute Javascript
 * or launch any popups. We allow one exception: 'allow-same-origin'
 * requests, so that local HTML documents can access CSS, images,
 * etc from the files system.
 */
export declare class HTMLViewer extends DocumentWidget<IFrame> implements IDocumentWidget<IFrame> {
    /**
     * Create a new widget for rendering HTML.
     */
    constructor(options: DocumentWidget.IOptionsOptionalContent);
    /**
     * Whether the HTML document is trusted. If trusted,
     * it can execute Javascript in the iframe sandbox.
     */
    get trusted(): boolean;
    set trusted(value: boolean);
    /**
     * Emitted when the trust state of the document changes.
     */
    get trustedChanged(): ISignal<this, boolean>;
    /**
     * Dispose of resources held by the html viewer.
     */
    dispose(): void;
    /**
     * Handle and update request.
     */
    protected onUpdateRequest(): void;
    /**
     * Render HTML in IFrame into this widget's node.
     */
    private _renderModel;
    /**
     * Set a <base> element in the HTML string so that the iframe
     * can correctly dereference relative links.
     */
    private _setBase;
    protected translator: ITranslator;
    private _renderPending;
    private _parser;
    private _monitor;
    private _objectUrl;
    private _trustedChanged;
}
/**
 * A widget factory for HTMLViewers.
 */
export declare class HTMLViewerFactory extends ABCWidgetFactory<HTMLViewer> {
    /**
     * Create a new widget given a context.
     */
    protected createNewWidget(context: DocumentRegistry.Context): HTMLViewer;
    /**
     * Default factory for toolbar items to be added after the widget is created.
     */
    protected defaultToolbarFactory(widget: HTMLViewer): DocumentRegistry.IToolbarItem[];
}
/**
 * A namespace for toolbar items generator
 */
export declare namespace ToolbarItems {
    /**
     * Create the refresh button
     *
     * @param widget HTML viewer widget
     * @param translator Application translator object
     * @returns Toolbar item button
     */
    function createRefreshButton(widget: HTMLViewer, translator?: ITranslator): Widget;
    /**
     * Create the trust button
     *
     * @param document HTML viewer widget
     * @param translator Application translator object
     * @returns Toolbar item button
     */
    function createTrustButton(document: HTMLViewer, translator: ITranslator): Widget;
}
