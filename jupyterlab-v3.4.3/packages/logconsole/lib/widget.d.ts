import { IChangedArgs } from '@jupyterlab/coreutils';
import { ITranslator } from '@jupyterlab/translation';
import { Message } from '@lumino/messaging';
import { ISignal } from '@lumino/signaling';
import { StackedPanel, Widget } from '@lumino/widgets';
import { ILogger, ILoggerRegistry } from './tokens';
/**
 * Implements a panel which supports pinning the position to the end if it is
 * scrolled to the end.
 *
 * #### Notes
 * This is useful for log viewing components or chat components that append
 * elements at the end. We would like to automatically scroll when the user
 * has scrolled to the bottom, but not change the scrolling when the user has
 * changed the scroll position.
 */
export declare class ScrollingWidget<T extends Widget> extends Widget {
    constructor({ content, ...options }: ScrollingWidget.IOptions<T>);
    /**
     * The content widget.
     */
    get content(): T;
    protected onAfterAttach(msg: Message): void;
    protected onBeforeDetach(msg: Message): void;
    protected onAfterShow(msg: Message): void;
    private _handleScroll;
    private _content;
    private _observer;
    private _scrollHeight;
    private _sentinel;
    private _tracking;
}
export declare namespace ScrollingWidget {
    interface IOptions<T extends Widget> extends Widget.IOptions {
        content: T;
    }
}
/**
 * A StackedPanel implementation that creates Output Areas
 * for each log source and activates as source is switched.
 */
export declare class LogConsolePanel extends StackedPanel {
    /**
     * Construct a LogConsolePanel instance.
     *
     * @param loggerRegistry - The logger registry that provides
     * logs to be displayed.
     */
    constructor(loggerRegistry: ILoggerRegistry, translator?: ITranslator);
    /**
     * The logger registry providing the logs.
     */
    get loggerRegistry(): ILoggerRegistry;
    /**
     * The current logger.
     */
    get logger(): ILogger | null;
    /**
     * The log source displayed
     */
    get source(): string | null;
    set source(name: string | null);
    /**
     * The source version displayed.
     */
    get sourceVersion(): number | null;
    /**
     * Signal for source changes
     */
    get sourceChanged(): ISignal<this, IChangedArgs<string | null, string | null, 'source'>>;
    /**
     * Signal for source changes
     */
    get sourceDisplayed(): ISignal<this, ISourceDisplayed>;
    protected onAfterAttach(msg: Message): void;
    protected onAfterShow(msg: Message): void;
    private _bindLoggerSignals;
    private _showOutputFromSource;
    private _handlePlaceholder;
    private _updateOutputAreas;
    protected translator: ITranslator;
    private _trans;
    private _loggerRegistry;
    private _outputAreas;
    private _source;
    private _sourceChanged;
    private _sourceDisplayed;
    private _placeholder;
    private _loggersWatched;
}
export interface ISourceDisplayed {
    source: string | null;
    version: number | null;
}
