import { CodeEditor } from '@jupyterlab/codeeditor';
import { IIterator, IterableOrArrayLike } from '@lumino/algorithm';
import { JSONObject } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';
import { Message } from '@lumino/messaging';
import { ISignal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import { CompletionHandler } from './handler';
/**
 * A widget that enables text completion.
 *
 * #### Notes
 * The completer is intended to be absolutely positioned on the
 * page and hover over any other content, so it should be attached directly
 * to `document.body`, or a node that is the full size of `document.body`.
 * Attaching it to other nodes may incorrectly locate the completer.
 */
export declare class Completer extends Widget {
    /**
     * Construct a text completer menu widget.
     */
    constructor(options: Completer.IOptions);
    /**
     * The active index.
     */
    get activeIndex(): number;
    /**
     * The editor used by the completion widget.
     */
    get editor(): CodeEditor.IEditor | null;
    set editor(newValue: CodeEditor.IEditor | null);
    /**
     * A signal emitted when a selection is made from the completer menu.
     */
    get selected(): ISignal<this, string>;
    /**
     * A signal emitted when the completer widget's visibility changes.
     *
     * #### Notes
     * This signal is useful when there are multiple floating widgets that may
     * contend with the same space and ought to be mutually exclusive.
     */
    get visibilityChanged(): ISignal<this, void>;
    /**
     * A signal emitted when the active index changes.
     */
    get indexChanged(): ISignal<this, number>;
    /**
     * The model used by the completer widget.
     */
    get model(): Completer.IModel | null;
    set model(model: Completer.IModel | null);
    /**
     * Dispose of the resources held by the completer widget.
     */
    dispose(): void;
    /**
     * Handle the DOM events for the widget.
     *
     * @param event - The DOM event sent to the widget.
     *
     * #### Notes
     * This method implements the DOM `EventListener` interface and is
     * called in response to events on the dock panel's node. It should
     * not be called directly by user code.
     */
    handleEvent(event: Event): void;
    /**
     * Reset the widget.
     */
    reset(): void;
    /**
     * Emit the selected signal for the current active item and reset.
     */
    selectActive(): void;
    /**
     * Handle `after-attach` messages for the widget.
     */
    protected onAfterAttach(msg: Message): void;
    /**
     * Handle `before-detach` messages for the widget.
     */
    protected onBeforeDetach(msg: Message): void;
    /**
     * Handle model state changes.
     */
    protected onModelStateChanged(): void;
    /**
     * Handle `update-request` messages.
     */
    protected onUpdateRequest(msg: Message): void;
    private _createCompletionItemNode;
    private _createIItemNode;
    /**
     * Cycle through the available completer items.
     *
     * #### Notes
     * When the user cycles all the way `down` to the last index, subsequent
     * `down` cycles will cycle to the first index. When the user cycles `up` to
     * the first item, subsequent `up` cycles will cycle to the last index.
     */
    private _cycle;
    /**
     * Handle keydown events for the widget.
     */
    private _evtKeydown;
    /**
     * Handle mousedown events for the widget.
     */
    private _evtMousedown;
    /**
     * Handle scroll events for the widget
     */
    private _evtScroll;
    /**
     * Populate the completer up to the longest initial subset of items.
     *
     * @returns `true` if a subset match was found and populated.
     */
    private _populateSubset;
    /**
     * Set the visible dimensions of the widget.
     */
    private _setGeometry;
    /**
     * Update the display-state and contents of the documentation panel
     */
    private _updateDocPanel;
    private _activeIndex;
    private _editor;
    private _model;
    private _renderer;
    private _resetFlag;
    private _selected;
    private _visibilityChanged;
    private _indexChanged;
    private _lastSubsetMatch;
}
export declare namespace Completer {
    /**
     * A type map that may add type annotations to completer matches.
     */
    type TypeMap = {
        [index: string]: string | null;
    };
    /**
     * The initialization options for a completer widget.
     */
    interface IOptions {
        /**
         * The semantic parent of the completer widget, its referent editor.
         */
        editor?: CodeEditor.IEditor | null;
        /**
         * The model for the completer widget.
         */
        model?: IModel;
        /**
         * The renderer for the completer widget nodes.
         */
        renderer?: IRenderer;
    }
    /**
     * An interface for a completion request reflecting the state of the editor.
     */
    interface ITextState extends JSONObject {
        /**
         * The current value of the editor.
         */
        readonly text: string;
        /**
         * The height of a character in the editor.
         */
        readonly lineHeight: number;
        /**
         * The width of a character in the editor.
         */
        readonly charWidth: number;
        /**
         * The line number of the editor cursor.
         */
        readonly line: number;
        /**
         * The character number of the editor cursor within a line.
         */
        readonly column: number;
    }
    /**
     * The data model backing a code completer widget.
     */
    interface IModel extends IDisposable {
        /**
         * A signal emitted when state of the completer menu changes.
         */
        readonly stateChanged: ISignal<IModel, void>;
        /**
         * The current text state details.
         */
        current: ITextState | null;
        /**
         * The cursor details that the API has used to return matching options.
         */
        cursor: ICursorSpan | null;
        /**
         * A flag that is true when the model value was modified by a subset match.
         */
        subsetMatch: boolean;
        /**
         * The original completer request details.
         */
        original: ITextState | null;
        /**
         * The query against which items are filtered.
         */
        query: string;
        /**
         * Get the list of visible CompletionItems in the completer menu.
         */
        completionItems?(): CompletionHandler.ICompletionItems;
        /**
         * Set the list of visible CompletionItems in the completer menu.
         */
        setCompletionItems?(items: CompletionHandler.ICompletionItems): void;
        /**
         * Get the of visible items in the completer menu.
         */
        items(): IIterator<IItem>;
        /**
         * Get the unfiltered options in a completer menu.
         */
        options(): IIterator<string>;
        /**
         * The map from identifiers (`a.b`) to their types (function, module, class,
         * instance, etc.).
         */
        typeMap(): TypeMap;
        /**
         * An ordered list of types used for visual encoding.
         */
        orderedTypes(): string[];
        /**
         * Set the available options in the completer menu.
         */
        setOptions(options: IterableOrArrayLike<string>, typeMap?: JSONObject): void;
        /**
         * Handle a cursor change.
         */
        handleCursorChange(change: Completer.ITextState): void;
        /**
         * Handle a completion request.
         */
        handleTextChange(change: Completer.ITextState): void;
        /**
         * Create a resolved patch between the original state and a patch string.
         */
        createPatch(patch: string): IPatch | undefined;
        /**
         * Reset the state of the model and emit a state change signal.
         *
         * @param hard - Reset even if a subset match is in progress.
         */
        reset(hard?: boolean): void;
    }
    /**
     * An object describing a completion option injection into text.
     */
    interface IPatch {
        /**
         * The start of the range to be patched.
         */
        start: number;
        /**
         * The end of the range to be patched.
         */
        end: number;
        /**
         * The value to be patched in.
         */
        value: string;
    }
    /**
     * A completer menu item.
     */
    interface IItem {
        /**
         * The highlighted, marked up text of a visible completer item.
         */
        text: string;
        /**
         * The raw text of a visible completer item.
         */
        raw: string;
    }
    /**
     * A cursor span.
     */
    interface ICursorSpan extends JSONObject {
        /**
         * The start position of the cursor.
         */
        start: number;
        /**
         * The end position of the cursor.
         */
        end: number;
    }
    /**
     * A renderer for completer widget nodes.
     */
    interface IRenderer {
        /**
         * Create an item node (an `li` element)  from a ICompletionItem
         * for a text completer menu.
         */
        createCompletionItemNode?(item: CompletionHandler.ICompletionItem, orderedTypes: string[]): HTMLLIElement;
        /**
         * Create an item node (an `li` element) for a text completer menu.
         */
        createItemNode(item: IItem, typeMap: TypeMap, orderedTypes: string[]): HTMLLIElement;
        /**
         * Create a documentation node (a `pre` element by default) for
         * documentation panel.
         */
        createDocumentationNode?(activeItem: CompletionHandler.ICompletionItem): HTMLElement;
    }
    /**
     * The default implementation of an `IRenderer`.
     */
    class Renderer implements IRenderer {
        /**
         * Create an item node from an ICompletionItem for a text completer menu.
         */
        createCompletionItemNode(item: CompletionHandler.ICompletionItem, orderedTypes: string[]): HTMLLIElement;
        /**
         * Create an item node for a text completer menu.
         */
        createItemNode(item: IItem, typeMap: TypeMap, orderedTypes: string[]): HTMLLIElement;
        /**
         * Create a documentation node for documentation panel.
         */
        createDocumentationNode(activeItem: CompletionHandler.ICompletionItem): HTMLElement;
        /**
         * Create base node with the value to be inserted
         */
        private _createBaseNode;
        /**
         * Create match node to highlight potential prefix match within result.
         */
        private _createMatchNode;
        /**
         * Attaches type and match nodes to base node.
         */
        private _constructNode;
    }
    /**
     * The default `IRenderer` instance.
     */
    const defaultRenderer: Renderer;
}
