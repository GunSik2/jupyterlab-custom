import { IBaseSearchProvider, ISearchMatch } from '@jupyterlab/documentsearch';
import { ISignal } from '@lumino/signaling';
import { CodeMirrorEditor } from './editor';
/**
 * CodeMirror search provider for file editor
 */
export declare class CodeMirrorSearchProvider implements IBaseSearchProvider {
    /**
     * Whether the search provider is disposed or not.
     */
    get isDisposed(): boolean;
    /**
     * Dispose the search provider
     */
    dispose(): void;
    /**
     * Initialize the search using a CodeMirrorEditor object.
     *
     * @param query the search regular expression
     */
    startQuery(query: RegExp): Promise<void>;
    /**
     * Refresh the search highlight overlay
     */
    refreshOverlay(): void;
    private _startQuery;
    /**
     * Clears state of a search provider to prepare for startQuery to be called
     * in order to start a new query or refresh an existing one.
     *
     * @param removeOverlay Whether to remove the search highlight overlay or not.
     */
    endQuery(removeOverlay?: boolean): Promise<void>;
    /**
     * Clear currently highlighted match.
     */
    clearHighlight(): Promise<void>;
    /**
     * Move the current match indicator to the next match.
     *
     * @param loop Whether to loop within the matches list.
     *
     * @returns A promise that resolves once the action has completed.
     */
    highlightNext(loop?: boolean): Promise<ISearchMatch | undefined>;
    /**
     * Move the current match indicator to the previous match.
     *
     * @param loop Whether to loop within the matches list.
     *
     * @returns A promise that resolves once the action has completed.
     */
    highlightPrevious(loop?: boolean): Promise<ISearchMatch | undefined>;
    /**
     * Replace the currently selected match with the provided text
     *
     * @param newText The replacement text
     * @param loop Whether to loop within the matches list.
     *
     * @returns A promise that resolves with a boolean indicating whether a replace occurred.
     */
    replaceCurrentMatch(newText: string, loop?: boolean): Promise<boolean>;
    /**
     * Replace all matches in the notebook with the provided text
     *
     * @param newText The replacement text
     *
     * @returns A promise that resolves with a boolean indicating whether a replace occurred.
     */
    replaceAllMatches(newText: string): Promise<boolean>;
    /**
     * The list of matches
     */
    get matches(): ISearchMatch[];
    /**
     * The number of matches.
     */
    get matchesCount(): number | null;
    /**
     * The current match
     */
    get currentMatch(): ISearchMatch | null;
    /**
     * Signal indicating that something in the search has changed, so the UI should update
     */
    get stateChanged(): ISignal<this, void>;
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
    protected editor: CodeMirrorEditor;
    private _query;
    private _currentMatch;
    private _matchState;
    private _changed;
    private _disposed;
    private _overlay;
}
/**
 * Helper class to highlight texts in a code mirror editor.
 *
 * Highlighted texts (aka `matches`) must be provided through
 * the `matches` attributes.
 */
export declare class CodeMirrorSearchHighlighter {
    /**
     * Constructor
     *
     * @param editor The CodeMirror editor
     */
    constructor(editor: CodeMirrorEditor);
    /**
     * The current index of the selected match.
     */
    get currentIndex(): number | null;
    /**
     * The list of matches
     */
    get matches(): ISearchMatch[];
    set matches(v: ISearchMatch[]);
    /**
     * Clear all highlighted matches
     */
    clearHighlight(): void;
    /**
     * Refresh the highlight matches overlay
     */
    refresh(): void;
    /**
     * Clear the highlighted matches.
     */
    endQuery(): Promise<void>;
    /**
     * Highlight the next match
     *
     * @returns The next match if available
     */
    highlightNext(): Promise<ISearchMatch | undefined>;
    /**
     * Highlight the previous match
     *
     * @returns The previous match if available
     */
    highlightPrevious(): Promise<ISearchMatch | undefined>;
    private _highlightCurrentMatch;
    private _refreshOverlay;
    private _getSearchOverlay;
    private _findNext;
    private _toEditorPos;
    private _cm;
    private _currentIndex;
    private _matches;
    private _overlay;
}
