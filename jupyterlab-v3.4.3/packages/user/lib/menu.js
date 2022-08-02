// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { caretDownIcon, userIcon } from '@jupyterlab/ui-components';
import { Menu, MenuBar } from '@lumino/widgets';
import { h } from '@lumino/virtualdom';
/**
 * Custom renderer for the user menu.
 */
export class RendererUserMenu extends MenuBar.Renderer {
    /**
     * Constructor of the class RendererUserMenu.
     *
     * @argument user Current user object.
     */
    constructor(user) {
        super();
        this._user = user;
    }
    /**
     * Render the virtual element for a menu bar item.
     *
     * @param data - The data to use for rendering the item.
     *
     * @returns A virtual element representing the item.
     */
    renderItem(data) {
        let className = this.createItemClass(data);
        let dataset = this.createItemDataset(data);
        let aria = this.createItemARIA(data);
        return h.li(Object.assign({ className, dataset, tabindex: '0', onfocus: data.onfocus }, aria), this._createUserIcon(), this.renderLabel(data), this.renderIcon(data));
    }
    /**
     * Render the label element for a menu item.
     *
     * @param data - The data to use for rendering the label.
     *
     * @returns A virtual element representing the item label.
     */
    renderLabel(data) {
        let content = this.formatLabel(data);
        return h.div({
            className: 'lm-MenuBar-itemLabel' +
                /* <DEPRECATED> */
                ' p-MenuBar-itemLabel' +
                /* </DEPRECATED> */
                ' jp-MenuBar-label'
        }, content);
    }
    /**
     * Render the user icon element for a menu item.
     *
     * @returns A virtual element representing the item label.
     */
    _createUserIcon() {
        if (this._user.isReady && this._user.avatar_url) {
            return h.div({
                className: 'lm-MenuBar-itemIcon p-MenuBar-itemIcon jp-MenuBar-imageIcon'
            }, h.img({ src: this._user.avatar_url }));
        }
        else if (this._user.isReady) {
            return h.div({
                className: 'lm-MenuBar-itemIcon p-MenuBar-itemIcon jp-MenuBar-anonymousIcon',
                style: { backgroundColor: this._user.color }
            }, h.span({}, this._user.initials));
        }
        else {
            return h.div({
                className: 'lm-MenuBar-itemIcon p-MenuBar-itemIcon jp-MenuBar-anonymousIcon'
            }, userIcon);
        }
    }
}
/**
 * Custom lumino Menu for the user menu.
 */
export class UserMenu extends Menu {
    constructor(options) {
        super(options);
        this._updateLabel = (user) => {
            const name = user.displayName !== '' ? user.displayName : user.name;
            this.title.label = name;
            this.update();
        };
        this._user = options.user;
        const name = this._user.displayName !== '' ? this._user.displayName : this._user.name;
        this.title.label = this._user.isReady ? name : '';
        this.title.icon = caretDownIcon;
        this.title.iconClass = 'jp-UserMenu-caretDownIcon';
        this._user.ready.connect(this._updateLabel);
        this._user.changed.connect(this._updateLabel);
    }
    dispose() {
        this._user.ready.disconnect(this._updateLabel);
        this._user.changed.disconnect(this._updateLabel);
    }
}
//# sourceMappingURL=menu.js.map