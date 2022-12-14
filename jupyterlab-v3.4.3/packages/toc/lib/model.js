// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { VDomModel } from '@jupyterlab/ui-components';
import { JSONExt } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';
import { TableOfContents } from './tokens';
/**
 * Abstract table of contents model.
 */
export class TableOfContentsModel extends VDomModel {
    /**
     * Constructor
     *
     * @param widget The widget to search in
     * @param configuration Default model configuration
     */
    constructor(widget, configuration) {
        super();
        this.widget = widget;
        this._activeHeading = null;
        this._activeHeadingChanged = new Signal(this);
        this._collapseChanged = new Signal(this);
        this._configuration = configuration !== null && configuration !== void 0 ? configuration : Object.assign({}, TableOfContents.defaultConfig);
        this._headings = new Array();
        this._headingsChanged = new Signal(this);
        this._isActive = false;
        this._isRefreshing = false;
        this._needsRefreshing = false;
    }
    /**
     * Current active entry.
     *
     * @returns table of contents active entry
     */
    get activeHeading() {
        return this._activeHeading;
    }
    /**
     * Signal emitted when the active heading changes.
     */
    get activeHeadingChanged() {
        return this._activeHeadingChanged;
    }
    /**
     * Signal emitted when a table of content section collapse state changes.
     */
    get collapseChanged() {
        return this._collapseChanged;
    }
    /**
     * Model configuration
     */
    get configuration() {
        return this._configuration;
    }
    /**
     * List of headings.
     *
     * @returns table of contents list of headings
     */
    get headings() {
        return this._headings;
    }
    /**
     * Signal emitted when the headings changes.
     */
    get headingsChanged() {
        return this._headingsChanged;
    }
    /**
     * Whether the model is active or not.
     *
     * #### Notes
     * An active model means it is displayed in the table of contents.
     * This can be used by subclass to limit updating the headings.
     */
    get isActive() {
        return this._isActive;
    }
    set isActive(v) {
        this._isActive = v;
        // Refresh on activation expect if it is always active
        //  => a ToC model is always active e.g. when displaying numbering in the document
        if (this._isActive && !this.isAlwaysActive) {
            this.refresh().catch(reason => {
                console.error('Failed to refresh ToC model.', reason);
            });
        }
    }
    /**
     * Whether the model gets updated even if the table of contents panel
     * is hidden or not.
     *
     * #### Notes
     * For example, ToC models use to add title numbering will
     * set this to true.
     */
    get isAlwaysActive() {
        return false;
    }
    /**
     * List of configuration options supported by the model.
     */
    get supportedOptions() {
        return ['maximalDepth'];
    }
    /**
     * Document title
     */
    get title() {
        return this._title;
    }
    set title(v) {
        if (v !== this._title) {
            this._title = v;
            this.stateChanged.emit();
        }
    }
    /**
     * Refresh the headings list.
     */
    async refresh() {
        if (this._isRefreshing) {
            // Schedule a refresh if one is in progress
            this._needsRefreshing = true;
            return Promise.resolve();
        }
        this._isRefreshing = true;
        try {
            const newHeadings = await this.getHeadings();
            if (this._needsRefreshing) {
                this._needsRefreshing = false;
                this._isRefreshing = false;
                return this.refresh();
            }
            if (newHeadings &&
                !Private.areHeadingsEqual(newHeadings, this._headings)) {
                this._headings = newHeadings;
                this.stateChanged.emit();
                this._headingsChanged.emit();
            }
        }
        finally {
            this._isRefreshing = false;
        }
    }
    /**
     * Set a new active heading.
     *
     * @param heading The new active heading
     * @param emitSignal Whether to emit the activeHeadingChanged signal or not.
     */
    setActiveHeading(heading, emitSignal = true) {
        if (this._activeHeading !== heading) {
            this._activeHeading = heading;
            this.stateChanged.emit();
            if (emitSignal) {
                this._activeHeadingChanged.emit(heading);
            }
        }
    }
    /**
     * Model configuration setter.
     *
     * @param c New configuration
     */
    setConfiguration(c) {
        const newConfiguration = Object.assign(Object.assign({}, this._configuration), c);
        if (!JSONExt.deepEqual(this._configuration, newConfiguration)) {
            this._configuration = newConfiguration;
            this.refresh().catch(reason => {
                console.error('Failed to update the table of contents.', reason);
            });
        }
    }
    /**
     * Callback on heading collapse.
     *
     * @param options.heading The heading to change state (all headings if not provided)
     * @param options.collapsed The new collapsed status (toggle existing status if not provided)
     */
    toggleCollapse(options) {
        var _a, _b;
        if (options.heading) {
            options.heading.collapsed =
                (_a = options.collapsed) !== null && _a !== void 0 ? _a : !options.heading.collapsed;
            this.stateChanged.emit();
            this._collapseChanged.emit(options.heading);
        }
        else {
            // Use the provided state or collapsed all except if all are collapsed
            const newState = (_b = options.collapsed) !== null && _b !== void 0 ? _b : !this.headings.some(h => { var _a; return !((_a = h.collapsed) !== null && _a !== void 0 ? _a : false); });
            this.headings.forEach(h => (h.collapsed = newState));
            this.stateChanged.emit();
            this._collapseChanged.emit(null);
        }
    }
}
/**
 * Private functions namespace
 */
var Private;
(function (Private) {
    /**
     * Test if two list of headings are equal or not.
     *
     * @param headings1 First list of headings
     * @param headings2 Second list of headings
     * @returns Whether the array are identical or not.
     */
    function areHeadingsEqual(headings1, headings2) {
        if (headings1.length === headings2.length) {
            for (let i = 0; i < headings1.length; i++) {
                if (headings1[i].level !== headings2[i].level ||
                    headings1[i].text !== headings2[i].text ||
                    headings1[i].prefix !== headings2[i].prefix) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
    Private.areHeadingsEqual = areHeadingsEqual;
})(Private || (Private = {}));
//# sourceMappingURL=model.js.map