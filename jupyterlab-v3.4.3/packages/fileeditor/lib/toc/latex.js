// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { TableOfContentsModel, TableOfContentsUtils } from '@jupyterlab/toc';
import { EditorTableOfContentsFactory } from './factory';
/**
 * Maps LaTeX section headings to HTML header levels.
 *
 * ## Notes
 *
 * -   As `part` and `chapter` section headings appear to be less common, assign them to heading level 1.
 *
 * @private
 */
const LATEX_LEVELS = {
    part: 1,
    chapter: 1,
    section: 1,
    subsection: 2,
    subsubsection: 3,
    paragraph: 4,
    subparagraph: 5
};
/**
 * Regular expression to create the outline
 */
const SECTIONS = /^\s*\\(section|subsection|subsubsection){(.+)}/;
/**
 * Table of content model for LaTeX files.
 */
export class LaTeXTableOfContentsModel extends TableOfContentsModel {
    /**
     * Type of document supported by the model.
     *
     * #### Notes
     * A `data-document-type` attribute with this value will be set
     * on the tree view `.jp-TableOfContents-content[data-document-type="..."]`
     */
    get documentType() {
        return 'latex';
    }
    /**
     * List of configuration options supported by the model.
     */
    get supportedOptions() {
        return ['maximalDepth', 'numberHeaders'];
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
        // Split the text into lines:
        const lines = this.widget.content.model.value.text.split('\n');
        const levels = new Array();
        let previousLevel = levels.length;
        const headings = new Array();
        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(SECTIONS);
            if (match) {
                const level = LATEX_LEVELS[match[1]];
                if (level <= this.configuration.maximalDepth) {
                    const prefix = TableOfContentsUtils.getPrefix(level, previousLevel, levels, Object.assign(Object.assign({}, this.configuration), { 
                        // Force base numbering and numbering first level
                        baseNumbering: 1, numberingH1: true }));
                    previousLevel = level;
                    headings.push({
                        text: match[2],
                        prefix: prefix,
                        level,
                        line: i
                    });
                }
            }
        }
        return Promise.resolve(headings);
    }
}
/**
 * Table of content model factory for LaTeX files.
 */
export class LaTeXTableOfContentsFactory extends EditorTableOfContentsFactory {
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
            return mime && (mime === 'text/x-latex' || mime === 'text/x-stex');
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
        return new LaTeXTableOfContentsModel(widget, configuration);
    }
}
//# sourceMappingURL=latex.js.map