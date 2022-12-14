// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { PathExt } from '@jupyterlab/coreutils';
import { nullTranslator } from '@jupyterlab/translation';
import { each, find } from '@lumino/algorithm';
import { PromiseDelegate, UUID } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import * as React from 'react';
import { Dialog, showDialog } from './dialog';
/**
 * The default implementation for a session context object.
 */
export class SessionContext {
    /**
     * Construct a new session context.
     */
    constructor(options) {
        var _a, _b, _c, _d;
        this._path = '';
        this._name = '';
        this._type = '';
        this._prevKernelName = '';
        this._isDisposed = false;
        this._disposed = new Signal(this);
        this._session = null;
        this._ready = new PromiseDelegate();
        this._initializing = false;
        this._initStarted = new PromiseDelegate();
        this._initPromise = new PromiseDelegate();
        this._isReady = false;
        this._isTerminating = false;
        this._isRestarting = false;
        this._kernelChanged = new Signal(this);
        this._sessionChanged = new Signal(this);
        this._statusChanged = new Signal(this);
        this._connectionStatusChanged = new Signal(this);
        this._pendingInput = false;
        this._iopubMessage = new Signal(this);
        this._unhandledMessage = new Signal(this);
        this._propertyChanged = new Signal(this);
        this._dialog = null;
        this._busyDisposable = null;
        this._pendingKernelName = '';
        this._pendingSessionRequest = '';
        this.sessionManager = options.sessionManager;
        this.specsManager = options.specsManager;
        this.translator = options.translator || nullTranslator;
        this._trans = this.translator.load('jupyterlab');
        this._path = (_a = options.path) !== null && _a !== void 0 ? _a : UUID.uuid4();
        this._type = (_b = options.type) !== null && _b !== void 0 ? _b : '';
        this._name = (_c = options.name) !== null && _c !== void 0 ? _c : '';
        this._setBusy = options.setBusy;
        this._kernelPreference = (_d = options.kernelPreference) !== null && _d !== void 0 ? _d : {};
    }
    /**
     * The current session connection.
     */
    get session() {
        var _a;
        return (_a = this._session) !== null && _a !== void 0 ? _a : null;
    }
    /**
     * The session path.
     *
     * #### Notes
     * Typically `.session.path` should be used. This attribute is useful if
     * there is no current session.
     */
    get path() {
        return this._path;
    }
    /**
     * The session type.
     *
     * #### Notes
     * Typically `.session.type` should be used. This attribute is useful if
     * there is no current session.
     */
    get type() {
        return this._type;
    }
    /**
     * The session name.
     *
     * #### Notes
     * Typically `.session.name` should be used. This attribute is useful if
     * there is no current session.
     */
    get name() {
        return this._name;
    }
    /**
     * A signal emitted when the kernel connection changes, proxied from the session connection.
     */
    get kernelChanged() {
        return this._kernelChanged;
    }
    /**
     * A signal emitted when the session connection changes.
     */
    get sessionChanged() {
        return this._sessionChanged;
    }
    /**
     * A signal emitted when the kernel status changes, proxied from the kernel.
     */
    get statusChanged() {
        return this._statusChanged;
    }
    /**
     * A flag indicating if the session has ending input, proxied from the kernel.
     */
    get pendingInput() {
        return this._pendingInput;
    }
    /**
     * A signal emitted when the kernel status changes, proxied from the kernel.
     */
    get connectionStatusChanged() {
        return this._connectionStatusChanged;
    }
    /**
     * A signal emitted for iopub kernel messages, proxied from the kernel.
     */
    get iopubMessage() {
        return this._iopubMessage;
    }
    /**
     * A signal emitted for an unhandled kernel message, proxied from the kernel.
     */
    get unhandledMessage() {
        return this._unhandledMessage;
    }
    /**
     * A signal emitted when a session property changes, proxied from the current session.
     */
    get propertyChanged() {
        return this._propertyChanged;
    }
    /**
     * The kernel preference of this client session.
     *
     * This is used when selecting a new kernel, and should reflect the sort of
     * kernel the activity prefers.
     */
    get kernelPreference() {
        return this._kernelPreference;
    }
    set kernelPreference(value) {
        this._kernelPreference = value;
    }
    /**
     * Whether the context is ready.
     */
    get isReady() {
        return this._isReady;
    }
    /**
     * A promise that is fulfilled when the context is ready.
     */
    get ready() {
        return this._ready.promise;
    }
    /**
     * Whether the context is terminating.
     */
    get isTerminating() {
        return this._isTerminating;
    }
    /**
     * Whether the context is restarting.
     */
    get isRestarting() {
        return this._isRestarting;
    }
    /**
     * Whether the kernel is "No Kernel" or not.
     *
     * #### Notes
     * As the displayed name is translated, this can be used directly.
     */
    get hasNoKernel() {
        return this.kernelDisplayName === this.noKernelName;
    }
    /**
     * The display name of the current kernel, or a sensible alternative.
     *
     * #### Notes
     * This is a convenience function to have a consistent sensible name for the
     * kernel.
     */
    get kernelDisplayName() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const kernel = (_a = this.session) === null || _a === void 0 ? void 0 : _a.kernel;
        if (this._pendingKernelName === this.noKernelName) {
            return this.noKernelName;
        }
        if (!kernel &&
            !this.isReady &&
            this.kernelPreference.canStart !== false &&
            this.kernelPreference.shouldStart !== false) {
            let name = this._pendingKernelName ||
                SessionContext.getDefaultKernel({
                    specs: this.specsManager.specs,
                    sessions: this.sessionManager.running(),
                    preference: this.kernelPreference
                }) ||
                '';
            if (name) {
                name = (_d = (_c = (_b = this.specsManager.specs) === null || _b === void 0 ? void 0 : _b.kernelspecs[name]) === null || _c === void 0 ? void 0 : _c.display_name) !== null && _d !== void 0 ? _d : name;
                return name;
            }
            return this.noKernelName;
        }
        if (this._pendingKernelName) {
            return ((_g = (_f = (_e = this.specsManager.specs) === null || _e === void 0 ? void 0 : _e.kernelspecs[this._pendingKernelName]) === null || _f === void 0 ? void 0 : _f.display_name) !== null && _g !== void 0 ? _g : this._pendingKernelName);
        }
        if (!kernel) {
            return this.noKernelName;
        }
        return ((_k = (_j = (_h = this.specsManager.specs) === null || _h === void 0 ? void 0 : _h.kernelspecs[kernel.name]) === null || _j === void 0 ? void 0 : _j.display_name) !== null && _k !== void 0 ? _k : kernel.name);
    }
    /**
     * A sensible status to display
     *
     * #### Notes
     * This combines the status and connection status into a single status for
     * the user.
     */
    get kernelDisplayStatus() {
        var _a, _b;
        const kernel = (_a = this.session) === null || _a === void 0 ? void 0 : _a.kernel;
        if (this._isTerminating) {
            return 'terminating';
        }
        if (this._isRestarting) {
            return 'restarting';
        }
        if (this._pendingKernelName === this.noKernelName) {
            return 'unknown';
        }
        if (!kernel && this._pendingKernelName) {
            return 'initializing';
        }
        if (!kernel &&
            !this.isReady &&
            this.kernelPreference.canStart !== false &&
            this.kernelPreference.shouldStart !== false) {
            return 'initializing';
        }
        return ((_b = ((kernel === null || kernel === void 0 ? void 0 : kernel.connectionStatus) === 'connected'
            ? kernel === null || kernel === void 0 ? void 0 : kernel.status : kernel === null || kernel === void 0 ? void 0 : kernel.connectionStatus)) !== null && _b !== void 0 ? _b : 'unknown');
    }
    /**
     * The name of the previously started kernel.
     */
    get prevKernelName() {
        return this._prevKernelName;
    }
    /**
     * Test whether the context is disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * A signal emitted when the poll is disposed.
     */
    get disposed() {
        return this._disposed;
    }
    /**
     * Get the constant displayed name for "No Kernel"
     */
    get noKernelName() {
        return this._trans.__('No Kernel');
    }
    /**
     * Dispose of the resources held by the context.
     */
    dispose() {
        if (this._isDisposed) {
            return;
        }
        this._isDisposed = true;
        this._disposed.emit();
        if (this._session) {
            if (this.kernelPreference.shutdownOnDispose) {
                // Fire and forget the session shutdown request
                this.sessionManager.shutdown(this._session.id).catch(reason => {
                    console.error(`Kernel not shut down ${reason}`);
                });
            }
            // Dispose the session connection
            this._session.dispose();
            this._session = null;
        }
        if (this._dialog) {
            this._dialog.dispose();
        }
        if (this._busyDisposable) {
            this._busyDisposable.dispose();
            this._busyDisposable = null;
        }
        Signal.clearData(this);
    }
    /**
     * Restart the current Kernel.
     *
     * @returns A promise that resolves when the kernel is restarted.
     */
    async restartKernel() {
        var _a, _b, _c, _d, _e, _f;
        const kernel = ((_a = this.session) === null || _a === void 0 ? void 0 : _a.kernel) || null;
        if (this._isRestarting) {
            return;
        }
        this._isRestarting = true;
        this._isReady = false;
        this._statusChanged.emit('restarting');
        try {
            await ((_c = (_b = this.session) === null || _b === void 0 ? void 0 : _b.kernel) === null || _c === void 0 ? void 0 : _c.restart());
            this._isReady = true;
        }
        catch (e) {
            console.error(e);
        }
        this._isRestarting = false;
        this._statusChanged.emit(((_e = (_d = this.session) === null || _d === void 0 ? void 0 : _d.kernel) === null || _e === void 0 ? void 0 : _e.status) || 'unknown');
        this._kernelChanged.emit({
            name: 'kernel',
            oldValue: kernel,
            newValue: ((_f = this.session) === null || _f === void 0 ? void 0 : _f.kernel) || null
        });
    }
    /**
     * Change the current kernel associated with the session.
     */
    async changeKernel(options = {}) {
        if (this.isDisposed) {
            throw new Error('Disposed');
        }
        // Wait for the initialization method to try
        // and start its kernel first to ensure consistent
        // ordering.
        await this._initStarted.promise;
        return this._changeKernel(options);
    }
    /**
     * Kill the kernel and shutdown the session.
     *
     * @returns A promise that resolves when the session is shut down.
     */
    async shutdown() {
        if (this.isDisposed || !this._initializing) {
            return;
        }
        await this._initStarted.promise;
        this._pendingSessionRequest = '';
        this._pendingKernelName = this.noKernelName;
        return this._shutdownSession();
    }
    /**
     * Initialize the session context
     *
     * @returns A promise that resolves with whether to ask the user to select a kernel.
     *
     * #### Notes
     * If a server session exists on the current path, we will connect to it.
     * If preferences include disabling `canStart` or `shouldStart`, no
     * server session will be started.
     * If a kernel id is given, we attempt to start a session with that id.
     * If a default kernel is available, we connect to it.
     * Otherwise we ask the user to select a kernel.
     */
    async initialize() {
        if (this._initializing) {
            return this._initPromise.promise;
        }
        this._initializing = true;
        const needsSelection = await this._initialize();
        if (!needsSelection) {
            this._isReady = true;
            this._ready.resolve(undefined);
        }
        if (!this._pendingSessionRequest) {
            this._initStarted.resolve(void 0);
        }
        this._initPromise.resolve(needsSelection);
        return needsSelection;
    }
    /**
     * Inner initialize function that doesn't handle promises.
     * This makes it easier to consolidate promise handling logic.
     */
    async _initialize() {
        const manager = this.sessionManager;
        await manager.ready;
        await manager.refreshRunning();
        const model = find(manager.running(), item => {
            return item.path === this._path;
        });
        if (model) {
            try {
                const session = manager.connectTo({ model });
                this._handleNewSession(session);
            }
            catch (err) {
                void this._handleSessionError(err);
                return Promise.reject(err);
            }
        }
        return await this._startIfNecessary();
    }
    /**
     * Shut down the current session.
     */
    async _shutdownSession() {
        var _a;
        const session = this._session;
        // Capture starting values in case an error is raised.
        const isTerminating = this._isTerminating;
        const isReady = this._isReady;
        this._isTerminating = true;
        this._isReady = false;
        this._statusChanged.emit('terminating');
        try {
            await (session === null || session === void 0 ? void 0 : session.shutdown());
            this._isTerminating = false;
            session === null || session === void 0 ? void 0 : session.dispose();
            this._session = null;
            const kernel = (session === null || session === void 0 ? void 0 : session.kernel) || null;
            this._statusChanged.emit('unknown');
            this._kernelChanged.emit({
                name: 'kernel',
                oldValue: kernel,
                newValue: null
            });
            this._sessionChanged.emit({
                name: 'session',
                oldValue: session,
                newValue: null
            });
        }
        catch (err) {
            this._isTerminating = isTerminating;
            this._isReady = isReady;
            const status = (_a = session === null || session === void 0 ? void 0 : session.kernel) === null || _a === void 0 ? void 0 : _a.status;
            if (status === undefined) {
                this._statusChanged.emit('unknown');
            }
            else {
                this._statusChanged.emit(status);
            }
            throw err;
        }
        return;
    }
    /**
     * Start the session if necessary.
     *
     * @returns Whether to ask the user to pick a kernel.
     */
    async _startIfNecessary() {
        var _a;
        const preference = this.kernelPreference;
        if (this.isDisposed || ((_a = this.session) === null || _a === void 0 ? void 0 : _a.kernel) ||
            preference.shouldStart === false ||
            preference.canStart === false) {
            // Not necessary to start a kernel
            return false;
        }
        let options;
        if (preference.id) {
            options = { id: preference.id };
        }
        else {
            const name = SessionContext.getDefaultKernel({
                specs: this.specsManager.specs,
                sessions: this.sessionManager.running(),
                preference
            });
            if (name) {
                options = { name };
            }
        }
        if (options) {
            try {
                await this._changeKernel(options);
                return false;
            }
            catch (err) {
                /* no-op */
            }
        }
        // Always fall back to selecting a kernel
        return true;
    }
    /**
     * Change the kernel.
     */
    async _changeKernel(model = {}, isInit = false) {
        if (model.name) {
            this._pendingKernelName = model.name;
        }
        if (!this._session) {
            this._kernelChanged.emit({
                name: 'kernel',
                oldValue: null,
                newValue: null
            });
        }
        // Guarantee that the initialized kernel
        // will be started first.
        if (!this._pendingSessionRequest) {
            this._initStarted.resolve(void 0);
        }
        // If we already have a session, just change the kernel.
        if (this._session && !this._isTerminating) {
            try {
                await this._session.changeKernel(model);
                return this._session.kernel;
            }
            catch (err) {
                void this._handleSessionError(err);
                throw err;
            }
        }
        // Use a UUID for the path to overcome a race condition on the server
        // where it will re-use a session for a given path but only after
        // the kernel finishes starting.
        // We later switch to the real path below.
        // Use the correct directory so the kernel will be started in that directory.
        const dirName = PathExt.dirname(this._path);
        const requestId = (this._pendingSessionRequest = PathExt.join(dirName, UUID.uuid4()));
        try {
            this._statusChanged.emit('starting');
            const session = await this.sessionManager.startNew({
                path: requestId,
                type: this._type,
                name: this._name,
                kernel: model
            });
            // Handle a preempt.
            if (this._pendingSessionRequest !== session.path) {
                await session.shutdown();
                session.dispose();
                return null;
            }
            // Change to the real path.
            await session.setPath(this._path);
            // Update the name in case it has changed since we launched the session.
            await session.setName(this._name);
            if (this._session && !this._isTerminating) {
                await this._shutdownSession();
            }
            return this._handleNewSession(session);
        }
        catch (err) {
            void this._handleSessionError(err);
            throw err;
        }
    }
    /**
     * Handle a new session object.
     */
    _handleNewSession(session) {
        var _a, _b, _c;
        if (this.isDisposed) {
            throw Error('Disposed');
        }
        if (!this._isReady) {
            this._isReady = true;
            this._ready.resolve(undefined);
        }
        if (this._session) {
            this._session.dispose();
        }
        this._session = session;
        this._pendingKernelName = '';
        if (session) {
            this._prevKernelName = (_b = (_a = session.kernel) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : '';
            session.disposed.connect(this._onSessionDisposed, this);
            session.propertyChanged.connect(this._onPropertyChanged, this);
            session.kernelChanged.connect(this._onKernelChanged, this);
            session.statusChanged.connect(this._onStatusChanged, this);
            session.connectionStatusChanged.connect(this._onConnectionStatusChanged, this);
            session.pendingInput.connect(this._onPendingInput, this);
            session.iopubMessage.connect(this._onIopubMessage, this);
            session.unhandledMessage.connect(this._onUnhandledMessage, this);
            if (session.path !== this._path) {
                this._onPropertyChanged(session, 'path');
            }
            if (session.name !== this._name) {
                this._onPropertyChanged(session, 'name');
            }
            if (session.type !== this._type) {
                this._onPropertyChanged(session, 'type');
            }
        }
        // Any existing session/kernel connection was disposed above when the session was
        // disposed, so the oldValue should be null.
        this._sessionChanged.emit({
            name: 'session',
            oldValue: null,
            newValue: session
        });
        this._kernelChanged.emit({
            oldValue: null,
            newValue: (session === null || session === void 0 ? void 0 : session.kernel) || null,
            name: 'kernel'
        });
        this._statusChanged.emit(((_c = session === null || session === void 0 ? void 0 : session.kernel) === null || _c === void 0 ? void 0 : _c.status) || 'unknown');
        return (session === null || session === void 0 ? void 0 : session.kernel) || null;
    }
    /**
     * Handle an error in session startup.
     */
    async _handleSessionError(err) {
        this._handleNewSession(null);
        let traceback = '';
        let message = '';
        try {
            traceback = err.traceback;
            message = err.message;
        }
        catch (err) {
            // no-op
        }
        await this._displayKernelError(message, traceback);
    }
    /**
     * Display kernel error
     */
    async _displayKernelError(message, traceback) {
        const body = (React.createElement("div", null,
            message && React.createElement("pre", null, message),
            traceback && (React.createElement("details", { className: "jp-mod-wide" },
                React.createElement("pre", null, traceback)))));
        const dialog = (this._dialog = new Dialog({
            title: this._trans.__('Error Starting Kernel'),
            body,
            buttons: [Dialog.okButton()]
        }));
        await dialog.launch();
        this._dialog = null;
    }
    /**
     * Handle a session termination.
     */
    _onSessionDisposed() {
        if (this._session) {
            const oldValue = this._session;
            this._session = null;
            const newValue = this._session;
            this._sessionChanged.emit({ name: 'session', oldValue, newValue });
        }
    }
    /**
     * Handle a change to a session property.
     */
    _onPropertyChanged(sender, property) {
        switch (property) {
            case 'path':
                this._path = sender.path;
                break;
            case 'name':
                this._name = sender.name;
                break;
            case 'type':
                this._type = sender.type;
                break;
            default:
                throw new Error(`unrecognized property ${property}`);
        }
        this._propertyChanged.emit(property);
    }
    /**
     * Handle a change to the kernel.
     */
    _onKernelChanged(sender, args) {
        this._kernelChanged.emit(args);
    }
    /**
     * Handle a change to the session status.
     */
    _onStatusChanged(sender, status) {
        var _a;
        if (status === 'dead') {
            const model = (_a = sender.kernel) === null || _a === void 0 ? void 0 : _a.model;
            if (model === null || model === void 0 ? void 0 : model.reason) {
                const traceback = model.traceback || '';
                void this._displayKernelError(model.reason, traceback);
            }
        }
        // Set that this kernel is busy, if we haven't already
        // If we have already, and now we aren't busy, dispose
        // of the busy disposable.
        if (this._setBusy) {
            if (status === 'busy') {
                if (!this._busyDisposable) {
                    this._busyDisposable = this._setBusy();
                }
            }
            else {
                if (this._busyDisposable) {
                    this._busyDisposable.dispose();
                    this._busyDisposable = null;
                }
            }
        }
        // Proxy the signal
        this._statusChanged.emit(status);
    }
    /**
     * Handle a change to the session status.
     */
    _onConnectionStatusChanged(sender, status) {
        // Proxy the signal
        this._connectionStatusChanged.emit(status);
    }
    /**
     * Handle a change to the pending input.
     */
    _onPendingInput(sender, value) {
        // Set the signal value
        this._pendingInput = value;
    }
    /**
     * Handle an iopub message.
     */
    _onIopubMessage(sender, message) {
        if (message.header.msg_type === 'shutdown_reply') {
            this.session.kernel.removeInputGuard();
        }
        this._iopubMessage.emit(message);
    }
    /**
     * Handle an unhandled message.
     */
    _onUnhandledMessage(sender, message) {
        this._unhandledMessage.emit(message);
    }
}
/**
 * A namespace for `SessionContext` statics.
 */
