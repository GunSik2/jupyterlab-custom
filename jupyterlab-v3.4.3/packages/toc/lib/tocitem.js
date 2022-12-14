// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { caretDownIcon, caretRightIcon } from '@jupyterlab/ui-components';
import * as React from 'react';
/**
 * React component for a table of contents entry.
 */
export class TableOfContentsItem extends React.PureComponent {
    /**
     * Renders a table of contents entry.
     *
     * @returns rendered entry
     */
    render() {
        const { children, isActive, heading, onCollapse, onMouseDown } = this.props;
        return (React.createElement("li", { className: "jp-tocItem", key: `${heading.level}-${heading.text}` },
            React.createElement("div", { className: `jp-tocItem-heading ${isActive ? 'jp-tocItem-active' : ''}`, onMouseDown: (event) => {
                    // React only on deepest item
                    if (!event.defaultPrevented) {
                        event.preventDefault();
                        onMouseDown(heading);
                    }
                } },
                React.createElement("button", { className: "jp-tocItem-collapser", onClick: (event) => {
                        event.preventDefault();
                        onCollapse(heading);
                    }, style: { visibility: children ? 'visible' : 'hidden' } }, heading.collapsed ? (React.createElement(caretRightIcon.react, { tag: "span", width: "20px" })) : (React.createElement(caretDownIcon.react, { tag: "span", width: "20px" }))),
                React.createElement("span", Object.assign({ className: "jp-tocItem-content", title: heading.text }, heading.dataset),
                    heading.prefix,
                    heading.text)),
            children && !heading.collapsed && React.createElement("ol", null, children)));
    }
}
//# sourceMappingURL=tocitem.js.map