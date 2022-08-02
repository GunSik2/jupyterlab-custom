import { IObservableString } from '@jupyterlab/observables';
import { CompletionHandler } from './handler';
import { ICompletionContext, ICompletionProvider, IConnectorProxy } from './tokens';
/**
 * The connector which is used to fetch responses from multiple providers.
 */
export declare class ConnectorProxy implements IConnectorProxy {
    /**
     * Creates an instance of ConnectorProxy. The `context` and `timeout` parameter
     * is stored and will be used in the `fetch` method of provider.
     */
    constructor(completerContext: ICompletionContext, providers: Array<ICompletionProvider>, timeout: number);
    /**
     * Fetch response from multiple providers, If a provider can not return
     * the response for a completer request before timeout,
     * the result of this provider will be ignore.
     *
     * @param {CompletionHandler.IRequest} request - The completion request.
     */
    fetch(request: CompletionHandler.IRequest): Promise<Array<CompletionHandler.ICompletionItemsReply | null>>;
    /**
     * Check if completer should make request to fetch completion responses
     * on user typing. If the provider with highest rank does not have
     * `shouldShowContinuousHint` method, a default one will be used.
     *
     * @param completerIsVisible - The visible status of completer widget.
     * @param changed - CodeMirror changed argument.
     */
    shouldShowContinuousHint(completerIsVisible: boolean, changed: IObservableString.IChangedArgs): boolean;
    private _defaultShouldShowContinuousHint;
    private _resolveFactory;
    /**
     * List of available providers.
     */
    private _providers;
    /**
     * Current completer context.
     */
    private _context;
    /**
     * Timeout for the fetch request.
     */
    private _timeout;
    /**
     * Counter to reject current provider response if a new fetch request is created.
     */
    private _fetching;
}
export declare namespace ConnectorProxy {
    type IConnectorMap = Map<string, CompletionHandler.ICompletionItemsConnector>;
}
