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
exports.ActivityHelper = void 0;
const Utils = __importStar(require("../utils"));
/**
 * Activity helper
 */
class ActivityHelper {
    constructor(page) {
        this.page = page;
    }
    /**
     * JupyterLab launcher selector
     */
    get launcherSelector() {
        return Utils.xpBuildActivityTabSelector('Launcher');
    }
    /**
     * Close all widgets in the main area
     */
    async closeAll() {
        await this.page.evaluate(async (launcherSelector) => {
            var _a;
            const app = (_a = window.jupyterlab) !== null && _a !== void 0 ? _a : window.jupyterapp;
            await app.commands.execute('application:close-all');
            await window.galataip.waitForXPath(launcherSelector);
        }, this.launcherSelector);
    }
    /**
     * Whether a tab is active or not
     *
     * @param name Activity name
     * @returns Active status
     */
    async isTabActive(name) {
        var _a;
        const tab = await this.getTab(name);
        return ((_a = (tab &&
            (await tab.evaluate((tab) => tab.classList.contains('lm-mod-current'))))) !== null && _a !== void 0 ? _a : false);
    }
    /**
     * Get a handle on a tab
     *
     * @param name Activity name
     * @returns Handle on the tab or null if the tab is not found
     */
    getTab(name) {
        const page = this.page;
        const tabSelector = name
            ? Utils.xpBuildActivityTabSelector(name)
            : Utils.xpBuildActiveActivityTabSelector();
        return page.$(`xpath=${tabSelector}`);
    }
    /**
     * Get a handle on a panel
     *
     * @param name Activity name
     * @returns Handle on the tab or null if the tab is not found
     */
    async getPanel(name) {
        const page = this.page;
        const tab = await this.getTab(name);
        if (tab) {
            const id = await tab.evaluate((tab) => tab.getAttribute('data-id'));
            return await page.$(`xpath=${Utils.xpBuildActivityPanelSelector(id)}`);
        }
        return null;
    }
    /**
     * Activate a tab is active
     *
     * @param name Activity name
     * @returns Whether the action is successful
     */
    async activateTab(name) {
        const tab = await this.getTab(name);
        if (tab) {
            await tab.click();
            await this.page.waitForFunction(({ tab }) => {
                return tab.classList.contains('jp-mod-current');
            }, { tab });
            return true;
        }
        return false;
    }
}
exports.ActivityHelper = ActivityHelper;
//# sourceMappingURL=activity.js.map