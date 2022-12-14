// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { CSVViewer } from '@jupyterlab/csvviewer';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { Signal } from '@lumino/signaling';
export class CSVSearchProvider {
    constructor() {
        /**
         * The same list of matches provided by the startQuery promise resolution
         */
        this.matches = [];
        /**
         * The current index of the selected match.
         */
        this.currentMatchIndex = null;
        /**
         * Set to true if the widget under search is read-only, false
         * if it is editable.  Will be used to determine whether to show
         * the replace option.
         */
        this.isReadOnly = true;
        this._changed = new Signal(this);
    }
    /**
     * Report whether or not this provider has the ability to search on the given object
     */
    static canSearchOn(domain) {
        // check to see if the CSVSearchProvider can search on the
        // first cell, false indicates another editor is present
        return (domain instanceof DocumentWidget && domain.content instanceof CSVViewer);
    }
    /**
     * Get an initial query value if applicable so that it can be entered
     * into the search box as an initial query
     *
     * @returns Initial value used to populate the search box.
     */
    getInitialQuery(searchTarget) {
        // CSV Viewer does not support selection
        return null;
    }
    /**
     * Initialize the search using the provided options.  Should update the UI
     * to highlight all matches and "select" whatever the first match should be.
     *
     * @param query A RegExp to be use to perform the search
     * @param searchTarget The widget to be searched
     *
     * @returns A promise that resolves with a list of all matches
     */
    async startQuery(query, searchTarget) {
        this._target = searchTarget;
        this._query = query;
        searchTarget.content.searchService.find(query);
        return this.matches;
    }
    /**
     * Clears state of a search provider to prepare for startQuery to be called
     * in order to start a new query or refresh an existing one.
     *
     * @returns A promise that resolves when the search provider is ready to
     * begin a new search.
     */
    async endQuery() {
        this._target.content.searchService.clear();
    }
    /**
     * Resets UI state as it was before the search process began.  Cleans up and
     * disposes of all internal state.
     *
     * @returns A promise that resolves when all state has been cleaned up.
     */
    async endSearch() {
        this._target.content.searchService.clear();
    }
    /**
     * Move the current match indicator to the next match.
     *
     * @returns A promise that resolves once the action has completed.
     */
    async highlightNext() {
        this._target.content.searchService.find(this._query);
        return undefined;
    }
    /**
     * Move the current match indicator to the previous match.
     *
     * @returns A promise that resolves once the action has completed.
     */
    async highlightPrevious() {
        this._target.content.searchService.find(this._query, true);
        return undefined;
    }
    /**
     * Replace the currently selected match with the provided text
     * Not implemented in the CSV viewer as it is read-only.
     *
     * @returns A promise that resolves once the action has completed.
     */
    async replaceCurrentMatch(newText) {
        return false;
    }
    /**
     * Replace all matches in the notebook with the provided text
     * Not implemented in the CSV viewer as it is read-only.
     *
     * @returns A promise that resolves once the action has completed.
     */
    async replaceAllMatches(newText) {
        return false;
    }
    /**
     * Signal indicating that something in the search has changed, so the UI should update
     */
    get changed() {
        return this._changed;
    }
}
//# sourceMappingURL=searchprovider.js.map