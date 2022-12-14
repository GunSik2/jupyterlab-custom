import { NotebookPanel } from '@jupyterlab/notebook';
import { ISignal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import { ISearchMatch, ISearchProvider } from '../index';
export interface INotebookFilters {
    /**
     * Should cell output be searched?
     */
    output: boolean;
    /**
     * Should search be within the selected cell(s)?
     */
    selectedCells: boolean;
}
export declare class NotebookSearchProvider implements ISearchProvider<NotebookPanel> {
    /**
     * Get an initial query value if applicable so that it can be entered
     * into the search box as an initial query
     *
     * @returns Initial value used to populate the search box.
     */
    getInitialQuery(searchTarget: NotebookPanel): unknown;
    /**
     * Initialize the search using the provided options. Should update the UI
     * to highlight all matches and "select" whatever the first match should be.
     *
     * @param query A RegExp to be use to perform the search
     * @param searchTarget The widget to be searched
     * @param filters Filter parameters to pass to provider
     *
     * @returns A promise that resolves with a list of all matches
     */
    startQuery(query: RegExp, searchTarget: NotebookPanel, filters: INotebookFilters | undefined): Promise<ISearchMatch[]>;
    /**
     * Gradually refresh cells in the background so that the user will not
     * experience frozen interface, `n` cells at a time.
     */
    private _refreshCellsEditorsInBackground;
    /**
     * Refresh the editor in the cell for the current match.
     */
    private _refreshCurrentCellEditor;
    /**
     * Clears state of a search provider to prepare for startQuery to be called
     * in order to start a new query or refresh an existing one.
     *
     * @returns A promise that resolves when the search provider is ready to
     * begin a new search.
     */
    endQuery(): Promise<void>;
    /**
     * Resets UI state, removes all matches.
     *
     * @returns A promise that resolves when all state has been cleaned up.
     */
    endSearch(): Promise<void>;
    /**
     * Move the current match indicator to the next match.
     *
     * @returns A promise that resolves once the action has completed.
     */
    highlightNext(): Promise<ISearchMatch | undefined>;
    /**
     * Move the current match indicator to the previous match.
     *
     * @returns A promise that resolves once the action has completed.
     */
    highlightPrevious(): Promise<ISearchMatch | undefined>;
    /**
     * Replace the currently selected match with the provided text
     *
     * @returns A promise that resolves with a boolean indicating whether a replace occurred.
     */
    replaceCurrentMatch(newText: string): Promise<boolean>;
    /**
     * Replace all matches in the notebook with the provided text
     *
     * @returns A promise that resolves with a boolean indicating whether a replace occurred.
     */
    replaceAllMatches(newText: string): Promise<boolean>;
    /**
     * Report whether or not this provider has the ability to search on the given object
     */
    static canSearchOn(domain: Widget): domain is NotebookPanel;
    /**
     * The same list of matches provided by the startQuery promise resolution
     */
    get matches(): ISearchMatch[];
    /**
     * Signal indicating that something in the search has changed, so the UI should update
     */
    get changed(): ISignal<this, void>;
    /**
     * The current index of the selected match.
     */
    get currentMatchIndex(): number | null;
    /**
     * Set to true if the widget under search is read-only, false
     * if it is editable.  Will be used to determine whether to show
     * the replace option.
     */
    readonly isReadOnly = false;
    readonly hasOutputs = true;
    private _updatedCurrentProvider;
    private _stepNext;
    private _getMatchesFromCells;
    private _onSearchProviderChanged;
    private _currentMatchIsSelected;
    private _searchTarget;
    private _filters;
    private _searchProviders;
    private _currentProvider;
    private _currentMatch;
    private _unRenderedMarkdownCells;
    private _cellsWithMatches;
    private _changed;
}
