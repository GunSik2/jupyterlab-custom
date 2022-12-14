/**
 * @packageDocumentation
 * @module json-extension
 */
import { Printing } from '@jupyterlab/apputils';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { ITranslator } from '@jupyterlab/translation';
import { Message } from '@lumino/messaging';
import { Widget } from '@lumino/widgets';
/**
 * The MIME type for JSON.
 */
export declare const MIME_TYPE = "application/json";
/**
 * A renderer for JSON data.
 */
export declare class RenderedJSON extends Widget implements IRenderMime.IRenderer, Printing.IPrintable {
    /**
     * Create a new widget for rendering JSON.
     */
    constructor(options: IRenderMime.IRendererOptions);
    [Printing.symbol](): () => Promise<void>;
    /**
     * Render JSON into this widget's node.
     */
    renderModel(model: IRenderMime.IMimeModel): Promise<void>;
    /**
     * Called before the widget is detached from the DOM.
     */
    protected onBeforeDetach(msg: Message): void;
    translator: ITranslator;
    private _mimeType;
}
/**
 * A mime renderer factory for JSON data.
 */
export declare const rendererFactory: IRenderMime.IRendererFactory;
declare const extensions: IRenderMime.IExtension | IRenderMime.IExtension[];
export default extensions;
