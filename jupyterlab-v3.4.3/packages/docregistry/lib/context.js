// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { Dialog, SessionContext, sessionContextDialogs, showDialog, showErrorMessage } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { ProviderMock } from '@jupyterlab/docprovider';
import { RenderMimeRegistry } from '@jupyterlab/rendermime';
import { nullTranslator } from '@jupyterlab/translation';
import { PromiseDelegate } from '@lumino/coreutils';
import { DisposableDelegate } from '@lumino/disposable';
import { Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
/**
 * An implementation of a document context.
 *
 * This class is typically instantiated by the document manager.
 */
export class Context {
    /**
     * Construct a new document context.
     */
    constructor(options) {
        this._path = '';
        this._lineEnding = null;
        this._contentsModel = null;
        this._populatedPromise = new PromiseDelegate();
        this._isPopulated = false;
        this._isReady = false;
        this._isDisposed = false;
        this._pathChanged = new Signal(this);
        this._fileChanged = new Signal(this);
        this._saveState = new Signal(this);
        this._disposed = new Signal(this);
        this._lastModifiedCheckMargin = 500;
        this._timeConflictModalIsOpen = false;
        const manager = (this._manager = options.manager);
        this.translator = options.translator || nullTranslator;
        this._trans = this.translator.load('jupyterlab');
        this._factory = options.factory;
        this._dialogs = options.sessionDialogs || sessionContextDialogs;
        this._opener = options.opener || Private.noOp;
        this._path = this._manager.contents.normalize(options.path);
        this._lastModifiedCheckMargin = options.lastModifiedCheckMargin || 500;
        const localPath = this._manager.contents.localPath(this._path);
        const lang = this._factory.preferredLanguage(PathExt.basename(localPath));
        const dbFactory = options.modelDBFactory;
        if (dbFactory) {
            const localPath = manager.contents.localPath(this._path);
            this._modelDB = dbFactory.createNew(localPath);
            this._model = this._factory.createNew(lang, this._modelDB, false);
        }
        else {
            this._model = this._factory.createNew(lang, undefined, false);
        }
        const ymodel = this._model.sharedModel; // translate to the concrete Yjs implementation
        const ydoc = ymodel.ydoc;
        this._ydoc = ydoc;
        this._ycontext = ydoc.getMap('context');
        const docProviderFactory = options.docProviderFactory;
        this._provider = docProviderFactory
            ? docProviderFactory({
                path: this._path,
                contentType: this._factory.contentType,
                ymodel
            })
            : new ProviderMock();
        this._readyPromise = manager.ready.then(() => {
            return this._populatedPromise.promise;
        });
        const ext = PathExt.extname(this._path);
        this.sessionContext = new SessionContext({
            sessionManager: manager.sessions,
            specsManager: manager.kernelspecs,
            path: this._path,
            type: ext === '.ipynb' ? 'notebook' : 'file',
            name: PathExt.basename(localPath),
            kernelPreference: options.kernelPreference || { shouldStart: false },
            setBusy: options.setBusy
        });
        this.sessionContext.propertyChanged.connect(this._onSessionChanged, this);
        manager.contents.fileChanged.connect(this._onFileChanged, this);
        const urlResolver = (this.urlResolver = new RenderMimeRegistry.UrlResolver({
            path: this._path,
            contents: manager.contents
        }));
        this._ycontext.set('path', this._path);
        this._ycontext.observe(event => {
            var _a;
            const pathChanged = event.changes.keys.get('path');
            if (pathChanged) {
                const newPath = this._ycontext.get('path');
                if (newPath && newPath !== pathChanged.oldValue) {
                    urlResolver.path = newPath;
                    this._path = newPath;
                    this._provider.setPath(newPath);
                    this._pathChanged.emit(this.path);
                    (_a = this.sessionContext.session) === null || _a === void 0 ? void 0 : _a.setPath(newPath);
                }
            }
        });
    }
    /**
     * A signal emitted when the path changes.
     */
    get pathChanged() {
        return this._pathChanged;
    }
    /**
     * A signal emitted when the model is saved or reverted.
     */
    get fileChanged() {
        return this._fileChanged;
    }
    /**
     * A signal emitted on the start and end of a saving operation.
     */
    get saveState() {
        return this._saveState;
    }
    /**
     * A signal emitted when the context is disposed.
     */
    get disposed() {
        return this._disposed;
    }
    /**
     * Configurable margin used to detect document modification conflicts, in milliseconds
     */
    get lastModifiedCheckMargin() {
        return this._lastModifiedCheckMargin;
    }
    set lastModifiedCheckMargin(value) {
        this._lastModifiedCheckMargin = value;
    }
    /**
     * Get the model associated with the document.
     */
    get model() {
        return this._model;
    }
    /**
     * The current path associated with the document.
     */
    get path() {
        return this._path;
    }
    /**
     * The current local path associated with the document.
     * If the document is in the default notebook file browser,
     * this is the same as the path.
     */
    get localPath() {
        return this._manager.contents.localPath(this._path);
    }
    /**
     * The current contents model associated with the document.
     *
     * #### Notes
     * The contents model will be null until the context is populated.
     * It will have an  empty `contents` field.
     */
    get contentsModel() {
        return this._contentsModel;
    }
    /**
     * Get the model factory name.
     *
     * #### Notes
     * This is not part of the `IContext` API.
     */
    get factoryName() {
        return this.isDisposed ? '' : this._factory.name;
    }
    /**
     * Test whether the context is disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Dispose of the resources held by the context.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._isDisposed = true;
        this.sessionContext.dispose();
        if (this._modelDB) {
            this._modelDB.dispose();
        }
        this._model.dispose();
        this._provider.destroy();
        this._model.sharedModel.dispose();
        this._ydoc.destroy();
        this._disposed.emit(void 0);
        Signal.clearData(this);
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
        return this._readyPromise;
    }
    /**
     * Initialize the context.
     *
     * @param isNew - Whether it is a new file.
     *
     * @returns a promise that resolves upon initialization.
     */
    async initialize(isNew) {
        const lock = await this._provider.acquireLock();
        const contentIsInitialized = await this._provider.requestInitialContent();
        let promise;
        if (isNew || contentIsInitialized) {
            promise = this._save();
        }
        else {
            promise = this._revert();
        }
        // make sure that the lock is released after the above operations are completed.
        const finally_ = () => {
            this._provider.releaseLock(lock);
        };
        // if save/revert completed successfully, we set the initialized content in the rtc server.
        promise
            .then(() => {
            this._provider.putInitializedState();
            this._model.initialize();
        })
            .then(finally_, finally_);
        return promise;
    }
    /**
     * Rename the document.
     *
     * @param newName - the new name for the document.
     */
    rename(newName) {
        return this.ready.then(() => {
            return this._manager.ready.then(() => {
                return this._rename(newName);
            });
        });
    }
    /**
     * Save the document contents to disk.
     */
    async save() {
        const [lock] = await Promise.all([
            this._provider.acquireLock(),
            this.ready
        ]);
        let promise;
        promise = this._save();
        // if save completed successfully, we set the initialized content in the rtc server.
        promise = promise.then(() => {
            this._provider.putInitializedState();
        });
        const finally_ = () => {
            this._provider.releaseLock(lock);
        };
        promise.then(finally_, finally_);
        return await promise;
    }
    /**
     * Save the document to a different path chosen by the user.
     */
    saveAs() {
        return this.ready
            .then(() => {
            return Private.getSavePath(this._path);
        })
            .then(newPath => {
            if (this.isDisposed || !newPath) {
                return;
            }
            if (newPath === this._path) {
                return this.save();
            }
            // Make sure the path does not exist.
            return this._manager.ready
                .then(() => {
                return this._manager.contents.get(newPath);
            })
                .then(() => {
                return this._maybeOverWrite(newPath);
            })
                .catch(err => {
                if (!err.response || err.response.status !== 404) {
                    throw err;
                }
                return this._finishSaveAs(newPath);
            });
        });
    }
    /**
     * Download a file.
     *
     * @param path - The path of the file to be downloaded.
     *
     * @returns A promise which resolves when the file has begun
     *   downloading.
     */
    async download() {
        const url = await this._manager.contents.getDownloadUrl(this._path);
        const element = document.createElement('a');
        element.href = url;
        element.download = '';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        return void 0;
    }
    /**
     * Revert the document contents to disk contents.
     */
    async revert() {
        const [lock] = await Promise.all([
            this._provider.acquireLock(),
            this.ready
        ]);
        const promise = this._revert();
        const finally_ = () => {
            this._provider.releaseLock(lock);
        };
        promise.then(finally_, finally_);
        return await promise;
    }
    /**
     * Create a checkpoint for the file.
     */
    createCheckpoint() {
        const contents = this._manager.contents;
        return this._manager.ready.then(() => {
            return contents.createCheckpoint(this._path);
        });
    }
    /**
     * Delete a checkpoint for the file.
     */
    deleteCheckpoint(checkpointId) {
        const contents = this._manager.contents;
        return this._manager.ready.then(() => {
            return contents.deleteCheckpoint(this._path, checkpointId);
        });
    }
    /**
     * Restore the file to a known checkpoint state.
     */
    restoreCheckpoint(checkpointId) {
        const contents = this._manager.contents;
        const path = this._path;
        return this._manager.ready.then(() => {
            if (checkpointId) {
                return contents.restoreCheckpoint(path, checkpointId);
            }
            return this.listCheckpoints().then(checkpoints => {
                if (this.isDisposed || !checkpoints.length) {
                    return;
                }
                checkpointId = checkpoints[checkpoints.length - 1].id;
                return contents.restoreCheckpoint(path, checkpointId);
            });
        });
    }
    /**
     * List available checkpoints for a file.
     */
    listCheckpoints() {
        const contents = this._manager.contents;
        return this._manager.ready.then(() => {
            return contents.listCheckpoints(this._path);
        });
    }
    /**
     * Add a sibling widget to the document manager.
     *
     * @param widget - The widget to add to the document manager.
     *
     * @param options - The desired options for adding the sibling.
     *
     * @returns A disposable used to remove the sibling if desired.
     *
     * #### Notes
     * It is assumed that the widget has the same model and context
     * as the original widget.
     */
    addSibling(widget, options = {}) {
        const opener = this._opener;
        if (opener) {
            opener(widget, options);
        }
        return new DisposableDelegate(() => {
            widget.close();
        });
    }
    /**
     * Handle a change on the contents manager.
     */
    _onFileChanged(sender, change) {
        var _a, _b, _c;
        if (change.type !== 'rename') {
            return;
        }
        let oldPath = change.oldValue && change.oldValue.path;
        let newPath = change.newValue && change.newValue.path;
        if (newPath && this._path.indexOf(oldPath || '') === 0) {
            let changeModel = change.newValue;
            // When folder name changed, `oldPath` is `foo`, `newPath` is `bar` and `this._path` is `foo/test`,
            // we should update `foo/test` to `bar/test` as well
            if (oldPath !== this._path) {
                newPath = this._path.replace(new RegExp(`^${oldPath}/`), `${newPath}/`);
                oldPath = this._path;
                // Update client file model from folder change
                changeModel = {
                    last_modified: (_a = change.newValue) === null || _a === void 0 ? void 0 : _a.created,
                    path: newPath
                };
            }
            this._path = newPath;
            void ((_b = this.sessionContext.session) === null || _b === void 0 ? void 0 : _b.setPath(newPath));
            const updateModel = Object.assign(Object.assign({}, this._contentsModel), changeModel);
            const localPath = this._manager.contents.localPath(newPath);
            void ((_c = this.sessionContext.session) === null || _c === void 0 ? void 0 : _c.setName(PathExt.basename(localPath)));
            this._updateContentsModel(updateModel);
            this._ycontext.set('path', this._path);
        }
    }
    /**
     * Handle a change to a session property.
     */
    _onSessionChanged(sender, type) {
        if (type !== 'path') {
            return;
        }
        const path = this.sessionContext.session.path;
        if (path !== this._path) {
            this._path = path;
            this._ycontext.set('path', this._path);
        }
    }
    /**
     * Update our contents model, without the content.
     */
    _updateContentsModel(model) {
        const newModel = {
            path: model.path,
            name: model.name,
            type: model.type,
            content: undefined,
            writable: model.writable,
            created: model.created,
            last_modified: model.last_modified,
            mimetype: model.mimetype,
            format: model.format
        };
        const mod = this._contentsModel ? this._contentsModel.last_modified : null;
        this._contentsModel = newModel;
        this._ycontext.set('last_modified', newModel.last_modified);
        if (!mod || newModel.last_modified !== mod) {
            this._fileChanged.emit(newModel);
        }
    }
    /**
     * Handle an initial population.
     */
    _populate() {
        this._isPopulated = true;
        this._isReady = true;
        this._populatedPromise.resolve(void 0);
        // Add a checkpoint if none exists and the file is writable.
        return this._maybeCheckpoint(false).then(() => {
            if (this.isDisposed) {
                return;
            }
            // Update the kernel preference.
            const name = this._model.defaultKernelName ||
                this.sessionContext.kernelPreference.name;
            this.sessionContext.kernelPreference = Object.assign(Object.assign({}, this.sessionContext.kernelPreference), { name, language: this._model.defaultKernelLanguage });
            // Note: we don't wait on the session to initialize
            // so that the user can be shown the content before
            // any kernel has started.
            void this.sessionContext.initialize().then(shouldSelect => {
                if (shouldSelect) {
                    void this._dialogs.selectKernel(this.sessionContext, this.translator);
                }
            });
        });
    }
    /**
     * Rename the document.
     *
     * @param newName - the new name for the document.
     */
    async _rename(newName) {
        var _a, _b;
        const splitPath = this.path.split('/');
        splitPath[splitPath.length - 1] = newName;
        const newPath = splitPath.join('/');
        await this._manager.contents.rename(this.path, newPath);
        await ((_a = this.sessionContext.session) === null || _a === void 0 ? void 0 : _a.setPath(newPath));
        await ((_b = this.sessionContext.session) === null || _b === void 0 ? void 0 : _b.setName(newName));
        this._path = newPath;
        this._ycontext.set('path', this._path);
    }
    /**
     * Save the document contents to disk.
     */
    async _save() {
        this._saveState.emit('started');
        const model = this._model;
        let content;
        if (this._factory.fileFormat === 'json') {
            content = model.toJSON();
        }
        else {
            content = model.toString();
            if (this._lineEnding) {
                content = content.replace(/\n/g, this._lineEnding);
            }
        }
        const options = {
            type: this._factory.contentType,
            format: this._factory.fileFormat,
            content
        };
        try {
            let value;
            await this._manager.ready;
            if (!model.modelDB.isCollaborative) {
                value = await this._maybeSave(options);
            }
            else {
                value = await this._manager.contents.save(this._path, options);
            }
            if (this.isDisposed) {
                return;
            }
            model.dirty = false;
            this._updateContentsModel(value);
            if (!this._isPopulated) {
                await this._populate();
            }
            // Emit completion.
            this._saveState.emit('completed');
        }
        catch (err) {
            // If the save has been canceled by the user,
            // throw the error so that whoever called save()
            // can decide what to do.
            if (err.message === 'Cancel' ||
                err.message === 'Modal is already displayed') {
                throw err;
            }
            // Otherwise show an error message and throw the error.
            const localPath = this._manager.contents.localPath(this._path);
            const name = PathExt.basename(localPath);
            void this._handleError(err, this._trans.__('File Save Error for %1', name));
            // Emit failure.
            this._saveState.emit('failed');
            throw err;
        }
    }
    /**
     * Revert the document contents to disk contents.
     *
     * @param initializeModel - call the model's initialization function after
     * deserializing the content.
     */
    _revert(initializeModel = false) {
        const opts = Object.assign({ type: this._factory.contentType, content: this._factory.fileFormat !== null }, (this._factory.fileFormat !== null
            ? { format: this._factory.fileFormat }
            : {}));
        const path = this._path;
        const model = this._model;
        return this._manager.ready
            .then(() => {
            return this._manager.contents.get(path, opts);
        })
            .then(contents => {
            if (this.isDisposed) {
                return;
            }
            if (contents.format === 'json') {
                model.fromJSON(contents.content);
                if (initializeModel) {
                    model.initialize();
                }
            }
            else {
                let content = contents.content;
                // Convert line endings if necessary, marking the file
                // as dirty.
                if (content.indexOf('\r\n') !== -1) {
                    this._lineEnding = '\r\n';
                    content = content.replace(/\r\n/g, '\n');
                }
                else if (content.indexOf('\r') !== -1) {
                    this._lineEnding = '\r';
                    content = content.replace(/\r/g, '\n');
                }
                else {
                    this._lineEnding = null;
                }
                model.fromString(content);
                if (initializeModel) {
                    model.initialize();
                }
            }
            this._updateContentsModel(contents);
            model.dirty = false;
            if (!this._isPopulated) {
                return this._populate();
            }
        })
            .catch(async (err) => {
            const localPath = this._manager.contents.localPath(this._path);
            const name = PathExt.basename(localPath);
            void this._handleError(err, this._trans.__('File Load Error for %1', name));
            throw err;
        });
    }
    /**
     * Save a file, dealing with conflicts.
     */
    _maybeSave(options) {
        const path = this._path;
        // Make sure the file has not changed on disk.
        const promise = this._manager.contents.get(path, { content: false });
        return promise.then(model => {
            var _a;
            if (this.isDisposed) {
                return Promise.reject(new Error('Disposed'));
            }
            // We want to check last_modified (disk) > last_modified (client)
            // (our last save)
            // In some cases the filesystem reports an inconsistent time, so we allow buffer when comparing.
            const lastModifiedCheckMargin = this._lastModifiedCheckMargin;
            const ycontextModified = this._ycontext.get('last_modified');
            // prefer using the timestamp from ycontext because it is more up to date
            const modified = ycontextModified || ((_a = this.contentsModel) === null || _a === void 0 ? void 0 : _a.last_modified);
            const tClient = modified ? new Date(modified) : new Date();
            const tDisk = new Date(model.last_modified);
            if (modified &&
                tDisk.getTime() - tClient.getTime() > lastModifiedCheckMargin) {
                return this._timeConflict(tClient, model, options);
            }
            return this._manager.contents.save(path, options);
        }, err => {
            if (err.response && err.response.status === 404) {
                return this._manager.contents.save(path, options);
            }
            throw err;
        });
    }
    /**
     * Handle a save/load error with a dialog.
     */
    async _handleError(err, title) {
        await showErrorMessage(title, err);
        return;
    }
    /**
     * Add a checkpoint the file is writable.
     */
    _maybeCheckpoint(force) {
        let writable = this._contentsModel && this._contentsModel.writable;
        let promise = Promise.resolve(void 0);
        if (!writable) {
            return promise;
        }
        if (force) {
            promise = this.createCheckpoint().then( /* no-op */);
        }
        else {
            promise = this.listCheckpoints().then(checkpoints => {
                writable = this._contentsModel && this._contentsModel.writable;
                if (!this.isDisposed && !checkpoints.length && writable) {
                    return this.createCheckpoint().then( /* no-op */);
                }
            });
        }
        return promise.catch(err => {
            // Handle a read-only folder.
            if (!err.response || err.response.status !== 403) {
                throw err;
            }
        });
    }
    /**
     * Handle a time conflict.
     */
    _timeConflict(tClient, model, options) {
        const tDisk = new Date(model.last_modified);
        console.warn(`Last saving performed ${tClient} ` +
            `while the current file seems to have been saved ` +
            `${tDisk}`);
        if (this._timeConflictModalIsOpen) {
            return Promise.reject(new Error('Modal is already displayed'));
        }
        const body = this._trans.__(`"%1" has changed on disk since the last time it was opened or saved.
Do you want to overwrite the file on disk with the version open here,
or load the version on disk (revert)?`, this.path);
        const revertBtn = Dialog.okButton({ label: this._trans.__('Revert') });
        const overwriteBtn = Dialog.warnButton({
            label: this._trans.__('Overwrite')
        });
        this._timeConflictModalIsOpen = true;
        return showDialog({
            title: this._trans.__('File Changed'),
            body,
            buttons: [Dialog.cancelButton(), revertBtn, overwriteBtn]
        }).then(result => {
            this._timeConflictModalIsOpen = false;
            if (this.isDisposed) {
                return Promise.reject(new Error('Disposed'));
            }
            if (result.button.label === this._trans.__('Overwrite')) {
                return this._manager.contents.save(this._path, options);
            }
            // FIXME-TRANS: Why compare to label?
            if (result.button.label === this._trans.__('Revert')) {
                return this.revert().then(() => {
                    return model;
                });
            }
            return Promise.reject(new Error('Cancel')); // Otherwise cancel the save.
        });
    }
    /**
     * Handle a time conflict.
     */
    _maybeOverWrite(path) {
        const body = this._trans.__('"%1" already exists. Do you want to replace it?', path);
        const overwriteBtn = Dialog.warnButton({
            label: this._trans.__('Overwrite')
        });
        return showDialog({
            title: this._trans.__('File Overwrite?'),
            body,
            buttons: [Dialog.cancelButton(), overwriteBtn]
        }).then(result => {
            if (this.isDisposed) {
                return Promise.reject(new Error('Disposed'));
            }
            // FIXME-TRANS: Why compare to label?
            if (result.button.label === this._trans.__('Overwrite')) {
                return this._manager.contents.delete(path).then(() => {
                    return this._finishSaveAs(path);
                });
            }
        });
    }
    /**
     * Finish a saveAs operation given a new path.
     */
    async _finishSaveAs(newPath) {
        var _a, _b;
        this._path = newPath;
        await ((_a = this.sessionContext.session) === null || _a === void 0 ? void 0 : _a.setPath(newPath));
        await ((_b = this.sessionContext.session) === null || _b === void 0 ? void 0 : _b.setName(newPath.split('/').pop()));
        await this.save();
        this._ycontext.set('path', this._path);
        await this._maybeCheckpoint(true);
    }
}
/**
 * A namespace for private data.
 */
var Private;
(function (Private) {
    /**
     * Get a new file path from the user.
     */
    function getSavePath(path, translator) {
        translator = translator || nullTranslator;
        const trans = translator.load('jupyterlab');
        const saveBtn = Dialog.okButton({ label: trans.__('Save') });
        return showDialog({
            title: trans.__('Save File As..'),
            body: new SaveWidget(path),
            buttons: [Dialog.cancelButton(), saveBtn]
        }).then(result => {
            var _a;
            // FIXME-TRANS: Why use the label?
            if (result.button.label === trans.__('Save')) {
                return (_a = result.value) !== null && _a !== void 0 ? _a : undefined;
            }
            return;
        });
    }
    Private.getSavePath = getSavePath;
    /**
     * A no-op function.
     */
    function noOp() {
        /* no-op */
    }
    Private.noOp = noOp;
    /*
     * A widget that gets a file path from a user.
     */
    class SaveWidget extends Widget {
        /**
         * Construct a new save widget.
         */
        constructor(path) {
            super({ node: createSaveNode(path) });
        }
        /**
         * Get the value for the widget.
         */
        getValue() {
            return this.node.value;
        }
    }
    /**
     * Create the node for a save widget.
     */
    function createSaveNode(path) {
        const input = document.createElement('input');
        input.value = path;
        return input;
    }
})(Private || (Private = {}));
//# sourceMappingURL=context.js.map