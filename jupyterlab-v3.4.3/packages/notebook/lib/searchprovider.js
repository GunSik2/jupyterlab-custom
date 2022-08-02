// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { createCellSearchProvider, SELECTED_HIGHLIGHT_CLASS } from '@jupyterlab/cells';
import { SearchProvider } from '@jupyterlab/documentsearch';
import { nullTranslator } from '@jupyterlab/translation';
import { ArrayExt } from '@lumino/algorithm';
import { NotebookPanel } from './panel';
/**
 * Notebook document search provider
 */
export class NotebookSearchProvider extends SearchProvider {
    /**
     * Constructor
     *
     * @param widget The widget to search in
     * @param translator Application translator
     */
    constructor(widget, translator = nullTranslator) {
        super(widget);
        this.translator = translator;
        this._currentProviderIndex = null;
        this._onSelectedCells = false;
        this._query = null;
        this._searchProviders = [];
        this._documentHasChanged = false;
        this.widget.model.cells.changed.connect(this._onCellsChanged, this);
        this.widget.content.activeCellChanged.connect(this._onActiveCellChanged, this);
        this.widget.content.placeholderCellRendered.connect(this._onPlaceholderRendered, this);
    }
    /**
     * Report whether or not this provider has the ability to search on the given object
     *
     * @param domain Widget to test
     * @returns Search ability
     */
    static isApplicable(domain) {
        // check to see if the CMSearchProvider can search on the
        // first cell, false indicates another editor is present
        return domain instanceof NotebookPanel;
    }
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
    static createNew(widget, translator) {
        return new NotebookSearchProvider(widget, translator);
    }
    /**
     * The current index of the selected match.
     */
    get currentMatchIndex() {
        let agg = 0;
        let found = false;
        for (let idx = 0; idx < this._searchProviders.length; idx++) {
            const provider = this._searchProviders[idx];
            const localMatch = provider.currentMatchIndex;
            if (localMatch !== null) {
                agg += localMatch;
                found = true;
                break;
            }
            else {
                agg += provider.matchesCount;
            }
        }
        return found ? agg : null;
    }
    /**
     * The number of matches.
     */
    get matchesCount() {
        return this._searchProviders.reduce((sum, provider) => (sum += provider.matchesCount), 0);
    }
    /**
     * Set to true if the widget under search is read-only, false
     * if it is editable.  Will be used to determine whether to show
     * the replace option.
     */
    get isReadOnly() {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.widget) === null || _a === void 0 ? void 0 : _a.content.model) === null || _b === void 0 ? void 0 : _b.readOnly) !== null && _c !== void 0 ? _c : false;
    }
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
    dispose() {
        var _a;
        if (this.isDisposed) {
            return;
        }
        this.widget.content.placeholderCellRendered.disconnect(this._onPlaceholderRendered, this);
        this.widget.content.activeCellChanged.disconnect(this._onActiveCellChanged, this);
        (_a = this.widget.model) === null || _a === void 0 ? void 0 : _a.cells.changed.disconnect(this._onCellsChanged, this);
        super.dispose();
        const index = this.widget.content.activeCellIndex;
        this.endQuery()
            .then(() => {
            if (!this.widget.isDisposed) {
                this.widget.content.activeCellIndex = index;
            }
        })
            .catch(reason => {
            console.error(`Fail to end search query in notebook:\n${reason}`);
        });
    }
    /**
     * Get the filters for the given provider.
     *
     * @returns The filters.
     */
    getFilters() {
        const trans = this.translator.load('jupyterlab');
        return {
            output: {
                title: trans.__('Search Cell Outputs'),
                description: trans.__('Search in the cell outputs.'),
                default: false,
                supportReplace: false
            },
            selectedCells: {
                title: trans.__('Search Selected Cell(s)'),
                description: trans.__('Search only in the selected cell(s).'),
                default: false,
                supportReplace: true
            }
        };
    }
    /**
     * Get an initial query value if applicable so that it can be entered
     * into the search box as an initial query
     *
     * @returns Initial value used to populate the search box.
     */
    getInitialQuery() {
        var _a;
        const activeCell = this.widget.content.activeCell;
        const selection = (_a = activeCell === null || activeCell === void 0 ? void 0 : activeCell.editor) === null || _a === void 0 ? void 0 : _a.doc.getSelection();
        // if there are newlines, just return empty string
        return (selection === null || selection === void 0 ? void 0 : selection.search(/\r?\n|\r/g)) === -1 ? selection : '';
    }
    /**
     * Clear currently highlighted match.
     */
    async clearHighlight() {
        if (this._currentProviderIndex !== null) {
            await this._searchProviders[this._currentProviderIndex].clearHighlight();
            this._currentProviderIndex = null;
        }
    }
    /**
     * Highlight the next match.
     *
     * @param loop Whether to loop within the matches list.
     *
     * @returns The next match if available.
     */
    async highlightNext(loop = true) {
        const match = await this._stepNext(false, loop);
        return match !== null && match !== void 0 ? match : undefined;
    }
    /**
     * Highlight the previous match.
     *
     * @param loop Whether to loop within the matches list.
     *
     * @returns The previous match if available.
     */
    async highlightPrevious(loop = true) {
        const match = await this._stepNext(true, loop);
        return match !== null && match !== void 0 ? match : undefined;
    }
    /**
     * Search for a regular expression with optional filters.
     *
     * @param query A regular expression to test for
     * @param filters Filter parameters to pass to provider
     *
     */
    async startQuery(query, filters) {
        if (!this.widget) {
            return;
        }
        await this.endQuery();
        let cells = this.widget.content.widgets;
        this._query = query;
        this._filters = Object.assign({ output: false, selectedCells: false }, (filters !== null && filters !== void 0 ? filters : {}));
        this._onSelectedCells = this._filters.selectedCells;
        if (this._filters.selectedCells) {
            this.widget.content.selectionChanged.connect(this._onSelectionChanged, this);
        }
        // For each cell, create a search provider
        this._searchProviders = await Promise.all(cells.map(async (cell) => {
            const cellSearchProvider = createCellSearchProvider(cell);
            cellSearchProvider.stateChanged.connect(this._onSearchProviderChanged, this);
            await cellSearchProvider.setIsActive(!this._filters.selectedCells ||
                this.widget.content.isSelectedOrActive(cell));
            await cellSearchProvider.startQuery(query, this._filters);
            return cellSearchProvider;
        }));
        this._currentProviderIndex = this.widget.content.activeCellIndex;
        if (!this._documentHasChanged) {
            await this.highlightNext(false);
        }
        this._documentHasChanged = false;
        return Promise.resolve();
    }
    /**
     * Stop the search and clear all internal state.
     */
    async endQuery() {
        await Promise.all(this._searchProviders.map(provider => {
            provider.stateChanged.disconnect(this._onSearchProviderChanged, this);
            return provider.endQuery().then(() => {
                provider.dispose();
            });
        }));
        this._searchProviders.length = 0;
        this._currentProviderIndex = null;
    }
    /**
     * Replace the currently selected match with the provided text
     *
     * @param newText The replacement text.
     * @param loop Whether to loop within the matches list.
     *
     * @returns A promise that resolves with a boolean indicating whether a replace occurred.
     */
    async replaceCurrentMatch(newText, loop = true) {
        let replaceOccurred = false;
        const unrenderMarkdownCell = async (highlightNext = false) => {
            var _a;
            // Unrendered markdown cell
            const activeCell = (_a = this.widget) === null || _a === void 0 ? void 0 : _a.content.activeCell;
            if ((activeCell === null || activeCell === void 0 ? void 0 : activeCell.model.type) === 'markdown' &&
                activeCell.rendered) {
                activeCell.rendered = false;
                if (highlightNext) {
                    await this.highlightNext(loop);
                }
            }
        };
        if (this._currentProviderIndex !== null) {
            await unrenderMarkdownCell();
            const searchEngine = this._searchProviders[this._currentProviderIndex];
            replaceOccurred = await searchEngine.replaceCurrentMatch(newText);
        }
        await this.highlightNext(loop);
        // Force highlighting the first hit in the unrendered cell
        await unrenderMarkdownCell(true);
        return replaceOccurred;
    }
    /**
     * Replace all matches in the notebook with the provided text
     *
     * @param newText The replacement text.
     *
     * @returns A promise that resolves with a boolean indicating whether a replace occurred.
     */
    async replaceAllMatches(newText) {
        const replacementOccurred = await Promise.all(this._searchProviders.map(provider => {
            return provider.replaceAllMatches(newText);
        }));
        return replacementOccurred.includes(true);
    }
    _addCellProvider(index) {
        var _a, _b;
        const cell = this.widget.content.widgets[index];
        const cellSearchProvider = createCellSearchProvider(cell);
        cellSearchProvider.stateChanged.connect(this._onSearchProviderChanged, this);
        ArrayExt.insert(this._searchProviders, index, cellSearchProvider);
        cellSearchProvider
            .setIsActive(!((_b = (_a = this._filters) === null || _a === void 0 ? void 0 : _a.selectedCells) !== null && _b !== void 0 ? _b : false) ||
            this.widget.content.isSelectedOrActive(cell))
            .then(() => {
            cellSearchProvider.startQuery(this._query, this._filters);
        });
    }
    _removeCellProvider(index) {
        const provider = ArrayExt.removeAt(this._searchProviders, index);
        provider === null || provider === void 0 ? void 0 : provider.stateChanged.disconnect(this._onSearchProviderChanged, this);
        provider === null || provider === void 0 ? void 0 : provider.dispose();
    }
    async _onCellsChanged(cells, changes) {
        await this.clearHighlight();
        switch (changes.type) {
            case 'add':
                changes.newValues.forEach((model, index) => {
                    this._addCellProvider(changes.newIndex + index);
                });
                break;
            case 'move':
                ArrayExt.move(this._searchProviders, changes.oldIndex, changes.newIndex);
                break;
            case 'remove':
                for (let index = 0; index < changes.oldValues.length; index++) {
                    this._removeCellProvider(changes.oldIndex);
                }
                break;
            case 'set':
                changes.newValues.forEach((model, index) => {
                    this._addCellProvider(changes.newIndex + index);
                    this._removeCellProvider(changes.newIndex + index + 1);
                });
                break;
        }
        this._onSearchProviderChanged();
    }
    _onPlaceholderRendered(panel, renderedCell) {
        const index = panel.widgets.findIndex(cell => cell.id === renderedCell.id);
        if (index >= 0) {
            void this._onCellsChanged(panel.model.cells, {
                newIndex: index,
                newValues: [renderedCell.model],
                oldIndex: index,
                oldValues: [renderedCell.model],
                type: 'set'
            });
        }
    }
    async _stepNext(reverse = false, loop = false) {
        const activateNewMatch = () => {
            var _a;
            if (this.widget.content.activeCellIndex !== this._currentProviderIndex) {
                this.widget.content.activeCellIndex = this._currentProviderIndex;
            }
            const activeCell = this.widget.content.activeCell;
            // Unhide cell
            if (activeCell.inputHidden) {
                activeCell.inputHidden = false;
            }
            // scroll to newly activate highlight
            const containerRect = this.widget.content.node.getBoundingClientRect();
            const element = (_a = activeCell.node.querySelector(`.${SELECTED_HIGHLIGHT_CLASS}`)) !== null && _a !== void 0 ? _a : activeCell.node.querySelector('.CodeMirror-selected');
            if (element) {
                const elementRect = element.getBoundingClientRect();
                if (elementRect.top < containerRect.top ||
                    elementRect.top > containerRect.bottom) {
                    element.scrollIntoView({ block: 'center' });
                }
            }
        };
        if (this._currentProviderIndex === null) {
            this._currentProviderIndex = this.widget.content.activeCellIndex;
        }
        const startIndex = this._currentProviderIndex;
        do {
            const searchEngine = this._searchProviders[this._currentProviderIndex];
            const match = reverse
                ? await searchEngine.highlightPrevious()
                : await searchEngine.highlightNext();
            if (match) {
                activateNewMatch();
                return match;
            }
            else {
                this._currentProviderIndex =
                    this._currentProviderIndex + (reverse ? -1 : 1);
                if (loop) {
                    // We loop on all cells, not hit found
                    if (this._currentProviderIndex === startIndex) {
                        break;
                    }
                    this._currentProviderIndex =
                        (this._currentProviderIndex + this._searchProviders.length) %
                            this._searchProviders.length;
                }
            }
        } while (0 <= this._currentProviderIndex &&
            this._currentProviderIndex < this._searchProviders.length);
        if (loop) {
            // Search a last time in the first provider as it may contain more
            // than one matches
            const searchEngine = this._searchProviders[this._currentProviderIndex];
            const match = reverse
                ? await searchEngine.highlightPrevious()
                : await searchEngine.highlightNext();
            if (match) {
                activateNewMatch();
                return match;
            }
        }
        this._currentProviderIndex = null;
        return null;
    }
    async _onActiveCellChanged() {
        await this._onSelectionChanged();
        if (this.widget.content.activeCellIndex !== this._currentProviderIndex) {
            await this.clearHighlight();
        }
    }
    _onSearchProviderChanged() {
        // Don't highlight the next occurrence when the query
        // follows a document change
        this._documentHasChanged = true;
        this._stateChanged.emit();
    }
    async _onSelectionChanged() {
        if (this._onSelectedCells) {
            const cells = this.widget.content.widgets;
            await Promise.all(this._searchProviders.map((provider, index) => provider.setIsActive(this.widget.content.isSelectedOrActive(cells[index]))));
            this._onSearchProviderChanged();
        }
    }
}
//# sourceMappingURL=searchprovider.js.map