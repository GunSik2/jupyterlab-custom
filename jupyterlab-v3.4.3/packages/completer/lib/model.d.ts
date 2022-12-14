import { IIterator, IterableOrArrayLike } from '@lumino/algorithm';
import { ISignal } from '@lumino/signaling';
import { CompletionHandler } from './handler';
import { Completer } from './widget';
/**
 * An implementation of a completer model.
 */
export declare class CompleterModel implements Completer.IModel {
    /**
     * A signal emitted when state of the completer menu changes.
     */
    get stateChanged(): ISignal<this, void>;
    /**
     * The original completion request details.
     */
    get original(): Completer.ITextState | null;
    set original(newValue: Completer.ITextState | null);
    /**
     * The current text change details.
     */
    get current(): Completer.ITextState | null;
    set current(newValue: Completer.ITextState | null);
    /**
     * The cursor details that the API has used to return matching options.
     */
    get cursor(): Completer.ICursorSpan | null;
    set cursor(newValue: Completer.ICursorSpan | null);
    /**
     * The query against which items are filtered.
     */
    get query(): string;
    set query(newValue: string);
    /**
     * A flag that is true when the model value was modified by a subset match.
     */
    get subsetMatch(): boolean;
    set subsetMatch(newValue: boolean);
    /**
     * Get whether the model is disposed.
     */
    get isDisposed(): boolean;
    /**
     * Dispose of the resources held by the model.
     */
    dispose(): void;
    /**
     * The list of visible items in the completer menu.
     *
     * #### Notes
     * This is a read-only property.
     */
    completionItems?(): CompletionHandler.ICompletionItems;
    /**
     * Set the list of visible items in the completer menu, and append any
     * new types to KNOWN_TYPES.
     */
    setCompletionItems?(newValue: CompletionHandler.ICompletionItems): void;
    /**
     * The list of visible items in the completer menu.
     * @deprecated use `completionItems` instead
     *
     * #### Notes
     * This is a read-only property.
     */
    items(): IIterator<Completer.IItem>;
    /**
     * The unfiltered list of all available options in a completer menu.
     */
    options(): IIterator<string>;
    /**
     * The map from identifiers (a.b) to types (function, module, class, instance,
     * etc.).
     *
     * #### Notes
     * A type map is currently only provided by the latest IPython kernel using
     * the completer reply metadata field `_jupyter_types_experimental`. The
     * values are completely up to the kernel.
     *
     */
    typeMap(): Completer.TypeMap;
    /**
     * An ordered list of all the known types in the typeMap.
     *
     * #### Notes
     * To visually encode the types of the completer matches, we assemble an
     * ordered list. This list begins with:
     * ```
     * ['function', 'instance', 'class', 'module', 'keyword']
     * ```
     * and then has any remaining types listed alphabetically. This will give
     * reliable visual encoding for these known types, but allow kernels to
     * provide new types.
     */
    orderedTypes(): string[];
    /**
     * Set the available options in the completer menu.
     */
    setOptions(newValue: IterableOrArrayLike<string>, typeMap?: Completer.TypeMap): void;
    /**
     * Handle a cursor change.
     */
    handleCursorChange(change: Completer.ITextState): void;
    /**
     * Handle a text change.
     */
    handleTextChange(change: Completer.ITextState): void;
    /**
     * Create a resolved patch between the original state and a patch string.
     *
     * @param patch - The patch string to apply to the original value.
     *
     * @returns A patched text change or undefined if original value did not exist.
     */
    createPatch(patch: string): Completer.IPatch | undefined;
    /**
     * Reset the state of the model and emit a state change signal.
     *
     * @param hard - Reset even if a subset match is in progress.
     */
    reset(hard?: boolean): void;
    /**
     * Check if CompletionItem matches against query.
     * Highlight matching prefix by adding <mark> tags.
     */
    private _markup;
    /**
     * Apply the query to the complete options list to return the matching subset.
     */
    private _filter;
    /**
     * Reset the state of the model.
     */
    private _reset;
    private _current;
    private _cursor;
    private _isDisposed;
    private _completionItems;
    private _options;
    private _original;
    private _query;
    private _subsetMatch;
    private _typeMap;
    private _orderedTypes;
    private _stateChanged;
}
