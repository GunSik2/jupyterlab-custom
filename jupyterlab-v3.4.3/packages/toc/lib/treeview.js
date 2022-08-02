// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { VDomRenderer } from '@jupyterlab/ui-components';
import * as React from 'react';
import { TableOfContentsTree } from './toctree';
/**
 * Table of contents widget.
 */
export class TableOfContentsWidget extends VDomRenderer {
    /**
     * Constructor
     *
     * @param options Widget options
     */
    constructor(options = {}) {
        super(options.model);
    }
    /**
     * Render the content of this widget using the virtual DOM.
     *
     * This method will be called anytime the widget needs to be rendered, which
     * includes layout triggered rendering.
     */
    render() {
        if (!this.model) {
            return null;
        }
        return (React.createElement(TableOfContentsTree, { activeHeading: this.model.activeHeading, documentType: this.model.documentType, headings: this.model.headings, onCollapseChange: (heading) => {
                this.model.toggleCollapse({ heading });
            }, setActiveHeading: (heading) => {
                this.model.setActiveHeading(heading);
            } }));
    }
}
//# sourceMappingURL=treeview.js.map