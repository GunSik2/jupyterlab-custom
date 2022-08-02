// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { VDomModel } from '@jupyterlab/ui-components';
import { JSONExt } from '@lumino/coreutils';
import { Debouncer } from '@lumino/polling';
import { Signal } from '@lumino/signaling';
/**
 * Search in a document model.
 */
export class SearchDocumentModel extends VDomModel {
    /**
     * Search document model
     * @param searchProvider Provider for the current document
     * @param searchDebounceTime Debounce search time
     */
    constructor(searchProvider, searchDebounceTime) {
        super();
        this.searchProvider = searchProvider;
        this._caseSensitive = false;
        this._disposed = new Signal(this);
        this._parsingError = '';
        this._filters = {};
        this._searchExpression = '';
        this._useRegex = false;
        this._filters = {};
        if (this.searchProvider.getFilters) {
            const filters = this.searchProvider.getFilters();
            for (const filter in filters) {
                this._filters[filter] = filters[filter].default;
            }
        }
        searchProvider.stateChanged.connect(this.refresh, this);
        this._searchDebouncer = new Debouncer(() => {
            this._updateSearch().catch(reason => {
                console.error('Failed to update search on document.', reason);
            });
        }, searchDebounceTime);
    }
    /**
     * Whether the search is case sensitive or not.
     */
    get caseSensitive() {
        return this._caseSensitive;
    }
    set caseSensitive(v) {
        if (this._caseSensitive !== v) {
            this._caseSensitive = v;
            this.stateChanged.emit();
            this.refresh();
        }
    }
    /**
     * Current highlighted match index.
     */
    get currentIndex() {
        return this.searchProvider.currentMatchIndex;
    }
    /**
     * A signal emitted when the object is disposed.
     */
    get disposed() {
        return this._disposed;
    }
    /**
     * Filter values.
     */
    get filters() {
        return this._filters;
    }
    set filters(v) {
        if (!JSONExt.deepEqual(this._filters, v)) {
            this._filters = v;
            this.stateChanged.emit();
            this.refresh();
        }
    }
    /**
     * Filter definitions for the current provider.
     */
    get filtersDefinition() {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.searchProvider).getFilters) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : {};
    }
    /**
     * The initial query string.
     */
    get initialQuery() {
        return this._searchExpression || this.searchProvider.getInitialQuery();
    }
    /**
     * Whether the document is read-only or not.
     */
    get isReadOnly() {
        return this.searchProvider.isReadOnly;
    }
    /**
     * Parsing regular expression error message.
     */
    get parsingError() {
        return this._parsingError;
    }
    /**
     * Replacement expression
     */
    get replaceText() {
        return this._replaceText;
    }
    set replaceText(v) {
        if (this._replaceText !== v) {
            this._replaceText = v;
            this.stateChanged.emit();
        }
    }
    /**
     * Search expression
     */
    get searchExpression() {
        return this._searchExpression;
    }
    set searchExpression(v) {
        if (this._searchExpression !== v) {
            this._searchExpression = v;
            this.stateChanged.emit();
            this.refresh();
        }
    }
    /**
     * Total number of matches.
     */
    get totalMatches() {
        return this.searchProvider.matchesCount;
    }
    /**
     * Whether to use regular expression or not.
     */
    get useRegex() {
        return this._useRegex;
    }
    set useRegex(v) {
        if (this._useRegex !== v) {
            this._useRegex = v;
            this.stateChanged.emit();
            this.refresh();
        }
    }
    /**
     * Dispose the model.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        if (this._searchExpression) {
            this.endQuery().catch(reason => {
                console.error(`Failed to end query '${this._searchExpression}.`, reason);
            });
        }
        this.searchProvider.stateChanged.disconnect(this.refresh, this);
        this._searchDebouncer.dispose();
        super.dispose();
    }
    /**
     * End the query.
     */
    async endQuery() {
        await this.searchProvider.endQuery();
        this.stateChanged.emit();
    }
    /**
     * Highlight the next match.
     */
    async highlightNext() {
        await this.searchProvider.highlightNext();
        // Emit state change as the index needs to be updated
        this.stateChanged.emit();
    }
    /**
     * Highlight the previous match
     */
    async highlightPrevious() {
        await this.searchProvider.highlightPrevious();
        // Emit state change as the index needs to be updated
        this.stateChanged.emit();
    }
    /**
     * Refresh search
     */
    refresh() {
        this._searchDebouncer.invoke().catch(reason => {
            console.error('Failed to invoke search document debouncer.', reason);
        });
    }
    /**
     * Replace all matches.
     */
    async replaceAllMatches() {
        await this.searchProvider.replaceAllMatches(this._replaceText);
        // Emit state change as the index needs to be updated
        this.stateChanged.emit();
    }
    /**
     * Replace the current match.
     */
    async replaceCurrentMatch() {
        await this.searchProvider.replaceCurrentMatch(this._replaceText);
        // Emit state change as the index needs to be updated
        this.stateChanged.emit();
    }
    async _updateSearch() {
        if (this._parsingError) {
            this._parsingError = '';
            this.stateChanged.emit();
        }
        try {
            const query = this.searchExpression
                ? Private.parseQuery(this.searchExpression, this.caseSensitive, this.useRegex)
                : null;
            if (query) {
                await this.searchProvider.startQuery(query, this._filters);
                // Emit state change as the index needs to be updated
                this.stateChanged.emit();
            }
        }
        catch (reason) {
            this._parsingError = reason;
            this.stateChanged.emit();
            console.error(`Failed to parse expression ${this.searchExpression}`, reason);
        }
    }
}
var Private;
(function (Private) {
    /**
     * Build the regular expression to use for searching.
     *
     * @param queryString Query string
     * @param caseSensitive Whether the search is case sensitive or not
     * @param regex Whether the expression is a regular expression
     * @returns The regular expression to use
     */
    function parseQuery(queryString, caseSensitive, regex) {
        const flag = caseSensitive ? 'g' : 'gi';
        // escape regex characters in query if its a string search
        const queryText = regex
            ? queryString
            : queryString.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
        let ret;
        ret = new RegExp(queryText, flag);
        // If the empty string is hit, the search logic will freeze the browser tab
        //  Trying /^/ or /$/ on the codemirror search demo, does not find anything.
        //  So this is a limitation of the editor.
        if (ret.test('')) {
            return null;
        }
        return ret;
    }
    Private.parseQuery = parseQuery;
})(Private || (Private = {}));
//# sourceMappingURL=searchmodel.js.map