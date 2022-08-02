// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { MarkdownCell } from '@jupyterlab/cells';
import { TableOfContentsFactory, TableOfContentsModel, TableOfContentsUtils } from '@jupyterlab/toc';
import { NotebookActions } from './actions';
/**
 * Cell running status
 */
export var RunningStatus;
(function (RunningStatus) {
    /**
     * Cell is idle
     */
    RunningStatus[RunningStatus["Idle"] = -1] = "Idle";
    /**
     * Cell execution is scheduled
     */
    RunningStatus[RunningStatus["Scheduled"] = 0] = "Scheduled";
    /**
     * Cell is running
     */
    RunningStatus[RunningStatus["Running"] = 1] = "Running";
})(RunningStatus || (RunningStatus = {}));
/**
 * Type of headings
 */
export var HeadingType;
(function (HeadingType) {
    /**
     * Heading from HTML output
     */
    HeadingType[HeadingType["HTML"] = 0] = "HTML";
    /**
     * Heading from Markdown cell or Markdown output
     */
    HeadingType[HeadingType["Markdown"] = 1] = "Markdown";
})(HeadingType || (HeadingType = {}));
/**
 * Table of content model for Notebook files.
 */
export class NotebookToCModel extends TableOfContentsModel {
    /**
     * Constructor
     *
     * @param widget The widget to search in
     * @param parser Markdown parser
     * @param sanitizer Sanitizer
     * @param configuration Default model configuration
     */
    constructor(widget, parser, sanitizer, configuration) {
        super(widget, configuration);
        this.parser = parser;
        this.sanitizer = sanitizer;
        /**
         * Mapping between configuration options and notebook metadata.
         *
         * If it starts with `!`, the boolean value of the configuration option is
         * opposite to the one stored in metadata.
         * If it contains `/`, the metadata data is nested.
         */
        this.configMetadataMap = {
            numberHeaders: ['toc-autonumbering', 'toc/number_sections'],
            numberingH1: ['!toc/skip_h1_title'],
            baseNumbering: ['toc/base_numbering']
        };
        this._runningCells = new Array();
        this._cellToHeadingIndex = new WeakMap();
        void widget.context.ready.then(() => {
            // Load configuration from metadata
            this.setConfiguration({});
        });
        this.widget.context.model.metadata.changed.connect(this.onMetadataChanged, this);
        this.widget.content.activeCellChanged.connect(this.onActiveCellChanged, this);
        NotebookActions.executionScheduled.connect(this.onExecutionScheduled, this);
        NotebookActions.executed.connect(this.onExecuted, this);
        this.headingsChanged.connect(this.onHeadingsChanged, this);
    }
    /**
     * Type of document supported by the model.
     *
     * #### Notes
     * A `data-document-type` attribute with this value will be set
     * on the tree view `.jp-TableOfContents-content[data-document-type="..."]`
     */
    get documentType() {
        return 'notebook';
    }
    /**
     * Whether the model gets updated even if the table of contents panel
     * is hidden or not.
     */
    get isAlwaysActive() {
        return true;
    }
    /**
     * List of configuration options supported by the model.
     */
    get supportedOptions() {
        return [
            'baseNumbering',
            'maximalDepth',
            'numberingH1',
            'numberHeaders',
            'includeOutput',
            'syncCollapseState'
        ];
    }
    /**
     * Get the first heading of a given cell.
     *
     * It will be `null` if the cell has no headings.
     *
     * @param cell Cell
     * @returns The associated heading
     */
    getCellHeading(cell) {
        let headingIndex = this._cellToHeadingIndex.get(cell);
        if (headingIndex !== undefined) {
            const candidate = this.headings[headingIndex];
            // Highlight the first title as active (if multiple titles are in the same cell)
            while (this.headings[headingIndex - 1] &&
                this.headings[headingIndex - 1].cellRef === candidate.cellRef) {
                headingIndex--;
            }
            return this.headings[headingIndex];
        }
        else {
            return null;
        }
    }
    /**
     * Dispose the object
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this.headingsChanged.disconnect(this.onHeadingsChanged, this);
        this.widget.context.model.metadata.changed.disconnect(this.onMetadataChanged, this);
        this.widget.content.activeCellChanged.disconnect(this.onActiveCellChanged, this);
        NotebookActions.executionScheduled.disconnect(this.onExecutionScheduled, this);
        NotebookActions.executed.disconnect(this.onExecuted, this);
        this._runningCells.length = 0;
        super.dispose();
    }
    /**
     * Model configuration setter.
     *
     * @param c New configuration
     */
    setConfiguration(c) {
        // Ensure configuration update
        const metadataConfig = this.loadConfigurationFromMetadata();
        super.setConfiguration(Object.assign(Object.assign(Object.assign({}, this.configuration), metadataConfig), c));
    }
    /**
     * Callback on heading collapse.
     *
     * @param options.heading The heading to change state (all headings if not provided)
     * @param options.collapsed The new collapsed status (toggle existing status if not provided)
     */
    toggleCollapse(options) {
        super.toggleCollapse(options);
        this.updateRunningStatus(this.headings);
    }
    /**
     * Produce the headings for a document.
     *
     * @returns The list of new headings or `null` if nothing needs to be updated.
     */
    getHeadings() {
        const cells = this.widget.content.widgets;
        const headings = [];
        const documentLevels = new Array();
        // Generate headings by iterating through all notebook cells...
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const model = cell.model;
            switch (model.type) {
                case 'code': {
                    // Collapsing cells is incompatible with output headings
                    if (!this.configuration.syncCollapseState &&
                        this.configuration.includeOutput) {
                        // Iterate over the code cell outputs to check for Markdown or HTML from which we can generate ToC headings...
                        const outputs = model.outputs;
                        for (let j = 0; j < outputs.length; j++) {
                            const m = outputs.get(j);
                            let htmlType = null;
                            let mdType = null;
                            Object.keys(m.data).forEach(t => {
                                if (!mdType && TableOfContentsUtils.Markdown.isMarkdown(t)) {
                                    mdType = t;
                                }
                                else if (!htmlType && TableOfContentsUtils.isHTML(t)) {
                                    htmlType = t;
                                }
                            });
                            // Parse HTML output
                            if (htmlType) {
                                headings.push(...TableOfContentsUtils.getHTMLHeadings(this.sanitizer.sanitize(m.data[htmlType]), this.configuration, documentLevels).map(heading => {
                                    return Object.assign(Object.assign({}, heading), { cellRef: cell, outputIndex: j, collapsed: false, isRunning: RunningStatus.Idle, type: HeadingType.HTML });
                                }));
                            }
                            else if (mdType) {
                                headings.push(...TableOfContentsUtils.Markdown.getHeadings(m.data[mdType], this.configuration, documentLevels).map(heading => {
                                    return Object.assign(Object.assign({}, heading), { cellRef: cell, outputIndex: j, collapsed: false, isRunning: RunningStatus.Idle, type: HeadingType.Markdown });
                                }));
                            }
                        }
                    }
                    break;
                }
                case 'markdown': {
                    const cellHeadings = TableOfContentsUtils.Markdown.getHeadings(cell.model.value.text, this.configuration, documentLevels).map((heading, index) => {
                        return Object.assign(Object.assign({}, heading), { cellRef: cell, collapsed: false, isRunning: RunningStatus.Idle, type: HeadingType.Markdown });
                    });
                    // If there are multiple headings, only collapse the highest heading (i.e. minimal level)
                    // consistent with the cell.headingInfo
                    if (this.configuration.syncCollapseState &&
                        cell.headingCollapsed) {
                        const minLevel = Math.min(...cellHeadings.map(h => h.level));
                        const minHeading = cellHeadings.find(h => h.level === minLevel);
                        minHeading.collapsed = cell.headingCollapsed;
                    }
                    headings.push(...cellHeadings);
                    break;
                }
            }
            if (headings.length > 0) {
                this._cellToHeadingIndex.set(cell, headings.length - 1);
            }
        }
        this.updateRunningStatus(headings);
        return Promise.resolve(headings);
    }
    /**
     * Read table of content configuration from notebook metadata.
     *
     * @returns ToC configuration from metadata
     */
    loadConfigurationFromMetadata() {
        const nbModel = this.widget.content.model;
        const newConfig = {};
        if (nbModel) {
            for (const option in this.configMetadataMap) {
                const keys = this.configMetadataMap[option];
                for (const k of keys) {
                    let key = k;
                    const negate = key[0] === '!';
                    if (negate) {
                        key = key.slice(1);
                    }
                    const keyPath = key.split('/');
                    let value = nbModel.metadata.get(keyPath[0]);
                    for (let p = 1; p < keyPath.length; p++) {
                        value = (value !== null && value !== void 0 ? value : {})[keyPath[p]];
                    }
                    if (value !== undefined) {
                        if (typeof value === 'boolean' && negate) {
                            value = !value;
                        }
                        newConfig[option] = value;
                    }
                }
            }
        }
        return newConfig;
    }
    onActiveCellChanged(notebook, cell) {
        let activeHeadingIndex = this._cellToHeadingIndex.get(cell);
        if (activeHeadingIndex !== undefined) {
            const candidate = this.headings[activeHeadingIndex];
            // Highlight the first title as active (if multiple titles are in the same cell)
            while (this.headings[activeHeadingIndex - 1] &&
                this.headings[activeHeadingIndex - 1].cellRef === candidate.cellRef) {
                activeHeadingIndex--;
            }
            this.setActiveHeading(this.headings[activeHeadingIndex], false);
        }
        else {
            this.setActiveHeading(null, false);
        }
    }
    onHeadingsChanged() {
        if (this.widget.content.activeCell) {
            this.onActiveCellChanged(this.widget.content, this.widget.content.activeCell);
        }
    }
    onExecuted(_, args) {
        this._runningCells.forEach((cell, index) => {
            if (cell === args.cell) {
                this._runningCells.splice(index, 1);
                const headingIndex = this._cellToHeadingIndex.get(cell);
                if (headingIndex !== undefined) {
                    const heading = this.headings[headingIndex];
                    heading.isRunning = RunningStatus.Idle;
                }
            }
        });
        this.updateRunningStatus(this.headings);
        this.stateChanged.emit();
    }
    onExecutionScheduled(_, args) {
        if (!this._runningCells.includes(args.cell)) {
            this._runningCells.push(args.cell);
        }
        this.updateRunningStatus(this.headings);
        this.stateChanged.emit();
    }
    onMetadataChanged() {
        this.setConfiguration({});
    }
    updateRunningStatus(headings) {
        // Update isRunning
        this._runningCells.forEach((cell, index) => {
            const headingIndex = this._cellToHeadingIndex.get(cell);
            if (headingIndex !== undefined) {
                const heading = this.headings[headingIndex];
                heading.isRunning = Math.max(index > 0 ? RunningStatus.Scheduled : RunningStatus.Running, heading.isRunning);
            }
        });
        let globalIndex = 0;
        while (globalIndex < headings.length) {
            const heading = headings[globalIndex];
            globalIndex++;
            if (heading.collapsed) {
                const maxIsRunning = Math.max(heading.isRunning, getMaxIsRunning(headings, heading.level));
                heading.dataset = Object.assign(Object.assign({}, heading.dataset), { 'data-running': maxIsRunning.toString() });
            }
            else {
                heading.dataset = Object.assign(Object.assign({}, heading.dataset), { 'data-running': heading.isRunning.toString() });
            }
        }
        function getMaxIsRunning(headings, collapsedLevel) {
            let maxIsRunning = RunningStatus.Idle;
            while (globalIndex < headings.length) {
                const heading = headings[globalIndex];
                heading.dataset = Object.assign(Object.assign({}, heading.dataset), { 'data-running': heading.isRunning.toString() });
                if (heading.level > collapsedLevel) {
                    globalIndex++;
                    maxIsRunning = Math.max(heading.isRunning, maxIsRunning);
                    if (heading.collapsed) {
                        maxIsRunning = Math.max(maxIsRunning, getMaxIsRunning(headings, heading.level));
                        heading.dataset = Object.assign(Object.assign({}, heading.dataset), { 'data-running': maxIsRunning.toString() });
                    }
                }
                else {
                    break;
                }
            }
            return maxIsRunning;
        }
    }
}
/**
 * Table of content model factory for Notebook files.
 */
