import { IFilter, IFilters, ISearchMatch, ISearchProvider, SearchProvider } from '@jupyterlab/documentsearch';
import { ITranslator } from '@jupyterlab/translation';
import { Widget } from '@lumino/widgets';
import { NotebookPanel } from './panel';
/**
 * Notebook document search provider
 */
export declare class NotebookSearchProvider extends SearchProvider<NotebookPanel> {
    protected translator: ITranslator;
    /**
     * Constructor
     *
     * @param widget The widget to search in
     * @param translator Application translator
     */
    constructor(widget: NotebookPanel, translator?: ITranslator);
    /**
     * Report whether or not this provider has the ability to search on the given object
     *
     * @param domain Widget to test
     * @returns Search ability
     */
    static isApplicable(domain: Widget): domain is NotebookPanel;
    /**
     * Instantiate a search provider for the notebook panel.
     *
     * #### Notes
     * The widget provided is always checked using `isApplicable` before calling
     * this factory.
     *
     * @param widget The widget to search on
     * @param translator [optional] The translator object
     *
     * @returns The search provider on the notebook panel
     */
    static createNew(widget: NotebookPanel, translator?: ITranslator): ISearchProvider;
    /**
     * The current index of the selected match.
     */
    get currentMatchIndex(): number | null;
    /**
     * The number of matches.
     */
    get matchesCount(): number | null;
    /**
     * Set to true if the widget under search is read-only, false
     * if it is editable.  Will be used to determine whether to show
     * the replace option.
     */
    get isReadOnly(): boolean;
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
     * Get the filters for the given provider.
     *
     * @returns The filters.
     */
    getFilters(): {
        [key: string]: IFilter;
    };
    /**
     * Get an initial query value if applicable so that it can be entered
     * into the search box as an initial query
     *
     * @returns Initial value used to populate the search box.
     */
    getInitialQuery(): string;
    /**
     * Clear currently highlighted match.
     */
    clearHighlight(): Promise<void>;
    /**
     * Highlight the next match.
     *
     * @param loop Whether to loop within the matches list.
     *
     * @returns The next match if available.
     */
    highlightNext(loop?: boolean): Promise<ISearchMatch | undefined>;
    /**
     * Highlight the previous match.
     *
     * @param loop Whether to loop within the matches list.
     *
     * @returns The previous match if available.
     */
    highlightPrevious(loop?: boolean): Promise<ISearchMatch | undefined>;
    /**
     * Search for a regular expression with optional filters.
     *
     * @param query A regular expression to test for
     * @param filters Filter parameters to pass to provider
     *
     */
    startQuery(query: RegExp, filters: IFilters | undefined): Promise<void>;
    /**
     * Stop the search and clear all internal state.
     */
    endQuery(): Promise<void>;
    /**
     * Replace the currently selected match with the provided text
     *
     * @param newText The replacement text.
     * @param loop Whether to loop within the matches list.
     *
     * @returns A promise that resolves with a boolean indicating whether a replace occurred.
     */
    replaceCurrentMatch(newText: string, loop?: boolean): Promise<boolean>;
    /**
     * Replace all matches in the notebook with the provided text
     *
     * @param newText The replacement text.
     *
     * @returns A promise that resolves with a boolean indicating whether a replace occurred.
     */
    replaceAllMatches(newText: string): Promise<boolean>;
    private _addCellProvider;
    private _removeCellProvider;
    private _onCellsChanged;
    private _onPlaceholderRendered;
    private _stepNext;
    private _onActiveCellChanged;
    private _onSearchProviderChanged;
    private _onSelectionChanged;
    private _currentProviderIndex;
    private _filters;
    private _onSelectedCells;
    private _query;
    private _searchProviders;
    private _documentHasChanged;
}
