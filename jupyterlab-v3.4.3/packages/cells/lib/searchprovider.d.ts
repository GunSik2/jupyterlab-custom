import { CodeMirrorSearchHighlighter } from '@jupyterlab/codemirror';
import { IBaseSearchProvider, IFilters, ISearchMatch } from '@jupyterlab/documentsearch';
import { IObservableString } from '@jupyterlab/observables';
import { ISignal, Signal } from '@lumino/signaling';
import { ICellModel } from './model';
import { Cell } from './widget';
/**
 * Class applied on highlighted search matches
 */
export declare const SELECTED_HIGHLIGHT_CLASS = "jp-mod-selected";
/**
 * Search provider for cells.
 */
export declare class CellSearchProvider implements IBaseSearchProvider {
    protected cell: Cell<ICellModel>;
    /**
     * Constructor
     *
     * @param cell Cell widget
     */
    constructor(cell: Cell<ICellModel>);
    /**
     * Changed signal to be emitted when search matches change.
     */
    get stateChanged(): ISignal<IBaseSearchProvider, void>;
    /**
     * Current match index
     */
    get currentMatchIndex(): number | null;
    /**
     * Whether the cell search is active.
     *
     * This is used when applying search only on selected cells.
     */
    get isActive(): boolean;
    /**
     * Whether the search provider is disposed or not.
     */
    get isDisposed(): boolean;
    /**
     * Number of matches in the cell.
     */
    get matchesCount(): number;
    /**
     * Clear currently highlighted match
     */
    clearHighlight(): Promise<void>;
    /**
     * Dispose the search provider
     */
    dispose(): void;
    /**
     * Set `isActive` status.
     *
     * #### Notes
     * It will start or end the search
     *
     * @param v New value
     */
    setIsActive(v: boolean): Promise<void>;
    /**
     * Initialize the search using the provided options. Should update the UI
     * to highlight all matches and "select" the first match.
     *
     * @param query A RegExp to be use to perform the search
     * @param filters Filter parameters to pass to provider
     */
    startQuery(query: RegExp | null, filters?: IFilters): Promise<void>;
    /**
     * Stop the search and clean any UI elements.
     */
    endQuery(): Promise<void>;
    /**
     * Highlight the next match.
     *
     * @returns The next match if there is one.
     */
    highlightNext(): Promise<ISearchMatch | undefined>;
    /**
     * Highlight the previous match.
     *
     * @returns The previous match if there is one.
     */
    highlightPrevious(): Promise<ISearchMatch | undefined>;
    /**
     * Replace the currently selected match with the provided text.
     *
     * If no match is selected, it won't do anything.
     *
     * @param newText The replacement text.
     * @returns Whether a replace occurred.
     */
    replaceCurrentMatch(newText: string): Promise<boolean>;
    /**
     * Replace all matches in the cell source with the provided text
     *
     * @param newText The replacement text.
     * @returns Whether a replace occurred.
     */
    replaceAllMatches(newText: string): Promise<boolean>;
    /**
     * Get the current match if it exists.
     *
     * @returns The current match
     */
    protected getCurrentMatch(): ISearchMatch | undefined;
    /**
     * Callback on source change
     *
     * @param content Cell source
     * @param changes Source change
     */
    protected onInputChanged(content: IObservableString, changes?: IObservableString.IChangedArgs): Promise<void>;
    private _updateCodeMirror;
    /**
     * CodeMirror search highlighter
     */
    protected cmHandler: CodeMirrorSearchHighlighter;
    /**
     * Current match index
     */
    protected currentIndex: number | null;
    /**
     * Current search filters
     */
    protected filters: IFilters | undefined;
    /**
     * Current search query
     */
    protected query: RegExp | null;
    protected _stateChanged: Signal<IBaseSearchProvider, void>;
    private _isActive;
    private _isDisposed;
    private _lastReplacementPosition;
}
/**
 * Factory to create a cell search provider
 *
 * @param cell Cell widget
 * @returns Cell search provider
 */
export declare function createCellSearchProvider(cell: Cell<ICellModel>): CellSearchProvider;
