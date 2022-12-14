// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { Text } from '@jupyterlab/coreutils';
import { MimeModel } from '@jupyterlab/rendermime';
import { JSONExt } from '@lumino/coreutils';
import { Debouncer } from '@lumino/polling';
import { Signal } from '@lumino/signaling';
/**
 * An object that handles code inspection.
 */
export class InspectionHandler {
    /**
     * Construct a new inspection handler for a widget.
     */
    constructor(options) {
        this._cleared = new Signal(this);
        this._disposed = new Signal(this);
        this._editor = null;
        this._inspected = new Signal(this);
        this._isDisposed = false;
        this._pending = 0;
        this._standby = true;
        this._lastInspectedReply = null;
        this._connector = options.connector;
        this._rendermime = options.rendermime;
        this._debouncer = new Debouncer(this.onEditorChange.bind(this), 250);
    }
    /**
     * A signal emitted when the inspector should clear all items.
     */
    get cleared() {
        return this._cleared;
    }
    /**
     * A signal emitted when the handler is disposed.
     */
    get disposed() {
        return this._disposed;
    }
    /**
     * A signal emitted when an inspector value is generated.
     */
    get inspected() {
        return this._inspected;
    }
    /**
     * The editor widget used by the inspection handler.
     */
    get editor() {
        return this._editor;
    }
    set editor(newValue) {
        if (newValue === this._editor) {
            return;
        }
        // Remove all of our listeners.
        Signal.disconnectReceiver(this);
        const editor = (this._editor = newValue);
        if (editor) {
            // Clear the inspector in preparation for a new editor.
            this._cleared.emit(void 0);
            // Call onEditorChange to cover the case where the user changes
            // the active cell
            this.onEditorChange();
            editor.model.selections.changed.connect(this._onChange, this);
            editor.model.value.changed.connect(this._onChange, this);
        }
    }
    /**
     * Indicates whether the handler makes API inspection requests or stands by.
     *
     * #### Notes
     * The use case for this attribute is to limit the API traffic when no
     * inspector is visible.
     */
    get standby() {
        return this._standby;
    }
    set standby(value) {
        this._standby = value;
    }
    /**
     * Get whether the inspection handler is disposed.
     *
     * #### Notes
     * This is a read-only property.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Dispose of the resources used by the handler.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._isDisposed = true;
        this._disposed.emit(void 0);
        Signal.clearData(this);
    }
    /**
     * Handle a text changed signal from an editor.
     *
     * #### Notes
     * Update the hints inspector based on a text change.
     */
    onEditorChange(customText) {
        // If the handler is in standby mode, bail.
        if (this._standby) {
            return;
        }
        const editor = this.editor;
        if (!editor) {
            return;
        }
        const text = customText ? customText : editor.model.value.text;
        const position = editor.getCursorPosition();
        const offset = Text.jsIndexToCharIndex(editor.getOffsetAt(position), text);
        const update = { content: null };
        const pending = ++this._pending;
        void this._connector
            .fetch({ offset, text })
            .then(reply => {
            // If handler has been disposed or a newer request is pending, bail.
            if (!reply || this.isDisposed || pending !== this._pending) {
                this._lastInspectedReply = null;
                this._inspected.emit(update);
                return;
            }
            const { data } = reply;
            // Do not update if there would be no change.
            if (this._lastInspectedReply &&
                JSONExt.deepEqual(this._lastInspectedReply, data)) {
                return;
            }
            const mimeType = this._rendermime.preferredMimeType(data);
            if (mimeType) {
                const widget = this._rendermime.createRenderer(mimeType);
                const model = new MimeModel({ data });
                void widget.renderModel(model);
                update.content = widget;
            }
            this._lastInspectedReply = reply.data;
            this._inspected.emit(update);
        })
            .catch(reason => {
            // Since almost all failures are benign, fail silently.
            this._lastInspectedReply = null;
            this._inspected.emit(update);
        });
    }
    /**
     * Handle changes to the editor state, debouncing.
     */
    _onChange() {
        void this._debouncer.invoke();
    }
}
//# sourceMappingURL=handler.js.map