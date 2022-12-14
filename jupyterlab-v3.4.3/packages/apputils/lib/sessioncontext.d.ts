import { IChangedArgs } from '@jupyterlab/coreutils';
import { Kernel, KernelMessage, KernelSpec, Session } from '@jupyterlab/services';
import { ITranslator } from '@jupyterlab/translation';
import { IterableOrArrayLike } from '@lumino/algorithm';
import { IDisposable, IObservableDisposable } from '@lumino/disposable';
import { ISignal } from '@lumino/signaling';
/**
 * A context object to manage a widget's kernel session connection.
 *
 * #### Notes
 * The current session connection is `.session`, the current session's kernel
 * connection is `.session.kernel`. For convenience, we proxy several kernel
 * connection and session connection signals up to the session context so
 * that you do not have to manage slots as sessions and kernels change. For
 * example, to act on whatever the current kernel's iopubMessage signal is
 * producing, connect to the session context `.iopubMessage` signal.
 *
 */
export interface ISessionContext extends IObservableDisposable {
    /**
     * The current session connection.
     */
    session: Session.ISessionConnection | null;
    /**
     * Initialize the session context.
     *
     * @returns A promise that resolves with whether to ask the user to select a kernel.
     *
     * #### Notes
     * This includes starting up an initial kernel if needed.
     */
    initialize(): Promise<boolean>;
    /**
     * Whether the session context is ready.
     */
    readonly isReady: boolean;
    /**
     * Whether the session context is terminating.
     */
    readonly isTerminating: boolean;
    /**
     * Whether the session context is restarting.
     */
    readonly isRestarting: boolean;
    /**
     * A promise that is fulfilled when the session context is ready.
     */
    readonly ready: Promise<void>;
    /**
     * A signal emitted when the session connection changes.
     */
    readonly sessionChanged: ISignal<this, IChangedArgs<Session.ISessionConnection | null, Session.ISessionConnection | null, 'session'>>;
    /**
     * A signal emitted when the kernel changes, proxied from the session connection.
     */
    readonly kernelChanged: ISignal<this, IChangedArgs<Kernel.IKernelConnection | null, Kernel.IKernelConnection | null, 'kernel'>>;
    /**
     * A signal emitted when the kernel status changes, proxied from the session connection.
     */
    readonly statusChanged: ISignal<this, Kernel.Status>;
    /**
     * A signal emitted when the kernel connection status changes, proxied from the session connection.
     */
    readonly connectionStatusChanged: ISignal<this, Kernel.ConnectionStatus>;
    /**
     * A flag indicating if session is has pending input, proxied from the session connection.
     */
    readonly pendingInput: boolean;
    /**
     * A signal emitted for a kernel messages, proxied from the session connection.
     */
    readonly iopubMessage: ISignal<this, KernelMessage.IMessage>;
    /**
     * A signal emitted for an unhandled kernel message, proxied from the session connection.
     */
    readonly unhandledMessage: ISignal<this, KernelMessage.IMessage>;
    /**
     * A signal emitted when a session property changes, proxied from the session connection.
     */
    readonly propertyChanged: ISignal<this, 'path' | 'name' | 'type'>;
    /**
     * The kernel preference for starting new kernels.
     */
    kernelPreference: ISessionContext.IKernelPreference;
    /**
     * Whether the kernel is "No Kernel" or not.
     *
     * #### Notes
     * As the displayed name is translated, this can be used directly.
     */
    readonly hasNoKernel: boolean;
    /**
     * The sensible display name for the kernel, or translated "No Kernel"
     *
     * #### Notes
     * This is at this level since the underlying kernel connection does not
     * have access to the kernel spec manager.
     */
    readonly kernelDisplayName: string;
    /**
     * A sensible status to display
     *
     * #### Notes
     * This combines the status and connection status into a single status for the user.
     */
    readonly kernelDisplayStatus: ISessionContext.KernelDisplayStatus;
    /**
     * The session path.
     *
     * #### Notes
     * Typically `.session.path` should be used. This attribute is useful if
     * there is no current session.
     */
    readonly path: string;
    /**
     * The session type.
     *
     * #### Notes
     * Typically `.session.type` should be used. This attribute is useful if
     * there is no current session.
     */
    readonly type: string;
    /**
     * The session name.
     *
     * #### Notes
     * Typically `.session.name` should be used. This attribute is useful if
     * there is no current session.
     */
    readonly name: string;
    /**
     * The previous kernel name.
     */
    readonly prevKernelName: string;
    /**
     * The session manager used by the session.
     */
    readonly sessionManager: Session.IManager;
    /**
     * The kernel spec manager
     */
    readonly specsManager: KernelSpec.IManager;
    /**
     * Restart the current Kernel.
     *
     * @returns A promise that resolves when the kernel is restarted.
     */
    restartKernel(): Promise<void>;
    /**
     * Kill the kernel and shutdown the session.
     *
     * @returns A promise that resolves when the session is shut down.
     */
    shutdown(): Promise<void>;
    /**
     * Change the kernel associated with the session.
     *
     * @param options The optional kernel model parameters to use for the new kernel.
     *
     * @returns A promise that resolves with the new kernel connection.
     */
    changeKernel(options?: Partial<Kernel.IModel>): Promise<Kernel.IKernelConnection | null>;
}
/**
 * The namespace for session context related interfaces.
 */
