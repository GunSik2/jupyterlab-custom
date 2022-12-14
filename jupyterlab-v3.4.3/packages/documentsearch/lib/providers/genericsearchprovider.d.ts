import { ISignal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import { ISearchMatch, ISearchProvider } from '../interfaces';
export declare const FOUND_CLASSES: string[];
export declare class GenericSearchProvider implements ISearchProvider<Widget> {
    /**
     * We choose opt out as most node types should be searched (e.g. script).
     * Even nodes like <data>, could have textContent we care about.
     *
     * Note: nodeName is capitalized, so we do the same here
     */
    static UNSUPPORTED_ELEMENTS: {
        BASE: boolean;
        HEAD: boolean;
        LINK: boolean;
        META: boolean;
        STYLE: boolean;
        TITLE: boolean;
        BODY: boolean;
        AREA: boolean;
        AUDIO: boolean;
        IMG: boolean;
        MAP: boolean;
        TRACK: boolean;
        VIDEO: boolean;
        APPLET: boolean;
        EMBED: boolean;
        IFRAME: boolean;
        NOEMBED: boolean;
        OBJECT: boolean;
        PARAM: boolean;
        PICTURE: boolean;
        SOURCE: boolean;
        CANVAS: boolean;
        NOSCRIPT: boolean;
        SCRIPT: boolean;
        SVG: boolean;
    };
    /**
     * Get an initial query value if applicable so that it can be entered
     * into the search box as an initial query
     *
     * @returns Initial value used to populate the search box.
     */
    getInitialQuery(searchTarget: Widget): any;
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
    refreshOverlay(): void;
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
    private _highlightNext;
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
    static canSearchOn(domain: Widget): boolean;
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
    get currentMatch(): ISearchMatch | null;
    /**
     * Set to true if the widget under search is read-only, false
     * if it is editable.  Will be used to determine whether to show
     * the replace option.
     */
    readonly isReadOnly = true;
    clearSelection(): void;
    /**
     * Set whether or not this will wrap to the beginning
     * or end of the document on invocations of highlightNext or highlightPrevious, respectively
     */
    isSubProvider: boolean;
    private _onWidgetChanged;
    private _query;
    private _widget;
    private _currentMatch;
    private _matches;
    private _mutationObserver;
    private _changed;
}
export interface IGenericSearchMatch extends ISearchMatch {
    readonly originalNode: Node;
    readonly spanElement: HTMLElement;
    readonly indexInOriginal: number;
    /**
     * Index in the matches array
     */
    readonly matchesIndex: number;
}
