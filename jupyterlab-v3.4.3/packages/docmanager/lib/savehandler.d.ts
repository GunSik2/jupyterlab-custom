import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IDisposable } from '@lumino/disposable';
/**
 * A class that manages the auto saving of a document.
 *
 * #### Notes
 * Implements https://github.com/ipython/ipython/wiki/IPEP-15:-Autosaving-the-IPython-Notebook.
 */
export declare class SaveHandler implements IDisposable {
    /**
     * Construct a new save handler.
     */
    constructor(options: SaveHandler.IOptions);
    /**
     * The save interval used by the timer (in seconds).
     */
    get saveInterval(): number;
    set saveInterval(value: number);
    /**
     * Get whether the handler is active.
     */
    get isActive(): boolean;
    /**
     * Get whether the save handler is disposed.
     */
    get isDisposed(): boolean;
    /**
     * Dispose of the resources used by the save handler.
     */
    dispose(): void;
    /**
     * Start the autosaver.
     */
    start(): void;
    /**
     * Stop the autosaver.
     */
    stop(): void;
    /**
     * Set the timer.
     */
    private _setTimer;
    /**
     * Handle an autosave timeout.
     */
    private _save;
    private _autosaveTimer;
    private _minInterval;
    private _interval;
    private _context;
    private _isActive;
    private _inDialog;
    private _isDisposed;
    private _multiplier;
}
/**
 * A namespace for `SaveHandler` statics.
 */
export declare namespace SaveHandler {
    /**
     * The options used to create a save handler.
     */
    interface IOptions {
        /**
         * The context associated with the file.
         */
        context: DocumentRegistry.Context;
        /**
         * The minimum save interval in seconds (default is two minutes).
         */
        saveInterval?: number;
    }
}
