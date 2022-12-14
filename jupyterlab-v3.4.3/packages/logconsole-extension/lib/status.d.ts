/// <reference types="react" />
import { VDomModel, VDomRenderer } from '@jupyterlab/apputils';
import { ILoggerRegistry } from '@jupyterlab/logconsole';
import { ITranslator } from '@jupyterlab/translation';
import { Signal } from '@lumino/signaling';
/**
 * A VDomRenderer widget for displaying the status of Log Console logs.
 */
export declare class LogConsoleStatus extends VDomRenderer<LogConsoleStatus.Model> {
    /**
     * Construct the log console status widget.
     *
     * @param options - The status widget initialization options.
     */
    constructor(options: LogConsoleStatus.IOptions);
    /**
     * Render the log console status item.
     */
    render(): JSX.Element | null;
    private _flashHighlight;
    private _showHighlighted;
    private _clearHighlight;
    readonly translator: ITranslator;
    private _handleClick;
}
/**
 * A namespace for Log Console log status.
 */
export declare namespace LogConsoleStatus {
    /**
     * A VDomModel for the LogConsoleStatus item.
     */
    class Model extends VDomModel {
        /**
         * Create a new LogConsoleStatus model.
         *
         * @param loggerRegistry - The logger registry providing the logs.
         */
        constructor(loggerRegistry: ILoggerRegistry);
        /**
         * Number of messages currently in the current source.
         */
        get messages(): number;
        /**
         * The number of messages ever stored by the current source.
         */
        get version(): number;
        /**
         * The name of the active log source
         */
        get source(): string | null;
        set source(name: string | null);
        /**
         * The last source version that was displayed.
         */
        get versionDisplayed(): number;
        /**
         * The last source version we notified the user about.
         */
        get versionNotified(): number;
        /**
         * Flag to toggle flashing when new logs added.
         */
        get flashEnabled(): boolean;
        set flashEnabled(enabled: boolean);
        /**
         * Record the last source version displayed to the user.
         *
         * @param source - The name of the log source.
         * @param version - The version of the log that was displayed.
         *
         * #### Notes
         * This will also update the last notified version so that the last
         * notified version is always at least the last displayed version.
         */
        sourceDisplayed(source: string | null, version: number | null): void;
        /**
         * Record a source version we notified the user about.
         *
         * @param source - The name of the log source.
         * @param version - The version of the log.
         */
        sourceNotified(source: string | null, version: number): void;
        private _handleLogRegistryChange;
        private _handleLogContentChange;
        /**
         * A signal emitted when the flash enablement changes.
         */
        flashEnabledChanged: Signal<this, void>;
        private _flashEnabled;
        private _loggerRegistry;
        private _source;
        /**
         * The view status of each source.
         *
         * #### Notes
         * Keys are source names, value is a list of two numbers. The first
         * represents the version of the messages that was last displayed to the
         * user, the second represents the version that we last notified the user
         * about.
         */
        private _sourceVersion;
    }
    /**
     * Options for creating a new LogConsoleStatus item
     */
    interface IOptions {
        /**
         * The logger registry providing the logs.
         */
        loggerRegistry: ILoggerRegistry;
        /**
         * A click handler for the item. By default
         * Log Console panel is launched.
         */
        handleClick: () => void;
        /**
         * Language translator.
         */
        translator?: ITranslator;
    }
}
