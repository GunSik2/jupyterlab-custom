/**
 * @packageDocumentation
 * @module vdom
 */
import { IWidgetTracker } from '@jupyterlab/apputils';
import { DocumentRegistry, MimeDocument } from '@jupyterlab/docregistry';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { Token } from '@lumino/coreutils';
import { Message } from '@lumino/messaging';
import { Widget } from '@lumino/widgets';
import { SerializedEvent } from '@nteract/transform-vdom';
/**
 * A class that tracks VDOM widgets.
 */
export interface IVDOMTracker extends IWidgetTracker<MimeDocument> {
}
/**
 * The VDOM tracker token.
 */
export declare const IVDOMTracker: Token<IVDOMTracker>;
/**
 * A renderer for declarative virtual DOM content.
 */
export declare class RenderedVDOM extends Widget implements IRenderMime.IRenderer {
    /**
     * Create a new widget for rendering DOM.
     */
    constructor(options: IRenderMime.IRendererOptions, context?: DocumentRegistry.IContext<DocumentRegistry.IModel>);
    /**
     * Dispose of the widget.
     */
    dispose(): void;
    /**
     * Called before the widget is detached from the DOM.
     */
    protected onBeforeDetach(msg: Message): void;
    /**
     * Render VDOM into this widget's node.
     */
    renderModel(model: IRenderMime.IMimeModel): Promise<void>;
    /**
     * Handle events for VDOM element.
     */
    handleVDOMEvent: (targetName: string, event: SerializedEvent<any>) => void;
    private _mimeType;
    private _sessionContext?;
    private _comms;
    private _timer;
}