(function (SessionContext) {
    /**
     * Get the default kernel name given select options.
     */
    function getDefaultKernel(options) {
        return Private.getDefaultKernel(options);
    }
    SessionContext.getDefaultKernel = getDefaultKernel;
})(SessionContext || (SessionContext = {}));
/**
 * The default implementation of the client session dialog provider.
 */
export const sessionContextDialogs = {
    /**
     * Select a kernel for the session.
     */
    async selectKernel(sessionContext, translator) {
        if (sessionContext.isDisposed) {
            return Promise.resolve();
        }
        translator = translator || nullTranslator;
        const trans = translator.load('jupyterlab');
        // If there is no existing kernel, offer the option
        // to keep no kernel.
        let label = trans.__('Cancel');
        if (sessionContext.hasNoKernel) {
            label = sessionContext.kernelDisplayName;
        }
        const buttons = [
            Dialog.cancelButton({ label }),
            Dialog.okButton({ label: trans.__('Select') })
        ];
        const dialog = new Dialog({
            title: trans.__('Select Kernel'),
            body: new Private.KernelSelector(sessionContext, translator),
            buttons
        });
        const result = await dialog.launch();
        if (sessionContext.isDisposed || !result.button.accept) {
            return;
        }
        const model = result.value;
        if (model === null && !sessionContext.hasNoKernel) {
            return sessionContext.shutdown();
        }
        if (model) {
            await sessionContext.changeKernel(model);
        }
    },
    /**
     * Restart the session.
     *
     * @returns A promise that resolves with whether the kernel has restarted.
     *
     * #### Notes
     * If there is a running kernel, present a dialog.
     * If there is no kernel, we start a kernel with the last run
     * kernel name and resolves with `true`.
     */
    async restart(sessionContext, translator) {
        var _a;
        translator = translator || nullTranslator;
        const trans = translator.load('jupyterlab');
        await sessionContext.initialize();
        if (sessionContext.isDisposed) {
            throw new Error('session already disposed');
        }
        const kernel = (_a = sessionContext.session) === null || _a === void 0 ? void 0 : _a.kernel;
        if (!kernel && sessionContext.prevKernelName) {
            await sessionContext.changeKernel({
                name: sessionContext.prevKernelName
            });
            return true;
        }
        // Bail if there is no previous kernel to start.
        if (!kernel) {
            throw new Error('No kernel to restart');
        }
        const restartBtn = Dialog.warnButton({ label: 'Restart' });
        const result = await showDialog({
            title: trans.__('Restart Kernel?'),
            body: trans.__('Do you want to restart the current kernel? All variables will be lost.'),
            buttons: [Dialog.cancelButton(), restartBtn]
        });
        if (kernel.isDisposed) {
            return false;
        }
        if (result.button.accept) {
            await sessionContext.restartKernel();
            return true;
        }
        return false;
    }
};
/**
 * The namespace for module private data.
 */
