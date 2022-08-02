// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { CodeMirrorSearchHighlighter } from '@jupyterlab/codemirror';
import { GenericSearchProvider, TextSearchEngine } from '@jupyterlab/documentsearch';
import { Signal } from '@lumino/signaling';
/**
 * Class applied on highlighted search matches
 */
export const SELECTED_HIGHLIGHT_CLASS = 'jp-mod-selected';
/**
 * Search provider for cells.
 */
export class CellSearchProvider {
    /**
     * Constructor
     *
     * @param cell Cell widget
     */
    constructor(cell) {
        this.cell = cell;
        /**
         * Current match index
         */
        this.currentIndex = null;
        /**
         * Current search query
         */
        this.query = null;
        this._isActive = true;
        this._isDisposed = false;
        this._lastReplacementPosition = null;
        this.currentIndex = null;
        this._stateChanged = new Signal(this);
        this.cmHandler = new CodeMirrorSearchHighlighter(this.cell.editor);
    }
    /**
     * Changed signal to be emitted when search matches change.
     */
    get stateChanged() {
        return this._stateChanged;
    }
    /**
     * Current match index
     */
    get currentMatchIndex() {
        return this.isActive ? this.currentIndex : null;
    }
    /**
     * Whether the cell search is active.
     *
     * This is used when applying search only on selected cells.
     */
    get isActive() {
        return this._isActive;
    }
    /**
     * Whether the search provider is disposed or not.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Number of matches in the cell.
     */
    get matchesCount() {
        return this.isActive ? this.cmHandler.matches.length : 0;
    }
    /**
     * Clear currently highlighted match
     */
    clearHighlight() {
        this.currentIndex = null;
        this.cmHandler.clearHighlight();
        return Promise.resolve();
    }
    /**
     * Dispose the search provider
     */
    dispose() {
        if (this._isDisposed) {
            return;
        }
        this._isDisposed = true;
        Signal.clearData(this);
        if (this.isActive) {
            this.endQuery().catch(reason => {
                console.error(`Failed to end search query on cells.`, reason);
            });
        }
    }
    /**
     * Set `isActive` status.
     *
     * #### Notes
     * It will start or end the search
     *
     * @param v New value
     */
    async setIsActive(v) {
        if (this._isActive !== v) {
            this._isActive = v;
        }
        if (this._isActive) {
            if (this.query !== null) {
                await this.startQuery(this.query, this.filters);
            }
        }
        else {
            await this.endQuery();
        }
    }
    /**
     * Initialize the search using the provided options. Should update the UI
     * to highlight all matches and "select" the first match.
     *
     * @param query A RegExp to be use to perform the search
     * @param filters Filter parameters to pass to provider
     */
    async startQuery(query, filters) {
        this.query = query;
        this.filters = filters;
        // Search input
        const content = this.cell.model.modelDB.get('value');
        await this._updateCodeMirror(content);
        content.changed.connect(this.onInputChanged, this);
    }
    /**
     * Stop the search and clean any UI elements.
     */
    async endQuery() {
        await this.cmHandler.endQuery();
        this.currentIndex = null;
    }
    /**
     * Highlight the next match.
     *
     * @returns The next match if there is one.
     */
    async highlightNext() {
        if (this.matchesCount === 0 || !this.isActive) {
            this.currentIndex = null;
        }
        else {
            if (this._lastReplacementPosition) {
                this.cell.editor.setCursorPosition(this._lastReplacementPosition);
                this._lastReplacementPosition = null;
            }
            // This starts from the cursor position
            let match = await this.cmHandler.highlightNext();
            if (match) {
                this.currentIndex = this.cmHandler.currentIndex;
            }
            else {
                this.currentIndex = null;
            }
            return match;
        }
        return Promise.resolve(this.getCurrentMatch());
    }
    /**
     * Highlight the previous match.
     *
     * @returns The previous match if there is one.
     */
    async highlightPrevious() {
        if (this.matchesCount === 0 || !this.isActive) {
            this.currentIndex = null;
        }
        else {
            // This starts from the cursor position
            let match = await this.cmHandler.highlightPrevious();
            if (match) {
                this.currentIndex = this.cmHandler.currentIndex;
            }
            else {
                this.currentIndex = null;
            }
            return match;
        }
        return Promise.resolve(this.getCurrentMatch());
    }
    /**
     * Replace the currently selected match with the provided text.
     *
     * If no match is selected, it won't do anything.
     *
     * @param newText The replacement text.
     * @returns Whether a replace occurred.
     */
    replaceCurrentMatch(newText) {
        if (!this.isActive) {
            return Promise.resolve(false);
        }
        let occurred = false;
        if (this.currentIndex !== null &&
            this.currentIndex < this.cmHandler.matches.length) {
            const editor = this.cell.editor;
            const selection = editor.doc.getSelection();
            const match = this.getCurrentMatch();
            // If cursor is not on a selection, highlight the next match
            if (selection !== (match === null || match === void 0 ? void 0 : match.text)) {
                this.currentIndex = null;
                // The next will be highlighted as a consequence of this returning false
            }
            else {
                this.cmHandler.matches.splice(this.currentIndex, 1);
                this.currentIndex = null;
                // Store the current position to highlight properly the next search hit
                this._lastReplacementPosition = editor.getCursorPosition();
                this.cell.model.value.text =
                    this.cell.model.value.text.slice(0, match.position) +
                        newText +
                        this.cell.model.value.text.slice(match.position + match.text.length);
                occurred = true;
            }
        }
        return Promise.resolve(occurred);
    }
    /**
     * Replace all matches in the cell source with the provided text
     *
     * @param newText The replacement text.
     * @returns Whether a replace occurred.
     */
    replaceAllMatches(newText) {
        if (!this.isActive) {
            return Promise.resolve(false);
        }
        let occurred = this.cmHandler.matches.length > 0;
        let src = this.cell.model.value.text;
        let lastEnd = 0;
        const finalSrc = this.cmHandler.matches.reduce((agg, match) => {
            const start = match.position;
            const end = start + match.text.length;
            const newStep = `${agg}${src.slice(lastEnd, start)}${newText}`;
            lastEnd = end;
            return newStep;
        }, '');
        if (occurred) {
            this.cmHandler.matches = [];
            this.currentIndex = null;
            this.cell.model.value.text = `${finalSrc}${src.slice(lastEnd)}`;
        }
        return Promise.resolve(occurred);
    }
    /**
     * Get the current match if it exists.
     *
     * @returns The current match
     */
    getCurrentMatch() {
        if (this.currentIndex === null) {
            return undefined;
        }
        else {
            let match = undefined;
            if (this.currentIndex < this.cmHandler.matches.length) {
                match = this.cmHandler.matches[this.currentIndex];
            }
            return match;
        }
    }
    /**
     * Callback on source change
     *
     * @param content Cell source
     * @param changes Source change
     */
    async onInputChanged(content, changes) {
        await this._updateCodeMirror(content);
        this._stateChanged.emit();
    }
    async _updateCodeMirror(content) {
        if (this.query !== null) {
            if (this.isActive) {
                this.cmHandler.matches = await TextSearchEngine.search(this.query, content.text);
            }
            else {
                this.cmHandler.matches = [];
            }
        }
    }
}
/**
 * Code cell search provider
 */
