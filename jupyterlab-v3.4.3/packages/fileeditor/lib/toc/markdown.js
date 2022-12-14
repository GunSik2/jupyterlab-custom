// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { TableOfContentsModel, TableOfContentsUtils } from '@jupyterlab/toc';
import { EditorTableOfContentsFactory } from './factory';
/**
 * Table of content model for Markdown files.
 */
export class MarkdownTableOfContentsModel extends TableOfContentsModel {
    /**
     * Type of document supported by the model.
     *
     * #### Notes
     * A `data-document-type` attribute with this value will be set
     * on the tree view `.jp-TableOfContents-content[data-document-type="..."]`
     */
    get documentType() {
        return 'markdown';
    }
    /**
     * Produce the headings for a document.
     *
     * @returns The list of new headings or `null` if nothing needs to be updated.
     */
    getHeadings() {
        if (!this.isActive) {
            return Promise.resolve(null);
        }
        const content = this.widget.content.model.value.text;
        const headings = TableOfContentsUtils.Markdown.getHeadings(content, Object.assign(Object.assign({}, this.configuration), { 
            // Force removing numbering as they cannot be displayed
            // in the document
            numberHeaders: false }));
        return Promise.resolve(headings);
    }
}
/**
 * Table of content model factory for Markdown files.
 */
export class MarkdownTableOfContentsFactory extends EditorTableOfContentsFactory {
    /**
     * Whether the factory can handle the widget or not.
     *
     * @param widget - widget
     * @returns boolean indicating a ToC can be generated
     */
    isApplicable(widget) {
        var _a, _b;
        const isApplicable = super.isApplicable(widget);
        if (isApplicable) {
            let mime = (_b = (_a = widget.content) === null || _a === void 0 ? void 0 : _a.model) === null || _b === void 0 ? void 0 : _b.mimeType;
            return mime && TableOfContentsUtils.Markdown.isMarkdown(mime);
        }
        return false;
    }
    /**
     * Create a new table of contents model for the widget
     *
     * @param widget - widget
     * @param configuration - Table of contents configuration
     * @returns The table of contents model
     */
    _createNew(widget, configuration) {
        return new MarkdownTableOfContentsModel(widget, configuration);
    }
}
//# sourceMappingURL=markdown.js.map