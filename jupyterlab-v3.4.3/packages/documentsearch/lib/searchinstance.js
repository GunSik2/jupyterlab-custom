// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { MainAreaWidget } from '@jupyterlab/apputils';
import { NotebookPanel } from '@jupyterlab/notebook';
import { nullTranslator } from '@jupyterlab/translation';
import { Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import { createSearchOverlay } from './searchoverlay';
/**
 * Represents a search on a single widget.
 */
export class SearchInstance {
    constructor(widget, searchProvider, translator, searchDebounceTime = 500) {
        this._displayState = {
            currentIndex: 0,
            totalMatches: 0,
            caseSensitive: false,
            useRegex: false,
            searchText: '',
            query: null,
            errorMessage: '',
            searchInputFocused: true,
            replaceInputFocused: false,
            forceFocus: true,
            replaceText: '',
            replaceEntryShown: false,
            filters: { output: true, selectedCells: false },
            filtersOpen: false
        };
        this._displayUpdateSignal = new Signal(this);
        this._isDisposed = false;
        this._disposed = new Signal(this);
        this.translator = translator || nullTranslator;
        this._widget = widget;
        this._activeProvider = searchProvider;
        const initialQuery = this._activeProvider.getInitialQuery(this._widget);
        this._displayState.searchText = initialQuery || '';
        this._searchWidget = createSearchOverlay({
            widgetChanged: this._displayUpdateSignal,
            overlayState: this._displayState,
            onCaseSensitiveToggled: this._onCaseSensitiveToggled.bind(this),
            onRegexToggled: this._onRegexToggled.bind(this),
            onHighlightNext: this._highlightNext.bind(this),
            onHighlightPrevious: this._highlightPrevious.bind(this),
            onStartQuery: this._startQuery.bind(this),
            onReplaceCurrent: this._replaceCurrent.bind(this),
            onReplaceAll: this._replaceAll.bind(this),
            onEndSearch: this.dispose.bind(this),
            isReadOnly: this._activeProvider.isReadOnly,
            hasOutputs: this._activeProvider.hasOutputs || false,
            searchDebounceTime: searchDebounceTime,
            translator: this.translator
        });
        this._widget.disposed.connect(() => {
            this.dispose();
        });
        this._searchWidget.disposed.connect(() => {
            this._widget.activate();
            this.dispose();
        });
        // TODO: this does not update if the toolbar changes height.
        if (this._widget instanceof MainAreaWidget) {
            // Offset the position of the search widget to not cover the toolbar.
            this._searchWidget.node.style.top = `${this._widget.toolbar.node.clientHeight}px`;
        }
        if (this._widget instanceof NotebookPanel) {
            this._widget.content.activeCellChanged.connect(() => {
                if (this._displayState.query &&
                    this._displayState.filters.selectedCells) {
                    void this._startQuery(this._displayState.query, this._displayState.filters);
                }
            });
        }
        this._displaySearchWidget();
    }
    /**
     * The search widget.
     */
    get searchWidget() {
        return this._searchWidget;
    }
    /**
     * The search provider.
     */
    get provider() {
        return this._activeProvider;
    }
    /**
     * Focus the search widget input.
     */
    focusInput() {
        this._displayState.forceFocus = true;
        this._displayState.searchInputFocused = true;
        // Trigger a rerender without resetting the forceFocus.
        this._displayUpdateSignal.emit(this._displayState);
        this._displayState.forceFocus = false;
    }
    /**
     * Set the search text
     *
     * It does not trigger a view update.
     */
    setSearchText(search) {
        this._displayState.searchText = search;
    }
    /**
     * Set the replace text
     *
     * It does not trigger a view update.
     */
    setReplaceText(replace) {
        this._displayState.replaceText = replace;
    }
    /**
     * If there is a replace box, show it.
     */
    showReplace() {
        this._displayState.replaceEntryShown = true;
    }
    /**
     * Updates the match index and total display in the search widget.
     */
    updateIndices() {
        this._displayState.totalMatches = this._activeProvider.matches.length;
        this._displayState.currentIndex = this._activeProvider.currentMatchIndex;
        this._updateDisplay();
    }
    _updateDisplay() {
        // Reset the focus attribute to make sure we don't steal focus.
        this._displayState.forceFocus = false;
        // Trigger a rerender
        this._displayUpdateSignal.emit(this._displayState);
    }
    async _startQuery(query, filters) {
        // save the last query (or set it to the current query if this is the first)
        if (this._activeProvider && this._displayState.query) {
            await this._activeProvider.endQuery();
        }
        this._displayState.query = query;
        this._displayState.filters = filters;
        await this._activeProvider.startQuery(query, this._widget, filters);
        this.updateIndices();
        // this signal should get injected when the widget is
        // created and hooked up to react!
        this._activeProvider.changed.connect(this.updateIndices, this);
    }
    async _replaceCurrent(newText) {
        if (this._activeProvider && this._displayState.query) {
            await this._activeProvider.replaceCurrentMatch(newText);
            this.updateIndices();
        }
    }
    async _replaceAll(newText) {
        if (this._activeProvider && this._displayState.query) {
            await this._activeProvider.replaceAllMatches(newText);
            this.updateIndices();
        }
    }
    /**
     * Dispose of the resources held by the search instance.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._isDisposed = true;
        // If a query hasn't been executed yet, no need to call endSearch
        if (this._displayState.query) {
            void this._activeProvider.endSearch();
        }
        this._searchWidget.dispose();
        this._disposed.emit(undefined);
        Signal.clearData(this);
    }
    /**
     * Test if the object has been disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * A signal emitted when the object is disposed.
     */
    get disposed() {
        return this._disposed;
    }
    /**
     * Display search widget.
     */
    _displaySearchWidget() {
        if (!this._searchWidget.isAttached) {
            Widget.attach(this._searchWidget, this._widget.node);
        }
    }
    async _highlightNext() {
        if (!this._displayState.query) {
            return;
        }
        await this._activeProvider.highlightNext();
        this.updateIndices();
    }
    async _highlightPrevious() {
        if (!this._displayState.query) {
            return;
        }
        await this._activeProvider.highlightPrevious();
        this.updateIndices();
    }
    _onCaseSensitiveToggled() {
        this._displayState.caseSensitive = !this._displayState.caseSensitive;
        this._updateDisplay();
    }
    _onRegexToggled() {
        this._displayState.useRegex = !this._displayState.useRegex;
        this._updateDisplay();
    }
}
//# sourceMappingURL=searchinstance.js.map