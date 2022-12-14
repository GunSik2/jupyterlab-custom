import { CodeEditor } from '@jupyterlab/codeeditor';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { IDataConnector } from '@jupyterlab/statedb';
import { ReadonlyJSONObject } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';
import { ISignal } from '@lumino/signaling';
import { IInspector } from './tokens';
/**
 * An object that handles code inspection.
 */
export declare class InspectionHandler implements IDisposable, IInspector.IInspectable {
    /**
     * Construct a new inspection handler for a widget.
     */
    constructor(options: InspectionHandler.IOptions);
    /**
     * A signal emitted when the inspector should clear all items.
     */
    get cleared(): ISignal<InspectionHandler, void>;
    /**
     * A signal emitted when the handler is disposed.
     */
    get disposed(): ISignal<InspectionHandler, void>;
    /**
     * A signal emitted when an inspector value is generated.
     */
    get inspected(): ISignal<InspectionHandler, IInspector.IInspectorUpdate>;
    /**
     * The editor widget used by the inspection handler.
     */
    get editor(): CodeEditor.IEditor | null;
    set editor(newValue: CodeEditor.IEditor | null);
    /**
     * Indicates whether the handler makes API inspection requests or stands by.
     *
     * #### Notes
     * The use case for this attribute is to limit the API traffic when no
     * inspector is visible.
     */
    get standby(): boolean;
    set standby(value: boolean);
    /**
     * Get whether the inspection handler is disposed.
     *
     * #### Notes
     * This is a read-only property.
     */
    get isDisposed(): boolean;
    /**
     * Dispose of the resources used by the handler.
     */
    dispose(): void;
    /**
     * Handle a text changed signal from an editor.
     *
     * #### Notes
     * Update the hints inspector based on a text change.
     */
    onEditorChange(customText?: string): void;
    /**
     * Handle changes to the editor state, debouncing.
     */
    private _onChange;
    private _cleared;
    private _connector;
    private _disposed;
    private _editor;
    private _inspected;
    private _isDisposed;
    private _pending;
    private _rendermime;
    private _standby;
    private _debouncer;
    private _lastInspectedReply;
}
/**
 * A namespace for inspection handler statics.
 */
export declare namespace InspectionHandler {
    /**
     * The instantiation options for an inspection handler.
     */
    interface IOptions {
        /**
         * The connector used to make inspection requests.
         *
         * #### Notes
         * The only method of this connector that will ever be called is `fetch`, so
         * it is acceptable for the other methods to be simple functions that return
         * rejected promises.
         */
        connector: IDataConnector<IReply, void, IRequest>;
        /**
         * The mime renderer for the inspection handler.
         */
        rendermime: IRenderMimeRegistry;
    }
    /**
     * A reply to an inspection request.
     */
    interface IReply {
        /**
         * The MIME bundle data returned from an inspection request.
         */
        data: ReadonlyJSONObject;
        /**
         * Any metadata that accompanies the MIME bundle returning from a request.
         */
        metadata: ReadonlyJSONObject;
    }
    /**
     * The details of an inspection request.
     */
    interface IRequest {
        /**
         * The cursor offset position within the text being inspected.
         */
        offset: number;
        /**
         * The text being inspected.
         */
        text: string;
    }
}