class CodeCellSearchProvider extends CellSearchProvider {
    /**
     * Constructor
     *
     * @param cell Cell widget
     */
    constructor(cell) {
        super(cell);
        this.currentProviderIndex = -1;
        this.outputsProvider = [];
        const outputs = this.cell.outputArea;
        this._onOutputsChanged(outputs, outputs.widgets.length).catch(reason => {
            console.error(`Failed to initialize search on cell outputs.`, reason);
        });
        outputs.outputLengthChanged.connect(this._onOutputsChanged, this);
        outputs.disposed.connect(() => {
            outputs.outputLengthChanged.disconnect(this._onOutputsChanged);
        }, this);
    }
    /**
     * Number of matches in the cell.
     */
    get matchesCount() {
        if (!this.isActive) {
            return 0;
        }
        return (super.matchesCount +
            this.outputsProvider.reduce((sum, provider) => { var _a; return sum + ((_a = provider.matchesCount) !== null && _a !== void 0 ? _a : 0); }, 0));
    }
    /**
     * Clear currently highlighted match.
     */
    async clearHighlight() {
        await super.clearHighlight();
        await Promise.all(this.outputsProvider.map(provider => provider.clearHighlight()));
    }
    /**
     * Dispose the search provider
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        super.dispose();
        this.outputsProvider.map(provider => {
            provider.dispose();
        });
        this.outputsProvider.length = 0;
    }
    /**
     * Highlight the next match.
     *
     * @returns The next match if there is one.
     */
    async highlightNext() {
        if (this.matchesCount === 0 || !this.isActive) {
            this.currentIndex = null;
        }
        else {
            if (this.currentProviderIndex === -1) {
                const match = await super.highlightNext();
                if (match) {
                    this.currentIndex = this.cmHandler.currentIndex;
                    return match;
                }
                else {
                    this.currentProviderIndex = 0;
                }
            }
            while (this.currentProviderIndex < this.outputsProvider.length) {
                const provider = this.outputsProvider[this.currentProviderIndex];
                const match = await provider.highlightNext(false);
                if (match) {
                    this.currentIndex =
                        super.matchesCount +
                            this.outputsProvider
                                .slice(0, this.currentProviderIndex)
                                .reduce((sum, provider) => { var _a; return (sum += (_a = provider.matchesCount) !== null && _a !== void 0 ? _a : 0); }, 0) +
                            provider.currentMatchIndex;
                    return match;
                }
                else {
                    this.currentProviderIndex += 1;
                }
            }
            this.currentProviderIndex = -1;
            this.currentIndex = null;
            return undefined;
        }
    }
    /**
     * Highlight the previous match.
     *
     * @returns The previous match if there is one.
     */
    async highlightPrevious() {
        if (this.matchesCount === 0 || !this.isActive) {
            this.currentIndex = null;
        }
        else {
            if (this.currentIndex === null) {
                this.currentProviderIndex = this.outputsProvider.length - 1;
            }
            while (this.currentProviderIndex >= 0) {
                const provider = this.outputsProvider[this.currentProviderIndex];
                const match = await provider.highlightPrevious(false);
                if (match) {
                    this.currentIndex =
                        super.matchesCount +
                            this.outputsProvider
                                .slice(0, this.currentProviderIndex)
                                .reduce((sum, provider) => { var _a; return (sum += (_a = provider.matchesCount) !== null && _a !== void 0 ? _a : 0); }, 0) +
                            provider.currentMatchIndex;
                    return match;
                }
                else {
                    this.currentProviderIndex -= 1;
                }
            }
            const match = await super.highlightPrevious();
            if (match) {
                this.currentIndex = this.cmHandler.currentIndex;
                return match;
            }
            else {
                this.currentIndex = null;
                return undefined;
            }
        }
    }
    /**
     * Initialize the search using the provided options. Should update the UI to highlight
     * all matches and "select" the first match.
     *
     * @param query A RegExp to be use to perform the search
     * @param filters Filter parameters to pass to provider
     */
    async startQuery(query, filters) {
        await super.startQuery(query, filters);
        // Search outputs
        if ((filters === null || filters === void 0 ? void 0 : filters.output) !== false && this.isActive) {
            await Promise.all(this.outputsProvider.map(provider => provider.startQuery(query)));
        }
    }
    async endQuery() {
        var _a;
        await super.endQuery();
        if (((_a = this.filters) === null || _a === void 0 ? void 0 : _a.output) !== false && this.isActive) {
            await Promise.all(this.outputsProvider.map(provider => provider.endQuery()));
        }
    }
    async _onOutputsChanged(outputArea, changes) {
        var _a;
        this.outputsProvider.forEach(provider => {
            provider.dispose();
        });
        this.outputsProvider.length = 0;
        this.currentProviderIndex = -1;
        this.outputsProvider = this.cell.outputArea.widgets.map(output => new GenericSearchProvider(output));
        if (this.isActive && this.query && ((_a = this.filters) === null || _a === void 0 ? void 0 : _a.output) !== false) {
            await Promise.all([
                this.outputsProvider.map(provider => {
                    provider.startQuery(this.query);
                })
            ]);
        }
        this._stateChanged.emit();
    }
}
/**
 * Markdown cell search provider
 */
