// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { TableOfContentsFactory, TableOfContentsModel, TableOfContentsUtils } from '@jupyterlab/toc';
/**
 * Table of content model for Markdown viewer files.
 */
export class MarkdownViewerTableOfContentsModel extends TableOfContentsModel {
    /**
     * Constructor
     *
     * @param widget The widget to search in
     * @param parser Markdown parser
     * @param configuration Default model configuration
     */
    constructor(widget, parser, configuration) {
        super(widget, configuration);
        this.parser = parser;
    }
    /**
     * Type of document supported by the model.
     *
     * #### Notes
     * A `data-document-type` attribute with this value will be set
     * on the tree view `.jp-TableOfContents-content[data-document-type="..."]`
     */
    get documentType() {
        return 'markdown-viewer';
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
        return ['maximalDepth', 'numberingH1', 'numberHeaders'];
    }
    /**
     * Produce the headings for a document.
     *
     * @returns The list of new headings or `null` if nothing needs to be updated.
     */
    getHeadings() {
        const content = this.widget.context.model.toString();
        const headings = TableOfContentsUtils.Markdown.getHeadings(content, Object.assign(Object.assign({}, this.configuration), { 
            // Force base number to be equal to 1
            baseNumbering: 1 }));
        return Promise.resolve(headings);
    }
}
/**
 * Table of content model factory for Markdown viewer files.
 */
export class MarkdownViewerTableOfContentsFactory extends TableOfContentsFactory {
    /**
     * Constructor
     *
     * @param tracker Widget tracker
     * @param parser Markdown parser
     */
    constructor(tracker, parser) {
        super(tracker);
        this.parser = parser;
    }
    /**
     * Create a new table of contents model for the widget
     *
     * @param widget - widget
     * @param configuration - Table of contents configuration
     * @returns The table of contents model
     */
    _createNew(widget, configuration) {
        const model = new MarkdownViewerTableOfContentsModel(widget, this.parser, configuration);
        let headingToElement = new WeakMap();
        const onActiveHeadingChanged = (model, heading) => {
            if (heading) {
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
        const onHeadingsChanged = () => {
            if (!this.parser) {
                return;
            }
            // Clear all numbering items
            TableOfContentsUtils.clearNumbering(widget.content.node);
            // Create a new mapping
            headingToElement = new WeakMap();
            model.headings.forEach(async (heading) => {
                var _a;
                const elementId = await TableOfContentsUtils.Markdown.getHeadingId(this.parser, heading.raw, heading.level);
                if (!elementId) {
                    return;
                }
                const selector = `h${heading.level}[id="${elementId}"]`;
                headingToElement.set(heading, TableOfContentsUtils.addPrefix(widget.content.node, selector, (_a = heading.prefix) !== null && _a !== void 0 ? _a : ''));
            });
        };
        widget.content.ready.then(() => {
            onHeadingsChanged();
            widget.content.rendered.connect(onHeadingsChanged);
            model.activeHeadingChanged.connect(onActiveHeadingChanged);
            model.headingsChanged.connect(onHeadingsChanged);
            widget.disposed.connect(() => {
                widget.content.rendered.disconnect(onHeadingsChanged);
                model.activeHeadingChanged.disconnect(onActiveHeadingChanged);
                model.headingsChanged.disconnect(onHeadingsChanged);
            });
        });
        return model;
    }
}
//# sourceMappingURL=toc.js.map