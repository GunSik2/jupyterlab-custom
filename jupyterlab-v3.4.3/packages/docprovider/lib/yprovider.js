/* -----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
import { PromiseDelegate } from '@lumino/coreutils';
import * as decoding from 'lib0/decoding';
import * as encoding from 'lib0/encoding';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import { getAnonymousUserName, getRandomColor } from './awareness';
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
export class WebSocketProviderWithLocks extends WebsocketProvider {
    /**
     * Construct a new WebSocketProviderWithLocks
     *
     * @param options The instantiation options for a WebSocketProviderWithLocks
     */
    constructor(options) {
        var _a, _b, _c;
        super(options.url, options.contentType + ':' + options.path, options.ymodel.ydoc, {
            awareness: options.ymodel.awareness
        });
        this._currentLockRequest = null;
        this._initialContentRequest = null;
        this._path = options.path;
        this._contentType = options.contentType;
        this._serverUrl = options.url;
        const searchParams = new URL(options.url).searchParams;
        const color = (_a = '#' + searchParams.get('usercolor')) !== null && _a !== void 0 ? _a : getRandomColor().slice(1);
        const name = (_b = searchParams.get('username')) !== null && _b !== void 0 ? _b : getAnonymousUserName();
        const awareness = options.ymodel.awareness;
        const currState = awareness.getLocalState();
        // only set if this was not already set by another plugin
        if (currState && ((_c = currState.user) === null || _c === void 0 ? void 0 : _c.name) == null) {
            options.ymodel.awareness.setLocalStateField('user', {
                name,
                color
            });
        }
        // Message handler that confirms when a lock has been acquired
        this.messageHandlers[127] = (encoder, decoder, provider, emitSynced, messageType) => {
            // acquired lock
            const timestamp = decoding.readUint32(decoder);
            const lockRequest = this._currentLockRequest;
            this._currentLockRequest = null;
            if (lockRequest) {
                lockRequest.resolve(timestamp);
            }
        };
        // Message handler that receives the initial content
        this.messageHandlers[125] = (encoder, decoder, provider, emitSynced, messageType) => {
            // received initial content
            const initialContent = decoding.readTailAsUint8Array(decoder);
            // Apply data from server
            if (initialContent.byteLength > 0) {
                Y.applyUpdate(this.doc, initialContent);
            }
            const initialContentRequest = this._initialContentRequest;
            this._initialContentRequest = null;
            if (initialContentRequest) {
                initialContentRequest.resolve(initialContent.byteLength > 0);
            }
        };
        this._isInitialized = false;
        this._onConnectionStatus = this._onConnectionStatus.bind(this);
        this.on('status', this._onConnectionStatus);
    }
    setPath(newPath) {
        if (newPath !== this._path) {
            this._path = newPath;
            const encoder = encoding.createEncoder();
            encoding.write(encoder, 123);
            // writing a utf8 string to the encoder
            const escapedPath = unescape(encodeURIComponent(this._contentType + ':' + newPath));
            for (let i = 0; i < escapedPath.length; i++) {
                encoding.write(encoder, 
                /** @type {number} */ escapedPath.codePointAt(i));
            }
            this._sendMessage(encoding.toUint8Array(encoder));
            // prevent publishing messages to the old channel id.
            this.disconnectBc();
            // The next time the provider connects, we should connect through a different server url
            this.bcChannel =
                this._serverUrl + '/' + this._contentType + ':' + this._path;
            this.url = this.bcChannel;
            this.connectBc();
        }
    }
    /**
     * Resolves to true if the initial content has been initialized on the server. false otherwise.
     */
    requestInitialContent() {
        if (this._initialContentRequest) {
            return this._initialContentRequest.promise;
        }
        this._initialContentRequest = new PromiseDelegate();
        this._sendMessage(new Uint8Array([125]));
        // Resolve with true if the server doesn't respond for some reason.
        // In case of a connection problem, we don't want the user to re-initialize the window.
        // Instead wait for y-websocket to connect to the server.
        // @todo maybe we should reload instead..
        setTimeout(() => { var _a; return (_a = this._initialContentRequest) === null || _a === void 0 ? void 0 : _a.resolve(false); }, 1000);
        return this._initialContentRequest.promise;
    }
    /**
     * Put the initialized state.
     */
    putInitializedState() {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, 124);
        encoding.writeUint8Array(encoder, Y.encodeStateAsUpdate(this.doc));
        this._sendMessage(encoding.toUint8Array(encoder));
        this._isInitialized = true;
    }
    /**
     * Acquire a lock.
     * Returns a Promise that resolves to the lock number.
     */
    acquireLock() {
        if (this._currentLockRequest) {
            return this._currentLockRequest.promise;
        }
        this._sendMessage(new Uint8Array([127]));
        // try to acquire lock in regular interval
        if (this._requestLockInterval) {
            clearInterval(this._requestLockInterval);
        }
        this._requestLockInterval = setInterval(() => {
            if (this.wsconnected) {
                // try to acquire lock
                this._sendMessage(new Uint8Array([127]));
            }
        }, 500);
        let resolve, reject;
        const promise = new Promise((_resolve, _reject) => {
            resolve = _resolve;
            reject = _reject;
        });
        this._currentLockRequest = { promise, resolve, reject };
        return promise;
    }
    /**
     * Release a lock.
     *
     * @param lock The lock to release.
     */
    releaseLock(lock) {
        const encoder = encoding.createEncoder();
        // reply with release lock
        encoding.writeVarUint(encoder, 126);
        encoding.writeUint32(encoder, lock);
        // releasing lock
        this._sendMessage(encoding.toUint8Array(encoder));
        if (this._requestLockInterval) {
            clearInterval(this._requestLockInterval);
        }
    }
    /**
     * Send a new message to WebSocket server.
     *
     * @param message The message to send
     */
    _sendMessage(message) {
        // send once connected
        const send = () => {
            setTimeout(() => {
                if (this.wsconnected) {
                    this.ws.send(message);
                }
                else {
                    this.once('status', send);
                }
            }, 0);
        };
        send();
    }
    /**
     * Handle a change to the connection status.
     *
     * @param status The connection status.
     */
    async _onConnectionStatus(status) {
        if (this._isInitialized && status.status === 'connected') {
            const lock = await this.acquireLock();
            const contentIsInitialized = await this.requestInitialContent();
            if (!contentIsInitialized) {
                this.putInitializedState();
            }
            this.releaseLock(lock);
        }
    }
}
//# sourceMappingURL=yprovider.js.map