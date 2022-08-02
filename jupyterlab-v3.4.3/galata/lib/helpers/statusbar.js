"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBarHelper = void 0;
/**
 * Status Bar helpers
 */
class StatusBarHelper {
    constructor(page, menu) {
        this.page = page;
        this.menu = menu;
    }
    /**
     * Whether the status bar is visible or not
     *
     * @returns Visibility status
     */
    async isVisible() {
        return await this.page.evaluate(() => {
            const statusBar = document.querySelector('#jp-main-statusbar');
            return window.galataip.isElementVisible(statusBar);
        });
    }
    /**
     * Show the status bar
     */
    async show() {
        const visible = await this.isVisible();
        if (visible) {
            return;
        }
        await this.menu.clickMenuItem('View>Show Status Bar');
        await this.page.waitForSelector('#jp-main-statusbar', {
            state: 'visible'
        });
    }
    /**
     * Hide the status bar
     */
    async hide() {
        const visible = await this.isVisible();
        if (!visible) {
            return;
        }
        await this.menu.clickMenuItem('View>Show Status Bar');
        await this.page.waitForSelector('#jp-main-statusbar', {
            state: 'hidden'
        });
    }
}
exports.StatusBarHelper = StatusBarHelper;
//# sourceMappingURL=statusbar.js.map