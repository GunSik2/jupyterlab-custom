// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { ObservableMap } from '@jupyterlab/observables';
import { AttachmentModel, imageRendererFactory } from '@jupyterlab/rendermime';
import { Signal } from '@lumino/signaling';
/**
 * The default implementation of the IAttachmentsModel.
 */
export class AttachmentsModel {
    /**
     * Construct a new observable outputs instance.
     */
    constructor(options = {}) {
        this._map = new ObservableMap();
        this._isDisposed = false;
        this._stateChanged = new Signal(this);
        this._changed = new Signal(this);
        this._modelDB = null;
        this._serialized = null;
        this._changeGuard = false;
        this.contentFactory =
            options.contentFactory || AttachmentsModel.defaultContentFactory;
        if (options.values) {
            for (const key of Object.keys(options.values)) {
                if (options.values[key] !== undefined) {
                    this.set(key, options.values[key]);
                }
            }
        }
        this._map.changed.connect(this._onMapChanged, this);
        // If we are given a IModelDB, keep an up-to-date
        // serialized copy of the AttachmentsModel in it.
        if (options.modelDB) {
            this._modelDB = options.modelDB;
            this._serialized = this._modelDB.createValue('attachments');
            if (this._serialized.get()) {
                this.fromJSON(this._serialized.get());
            }
            else {
                this._serialized.set(this.toJSON());
            }
            this._serialized.changed.connect(this._onSerializedChanged, this);
        }
    }
    /**
     * A signal emitted when the model state changes.
     */
    get stateChanged() {
        return this._stateChanged;
    }
    /**
     * A signal emitted when the model changes.
     */
    get changed() {
        return this._changed;
    }
    /**
     * The keys of the attachments in the model.
     */
    get keys() {
        return this._map.keys();
    }
    /**
     * Get the length of the items in the model.
     */
    get length() {
        return this._map.keys().length;
    }
    /**
     * Test whether the model is disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Dispose of the resources used by the model.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._isDisposed = true;
        this._map.dispose();
        Signal.clearData(this);
    }
    /**
     * Whether the specified key is set.
     */
    has(key) {
        return this._map.has(key);
    }
    /**
     * Get an item at the specified key.
     */
    get(key) {
        return this._map.get(key);
    }
    /**
     * Set the value at the specified key.
     */
    set(key, value) {
        // Normalize stream data.
        const item = this._createItem({ value });
        this._map.set(key, item);
    }
    /**
     * Remove the attachment whose name is the specified key
     */
    remove(key) {
        this._map.delete(key);
    }
    /**
     * Clear all of the attachments.
     */
    clear() {
        this._map.values().forEach((item) => {
            item.dispose();
        });
        this._map.clear();
    }
    /**
     * Deserialize the model from JSON.
     *
     * #### Notes
     * This will clear any existing data.
     */
    fromJSON(values) {
        this.clear();
        Object.keys(values).forEach(key => {
            if (values[key] !== undefined) {
                this.set(key, values[key]);
            }
        });
    }
    /**
     * Serialize the model to JSON.
     */
    toJSON() {
        const ret = {};
        for (const key of this._map.keys()) {
            ret[key] = this._map.get(key).toJSON();
        }
        return ret;
    }
    /**
     * Create an attachment item and hook up its signals.
     */
    _createItem(options) {
        const factory = this.contentFactory;
        const item = factory.createAttachmentModel(options);
        item.changed.connect(this._onGenericChange, this);
        return item;
    }
    /**
     * Handle a change to the list.
     */
    _onMapChanged(sender, args) {
        if (this._serialized && !this._changeGuard) {
            this._changeGuard = true;
            this._serialized.set(this.toJSON());
            this._changeGuard = false;
        }
        this._changed.emit(args);
        this._stateChanged.emit(void 0);
    }
    /**
     * If the serialized version of the outputs have changed due to a remote
     * action, then update the model accordingly.
     */
    _onSerializedChanged(sender, args) {
        if (!this._changeGuard) {
            this._changeGuard = true;
            this.fromJSON(args.newValue);
            this._changeGuard = false;
        }
    }
    /**
     * Handle a change to an item.
     */
    _onGenericChange() {
        this._stateChanged.emit(void 0);
    }
}
/**
 * The namespace for AttachmentsModel class statics.
 */
(function (AttachmentsModel) {
    /**
     * The default implementation of a `IAttachmentsModel.IContentFactory`.
     */
    class ContentFactory {
        /**
         * Create an attachment model.
         */
        createAttachmentModel(options) {
            return new AttachmentModel(options);
        }
    }
    AttachmentsModel.ContentFactory = ContentFactory;
    /**
     * The default attachment model factory.
     */
    AttachmentsModel.defaultContentFactory = new ContentFactory();
})(AttachmentsModel || (AttachmentsModel = {}));
/**
 * A resolver for cell attachments 'attachment:filename'.
 *
 * Will resolve to a data: url.
 */
export class AttachmentsResolver {
    /**
     * Create an attachments resolver object.
     */
    constructor(options) {
        this._parent = options.parent || null;
        this._model = options.model;
    }
    /**
     * Resolve a relative url to a correct server path.
     */
    async resolveUrl(url) {
        if (this._parent && !url.startsWith('attachment:')) {
            return this._parent.resolveUrl(url);
        }
        return url;
    }
    /**
     * Get the download url of a given absolute server path.
     *
     * #### Notes
     * The returned URL may include a query parameter.
     */
    async getDownloadUrl(path) {
        if (this._parent && !path.startsWith('attachment:')) {
            return this._parent.getDownloadUrl(path);
        }
        // Return a data URL with the data of the url
        const key = path.slice('attachment:'.length);
        const attachment = this._model.get(key);
        if (attachment === undefined) {
            // Resolve with unprocessed path, to show as broken image
            return path;
        }
        const { data } = attachment;
        const mimeType = Object.keys(data)[0];
        // Only support known safe types:
        if (mimeType === undefined ||
            imageRendererFactory.mimeTypes.indexOf(mimeType) === -1) {
            throw new Error(`Cannot render unknown image mime type "${mimeType}".`);
        }
        const dataUrl = `data:${mimeType};base64,${data[mimeType]}`;
        return dataUrl;
    }
    /**
     * Whether the URL should be handled by the resolver
     * or not.
     */
    isLocal(url) {
        var _a, _b, _c;
        if (this._parent && !url.startsWith('attachment:')) {
            return (_c = (_b = (_a = this._parent).isLocal) === null || _b === void 0 ? void 0 : _b.call(_a, url)) !== null && _c !== void 0 ? _c : true;
        }
        return true;
    }
}
//# sourceMappingURL=model.js.map