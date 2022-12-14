import { CSVViewer } from '@jupyterlab/csvviewer';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { ISearchMatch, ISearchProvider } from '@jupyterlab/documentsearch';
import { ISignal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
export declare type CSVDocumentWidget = DocumentWidget<CSVViewer>;
export declare class CSVSearchProvider implements ISearchProvider<CSVDocumentWidget> {
    /**
     * Report whether or not this provider has the ability to search on the given object
     */
    static canSearchOn(domain: Widget): domain is CSVDocumentWidget;
    /**
     * Get an initial query value if applicable so that it can be entered
     * into the search box as an initial query
     *
     * @returns Initial value used to populate the search box.
     */
    getInitialQuery(searchTarget: CSVDocumentWidget): any;
    /**
     * Initialize the search using the provided options.  Should update the UI
     * to highlight all matches and "select" whatever the first match should be.
     *
     * @param query A RegExp to be use to perform the search
     * @param searchTarget The widget to be searched
     *
     * @returns A promise that resolves with a list of all matches
     */
    startQuery(query: RegExp, searchTarget: CSVDocumentWidget): Promise<ISearchMatch[]>;
    /**
     * Clears state of a search provider to prepare for startQuery to be called
     * in order to start a new query or refresh an existing one.
     *
     * @returns A promise that resolves when the search provider is ready to
     * begin a new search.
     */
    endQuery(): Promise<void>;
    /**
     * Resets UI state as it was before the search process began.  Cleans up and
     * disposes of all internal state.
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
     * Not implemented in the CSV viewer as it is read-only.
     *
     * @returns A promise that resolves once the action has completed.
     */
    replaceCurrentMatch(newText: string): Promise<boolean>;
    /**
     * Replace all matches in the notebook with the provided text
     * Not implemented in the CSV viewer as it is read-only.
     *
     * @returns A promise that resolves once the action has completed.
     */
    replaceAllMatches(newText: string): Promise<boolean>;
    /**
     * Signal indicating that something in the search has changed, so the UI should update
     */
    get changed(): ISignal<this, void>;
    /**
     * The same list of matches provided by the startQuery promise resolution
     */
    readonly matches: ISearchMatch[];
    /**
     * The current index of the selected match.
     */
    readonly currentMatchIndex: number | null;
    /**
     * Set to true if the widget under search is read-only, false
     * if it is editable.  Will be used to determine whether to show
     * the replace option.
     */
    readonly isReadOnly = true;
    private _target;
    private _query;
    private _changed;
}
