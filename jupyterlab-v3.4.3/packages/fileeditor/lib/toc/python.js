// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { TableOfContentsModel } from '@jupyterlab/toc';
import { EditorTableOfContentsFactory } from './factory';
/**
 * Regular expression to create the outline
 */
let KEYWORDS;
try {
    // https://github.com/tc39/proposal-regexp-match-indices was accepted
    // in May 2021 (https://github.com/tc39/proposals/blob/main/finished-proposals.md)
    // So we will fallback to the polyfill regexp-match-indices if not available
    KEYWORDS = new RegExp('^\\s*(class |def |from |import )', 'd');
}
catch (_a) {
    KEYWORDS = new RegExp('^\\s*(class |def |from |import )');
}
/**
 * Table of content model for Python files.
 */
export class PythonTableOfContentsModel extends TableOfContentsModel {
    /**
     * Type of document supported by the model.
     *
     * #### Notes
     * A `data-document-type` attribute with this value will be set
     * on the tree view `.jp-TableOfContents-content[data-document-type="..."]`
     */
    get documentType() {
        return 'python';
    }
    /**
     * Produce the headings for a document.
     *
     * @returns The list of new headings or `null` if nothing needs to be updated.
     */
    async getHeadings() {
        if (!this.isActive) {
            return Promise.resolve(null);
        }
        // Split the text into lines:
        const lines = this.widget.content.model.value.text.split('\n');
        // Iterate over the lines to get the heading level and text for each line:
        let headings = new Array();
        let processingImports = false;
        let indent = 1;
        let lineIdx = -1;
        for (const line of lines) {
            lineIdx++;
            let hasKeyword;
            if (KEYWORDS.flags.includes('d')) {
                hasKeyword = KEYWORDS.exec(line);
            }
            else {
                const { default: execWithIndices } = await import('regexp-match-indices');
                hasKeyword = execWithIndices(KEYWORDS, line);
            }
            if (hasKeyword) {
                // Index 0 contains the spaces, index 1 is the keyword group
                const [start] = hasKeyword.indices[1];
                if (indent === 1 && start > 0) {
                    indent = start;
                }
                const isImport = ['from ', 'import '].includes(hasKeyword[1]);
                if (isImport && processingImports) {
                    continue;
                }
                processingImports = isImport;
                const level = 1 + start / indent;
                if (level > this.configuration.maximalDepth) {
                    continue;
                }
                headings.push({
                    text: line.slice(start),
                    level,
                    line: lineIdx
                });
            }
        }
        return Promise.resolve(headings);
    }
}
/**
 * Table of content model factory for Python files.
 */
export class PythonTableOfContentsFactory extends EditorTableOfContentsFactory {
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
            return (mime &&
                (mime === 'application/x-python-code' || mime === 'text/x-python'));
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
        return new PythonTableOfContentsModel(widget, configuration);
    }
}
//# sourceMappingURL=python.js.map