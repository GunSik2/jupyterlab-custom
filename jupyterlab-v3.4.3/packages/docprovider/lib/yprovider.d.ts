import { WebsocketProvider } from 'y-websocket';
import { IDocumentProvider, IDocumentProviderFactory } from './tokens';
/**
 * A class to provide Yjs synchronization over WebSocket.
 *
 * The user can specify their own user-name and user-color by adding url parameters:
 *   ?username=Alice&usercolor=007007
 * where usercolor must be a six-digit hexadecimal encoded RGB value without the hash token.
 *
 * We specify custom messages that the server can interpret. For reference please look in yjs_ws_server.
 *
 */
export declare class WebSocketProviderWithLocks extends WebsocketProvider implements IDocumentProvider {
    /**
     * Construct a new WebSocketProviderWithLocks
     *
     * @param options The instantiation options for a WebSocketProviderWithLocks
     */
    constructor(options: WebSocketProviderWithLocks.IOptions);
    setPath(newPath: string): void;
    /**
     * Resolves to true if the initial content has been initialized on the server. false otherwise.
     */
    requestInitialContent(): Promise<boolean>;
    /**
     * Put the initialized state.
     */
    putInitializedState(): void;
    /**
     * Acquire a lock.
     * Returns a Promise that resolves to the lock number.
     */
    acquireLock(): Promise<number>;
    /**
     * Release a lock.
     *
     * @param lock The lock to release.
     */
    releaseLock(lock: number): void;
    /**
     * Send a new message to WebSocket server.
     *
     * @param message The message to send
     */
    private _sendMessage;
    /**
     * Handle a change to the connection status.
     *
     * @param status The connection status.
     */
    private _onConnectionStatus;
    private _path;
    private _contentType;
    private _serverUrl;
    private _isInitialized;
    private _requestLockInterval;
    private _currentLockRequest;
    private _initialContentRequest;
}
/**
 * A namespace for WebSocketProviderWithLocks statics.
 */
export declare namespace WebSocketProviderWithLocks {
    /**
     * The instantiation options for a WebSocketProviderWithLocks.
     */
    interface IOptions extends IDocumentProviderFactory.IOptions {
        /**
         * The server URL
         */
        url: string;
    }
}
