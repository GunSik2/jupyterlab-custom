import { ITranslator } from '@jupyterlab/translation';
import { Message } from '@lumino/messaging';
import { BoxPanel, Widget } from '@lumino/widgets';
import { Printing } from './printing';
import { Toolbar } from './toolbar';
/**
 * A widget meant to be contained in the JupyterLab main area.
 *
 * #### Notes
 * Mirrors all of the `title` attributes of the content.
 * This widget is `closable` by default.
 * This widget is automatically disposed when closed.
 * This widget ensures its own focus when activated.
 */
export declare class MainAreaWidget<T extends Widget = Widget> extends Widget implements Printing.IPrintable {
    /**
     * Construct a new main area widget.
     *
     * @param options - The options for initializing the widget.
     */
    constructor(options: MainAreaWidget.IOptions<T>);
    /**
     * Print method. Deferred to content.
     */
    [Printing.symbol](): Printing.OptionalAsyncThunk;
    /**
     * The content hosted by the widget.
     */
    get content(): T;
    /**
     * The toolbar hosted by the widget.
     */
    get toolbar(): Toolbar;
    /**
     * A panel for widgets that sit between the toolbar and the content.
     * Imagine a formatting toolbar, notification headers, etc.
     */
    get contentHeader(): BoxPanel;
    /**
     * Whether the content widget or an error is revealed.
     */
    get isRevealed(): boolean;
    /**
     * A promise that resolves when the widget is revealed.
     */
    get revealed(): Promise<void>;
    /**
     * Handle `'activate-request'` messages.
     */
    protected onActivateRequest(msg: Message): void;
    /**
     * Handle `after-attach` messages for the widget.
     */
    protected onAfterAttach(msg: Message): void;
    /**
     * Handle `before-detach` messages for the widget.
     */
    protected onBeforeDetach(msg: Message): void;
    /**
     * Handle `'close-request'` messages.
     */
    protected onCloseRequest(msg: Message): void;
    /**
     * Handle `'update-request'` messages by forwarding them to the content.
     */
    protected onUpdateRequest(msg: Message): void;
    private _disposeSpinner;
    /**
     * Update the title based on the attributes of the child widget.
     */
    private _updateTitle;
    /**
     * Update the content title based on attributes of the main widget.
     */
    private _updateContentTitle;
    /**
     * Give focus to the content.
     */
    private _focusContent;
    private _content;
    private _toolbar;
    private _contentHeader;
    private _changeGuard;
    private _spinner;
    private _isRevealed;
    private _revealed;
    private _evtMouseDown;
}
/**
 * The namespace for the `MainAreaWidget` class statics.
 */
export declare namespace MainAreaWidget {
    /**
     * An options object for creating a main area widget.
     */
    interface IOptions<T extends Widget = Widget> extends Widget.IOptions {
        /**
         * The child widget to wrap.
         */
        content: T;
        /**
         * The toolbar to use for the widget.  Defaults to an empty toolbar.
         */
        toolbar?: Toolbar;
        /**
         * The layout to sit underneath the toolbar and above the content,
         * and that extensions can populate. Defaults to an empty BoxPanel.
         */
        contentHeader?: BoxPanel;
        /**
         * An optional promise for when the content is ready to be revealed.
         */
        reveal?: Promise<any>;
        /**
         * The application language translator.
         */
        translator?: ITranslator;
    }
    /**
     * An options object for main area widget subclasses providing their own
     * default content.
     *
     * #### Notes
     * This makes it easier to have a subclass that provides its own default
     * content. This can go away once we upgrade to TypeScript 2.8 and have an
     * easy way to make a single property optional, ala
     * https://stackoverflow.com/a/46941824
     */
    interface IOptionsOptionalContent<T extends Widget = Widget> extends Widget.IOptions {
        /**
         * The child widget to wrap.
         */
        content?: T;
        /**
         * The toolbar to use for the widget.  Defaults to an empty toolbar.
         */
        toolbar?: Toolbar;
        /**
         * An optional promise for when the content is ready to be revealed.
         */
        reveal?: Promise<any>;
    }
}
