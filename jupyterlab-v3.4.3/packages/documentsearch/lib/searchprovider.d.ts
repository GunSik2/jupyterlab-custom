import { ISignal, Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import { IFilter, IFilters, ISearchMatch, ISearchProvider } from './tokens';
/**
 * Abstract class implementing the search provider interface.
 */
export declare abstract class SearchProvider<T extends Widget = Widget> implements ISearchProvider {
    protected widget: T;
    /**
     * Constructor
     *
     * @param widget The widget to search in
     */
    constructor(widget: T);
    /**
     * Signal indicating that something in the search has changed, so the UI should update
     */
    get stateChanged(): ISignal<this, void>;
    /**
     * The current index of the selected match.
     */
    get currentMatchIndex(): number | null;
    /**
     * Whether the search provider is disposed or not.
     */
    get isDisposed(): boolean;
    /**
     * The number of matches.
     */
    get matchesCount(): number | null;
    /**
     * Set to true if the widget under search is read-only, false
     * if it is editable.  Will be used to determine whether to show
     * the replace option.
     */
    abstract get isReadOnly(): boolean;
    /**
     * Dispose of the resources held by the search provider.
     *
     * #### Notes
     * If the object's `dispose` method is called more than once, all
     * calls made after the first will be a no-op.
     *
     * #### Undefined Behavior
     * It is undefined behavior to use any functionality of the object
     * after it has been disposed unless otherwise explicitly noted.
     */
    dispose(): void;
    /**
     * Get an initial query value if applicable so that it can be entered
     * into the search box as an initial query
     *
     * @returns Initial value used to populate the search box.
     */
    getInitialQuery(): string;
    /**
     * Get the filters for the given provider.
     *
     * @returns The filters.
     *
     * ### Notes
     * TODO For now it only supports boolean filters (represented with checkboxes)
     */
    getFilters(): {
        [key: string]: IFilter;
    };
    /**
     * Start a search using the provided options.
     *
     * @param query A RegExp to be use to perform the search
     * @param filters Filter parameters to pass to provider
     */
    abstract startQuery(query: RegExp, filters: IFilters): Promise<void>;
    /**
     * Stop a search and clear any internal state of the search provider.
     */
    abstract endQuery(): Promise<void>;
    /**
     * Clear currently highlighted match.
     */
    abstract clearHighlight(): Promise<void>;
    /**
     * Highlight the next match.
     *
     * @returns The next match if available
     */
    abstract highlightNext(): Promise<ISearchMatch | undefined>;
    /**
     * Highlight the previous match.
     *
     * @returns The previous match if available.
     */
    abstract highlightPrevious(): Promise<ISearchMatch | undefined>;
    /**
     * Replace the currently selected match with the provided text
     *
     * @param newText The replacement text
     *
     * @returns A promise that resolves with a boolean indicating whether a replace occurred.
     */
    abstract replaceCurrentMatch(newText: string): Promise<boolean>;
    /**
     * Replace all matches in the widget with the provided text
     *
     * @param newText The replacement text
     *
     * @returns A promise that resolves with a boolean indicating whether a replace occurred.
     */
    abstract replaceAllMatches(newText: string): Promise<boolean>;
    protected _stateChanged: Signal<this, void>;
    private _disposed;
}
