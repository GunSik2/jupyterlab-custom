import { SidePanel } from '@jupyterlab/ui-components';
import { Panel, Widget } from '@lumino/widgets';
import { TableOfContentsWidget } from './treeview';
/**
 * Table of contents sidebar panel.
 */
export class TableOfContentsPanel extends SidePanel {
    /**
     * Constructor
     *
     * @param translator - Translator tool
     */
    constructor(translator) {
        super({ content: new Panel(), translator });
        this._model = null;
        this.addClass('jp-TableOfContents');
        this._title = new Private.Header(this._trans.__('Table of Contents'));
        this.header.addWidget(this._title);
        this._treeview = new TableOfContentsWidget();
        this._treeview.addClass('jp-TableOfContents-tree');
        this.content.addWidget(this._treeview);
    }
    /**
     * Get the current model.
     */
    get model() {
        return this._model;
    }
    set model(newValue) {
        var _a, _b;
        if (this._model !== newValue) {
            (_a = this._model) === null || _a === void 0 ? void 0 : _a.stateChanged.disconnect(this._onTitleChanged, this);
            this._model = newValue;
            if (this._model) {
                this._model.isActive = this.isVisible;
            }
            (_b = this._model) === null || _b === void 0 ? void 0 : _b.stateChanged.connect(this._onTitleChanged, this);
            this._onTitleChanged();
            this._treeview.model = this._model;
        }
    }
    onAfterHide(msg) {
        super.onAfterHide(msg);
        if (this._model) {
            this._model.isActive = false;
        }
    }
    onBeforeShow(msg) {
        super.onBeforeShow(msg);
        if (this._model) {
            this._model.isActive = true;
        }
    }
    _onTitleChanged() {
        var _a, _b;
        this._title.setTitle((_b = (_a = this._model) === null || _a === void 0 ? void 0 : _a.title) !== null && _b !== void 0 ? _b : this._trans.__('Table of Contents'));
    }
}
/**
 * Private helpers namespace
 */
var Private;
(function (Private) {
    /**
     * Panel header
     */
    class Header extends Widget {
        /**
         * Constructor
         *
         * @param title - Title text
         */
        constructor(title) {
            const node = document.createElement('h2');
            node.textContent = title;
            node.classList.add('jp-text-truncated');
            super({ node });
            this._title = node;
        }
        /**
         * Set the header title.
         */
        setTitle(title) {
            this._title.textContent = title;
        }
    }
    Private.Header = Header;
})(Private || (Private = {}));
//# sourceMappingURL=panel.js.map