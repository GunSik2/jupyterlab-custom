/**
 * @packageDocumentation
 * @module pdf-extension
 */
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { Widget } from '@lumino/widgets';
/**
 * A class for rendering a PDF document.
 */
export declare class RenderedPDF extends Widget implements IRenderMime.IRenderer {
    constructor();
    /**
     * Render PDF into this widget's node.
     */
    renderModel(model: IRenderMime.IMimeModel): Promise<void>;
    /**
     * Handle a `before-hide` message.
     */
    protected onBeforeHide(): void;
    /**
     * Dispose of the resources held by the pdf widget.
     */
    dispose(): void;
    private _base64;
    private _disposable;
    private _object;
    private _ready;
}
/**
 * A mime renderer factory for PDF data.
 */
export declare const rendererFactory: IRenderMime.IRendererFactory;
declare const extensions: IRenderMime.IExtension | IRenderMime.IExtension[];
export default extensions;
