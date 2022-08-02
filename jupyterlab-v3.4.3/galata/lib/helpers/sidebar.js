"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SidebarHelper = void 0;
const tokens_1 = require("../inpage/tokens");
const Utils = __importStar(require("../utils"));
/**
 * Sidebar helpers
 */
class SidebarHelper {
    constructor(page, menu) {
        this.page = page;
        this.menu = menu;
        /**
         * Whether a sidebar is opened or not
         *
         * @param side Sidebar side
         * @returns Opened status
         */
        this.isOpen = async (side = 'left') => {
            return (await this.getContentPanel(side)) !== null;
        };
        /**
         * Get the position of a given tab
         *
         * @param id Tab id
         * @returns Tab position
         */
        this.getTabPosition = async (id) => {
            return await this.page.evaluate(async ({ tabSelector }) => {
                const tabButton = document.querySelector(tabSelector);
                if (!tabButton) {
                    return null;
                }
                const sideBar = tabButton.closest('.jp-SideBar');
                if (!sideBar) {
                    return null;
                }
                return sideBar.classList.contains('jp-mod-right') ? 'right' : 'left';
            }, { tabSelector: this.buildTabSelector(id) });
        };
    }
    /**
     * Whether a given tab is opened or not
     *
     * @param id Tab id
     * @returns Tab opened status
     */
    async isTabOpen(id) {
        const tabButton = await this.page.$(`${this.buildTabSelector(id)}.lm-mod-current`);
        return tabButton !== null;
    }
    /**
     * Move a given tab to left side
     *
     * @param id Tab id
     */
    async moveTabToLeft(id) {
        await this.setTabPosition(id, 'left');
    }
    /**
     * Move a given tab to the right side
     *
     * @param id Tab id
     */
    async moveTabToRight(id) {
        await this.setTabPosition(id, 'right');
    }
    /**
     * Set the position of a given tab
     *
     * @param id Tab id
     * @param side Sidebar side
     */
    async setTabPosition(id, side) {
        const position = await this.getTabPosition(id);
        if (position === side) {
            return;
        }
        await this.toggleTabPosition(id);
        await Utils.waitForCondition(async () => {
            return (await this.getTabPosition(id)) === side;
        });
    }
    /**
     * Toggle a given tab position
     *
     * @param id Tab id
     */
    async toggleTabPosition(id) {
        const tab = await this.getTab(id);
        if (!tab) {
            return;
        }
        await tab.click({ button: 'right' });
        const switchMenuItem = await this.page.waitForSelector('.lm-Menu-content .lm-Menu-item[data-command="sidebar:switch"]', { state: 'visible' });
        if (switchMenuItem) {
            await switchMenuItem.click();
        }
    }
    /**
     * Move all tabs to the left side
     */
    async moveAllTabsToLeft() {
        await this.page.evaluate(async ({ pluginId }) => {
            const settingRegistry = (await window.galataip.getPlugin(pluginId));
            const SIDEBAR_ID = '@jupyterlab/application-extension:sidebar';
            const overrides = (await settingRegistry.get(SIDEBAR_ID, 'overrides'))
                .composite;
            for (const widgetId of Object.keys(overrides)) {
                overrides[widgetId] = 'left';
            }
            // default location of the property inspector and debugger is right, move it to left during tests
            overrides['jp-property-inspector'] = 'left';
            overrides['jp-debugger-sidebar'] = 'left';
            await settingRegistry.set(SIDEBAR_ID, 'overrides', overrides);
        }, { pluginId: tokens_1.PLUGIN_ID_SETTINGS });
        await this.page.waitForFunction(() => {
            const rightStack = document.getElementById('jp-right-stack');
            return (rightStack === null || rightStack === void 0 ? void 0 : rightStack.childElementCount) === 0;
        });
    }
    /**
     * Get the handle on a given tab
     *
     * @param id Tab id
     * @returns Tab handle
     */
    async getTab(id) {
        return await this.page.$(this.buildTabSelector(id));
    }
    /**
     * Open a given tab
     *
     * @param id Tab id
     */
    async openTab(id) {
        const isOpen = await this.isTabOpen(id);
        if (isOpen) {
            return;
        }
        const tabButton = await this.page.$(this.buildTabSelector(id));
        if (tabButton === null) {
            throw new Error(`Unable to find the tab ${id} button`);
        }
        await tabButton.click();
        await this._waitForTabActivate(tabButton);
    }
    /**
     * Get the handle on a sidebar content panel
     *
     * @param side Position
     * @returns Panel handle
     */
    async getContentPanel(side = 'left') {
        return await this.page.$(`#jp-${side}-stack .p-StackedPanel-child:not(.lm-mod-hidden)`);
    }
    /**
     * Open a given sidebar
     *
     * @param side Position
     */
    async open(side = 'left') {
        const isOpen = await this.isOpen(side);
        if (isOpen) {
            return;
        }
        await this.menu.clickMenuItem(`View>Appearance>Show ${side === 'left' ? 'Left' : 'Right'} Sidebar`);
        await Utils.waitForCondition(async () => {
            return await this.isOpen(side);
        });
    }
    /**
     * Close a given sidebar
     *
     * @param side Position
     */
    async close(side = 'left') {
        const isOpen = await this.isOpen(side);
        if (!isOpen) {
            return;
        }
        await this.menu.clickMenuItem(`View>Appearance>Show ${side === 'left' ? 'Left' : 'Right'} Sidebar`);
        await Utils.waitForCondition(async () => {
            return !(await this.isOpen(side));
        });
    }
    /**
     * Get the selector for a given tab
     *
     * @param id Tab id
     * @returns Selector
     */
    buildTabSelector(id) {
        return `.lm-TabBar.jp-SideBar .lm-TabBar-content li.lm-TabBar-tab[data-id="${id}"]`;
    }
    async _waitForTabActivate(tab, activate = true) {
        await this.page.waitForFunction(({ tab, activate }) => {
            const current = tab.classList.contains('lm-mod-current');
            return activate ? current : !current;
        }, { tab, activate });
    }
}
exports.SidebarHelper = SidebarHelper;
//# sourceMappingURL=sidebar.js.map