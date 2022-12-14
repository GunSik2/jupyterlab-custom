import { ITranslator } from '@jupyterlab/translation';
import { Widget } from '@lumino/widgets';
import { TagTool } from './tool';
/**
 * A widget which hosts a cell tags area.
 */
export declare class AddWidget extends Widget {
    /**
     * Construct a new tag widget.
     */
    constructor(translator?: ITranslator);
    /**
     * Create input box with icon and attach to this.node.
     */
    buildTag(): void;
    /**
     * Handle `after-attach` messages for the widget.
     */
    onAfterAttach(): void;
    /**
     * Handle `before-detach` messages for the widget.
     */
    onBeforeDetach(): void;
    /**
     * Handle the DOM events for the widget.
     *
     * @param event - The DOM event sent to the widget.
     *
     * #### Notes
     * This method implements the DOM `EventListener` interface and is
     * called in response to events on the dock panel's node. It should
     * not be called directly by user code.
     */
    handleEvent(event: Event): void;
    /**
     * Handle the `'mousedown'` event for the input box.
     *
     * @param event - The DOM event sent to the widget
     */
    private _evtMouseDown;
    /**
     * Handle the `'focus'` event for the input box.
     */
    private _evtFocus;
    /**
     * Handle the `'keydown'` event for the input box.
     *
     * @param event - The DOM event sent to the widget
     */
    private _evtKeyDown;
    /**
     * Handle the `'focusout'` event for the input box.
     */
    private _evtBlur;
    parent: TagTool | null;
    private editing;
    private input;
    protected translator: ITranslator;
    private _trans;
}
