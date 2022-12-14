import { Terminal as TerminalNS } from '@jupyterlab/services';
import { ITranslator } from '@jupyterlab/translation';
import { Message } from '@lumino/messaging';
import { Widget } from '@lumino/widgets';
import { ITerminal } from '.';
/**
 * A widget which manages a terminal session.
 */
export declare class Terminal extends Widget implements ITerminal.ITerminal {
    /**
     * Construct a new terminal widget.
     *
     * @param session - The terminal session object.
     *
     * @param options - The terminal configuration options.
     *
     * @param translator - The language translator.
     */
    constructor(session: TerminalNS.ITerminalConnection, options?: Partial<ITerminal.IOptions>, translator?: ITranslator);
    private _setThemeAttribute;
    private _initialConnection;
    /**
     * The terminal session associated with the widget.
     */
    readonly session: TerminalNS.ITerminalConnection;
    /**
     * Get a config option for the terminal.
     */
    getOption<K extends keyof ITerminal.IOptions>(option: K): ITerminal.IOptions[K];
    /**
     * Set a config option for the terminal.
     */
    setOption<K extends keyof ITerminal.IOptions>(option: K, value: ITerminal.IOptions[K]): void;
    /**
     * Dispose of the resources held by the terminal widget.
     */
    dispose(): void;
    /**
     * Refresh the terminal session.
     *
     * #### Notes
     * Failure to reconnect to the session should be caught appropriately
     */
    refresh(): Promise<void>;
    /**
     * Process a message sent to the widget.
     *
     * @param msg - The message sent to the widget.
     *
     * #### Notes
     * Subclasses may reimplement this method as needed.
     */
    processMessage(msg: Message): void;
    /**
     * Set the size of the terminal when attached if dirty.
     */
    protected onAfterAttach(msg: Message): void;
    /**
     * Set the size of the terminal when shown if dirty.
     */
    protected onAfterShow(msg: Message): void;
    /**
     * On resize, use the computed row and column sizes to resize the terminal.
     */
    protected onResize(msg: Widget.ResizeMessage): void;
    /**
     * A message handler invoked on an `'update-request'` message.
     */
    protected onUpdateRequest(msg: Message): void;
    /**
     * A message handler invoked on an `'fit-request'` message.
     */
    protected onFitRequest(msg: Message): void;
    /**
     * Handle `'activate-request'` messages.
     */
    protected onActivateRequest(msg: Message): void;
    /**
     * Initialize the terminal object.
     */
    private _initializeTerm;
    /**
     * Handle a message from the terminal session.
     */
    private _onMessage;
    /**
     * Resize the terminal based on computed geometry.
     */
    private _resizeTerminal;
    /**
     * Set the size of the terminal in the session.
     */
    private _setSessionSize;
    private readonly _term;
    private readonly _fitAddon;
    private _trans;
    private _needsResize;
    private _termOpened;
    private _offsetWidth;
    private _offsetHeight;
    private _options;
}
