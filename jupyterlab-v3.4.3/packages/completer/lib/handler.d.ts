import { CodeEditor } from '@jupyterlab/codeeditor';
import { IDataConnector } from '@jupyterlab/statedb';
import { LabIcon } from '@jupyterlab/ui-components';
import { ReadonlyJSONObject } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';
import { Message } from '@lumino/messaging';
import { Completer } from './widget';
/**
 * A completion handler for editors.
 */
export declare class CompletionHandler implements IDisposable {
    /**
     * Construct a new completion handler for a widget.
     */
    constructor(options: CompletionHandler.IOptions);
    /**
     * The completer widget managed by the handler.
     */
    readonly completer: Completer;
    /**
     * The data connector used to populate completion requests.
     * @deprecated will be removed, or will return `CompletionHandler.ICompletionItemsConnector`
     * instead of `IDataConnector` in future versions
     *
     * #### Notes
     * The only method of this connector that will ever be called is `fetch`, so
     * it is acceptable for the other methods to be simple functions that return
     * rejected promises.
     */
    get connector(): IDataConnector<CompletionHandler.IReply, void, CompletionHandler.IRequest>;
    set connector(connector: IDataConnector<CompletionHandler.IReply, void, CompletionHandler.IRequest>);
    /**
     * The editor used by the completion handler.
     */
    get editor(): CodeEditor.IEditor | null;
    set editor(newValue: CodeEditor.IEditor | null);
    /**
     * Get whether the completion handler is disposed.
     */
    get isDisposed(): boolean;
    /**
     * Dispose of the resources used by the handler.
     */
    dispose(): void;
    /**
     * Invoke the handler and launch a completer.
     */
    invoke(): void;
    /**
     * Process a message sent to the completion handler.
     */
    processMessage(msg: Message): void;
    /**
     * Get the state of the text editor at the given position.
     */
    protected getState(editor: CodeEditor.IEditor, position: CodeEditor.IPosition): Completer.ITextState;
    /**
     * Handle a completion selected signal from the completion widget.
     */
    protected onCompletionSelected(completer: Completer, val: string): void;
    /**
     * Handle `invoke-request` messages.
     */
    protected onInvokeRequest(msg: Message): void;
    /**
     * Handle selection changed signal from an editor.
     *
     * #### Notes
     * If a sub-class reimplements this method, then that class must either call
     * its super method or it must take responsibility for adding and removing
     * the completer completable class to the editor host node.
     *
     * Despite the fact that the editor widget adds a class whenever there is a
     * primary selection, this method checks independently for two reasons:
     *
     * 1. The editor widget connects to the same signal to add that class, so
     *    there is no guarantee that the class will be added before this method
     *    is invoked so simply checking for the CSS class's existence is not an
     *    option. Secondarily, checking the editor state should be faster than
     *    querying the DOM in either case.
     * 2. Because this method adds a class that indicates whether completer
     *    functionality ought to be enabled, relying on the behavior of the
     *    `jp-mod-has-primary-selection` to filter out any editors that have
     *    a selection means the semantic meaning of `jp-mod-completer-enabled`
     *    is obscured because there may be cases where the enabled class is added
     *    even though the completer is not available.
     */
    protected onSelectionsChanged(): void;
    /**
     * Handle a text changed signal from an editor.
     */
    protected onTextChanged(): void;
    /**
     * Handle a visibility change signal from a completer widget.
     */
    protected onVisibilityChanged(completer: Completer): void;
    /**
     * Make a completion request.
     */
    private _makeRequest;
    private _isICompletionItemsConnector;
    private _validate;
    /**
     * Updates model with text state and current cursor position.
     */
    private _updateModel;
    /**
     * Receive a completion reply from the connector.
     *
     * @param state - The state of the editor when completion request was made.
     *
     * @param reply - The API response returned for a completion request.
     */
    private _onReply;
    /**
     * Receive completion items from provider.
     *
     * @param state - The state of the editor when completion request was made.
     *
     * @param reply - The API response returned for a completion request.
     */
    private _onFetchItemsReply;
    /**
     * If completion request fails, reset model and fail silently.
     */
    private _onFailure;
    private _connector;
    private _editor;
    private _enabled;
    private _pending;
    private _isDisposed;
}
/**
 * A namespace for cell completion handler statics.
 */