export declare namespace ISessionContext {
    /**
     * A kernel preference.
     *
     * #### Notes
     * Preferences for a kernel are considered in the order `id`, `name`,
     * `language`. If no matching kernels can be found and `autoStartDefault` is
     * `true`, then the default kernel for the server is preferred.
     */
    interface IKernelPreference {
        /**
         * The name of the kernel.
         */
        readonly name?: string;
        /**
         * The preferred kernel language.
         */
        readonly language?: string;
        /**
         * The id of an existing kernel.
         */
        readonly id?: string;
        /**
         * A kernel should be started automatically (default `true`).
         */
        readonly shouldStart?: boolean;
        /**
         * A kernel can be started (default `true`).
         */
        readonly canStart?: boolean;
        /**
         * Shut down the session when session context is disposed (default `false`).
         */
        readonly shutdownOnDispose?: boolean;
        /**
         * Automatically start the default kernel if no other matching kernel is
         * found (default `true`).
         */
        readonly autoStartDefault?: boolean;
    }
    type KernelDisplayStatus = Kernel.Status | Kernel.ConnectionStatus | 'initializing' | '';
    /**
     * An interface for a session context dialog provider.
     */
    interface IDialogs {
        /**
         * Select a kernel for the session.
         */
        selectKernel(session: ISessionContext, translator?: ITranslator): Promise<void>;
        /**
         * Restart the session context.
         *
         * @returns A promise that resolves with whether the kernel has restarted.
         *
         * #### Notes
         * If there is a running kernel, present a dialog.
         * If there is no kernel, we start a kernel with the last run
         * kernel name and resolves with `true`. If no kernel has been started,
         * this is a no-op, and resolves with `false`.
         */
        restart(session: ISessionContext, translator?: ITranslator): Promise<boolean>;
    }
}
/**
 * The default implementation for a session context object.
 */
