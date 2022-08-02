// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import { ConnectorProxy } from './connectorproxy';
import { CONTEXT_PROVIDER_ID } from './default/contextprovider';
import { KERNEL_PROVIDER_ID } from './default/kernelprovider';
import { CompletionHandler } from './handler';
import { CompleterModel } from './model';
import { Completer } from './widget';
/**
 * A manager for completer provider.
 */
export class CompletionProviderManager {
    /**
     * Construct a new completer manager.
     */
    constructor() {
        /**
         * The set of activated provider
         */
        this._activeProviders = new Set([KERNEL_PROVIDER_ID, CONTEXT_PROVIDER_ID]);
        this._providers = new Map();
        this._panelHandlers = new Map();
        this._activeProvidersChanged = new Signal(this);
    }
    /**
     * Signal emitted when active providers list is changed.
     */
    get activeProvidersChanged() {
        return this._activeProvidersChanged;
    }
    /**
     * Set provider timeout.
     *
     * @param {number} timeout - value of timeout in millisecond.
     */
    setTimeout(timeout) {
        this._timeout = timeout;
    }
    /**
     * Enable/disable the document panel.
     */
    setShowDocumentFlag(showDoc) {
        this._panelHandlers.forEach(handler => (handler.completer.showDocsPanel = showDoc));
        this._showDoc = showDoc;
    }
    /**
     * Enable/disable continuous hinting mode.
     */
    setContinuousHinting(value) {
        this._panelHandlers.forEach(handler => (handler.autoCompletion = value));
        this._autoCompletion = value;
    }
    /**
     * Register a completer provider with the manager.
     *
     * @param {ICompletionProvider} provider - the provider to be registered.
     */
    registerProvider(provider) {
        const identifier = provider.identifier;
        if (this._providers.has(identifier)) {
            console.warn(`Completion service with identifier ${identifier} is already registered`);
        }
        else {
            this._providers.set(identifier, provider);
        }
    }
    /**
     *
     * Return the map of providers.
     */
    getProviders() {
        return this._providers;
    }
    /**
     * Activate the providers by id, the list of ids is populated from user setting.
     * The non-existing providers will be discarded.
     *
     * @param {Array<string>} providerIds - Array of strings with ids of provider
     */
    activateProvider(providerIds) {
        this._activeProviders = new Set([]);
        providerIds.forEach(providerId => {
            if (this._providers.has(providerId)) {
                this._activeProviders.add(providerId);
            }
        });
        if (this._activeProviders.size === 0) {
            this._activeProviders.add(KERNEL_PROVIDER_ID);
            this._activeProviders.add(CONTEXT_PROVIDER_ID);
        }
        this._activeProvidersChanged.emit();
    }
    /**
     * Create or update completer handler of a widget with new context.
     *
     * @param newCompleterContext - The completion context.
     */
    async updateCompleter(newCompleterContext) {
        const { widget, editor } = newCompleterContext;
        const id = widget.id;
        const handler = this._panelHandlers.get(id);
        if (!handler) {
            // Create a new handler.
            const handler = await this.generateHandler(newCompleterContext);
            this._panelHandlers.set(widget.id, handler);
            widget.disposed.connect(old => {
                this.disposeHandler(old.id, handler);
            });
        }
        else {
            // Update existing handler.
            handler.completer.showDocsPanel = this._showDoc;
            handler.autoCompletion = this._autoCompletion;
            if (editor) {
                handler.editor = editor;
                handler.connector = await this.generateConnectorProxy(newCompleterContext);
            }
        }
    }
    /**
     * Invoke the completer in the widget with provided id.
     *
     * @param id - the id of notebook panel, console panel or code editor.
     */
    invoke(id) {
        const handler = this._panelHandlers.get(id);
        if (handler) {
            handler.invoke();
        }
    }
    /**
     * Activate `select` command in the widget with provided id.
     *
     * @param {string} id - the id of notebook panel, console panel or code editor.
     */
    select(id) {
        const handler = this._panelHandlers.get(id);
        if (handler) {
            handler.completer.selectActive();
        }
    }
    /**
     * Helper function to generate a `ConnectorProxy` with provided context.
     * The `isApplicable` method of provider is used to filter out the providers
     * which can not be used with provided context.
     *
     * @param {ICompletionContext} completerContext - the current completer context
     */
    async generateConnectorProxy(completerContext) {
        let providers = [];
        //TODO Update list with rank
        for (const id of this._activeProviders) {
            const provider = this._providers.get(id);
            if (provider && (await provider.isApplicable(completerContext))) {
                providers.push(provider);
            }
        }
        return new ConnectorProxy(completerContext, providers, this._timeout);
    }
    /**
     * Helper to dispose the completer handler on widget disposed event.
     *
     * @param {string} id - id of the widget
     * @param {CompletionHandler} handler - the handler to be disposed.
     */
    disposeHandler(id, handler) {
        var _a;
        (_a = handler.completer.model) === null || _a === void 0 ? void 0 : _a.dispose();
        handler.completer.dispose();
        handler.dispose();
        this._panelHandlers.delete(id);
    }
    /**
     * Helper to generate a completer handler from provided context.
     */
    async generateHandler(completerContext) {
        const firstProvider = [...this._activeProviders][0];
        const provider = this._providers.get(firstProvider);
        let renderer = provider === null || provider === void 0 ? void 0 : provider.renderer;
        if (!renderer) {
            renderer = Completer.defaultRenderer;
        }
        const modelFactory = provider === null || provider === void 0 ? void 0 : provider.modelFactory;
        let model;
        if (modelFactory) {
            model = await modelFactory(completerContext);
        }
        else {
            model = new CompleterModel();
        }
        const completer = new Completer({ model, renderer });
        completer.showDocsPanel = this._showDoc;
        completer.hide();
        Widget.attach(completer, document.body);
        const connectorProxy = await this.generateConnectorProxy(completerContext);
        const handler = new CompletionHandler({
            completer,
            connector: connectorProxy
        });
        handler.editor = completerContext.editor;
        return handler;
    }
}
//# sourceMappingURL=manager.js.map