class MarkdownCellSearchProvider extends CellSearchProvider {
    /**
     * Constructor
     *
     * @param cell Cell widget
     */
    constructor(cell) {
        super(cell);
        this._unrenderedByHighligh = false;
        this.renderedProvider = new GenericSearchProvider(cell.renderer);
    }
    /**
     * Clear currently highlighted match
     */
    async clearHighlight() {
        await super.clearHighlight();
        await this.renderedProvider.clearHighlight();
    }
    /**
     * Dispose the search provider
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        super.dispose();
        this.renderedProvider.dispose();
    }
    /**
     * Stop the search and clean any UI elements.
     */
    async endQuery() {
        await super.endQuery();
        await this.renderedProvider.endQuery();
    }
    /**
     * Highlight the next match.
     *
     * @returns The next match if there is one.
     */
    async highlightNext() {
        let match = undefined;
        if (!this.isActive) {
            return match;
        }
        const cell = this.cell;
        if (cell.rendered && this.matchesCount > 0) {
            // Unrender the cell
            this._unrenderedByHighligh = true;
            cell.rendered = false;
        }
        match = await super.highlightNext();
        return match;
    }
    /**
     * Highlight the previous match.
     *
     * @returns The previous match if there is one.
     */
    async highlightPrevious() {
        let match = undefined;
        const cell = this.cell;
        if (cell.rendered && this.matchesCount > 0) {
            // Unrender the cell if there are matches within the cell
            this._unrenderedByHighligh = true;
            cell.rendered = false;
        }
        match = await super.highlightPrevious();
        return match;
    }
    /**
     * Initialize the search using the provided options. Should update the UI
     * to highlight all matches and "select" the first match.
     *
     * @param query A RegExp to be use to perform the search
     * @param filters Filter parameters to pass to provider
     */
    async startQuery(query, filters) {
        await super.startQuery(query, filters);
        const cell = this.cell;
        if (cell.rendered) {
            this.onRenderedChanged(cell, cell.rendered);
        }
        cell.renderedChanged.connect(this.onRenderedChanged, this);
    }
    /**
     * Replace all matches in the cell source with the provided text
     *
     * @param newText The replacement text.
     * @returns Whether a replace occurred.
     */
    async replaceAllMatches(newText) {
        const result = await super.replaceAllMatches(newText);
        // if the cell is rendered force update
        if (this.cell.rendered) {
            this.cell.update();
        }
        return result;
    }
    /**
     * Callback on rendered state change
     *
     * @param cell Cell that emitted the change
     * @param rendered New rendered value
     */
    onRenderedChanged(cell, rendered) {
        if (!this._unrenderedByHighligh) {
            this.currentIndex = null;
        }
        this._unrenderedByHighligh = false;
        if (this.isActive) {
            if (rendered) {
                this.renderedProvider.startQuery(this.query);
            }
            else {
                // Force cursor position to ensure reverse search is working as expected
                cell.editor.setCursorPosition({ column: 0, line: 0 });
                this.renderedProvider.endQuery();
            }
        }
    }
}
/**
 * Factory to create a cell search provider
 *
 * @param cell Cell widget
 * @returns Cell search provider
 */
export function createCellSearchProvider(cell) {
    if (cell.isPlaceholder()) {
        return new CellSearchProvider(cell);
    }
    switch (cell.model.type) {
        case 'code':
            return new CodeCellSearchProvider(cell);
        case 'markdown':
            return new MarkdownCellSearchProvider(cell);
        default:
            return new CellSearchProvider(cell);
    }
}
//# sourceMappingURL=searchprovider.js.map