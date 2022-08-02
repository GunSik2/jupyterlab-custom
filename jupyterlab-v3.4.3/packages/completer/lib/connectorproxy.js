/**
 * The connector which is used to fetch responses from multiple providers.
 */
export class ConnectorProxy {
    /**
     * Creates an instance of ConnectorProxy. The `context` and `timeout` parameter
     * is stored and will be used in the `fetch` method of provider.
     */
    constructor(completerContext, providers, timeout) {
        this._resolveFactory = (provider, el) => provider.resolve
            ? (patch) => provider.resolve(el, this._context, patch)
            : undefined;
        /**
         * Counter to reject current provider response if a new fetch request is created.
         */
        this._fetching = 0;
        this._providers = providers;
        this._context = completerContext;
        this._timeout = timeout;
    }
    /**
     * Fetch response from multiple providers, If a provider can not return
     * the response for a completer request before timeout,
     * the result of this provider will be ignore.
     *
     * @param {CompletionHandler.IRequest} request - The completion request.
     */
    async fetch(request) {
        const current = ++this._fetching;
        let promises = [];
        for (const provider of this._providers) {
            let promise;
            promise = provider.fetch(request, this._context).then(reply => {
                if (current !== this._fetching) {
                    return Promise.reject(void 0);
                }
                const items = reply.items.map(el => (Object.assign(Object.assign({}, el), { resolve: this._resolveFactory(provider, el) })));
                return Object.assign(Object.assign({}, reply), { items });
            });
            const timeoutPromise = new Promise(resolve => {
                return setTimeout(() => resolve(null), this._timeout);
            });
            promise = Promise.race([promise, timeoutPromise]);
            promises.push(promise);
        }
        const combinedPromise = Promise.all(promises);
        return combinedPromise;
    }
    /**
     * Check if completer should make request to fetch completion responses
     * on user typing. If the provider with highest rank does not have
     * `shouldShowContinuousHint` method, a default one will be used.
     *
     * @param completerIsVisible - The visible status of completer widget.
     * @param changed - CodeMirror changed argument.
     */
    shouldShowContinuousHint(completerIsVisible, changed) {
        if (this._providers[0].shouldShowContinuousHint) {
            return this._providers[0].shouldShowContinuousHint(completerIsVisible, changed);
        }
        return this._defaultShouldShowContinuousHint(completerIsVisible, changed);
    }
    _defaultShouldShowContinuousHint(completerIsVisible, changed) {
        return (!completerIsVisible &&
            changed.type !== 'remove' &&
            changed.value.trim().length > 0);
    }
}
//# sourceMappingURL=connectorproxy.js.map