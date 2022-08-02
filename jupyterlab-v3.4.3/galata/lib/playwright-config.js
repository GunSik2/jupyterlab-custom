"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
// Default Playwright configuration for JupyterLab
module.exports = {
    reporter: [[process.env.CI ? 'dot' : 'list'], ['html']],
    reportSlowTests: null,
    timeout: 60000,
    use: {
        // Browser options
        // headless: false,
        // slowMo: 500,
        // Context options
        viewport: { width: 1024, height: 768 },
        // Artifacts
        video: 'retain-on-failure'
    }
};
//# sourceMappingURL=playwright-config.js.map