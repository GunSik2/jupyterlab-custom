// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { nullTranslator } from '@jupyterlab/translation';
import { Signal } from '@lumino/signaling';
/**
 * Class for managing notebook ToC generator options.
 *
 * @private
 */
class OptionsManager {
    /**
     * Returns an options manager.
     *
     * @param widget - table of contents widget
     * @param notebook - notebook tracker
     * @param options - generator options
     * @returns options manager
     */
    constructor(widget, notebook, options) {
        this._preRenderedToolbar = null;
        this._filtered = [];
        this._showCode = false;
        this._showMarkdown = false;
        this._showTags = false;
        this._tagTool = null;
        this._numbering = options.numbering;
        this._numberingH1 = options.numberingH1;
        this._includeOutput = options.includeOutput;
        this._syncCollapseState = options.syncCollapseState;
        this._widget = widget;
        this._notebook = notebook;
        this.sanitizer = options.sanitizer;
        this.storeTags = [];
        this.translator = options.translator || nullTranslator;
        this._collapseChanged = new Signal(this);
    }
    /**
     * Gets/sets the tag tool component.
     */
    set tagTool(tagTool) {
        this._tagTool = tagTool;
    }
    get tagTool() {
        return this._tagTool;
    }
    /**
     * Sets notebook meta data.
     */
    set notebookMetadata(value) {
        if (this._notebook.currentWidget != null) {
            this._notebook.currentWidget.model.metadata.set(value[0], value[1]);
        }
    }
    /**
     * Gets/sets ToC generator numbering.
     */
    set numbering(value) {
        this._numbering = value;
        this._widget.update();
        this.notebookMetadata = ['toc-autonumbering', this._numbering];
    }
    get numbering() {
        return this._numbering;
    }
    /**
     * Gets/sets ToC generator numbering h1 headers.
     */
    set numberingH1(value) {
        if (this._numberingH1 != value) {
            this._numberingH1 = value;
            this._widget.update();
        }
    }
    get numberingH1() {
        return this._numberingH1;
    }
    /**
     * Toggles whether cell outputs should be included in headings.
     */
    set includeOutput(value) {
        if (this._includeOutput != value) {
            this._includeOutput = value;
            this._widget.update();
        }
    }
    get includeOutput() {
        return this._includeOutput;
    }
    /**
     * Gets/sets option for ToC heading collapsing to be reflected in Notebook and vice versa
     */
    set syncCollapseState(value) {
        if (this._syncCollapseState != value) {
            this._syncCollapseState = value;
            this._widget.update();
        }
    }
    get syncCollapseState() {
        return this._syncCollapseState;
    }
    /**
     * Toggles whether to show code previews in the table of contents.
     */
    set showCode(value) {
        this._showCode = value;
        this.notebookMetadata = ['toc-showcode', this._showCode];
        this._widget.update();
    }
    get showCode() {
        return this._showCode;
    }
    /**
     * Toggles whether to show Markdown previews in the table of contents.
     */
    set showMarkdown(value) {
        this._showMarkdown = value;
        this.notebookMetadata = ['toc-showmarkdowntxt', this._showMarkdown];
        this._widget.update();
    }
    get showMarkdown() {
        return this._showMarkdown;
    }
    /**
     * Signal emitted when a "collapse" twist button is pressed in the ToC
     */
    get collapseChanged() {
        return this._collapseChanged;
    }
    /**
     * Toggles whether to show tags in the table of contents.
     */
    set showTags(value) {
        this._showTags = value;
        this.notebookMetadata = ['toc-showtags', this._showTags];
        this._widget.update();
    }
    get showTags() {
        return this._showTags;
    }
    /**
     * Returns a list of selected tags.
     */
    get filtered() {
        if (this.tagTool) {
            this._filtered = this.tagTool.filtered;
        }
        else if (this.storeTags.length > 0) {
            this._filtered = this.storeTags;
        }
        else {
            this._filtered = [];
        }
        return this._filtered;
    }
    /**
     * Gets/sets a pre-rendered a toolbar.
     */
    set preRenderedToolbar(value) {
        this._preRenderedToolbar = value;
    }
    get preRenderedToolbar() {
        return this._preRenderedToolbar;
    }
    /**
     * Updates a table of contents widget.
     */
    updateWidget() {
        this._widget.update();
    }
    /**
     * Updates a table of contents widget and
     * emits a signal in case an extension wants
     * to perform an action when the collapse button
     * is pressed.
     */
    updateAndCollapse(args) {
        this._collapseChanged.emit(args);
        this._widget.update();
    }
    /**
     * Initializes options.
     *
     * ## Notes
     *
     * -  This will **not** change notebook meta-data.
     *
     * @param numbering - boolean indicating whether to number items
     * @param numberingH1 - boolean indicating whether to number first level items
     * @param includeOutput - boolean indicating whether cell outputs should be included in headings
     * @param syncCollapseState - boolean indicating whether collapsing in ToC should be reflected in Notebook and vice versa
     * @param showCode - boolean indicating whether to show code previews
     * @param showMarkdown - boolean indicating whether to show Markdown previews
     * @param showTags - boolean indicating whether to show tags
     */
    initializeOptions(numbering, numberingH1, includeOutput, syncCollapseState, showCode, showMarkdown, showTags) {
        this._numbering = numbering;
        this._numberingH1 = numberingH1;
        this._includeOutput = includeOutput;
        this._syncCollapseState = syncCollapseState;
        this._showCode = showCode;
        this._showMarkdown = showMarkdown;
        this._showTags = showTags;
        this._widget.update();
    }
}
/**
 * Exports.
 */
export { OptionsManager };
//# sourceMappingURL=options_manager.js.map