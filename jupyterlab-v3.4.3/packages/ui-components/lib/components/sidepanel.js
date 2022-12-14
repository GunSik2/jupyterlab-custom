// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { nullTranslator } from '@jupyterlab/translation';
import { AccordionPanel, Panel, PanelLayout, Widget } from '@lumino/widgets';
import { AccordionToolbar } from './accordiontoolbar';
import { Toolbar } from './toolbar';
/**
 * A widget meant to be contained in sidebars.
 *
 * #### Note
 * By default the content widget is an accordion panel that supports widget with
 * associated toolbar to be displayed in the widget title.
 */
export class SidePanel extends Widget {
    constructor(options = {}) {
        var _a;
        super();
        const layout = (this.layout = new PanelLayout());
        this.addClass('jp-SidePanel');
        const trans = (this._trans = (options.translator || nullTranslator).load('jupyterlab'));
        if (options.header) {
            this.addHeader(options.header);
        }
        const content = (this._content =
            (_a = options.content) !== null && _a !== void 0 ? _a : new AccordionPanel(Object.assign(Object.assign({}, options), { layout: AccordionToolbar.createLayout(options) })));
        content.node.setAttribute('role', 'region');
        content.node.setAttribute('aria-label', trans.__('side panel content'));
        content.addClass('jp-SidePanel-content');
        layout.addWidget(content);
        if (options.toolbar) {
            this.addToolbar(options.toolbar);
        }
    }
    /**
     * The content hosted by the widget.
     */
    get content() {
        return this._content;
    }
    /**
     * A panel for widgets that sit on top of the widget.
     */
    get header() {
        if (!this._header) {
            this.addHeader();
        }
        return this._header;
    }
    /**
     * The toolbar hosted by the widget.
     *
     * It sits between the header and the content
     */
    get toolbar() {
        if (!this._toolbar) {
            this.addToolbar();
        }
        return this._toolbar;
    }
    /**
     * A read-only array of the widgets in the content panel.
     */
    get widgets() {
        return this.content.widgets;
    }
    /**
     * Add a widget to the content panel bottom.
     *
     * @param widget Widget to add
     */
    addWidget(widget) {
        this.content.addWidget(widget);
    }
    /**
     * Insert a widget at the given position in the content panel.
     *
     * @param index Position
     * @param widget Widget to insert
     */
    insertWidget(index, widget) {
        this.content.insertWidget(index, widget);
    }
    addHeader(header) {
        const theHeader = (this._header = header || new Panel());
        theHeader.addClass('jp-SidePanel-header');
        this.layout.insertWidget(0, theHeader);
    }
    addToolbar(toolbar) {
        const theToolbar = (this._toolbar = toolbar !== null && toolbar !== void 0 ? toolbar : new Toolbar());
        theToolbar.addClass('jp-SidePanel-toolbar');
        theToolbar.node.setAttribute('role', 'navigation');
        theToolbar.node.setAttribute('aria-label', this._trans.__('side panel actions'));
        this.layout.insertWidget(this.layout.widgets.length - 1, theToolbar);
    }
}
//# sourceMappingURL=sidepanel.js.map