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
exports.KernelHelper = void 0;
const Utils = __importStar(require("../utils"));
/**
 * Kernels and sessions helpers
 *
 * These helpers are using JupyterLab serviceManager in Javascript. There
 * are therefore not available if the page is not loaded.
 */
class KernelHelper {
    constructor(page) {
        this.page = page;
    }
    /**
     * Whether a sessions is running or not.
     *
     * @returns Running status
     */
    async isAnyRunning() {
        return await this.page.evaluate(() => {
            var _a;
            const app = (_a = window.jupyterlab) !== null && _a !== void 0 ? _a : window.jupyterapp;
            return app.serviceManager.sessions.running().next() !== undefined;
        });
    }
    /**
     * Shutdown all sessions.
     */
    async shutdownAll() {
        await this.page.evaluate(async () => {
            var _a;
            const app = (_a = window.jupyterlab) !== null && _a !== void 0 ? _a : window.jupyterapp;
            await app.serviceManager.sessions.shutdownAll();
        });
        await Utils.waitForCondition(async () => {
            return (await this.isAnyRunning()) === false;
        });
    }
}
exports.KernelHelper = KernelHelper;
//# sourceMappingURL=kernel.js.map