export declare namespace CompletionHandler {
    /**
     * The instantiation options for cell completion handlers.
     */
    interface IOptions {
        /**
         * The completion widget the handler will connect to.
         */
        completer: Completer;
        /**
         * The data connector used to populate completion requests.
         * Use the connector with ICompletionItemsReply for enhanced completions.
         * #### Notes
         * The only method of this connector that will ever be called is `fetch`, so
         * it is acceptable for the other methods to be simple functions that return
         * rejected promises.
         *
         * @deprecated passing `IDataConnector` is deprecated;
         * pass `CompletionHandler.ICompletionItemsConnector`
         */
        connector: IDataConnector<IReply, void, IRequest> | CompletionHandler.ICompletionItemsConnector;
    }
    /**
     * Type alias for ICompletionItem list.
     * Implementers of this interface should be responsible for
     * deduping and sorting the items in the list.
     */
    type ICompletionItems = ReadonlyArray<ICompletionItem>;
    /**
     * Completion item object based off of LSP CompletionItem.
     * Compared to the old kernel completions interface, this enhances the completions UI to support:
     * - differentiation between inserted text and user facing text
     * - documentation for each completion item to be displayed adjacently
     * - deprecation styling
     * - custom icons
     * and other potential new features.
     */
    interface ICompletionItem {
        /**
         * User facing completion.
         * If insertText is not set, this will be inserted.
         */
        label: string;
        /**
         * Completion to be inserted.
         */
        insertText?: string;
        /**
         * Type of this completion item.
         */
        type?: string;
        /**
         * LabIcon object for icon to be rendered with completion type.
         */
        icon?: LabIcon;
        /**
         * A human-readable string with additional information
         * about this item, like type or symbol information.
         */
        documentation?: string;
        /**
         * Indicates if the item is deprecated.
         */
        deprecated?: boolean;
    }
    type ICompletionItemsConnector = IDataConnector<CompletionHandler.ICompletionItemsReply, void, CompletionHandler.IRequest> & CompletionHandler.ICompleterConnecterResponseType;
    /**
     * A reply to a completion items fetch request.
     */
    interface ICompletionItemsReply {
        /**
         * The starting index for the substring being replaced by completion.
         */
        start: number;
        /**
         * The end index for the substring being replaced by completion.
         */
        end: number;
        /**
         * A list of completion items.
         */
        items: CompletionHandler.ICompletionItems;
    }
    interface ICompleterConnecterResponseType {
        responseType: typeof ICompletionItemsResponseType;
    }
    const ICompletionItemsResponseType: "ICompletionItemsReply";
    /**
     * @deprecated use `ICompletionItemsReply` instead
     *
     * A reply to a completion request.
     */
    interface IReply {
        /**
         * The starting index for the substring being replaced by completion.
         */
        start: number;
        /**
         * The end index for the substring being replaced by completion.
         */
        end: number;
        /**
         * A list of matching completion strings.
         */
        matches: ReadonlyArray<string>;
        /**
         * Any metadata that accompanies the completion reply.
         */
        metadata: ReadonlyJSONObject;
    }
    /**
     * The details of a completion request.
     */
    interface IRequest {
        /**
         * The cursor offset position within the text being completed.
         */
        offset: number;
        /**
         * The text being completed.
         */
        text: string;
    }
    /**
     * A namespace for completion handler messages.
     */
    namespace Msg {
        /**
         * A singleton `'invoke-request'` message.
         */
        const InvokeRequest: Message;
    }
}