export class NotebookToCFactory extends TableOfContentsFactory {
    /**
     * Constructor
     *
     * @param tracker Widget tracker
     * @param parser Markdown parser
     * @param sanitizer Sanitizer
     */
    constructor(tracker, parser, sanitizer) {
        super(tracker);
        this.parser = parser;
        this.sanitizer = sanitizer;
    }
    /**
     * Create a new table of contents model for the widget
     *
     * @param widget - widget
     * @param configuration - Table of contents configuration
     * @returns The table of contents model
     */
    _createNew(widget, configuration) {
        const model = new NotebookToCModel(widget, this.parser, this.sanitizer, configuration);
        // Connect model signals to notebook panel
        let headingToElement = new WeakMap();
        const onActiveHeadingChanged = (model, heading) => {
            if (heading) {
                // Set active cell
                const cells = widget.content.widgets;
                const idx = cells.indexOf(heading.cellRef);
                widget.content.activeCellIndex = idx;
                // Scroll to heading
                const el = headingToElement.get(heading);
                if (el) {
                    const widgetBox = widget.content.node.getBoundingClientRect();
                    const elementBox = el.getBoundingClientRect();
                    if (elementBox.top > widgetBox.bottom ||
                        elementBox.bottom < widgetBox.top ||
                        elementBox.left > widgetBox.right ||
                        elementBox.right < widgetBox.left) {
                        el.scrollIntoView({ inline: 'center' });
                    }
                }
            }
        };
        const onHeadingsChanged = (model) => {
            if (!this.parser) {
                return;
            }
            // Clear all numbering items
            TableOfContentsUtils.clearNumbering(widget.content.node);
            // Create a new mapping
            headingToElement = new WeakMap();
            model.headings.forEach(async (heading) => {
                var _a, _b;
                let elementId = null;
                if (heading.type === HeadingType.Markdown) {
                    elementId = await TableOfContentsUtils.Markdown.getHeadingId(this.parser, 
                    // Type from TableOfContentsUtils.Markdown.IMarkdownHeading
                    heading.raw, heading.level);
                }
                else if (heading.type === HeadingType.HTML) {
                    // Type from TableOfContentsUtils.IHTMLHeading
                    elementId = heading.id;
                }
                const selector = elementId
                    ? `h${heading.level}[id="${elementId}"]`
                    : `h${heading.level}`;
                if (heading.outputIndex !== undefined) {
                    // Code cell
                    headingToElement.set(heading, TableOfContentsUtils.addPrefix(heading.cellRef.outputArea.widgets[heading.outputIndex].node, selector, (_a = heading.prefix) !== null && _a !== void 0 ? _a : ''));
                }
                else {
                    headingToElement.set(heading, TableOfContentsUtils.addPrefix(heading.cellRef.node, selector, (_b = heading.prefix) !== null && _b !== void 0 ? _b : ''));
                }
            });
        };
        const onHeadingCollapsed = (_, heading) => {
            var _a, _b, _c, _d;
            if (model.configuration.syncCollapseState) {
                if (heading !== null) {
                    const cell = heading.cellRef;
                    if (cell.headingCollapsed !== ((_a = heading.collapsed) !== null && _a !== void 0 ? _a : false)) {
                        cell.headingCollapsed = (_b = heading.collapsed) !== null && _b !== void 0 ? _b : false;
                    }
                }
                else {
                    const collapseState = (_d = (_c = model.headings[0]) === null || _c === void 0 ? void 0 : _c.collapsed) !== null && _d !== void 0 ? _d : false;
                    widget.content.widgets.forEach(cell => {
                        if (cell instanceof MarkdownCell) {
                            if (cell.headingInfo.level >= 0) {
                                cell.headingCollapsed = collapseState;
                            }
                        }
                    });
                }
            }
        };
        const onCellCollapsed = (_, cell) => {
            if (model.configuration.syncCollapseState) {
                const h = model.getCellHeading(cell);
                if (h) {
                    model.toggleCollapse({
                        heading: h,
                        collapsed: cell.headingCollapsed
                    });
                }
            }
        };
        widget.context.ready.then(() => {
            onHeadingsChanged(model);
            model.activeHeadingChanged.connect(onActiveHeadingChanged);
            model.headingsChanged.connect(onHeadingsChanged);
            model.collapseChanged.connect(onHeadingCollapsed);
            widget.content.cellCollapsed.connect(onCellCollapsed);
            // widget.content.
            widget.disposed.connect(() => {
                model.activeHeadingChanged.disconnect(onActiveHeadingChanged);
                model.headingsChanged.disconnect(onHeadingsChanged);
                model.collapseChanged.disconnect(onHeadingCollapsed);
                widget.content.cellCollapsed.disconnect(onCellCollapsed);
            });
        });
        return model;
    }
}
//# sourceMappingURL=toc.js.map