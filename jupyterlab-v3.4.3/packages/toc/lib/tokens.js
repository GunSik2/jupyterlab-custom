// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { Token } from '@lumino/coreutils';
/**
 * Table of contents registry token.
 */
export const ITableOfContentsRegistry = new Token('@jupyterlab/toc:ITableOfContentsRegistry');
/**
 * Table of contents tracker token.
 */
export const ITableOfContentsTracker = new Token('@jupyterlab/toc:ITableOfContentsTracker');
/**
 * Namespace for table of contents interface
 */
export var TableOfContents;
(function (TableOfContents) {
    /**
     * Default table of content configuration
     */
    TableOfContents.defaultConfig = {
        baseNumbering: 1,
        maximalDepth: 4,
        numberingH1: true,
        numberHeaders: false,
        includeOutput: true,
        syncCollapseState: false
    };
})(TableOfContents || (TableOfContents = {}));
//# sourceMappingURL=tokens.js.map