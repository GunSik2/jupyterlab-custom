import { VDomModel } from '@jupyterlab/ui-components';
import { IObservableDisposable } from '@lumino/disposable';
import { ISignal } from '@lumino/signaling';
import { IFilter, IFilters, ISearchProvider } from './tokens';
/**
 * Search in a document model.
 */
export declare class SearchDocumentModel extends VDomModel implements IObservableDisposable {
    protected searchProvider: ISearchProvider;
    /**
     * Search document model
     * @param searchProvider Provider for the current document
     * @param searchDebounceTime Debounce search time
     */
    constructor(searchProvider: ISearchProvider, searchDebounceTime: number);
    /**
     * Whether the search is case sensitive or not.
     */
    get caseSensitive(): boolean;
    set caseSensitive(v: boolean);
    /**
     * Current highlighted match index.
     */
    get currentIndex(): number | null;
    /**
     * A signal emitted when the object is disposed.
     */
    get disposed(): ISignal<this, void>;
    /**
     * Filter values.
     */
    get filters(): IFilters;
    set filters(v: IFilters);
    /**
     * Filter definitions for the current provider.
     */
    get filtersDefinition(): {
        [n: string]: IFilter;
    };
    /**
     * The initial query string.
     */
    get initialQuery(): string;
    /**
     * Whether the document is read-only or not.
     */
    get isReadOnly(): boolean;
    /**
     * Parsing regular expression error message.
     */
    get parsingError(): string;
    /**
     * Replacement expression
     */
    get replaceText(): string;
    set replaceText(v: string);
    /**
     * Search expression
     */
    get searchExpression(): string;
    set searchExpression(v: string);
    /**
     * Total number of matches.
     */
    get totalMatches(): number | null;
    /**
     * Whether to use regular expression or not.
     */
    get useRegex(): boolean;
    set useRegex(v: boolean);
    /**
     * Dispose the model.
     */
    dispose(): void;
    /**
     * End the query.
     */
    endQuery(): Promise<void>;
    /**
     * Highlight the next match.
     */
    highlightNext(): Promise<void>;
    /**
     * Highlight the previous match
     */
    highlightPrevious(): Promise<void>;
    /**
     * Refresh search
     */
    refresh(): void;
    /**
     * Replace all matches.
     */
    replaceAllMatches(): Promise<void>;
    /**
     * Replace the current match.
     */
    replaceCurrentMatch(): Promise<void>;
    private _updateSearch;
    private _caseSensitive;
    private _disposed;
    private _parsingError;
    private _filters;
    private _replaceText;
    private _searchDebouncer;
    private _searchExpression;
    private _useRegex;
}
