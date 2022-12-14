import { ISignal } from '@lumino/signaling';
import { ICompletionContext, ICompletionProvider, ICompletionProviderManager } from './tokens';
/**
 * A manager for completer provider.
 */
export declare class CompletionProviderManager implements ICompletionProviderManager {
    /**
     * Construct a new completer manager.
     */
    constructor();
    /**
     * Signal emitted when active providers list is changed.
     */
    get activeProvidersChanged(): ISignal<ICompletionProviderManager, void>;
    /**
     * Set provider timeout.
     *
     * @param {number} timeout - value of timeout in millisecond.
     */
    setTimeout(timeout: number): void;
    /**
     * Enable/disable the document panel.
     */
    setShowDocumentFlag(showDoc: boolean): void;
    /**
     * Enable/disable continuous hinting mode.
     */
    setContinuousHinting(value: boolean): void;
    /**
     * Register a completer provider with the manager.
     *
     * @param {ICompletionProvider} provider - the provider to be registered.
     */
    registerProvider(provider: ICompletionProvider): void;
    /**
     *
     * Return the map of providers.
     */
    getProviders(): Map<string, ICompletionProvider>;
    /**
     * Activate the providers by id, the list of ids is populated from user setting.
     * The non-existing providers will be discarded.
     *
     * @param {Array<string>} providerIds - Array of strings with ids of provider
     */
    activateProvider(providerIds: Array<string>): void;
    /**
     * Create or update completer handler of a widget with new context.
     *
     * @param newCompleterContext - The completion context.
     */
    updateCompleter(newCompleterContext: ICompletionContext): Promise<void>;
    /**
     * Invoke the completer in the widget with provided id.
     *
     * @param id - the id of notebook panel, console panel or code editor.
     */
    invoke(id: string): void;
    /**
     * Activate `select` command in the widget with provided id.
     *
     * @param {string} id - the id of notebook panel, console panel or code editor.
     */
    select(id: string): void;
    /**
     * Helper function to generate a `ConnectorProxy` with provided context.
     * The `isApplicable` method of provider is used to filter out the providers
     * which can not be used with provided context.
     *
     * @param {ICompletionContext} completerContext - the current completer context
     */
    private generateConnectorProxy;
    /**
     * Helper to dispose the completer handler on widget disposed event.
     *
     * @param {string} id - id of the widget
     * @param {CompletionHandler} handler - the handler to be disposed.
     */
    private disposeHandler;
    /**
     * Helper to generate a completer handler from provided context.
     */
    private generateHandler;
    /**
     * The completer provider map, the keys are id of provider
     */
    private readonly _providers;
    /**
     * The completer handler map, the keys are id of widget and
     * values are the completer handler attached to this widget.
     */
    private _panelHandlers;
    /**
     * The set of activated provider
     */
    private _activeProviders;
    /**
     * Timeout value for the completer provider.
     */
    private _timeout;
    /**
     * Flag to show or hide the document panel.
     */
    private _showDoc;
    /**
     * Flag to enable/disable continuous hinting.
     */
    private _autoCompletion;
    private _activeProvidersChanged;
}
