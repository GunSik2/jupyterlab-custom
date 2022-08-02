"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeHelper = void 0;
/**
 * Theme helpers
 */
class ThemeHelper {
    constructor(page) {
        this.page = page;
    }
    /**
     * Set JupyterLab theme to Dark
     */
    async setDarkTheme() {
        await this.setTheme('JupyterLab Dark');
    }
    /**
     * Set JupyterLab theme to Light
     */
    async setLightTheme() {
        await this.setTheme('JupyterLab Light');
    }
    /**
     * Get JupyterLab theme name
     *
     * @returns Theme name
     */
    async getTheme() {
        return await this.page.evaluate(() => {
            return document.body.dataset.jpThemeName;
        });
    }
    /**
     * Set JupyterLab theme
     *
     * @param themeName Theme name
     */
    async setTheme(themeName) {
        const page = this.page;
        await page.evaluate(async (themeName) => {
            await window.galataip.setTheme(themeName);
        }, themeName);
        await page.waitForSelector('#jupyterlab-splash', { state: 'detached' });
    }
}
exports.ThemeHelper = ThemeHelper;
//# sourceMappingURL=theme.js.map