var Private;
(function (Private) {
    /**
     * A widget that provides a kernel selection.
     */
    class KernelSelector extends Widget {
        /**
         * Create a new kernel selector widget.
         */
        constructor(sessionContext, translator) {
            super({ node: createSelectorNode(sessionContext, translator) });
        }
        /**
         * Get the value of the kernel selector widget.
         */
        getValue() {
            const selector = this.node.querySelector('select');
            return JSON.parse(selector.value);
        }
    }
    Private.KernelSelector = KernelSelector;
    /**
     * Create a node for a kernel selector widget.
     */
    function createSelectorNode(sessionContext, translator) {
        // Create the dialog body.
        translator = translator || nullTranslator;
        const trans = translator.load('jupyterlab');
        const body = document.createElement('div');
        const text = document.createElement('label');
        text.textContent = `${trans.__('Select kernel for:')} "${sessionContext.name}"`;
        body.appendChild(text);
        const options = getKernelSearch(sessionContext);
        const selector = document.createElement('select');
        populateKernelSelect(selector, options, translator, !sessionContext.hasNoKernel ? sessionContext.kernelDisplayName : null);
        body.appendChild(selector);
        return body;
    }
    /**
     * Get the default kernel name given select options.
     */
    function getDefaultKernel(options) {
        var _a;
        const { specs, preference } = options;
        const { name, language, shouldStart, canStart, autoStartDefault } = preference;
        if (!specs || shouldStart === false || canStart === false) {
            return null;
        }
        const defaultName = autoStartDefault ? specs.default : null;
        if (!name && !language) {
            return defaultName;
        }
        // Look for an exact match of a spec name.
        for (const specName in specs.kernelspecs) {
            if (specName === name) {
                return name;
            }
        }
        // Bail if there is no language.
        if (!language) {
            return defaultName;
        }
        // Check for a single kernel matching the language.
        const matches = [];
        for (const specName in specs.kernelspecs) {
            const kernelLanguage = (_a = specs.kernelspecs[specName]) === null || _a === void 0 ? void 0 : _a.language;
            if (language === kernelLanguage) {
                matches.push(specName);
            }
        }
        if (matches.length === 1) {
            const specName = matches[0];
            console.warn('No exact match found for ' +
                specName +
                ', using kernel ' +
                specName +
                ' that matches ' +
                'language=' +
                language);
            return specName;
        }
        // No matches found.
        return defaultName;
    }
    Private.getDefaultKernel = getDefaultKernel;
    /**
     * Populate a kernel select node for the session.
     */
    function populateKernelSelect(node, options, translator, currentKernelDisplayName = null) {
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
        const { preference, sessions, specs } = options;
        const { name, id, language, canStart, shouldStart } = preference;
        translator = translator || nullTranslator;
        const trans = translator.load('jupyterlab');
        if (!specs || canStart === false) {
            node.appendChild(optionForNone(translator));
            node.value = 'null';
            node.disabled = true;
            return;
        }
        node.disabled = false;
        // Create mappings of display names and languages for kernel name.
        const displayNames = Object.create(null);
        const languages = Object.create(null);
        for (const name in specs.kernelspecs) {
            const spec = specs.kernelspecs[name];
            displayNames[name] = spec.display_name;
            languages[name] = spec.language;
        }
        // Handle a kernel by name.
        const names = [];
        if (name && name in specs.kernelspecs) {
            names.push(name);
        }
        // Then look by language.
        if (language) {
            for (const specName in specs.kernelspecs) {
                if (name !== specName && languages[specName] === language) {
                    names.push(specName);
                }
            }
        }
        // Use the default kernel if no kernels were found.
        if (!names.length) {
            names.push(specs.default);
        }
        // Handle a preferred kernels in order of display name.
        const preferred = document.createElement('optgroup');
        preferred.label = trans.__('Start Preferred Kernel');
        names.sort((a, b) => displayNames[a].localeCompare(displayNames[b]));
        for (const name of names) {
            preferred.appendChild(optionForName(name, displayNames[name]));
        }
        if (preferred.firstChild) {
            node.appendChild(preferred);
        }
        // Add an option for no kernel
        node.appendChild(optionForNone());
        const other = document.createElement('optgroup');
        other.label = trans.__('Start Other Kernel');
        // Add the rest of the kernel names in alphabetical order.
        const otherNames = [];
        for (const specName in specs.kernelspecs) {
            if (names.indexOf(specName) !== -1) {
                continue;
            }
            otherNames.push(specName);
        }
        otherNames.sort((a, b) => displayNames[a].localeCompare(displayNames[b]));
        for (const otherName of otherNames) {
            other.appendChild(optionForName(otherName, displayNames[otherName]));
        }
        // Add a separator option if there were any other names.
        if (otherNames.length) {
            node.appendChild(other);
        }
        // Handle the default value.
        if (shouldStart === false) {
            node.value = 'null';
        }
        else {
            let selectedIndex = 0;
            if (currentKernelDisplayName) {
                // Select current kernel by default.
                selectedIndex = [...node.options].findIndex(option => option.text === currentKernelDisplayName);
                selectedIndex = Math.max(selectedIndex, 0);
            }
            node.selectedIndex = selectedIndex;
        }
        // Bail if there are no sessions.
        if (!sessions) {
            return;
        }
        // Add the sessions using the preferred language first.
        const matchingSessions = [];
        const otherSessions = [];
        each(sessions, session => {
            var _a;
            if (language &&
                session.kernel &&
                languages[session.kernel.name] === language &&
                session.kernel.id !== id) {
                matchingSessions.push(session);
            }
            else if (((_a = session.kernel) === null || _a === void 0 ? void 0 : _a.id) !== id) {
                otherSessions.push(session);
            }
        });
        const matching = document.createElement('optgroup');
        matching.label = trans.__('Use Kernel from Preferred Session');
        node.appendChild(matching);
        if (matchingSessions.length) {
            matchingSessions.sort((a, b) => {
                return a.path.localeCompare(b.path);
            });
            each(matchingSessions, session => {
                const name = session.kernel ? displayNames[session.kernel.name] : '';
                matching.appendChild(optionForSession(session, name, translator));
            });
        }
        const otherSessionsNode = document.createElement('optgroup');
        otherSessionsNode.label = trans.__('Use Kernel from Other Session');
        node.appendChild(otherSessionsNode);
        if (otherSessions.length) {
            otherSessions.sort((a, b) => {
                return a.path.localeCompare(b.path);
            });
            each(otherSessions, session => {
                const name = session.kernel
                    ? displayNames[session.kernel.name] || session.kernel.name
                    : '';
                otherSessionsNode.appendChild(optionForSession(session, name, translator));
            });
        }
    }
    Private.populateKernelSelect = populateKernelSelect;
    /**
     * Get the kernel search options given a session context and session manager.
     */
    function getKernelSearch(sessionContext) {
        return {
            specs: sessionContext.specsManager.specs,
            sessions: sessionContext.sessionManager.running(),
            preference: sessionContext.kernelPreference
        };
    }
    /**
     * Create an option element for a kernel name.
     */
    function optionForName(name, displayName) {
        const option = document.createElement('option');
        option.text = displayName;
        option.value = JSON.stringify({ name });
        return option;
    }
    /**
     * Create an option for no kernel.
     */
    function optionForNone(translator) {
        translator = translator || nullTranslator;
        const trans = translator.load('jupyterlab');
        const group = document.createElement('optgroup');
        group.label = trans.__('Use No Kernel');
        const option = document.createElement('option');
        option.text = trans.__('No Kernel');
        option.value = 'null';
        group.appendChild(option);
        return group;
    }
    /**
     * Create an option element for a session.
     */
    function optionForSession(session, displayName, translator) {
        var _a, _b;
        translator = translator || nullTranslator;
        const trans = translator.load('jupyterlab');
        const option = document.createElement('option');
        const sessionName = session.name || PathExt.basename(session.path);
        option.text = sessionName;
        option.value = JSON.stringify({ id: (_a = session.kernel) === null || _a === void 0 ? void 0 : _a.id });
        option.title =
            `${trans.__('Path:')} ${session.path}\n` +
                `${trans.__('Name:')} ${sessionName}\n` +
                `${trans.__('Kernel Name:')} ${displayName}\n` +
                `${trans.__('Kernel Id:')} ${(_b = session.kernel) === null || _b === void 0 ? void 0 : _b.id}`;
        return option;
    }
})(Private || (Private = {}));
//# sourceMappingURL=sessioncontext.js.map