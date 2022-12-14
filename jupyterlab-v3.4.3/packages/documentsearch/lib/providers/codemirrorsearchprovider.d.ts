import { MainAreaWidget } from '@jupyterlab/apputils';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { FileEditor } from '@jupyterlab/fileeditor';
import { ISignal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import * as CodeMirror from 'codemirror';
import { ISearchMatch, ISearchProvider } from '../interfaces';
export declare type CMMainAreaWidget = MainAreaWidget<FileEditor> & {
    content: {
        editor: CodeMirrorEditor;
    };
};
export declare class CodeMirrorSearchProvider implements ISearchProvider<CMMainAreaWidget> {
    /**
     * Get an initial query value if applicable so that it can be entered
     * into the search box as an initial query
     *
     * @returns Initial value used to populate the search box.
     */
    getInitialQuery(searchTarget: CMMainAreaWidget): any;
    /**
     * Initialize the search using the provided options.  Should update the UI
     * to highlight all matches and "select" whatever the first match should be.
     *
     * @param query A RegExp to be use to perform the search
     * @param searchTarget The widget to be searched
     * @param [filters={}] Filter parameters to pass to provider
     *
     * @returns A promise that resolves with a list of all matches
     */
    startQuery(query: RegExp, searchTarget: Widget, filters?: {}): Promise<ISearchMatch[]>;
    /**
     * Initialize the search using a CodeMirrorEditor object.
     */
    startQueryCodeMirror(query: RegExp, searchTarget: CodeMirrorEditor): Promise<ISearchMatch[]>;
    refreshOverlay(): void;
    private _startQuery;
    /**
     * Clears state of a search provider to prepare for startQuery to be called
     * in order to start a new query or refresh an existing one.
     *
     * @returns A promise that resolves when the search provider is ready to
     * begin a new search.
     */
    endQuery(removeOverlay?: boolean): Promise<void>;
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
    static canSearchOn(domain: Widget): domain is CMMainAreaWidget;
    /**
     * The same list of matches provided by the startQuery promise resolution
     */
    get matches(): ISearchMatch[];
    get currentMatch(): ISearchMatch | null;
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
    clearSelection(): void;
    get editor(): CodeMirrorEditor;
    /**
     * Set whether or not the CodemirrorSearchProvider will wrap to the beginning
     * or end of the document on invocations of highlightNext or highlightPrevious, respectively
     */
    isSubProvider: boolean;
    private _onDocChanged;
    private _refreshOverlay;
    /**
     * Do a full search on the entire document.
     *
     * This manually constructs the initial match state across the whole
     * document. This must be done manually because the codemirror overlay
     * is lazy-loaded, so it will only tokenize lines that are in or near
     * the viewport.  This is sufficient for efficiently maintaining the
     * state when changes are made to the document, as changes occur in or
     * near the viewport, but to scan the whole document, a manual search
     * across the entire content is required.
     *
     * @param query The search term
     */
    private _setInitialMatches;
    private _getSearchOverlay;
    private _findNext;
    private _parseMatchesFromState;
    private _toEditorPos;
    private _currentMatchIsSelected;
    private _query;
    private _cm;
    private _currentMatch;
    private _matchState;
    private _changed;
    private _overlay;
}
export declare class SearchState {
    posFrom: CodeMirror.Position;
    posTo: CodeMirror.Position;
    lastQuery: string;
    query: RegExp;
}
