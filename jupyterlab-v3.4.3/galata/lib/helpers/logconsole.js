"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogConsoleHelper = void 0;
/**
 * LogConsole helpers
 */
class LogConsoleHelper {
    constructor(page) {
        this.page = page;
    }
    /**
     * Get the number of log messages in the log console panel.
     *
     * @returns Number of log messages
     */
    async logCount() {
        return await this.page.evaluate(() => {
            let count = 0;
            const logPanels = document.querySelectorAll('.jp-LogConsolePanel .lm-StackedPanel-child');
            logPanels.forEach(logPanel => {
                if (!logPanel.classList.contains('lm-mod-hidden')) {
                    count += logPanel.querySelectorAll('.jp-OutputArea-child').length;
                }
            });
            return count;
        });
    }
}
exports.LogConsoleHelper = LogConsoleHelper;
//# sourceMappingURL=logconsole.js.map