export declare class SessionContext implements ISessionContext {
    /**
     * Construct a new session context.
     */
    constructor(options: SessionContext.IOptions);
    /**
     * The current session connection.
     */
    get session(): Session.ISessionConnection | null;
    /**
     * The session path.
     *
     * #### Notes
     * Typically `.session.path` should be used. This attribute is useful if
     * there is no current session.
     */
    get path(): string;
    /**
     * The session type.
     *
     * #### Notes
     * Typically `.session.type` should be used. This attribute is useful if
     * there is no current session.
     */
    get type(): string;
    /**
     * The session name.
     *
     * #### Notes
     * Typically `.session.name` should be used. This attribute is useful if
     * there is no current session.
     */
    get name(): string;
    /**
     * A signal emitted when the kernel connection changes, proxied from the session connection.
     */
    get kernelChanged(): ISignal<this, Session.ISessionConnection.IKernelChangedArgs>;
    /**
     * A signal emitted when the session connection changes.
     */
    get sessionChanged(): ISignal<this, IChangedArgs<Session.ISessionConnection | null, Session.ISessionConnection | null, 'session'>>;
    /**
     * A signal emitted when the kernel status changes, proxied from the kernel.
     */
    get statusChanged(): ISignal<this, Kernel.Status>;
    /**
     * A flag indicating if the session has ending input, proxied from the kernel.
     */
    get pendingInput(): boolean;
    /**
     * A signal emitted when the kernel status changes, proxied from the kernel.
     */
    get connectionStatusChanged(): ISignal<this, Kernel.ConnectionStatus>;
    /**
     * A signal emitted for iopub kernel messages, proxied from the kernel.
     */
    get iopubMessage(): ISignal<this, KernelMessage.IIOPubMessage>;
    /**
     * A signal emitted for an unhandled kernel message, proxied from the kernel.
     */
    get unhandledMessage(): ISignal<this, KernelMessage.IMessage>;
    /**
     * A signal emitted when a session property changes, proxied from the current session.
     */
    get propertyChanged(): ISignal<this, 'path' | 'name' | 'type'>;
    /**
     * The kernel preference of this client session.
     *
     * This is used when selecting a new kernel, and should reflect the sort of
     * kernel the activity prefers.
     */
    get kernelPreference(): ISessionContext.IKernelPreference;
    set kernelPreference(value: ISessionContext.IKernelPreference);
    /**
     * Whether the context is ready.
     */
    get isReady(): boolean;
    /**
     * A promise that is fulfilled when the context is ready.
     */
    get ready(): Promise<void>;
    /**
     * Whether the context is terminating.
     */
    get isTerminating(): boolean;
    /**
     * Whether the context is restarting.
     */
    get isRestarting(): boolean;
    /**
     * The session manager used by the session.
     */
    readonly sessionManager: Session.IManager;
    /**
     * The kernel spec manager
     */
    readonly specsManager: KernelSpec.IManager;
    /**
     * Whether the kernel is "No Kernel" or not.
     *
     * #### Notes
     * As the displayed name is translated, this can be used directly.
     */
    get hasNoKernel(): boolean;
    /**
     * The display name of the current kernel, or a sensible alternative.
     *
     * #### Notes
     * This is a convenience function to have a consistent sensible name for the
     * kernel.
     */
    get kernelDisplayName(): string;
    /**
     * A sensible status to display
     *
     * #### Notes
     * This combines the status and connection status into a single status for
     * the user.
     */
    get kernelDisplayStatus(): ISessionContext.KernelDisplayStatus;
    /**
     * The name of the previously started kernel.
     */
    get prevKernelName(): string;
    /**
     * Test whether the context is disposed.
     */
    get isDisposed(): boolean;
    /**
     * A signal emitted when the poll is disposed.
     */
    get disposed(): ISignal<this, void>;
    /**
     * Get the constant displayed name for "No Kernel"
     */
    protected get noKernelName(): string;
    /**
     * Dispose of the resources held by the context.
     */
    dispose(): void;
    /**
     * Restart the current Kernel.
     *
     * @returns A promise that resolves when the kernel is restarted.
     */
    restartKernel(): Promise<void>;
    /**
     * Change the current kernel associated with the session.
     */
    changeKernel(options?: Partial<Kernel.IModel>): Promise<Kernel.IKernelConnection | null>;
    /**
     * Kill the kernel and shutdown the session.
     *
     * @returns A promise that resolves when the session is shut down.
     */
    shutdown(): Promise<void>;
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
    initialize(): Promise<boolean>;
    /**
     * Inner initialize function that doesn't handle promises.
     * This makes it easier to consolidate promise handling logic.
     */
    _initialize(): Promise<boolean>;
    /**
     * Shut down the current session.
     */
    private _shutdownSession;
    /**
     * Start the session if necessary.
     *
     * @returns Whether to ask the user to pick a kernel.
     */
    private _startIfNecessary;
    /**
     * Change the kernel.
     */
    private _changeKernel;
    /**
     * Handle a new session object.
     */
    private _handleNewSession;
    /**
     * Handle an error in session startup.
     */
    private _handleSessionError;
    /**
     * Display kernel error
     */
    private _displayKernelError;
    /**
     * Handle a session termination.
     */
    private _onSessionDisposed;
    /**
     * Handle a change to a session property.
     */
    private _onPropertyChanged;
    /**
     * Handle a change to the kernel.
     */
    private _onKernelChanged;
    /**
     * Handle a change to the session status.
     */
    private _onStatusChanged;
    /**
     * Handle a change to the session status.
     */
    private _onConnectionStatusChanged;
    /**
     * Handle a change to the pending input.
     */
    private _onPendingInput;
    /**
     * Handle an iopub message.
     */
    private _onIopubMessage;
    /**
     * Handle an unhandled message.
     */
    private _onUnhandledMessage;
    private _path;
    private _name;
    private _type;
    private _prevKernelName;
    private _kernelPreference;
    private _isDisposed;
    private _disposed;
    private _session;
    private _ready;
    private _initializing;
    private _initStarted;
    private _initPromise;
    private _isReady;
    private _isTerminating;
    private _isRestarting;
    private _kernelChanged;
    private _sessionChanged;
    private _statusChanged;
    private _connectionStatusChanged;
    private translator;
    private _trans;
    private _pendingInput;
    private _iopubMessage;
    private _unhandledMessage;
    private _propertyChanged;
    private _dialog;
    private _setBusy;
    private _busyDisposable;
    private _pendingKernelName;
    private _pendingSessionRequest;
}
/**
 * A namespace for `SessionContext` statics.
 */
export declare namespace SessionContext {
    /**
     * The options used to initialize a context.
     */
    interface IOptions {
        /**
         * A session manager instance.
         */
        sessionManager: Session.IManager;
        /**
         * A kernel spec manager instance.
         */
        specsManager: KernelSpec.IManager;
        /**
         * The initial path of the file.
         */
        path?: string;
        /**
         * The name of the session.
         */
        name?: string;
        /**
         * The type of the session.
         */
        type?: string;
        /**
         * A kernel preference.
         */
        kernelPreference?: ISessionContext.IKernelPreference;
        /**
         * The application language translator.
         */
        translator?: ITranslator;
        /**
         * A function to call when the session becomes busy.
         */
        setBusy?: () => IDisposable;
    }
    /**
     * An interface for populating a kernel selector.
     */
    interface IKernelSearch {
        /**
         * The Kernel specs.
         */
        specs: KernelSpec.ISpecModels | null;
        /**
         * The kernel preference.
         */
        preference: ISessionContext.IKernelPreference;
        /**
         * The current running sessions.
         */
        sessions?: IterableOrArrayLike<Session.IModel>;
    }
    /**
     * Get the default kernel name given select options.
     */
    function getDefaultKernel(options: IKernelSearch): string | null;
}
/**
 * The default implementation of the client session dialog provider.
 */
export declare const sessionContextDialogs: ISessionContext.IDialogs;
