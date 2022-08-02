// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { Signal } from '@lumino/signaling';
/**
 * Abstract class implementing the search provider interface.
 */
export class SearchProvider {
    /**
     * Constructor
     *
     * @param widget The widget to search in
     */
    constructor(widget) {
        this.widget = widget;
        this._stateChanged = new Signal(this);
        this._disposed = false;
    }
    /**
     * Signal indicating that something in the search has changed, so the UI should update
     */
    get stateChanged() {
        return this._stateChanged;
    }
    /**
     * The current index of the selected match.
     */
    get currentMatchIndex() {
        return null;
    }
    /**
     * Whether the search provider is disposed or not.
     */
    get isDisposed() {
        return this._disposed;
    }
    /**
     * The number of matches.
     */
    get matchesCount() {
        return null;
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
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        Signal.clearData(this);
    }
    /**
     * Get an initial query value if applicable so that it can be entered
     * into the search box as an initial query
     *
     * @returns Initial value used to populate the search box.
     */
    getInitialQuery() {
        return '';
    }
    /**
     * Get the filters for the given provider.
     *
     * @returns The filters.
     *
     * ### Notes
     * TODO For now it only supports boolean filters (represented with checkboxes)
     */
    getFilters() {
        return {};
    }
}
//# sourceMappingURL=searchprovider.js.map