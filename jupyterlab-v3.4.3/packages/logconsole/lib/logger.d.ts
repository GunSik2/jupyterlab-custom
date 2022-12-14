import * as nbformat from '@jupyterlab/nbformat';
import { IOutputAreaModel, OutputAreaModel } from '@jupyterlab/outputarea';
import { IOutputModel, IRenderMimeRegistry, OutputModel } from '@jupyterlab/rendermime';
import { ISignal } from '@lumino/signaling';
import { IContentChange, ILogger, ILoggerOutputAreaModel, ILogPayload, IStateChange, LogLevel } from './tokens';
/**
 * All severity levels, including an internal one for metadata.
 */
declare type FullLogLevel = LogLevel | 'metadata';
/**
 * Custom Notebook Output with log info.
 */
declare type ILogOutput = nbformat.IOutput & {
    /**
     * Date & time when output is logged in integer representation.
     */
    timestamp: number;
    /**
     * Log level
     */
    level: FullLogLevel;
};
export interface ILogOutputModel extends IOutputModel {
    /**
     * Date & time when output is logged.
     */
    readonly timestamp: Date;
    /**
     * Log level
     */
    readonly level: FullLogLevel;
}
/**
 * Log Output Model with timestamp which provides
 * item information for Output Area Model.
 */
export declare class LogOutputModel extends OutputModel implements ILogOutputModel {
    /**
     * Construct a LogOutputModel.
     *
     * @param options - The model initialization options.
     */
    constructor(options: LogOutputModel.IOptions);
    /**
     * Date & time when output is logged.
     */
    readonly timestamp: Date;
    /**
     * Log level
     */
    readonly level: FullLogLevel;
}
/**
 * Log Output Model namespace that defines initialization options.
 */
declare namespace LogOutputModel {
    interface IOptions extends IOutputModel.IOptions {
        value: ILogOutput;
    }
}
/**
 * Output Area Model implementation which is able to
 * limit number of outputs stored.
 */
export declare class LoggerOutputAreaModel extends OutputAreaModel implements ILoggerOutputAreaModel {
    constructor({ maxLength, ...options }: LoggerOutputAreaModel.IOptions);
    /**
     * Add an output, which may be combined with previous output.
     *
     * @returns The total number of outputs.
     *
     * #### Notes
     * The output bundle is copied. Contiguous stream outputs of the same `name`
     * are combined. The oldest outputs are possibly removed to ensure the total
     * number of outputs is at most `.maxLength`.
     */
    add(output: ILogOutput): number;
    /**
     * Whether an output should combine with the previous output.
     *
     * We combine if the two outputs are in the same second, which is the
     * resolution for our time display.
     */
    protected shouldCombine(options: {
        value: ILogOutput;
        lastModel: ILogOutputModel;
    }): boolean;
    /**
     * Get an item at the specified index.
     */
    get(index: number): ILogOutputModel;
    /**
     * Maximum number of outputs to store in the model.
     */
    get maxLength(): number;
    set maxLength(value: number);
    /**
     * Manually apply length limit.
     */
    private _applyMaxLength;
    private _maxLength;
}
export declare namespace LoggerOutputAreaModel {
    interface IOptions extends IOutputAreaModel.IOptions {
        /**
         * The maximum number of messages stored.
         */
        maxLength: number;
    }
}
/**
 * A concrete implementation of ILogger.
 */
export declare class Logger implements ILogger {
    /**
     * Construct a Logger.
     *
     * @param source - The name of the log source.
     */
    constructor(options: Logger.IOptions);
    /**
     * The maximum number of outputs stored.
     *
     * #### Notes
     * Oldest entries will be trimmed to ensure the length is at most
     * `.maxLength`.
     */
    get maxLength(): number;
    set maxLength(value: number);
    /**
     * The level of outputs logged
     */
    get level(): LogLevel;
    set level(newValue: LogLevel);
    /**
     * Number of outputs logged.
     */
    get length(): number;
    /**
     * A signal emitted when the list of log messages changes.
     */
    get contentChanged(): ISignal<this, IContentChange>;
    /**
     * A signal emitted when the log state changes.
     */
    get stateChanged(): ISignal<this, IStateChange>;
    /**
     * Rendermime to use when rendering outputs logged.
     */
    get rendermime(): IRenderMimeRegistry | null;
    set rendermime(value: IRenderMimeRegistry | null);
    /**
     * The number of messages that have ever been stored.
     */
    get version(): number;
    /**
     * The source for the logger.
     */
    readonly source: string;
    /**
     * The output area model used for the logger.
     *
     * #### Notes
     * This will usually not be accessed directly. It is a public attribute so
     * that the renderer can access it.
     */
    readonly outputAreaModel: LoggerOutputAreaModel;
    /**
     * Log an output to logger.
     *
     * @param log - The output to be logged.
     */
    log(log: ILogPayload): void;
    /**
     * Clear all outputs logged.
     */
    clear(): void;
    /**
     * Add a checkpoint to the log.
     */
    checkpoint(): void;
    /**
     * Whether the logger is disposed.
     */
    get isDisposed(): boolean;
    /**
     * Dispose the logger.
     */
    dispose(): void;
    private _log;
    private _isDisposed;
    private _contentChanged;
    private _stateChanged;
    private _rendermime;
    private _version;
    private _level;
}
export declare namespace Logger {
    interface IOptions {
        /**
         * The log source identifier.
         */
        source: string;
        /**
         * The maximum number of messages to store.
         */
        maxLength: number;
    }
}
export {};
