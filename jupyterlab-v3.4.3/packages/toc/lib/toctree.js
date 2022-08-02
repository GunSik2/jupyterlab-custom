// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import * as React from 'react';
import { TableOfContentsItem } from './tocitem';
/**
 * React component for a table of contents tree.
 */
export class TableOfContentsTree extends React.PureComponent {
    /**
     * Renders a table of contents tree.
     */
    render() {
        const { documentType } = this.props;
        return (React.createElement("ol", Object.assign({ className: "jp-TableOfContents-content" }, { 'data-document-type': documentType }), this.buildTree()));
    }
    /**
     * Convert the flat headings list to a nested tree list
     */
    buildTree() {
        if (this.props.headings.length === 0) {
            return [];
        }
        let globalIndex = 0;
        const getChildren = (items, level) => {
            const nested = new Array();
            while (globalIndex < items.length) {
                const current = items[globalIndex];
                if (current.level >= level) {
                    globalIndex += 1;
                    const next = items[globalIndex];
                    nested.push(React.createElement(TableOfContentsItem, { key: `${current.level}-${current.text}`, isActive: !!this.props.activeHeading &&
                            current === this.props.activeHeading, heading: current, onMouseDown: this.props.setActiveHeading, onCollapse: this.props.onCollapseChange }, next && next.level > level && getChildren(items, level + 1)));
                }
                else {
                    break;
                }
            }
            return nested;
        };
        return getChildren(this.props.headings, this.props.headings[0].level);
    }
}
//# sourceMappingURL=toctree.js.map