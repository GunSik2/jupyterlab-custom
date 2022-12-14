// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { VDomModel, VDomRenderer } from '@jupyterlab/apputils';
import { clickedItem, interactiveItem, showPopup, TextItem } from '@jupyterlab/statusbar';
import { nullTranslator } from '@jupyterlab/translation';
import React from 'react';
/**
 * A pure functional component for rendering the TabSpace status.
 */
function TabSpaceComponent(props) {
    const translator = props.translator || nullTranslator;
    const trans = translator.load('jupyterlab');
    const description = props.isSpaces
        ? trans.__('Spaces')
        : trans.__('Tab Size');
    return (React.createElement(TextItem, { onClick: props.handleClick, source: `${description}: ${props.tabSpace}`, title: trans.__('Change Tab indentationâ€¦') }));
}
/**
 * A VDomRenderer for a tabs vs. spaces status item.
 */
export class TabSpaceStatus extends VDomRenderer {
    /**
     * Create a new tab/space status item.
     */
    constructor(options) {
        super(new TabSpaceStatus.Model());
        this._popup = null;
        this._menu = options.menu;
        this.translator = options.translator || nullTranslator;
        this.addClass(interactiveItem);
    }
    /**
     * Render the TabSpace status item.
     */
    render() {
        if (!this.model || !this.model.config) {
            return null;
        }
        else {
            return (React.createElement(TabSpaceComponent, { isSpaces: this.model.config.insertSpaces, tabSpace: this.model.config.tabSize, handleClick: () => this._handleClick(), translator: this.translator }));
        }
    }
    /**
     * Handle a click on the status item.
     */
    _handleClick() {
        const menu = this._menu;
        if (this._popup) {
            this._popup.dispose();
        }
        menu.aboutToClose.connect(this._menuClosed, this);
        this._popup = showPopup({
            body: menu,
            anchor: this,
            align: 'right'
        });
    }
    _menuClosed() {
        this.removeClass(clickedItem);
    }
}
/**
 * A namespace for TabSpace statics.
 */
(function (TabSpaceStatus) {
    /**
     * A VDomModel for the TabSpace status item.
     */
    class Model extends VDomModel {
        constructor() {
            super(...arguments);
            this._config = null;
        }
        /**
         * The editor config from the settings system.
         */
        get config() {
            return this._config;
        }
        set config(val) {
            const oldConfig = this._config;
            this._config = val;
            this._triggerChange(oldConfig, this._config);
        }
        _triggerChange(oldValue, newValue) {
            const oldSpaces = oldValue && oldValue.insertSpaces;
            const oldSize = oldValue && oldValue.tabSize;
            const newSpaces = newValue && newValue.insertSpaces;
            const newSize = newValue && newValue.tabSize;
            if (oldSpaces !== newSpaces || oldSize !== newSize) {
                this.stateChanged.emit(void 0);
            }
        }
    }
    TabSpaceStatus.Model = Model;
})(TabSpaceStatus || (TabSpaceStatus = {}));
//# sourceMappingURL=tabspacestatus.js.map