"use strict";
/* eslint-disable @typescript-eslint/ban-types */
// Copyright (c) Bloomberg Finance LP.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalataInpage = void 0;
const algorithm_1 = require("@lumino/algorithm");
const tokens_1 = require("./tokens");
/**
 * Factory for element containing a given class xpath
 *
 * @param className Class name
 * @returns The selector
 */
function xpContainsClass(className) {
    return `contains(concat(" ", normalize-space(@class), " "), " ${className} ")`;
}
/**
 * In-Page Galata helpers
 */
class GalataInpage {
    constructor() {
        var _a;
        this._app = (_a = window.jupyterlab) !== null && _a !== void 0 ? _a : window.jupyterapp;
    }
    /**
     * Get an application plugin
     *
     * @param pluginId Plugin ID
     * @returns Application plugin
     */
    async getPlugin(pluginId) {
        return new Promise((resolve, reject) => {
            const app = this._app;
            const hasPlugin = app.hasPlugin(pluginId);
            if (hasPlugin) {
                try {
                    const appAny = app;
                    const plugin = appAny._pluginMap
                        ? appAny._pluginMap[pluginId]
                        : undefined;
                    if (plugin.activated) {
                        resolve(plugin.service);
                    }
                    else {
                        void app.activatePlugin(pluginId).then(response => {
                            resolve(plugin.service);
                        });
                    }
                }
                catch (error) {
                    console.error('Failed to get plugin', error);
                }
            }
        });
    }
    /**
     * Wait for a function to finish for max. timeout milliseconds
     *
     * @param fn Function
     * @param timeout Timeout
     */
    async waitForFunction(fn, timeout) {
        return new Promise((resolve, reject) => {
            let checkTimer = null;
            let timeoutTimer = null;
            const check = async () => {
                checkTimer = null;
                if (await Promise.resolve(fn())) {
                    if (timeoutTimer) {
                        clearTimeout(timeoutTimer);
                    }
                    resolve();
                }
                else {
                    checkTimer = window.setTimeout(check, 200);
                }
            };
            void check();
            if (timeout) {
                timeoutTimer = window.setTimeout(() => {
                    timeoutTimer = null;
                    if (checkTimer) {
                        clearTimeout(checkTimer);
                    }
                    reject(new Error('Timed out waiting for condition to be fulfilled.'));
                }, timeout);
            }
        });
    }
    /**
     * Waits for the given `timeout` in milliseconds.
     *
     * @param timeout A timeout to wait for
     */
    async waitForTimeout(timeout) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, timeout);
        });
    }
    /**
     * Wait for a condition to fulfill or for a certain time
     *
     * @param condition Condition or timeout to wait for
     * @param timeout Timeout
     */
    async waitFor(condition, timeout) {
        const conditionType = typeof condition;
        if (conditionType === 'function') {
            return this.waitForFunction(condition, timeout);
        }
        else if (conditionType === 'number') {
            return this.waitForTimeout(condition);
        }
    }
    /**
     * Wait for the route to be on path and close all documents
     *
     * @param path Path to monitor
     */
    async waitForLaunch(path = '/lab') {
        let resolver;
        const delegate = new Promise(resolve => {
            resolver = resolve;
        });
        const router = await this.getPlugin(tokens_1.PLUGIN_ID_ROUTER);
        const docManager = await this.getPlugin(tokens_1.PLUGIN_ID_DOC_MANAGER);
        const listener = async (sender, args) => {
            if (args.path === path) {
                router === null || router === void 0 ? void 0 : router.routed.disconnect(listener);
                await (docManager === null || docManager === void 0 ? void 0 : docManager.closeAll());
                resolver();
            }
        };
        router === null || router === void 0 ? void 0 : router.routed.connect(listener);
        return delegate;
    }
    /**
     * Wait for an element to be found from a CSS selector
     *
     * @param selector CSS selector
     * @param node Element
     * @param options Options
     * @returns Selected element
     */
    async waitForSelector(selector, node, options) {
        const waitForHidden = options && options.hidden;
        return new Promise((resolve, reject) => {
            const timer = setInterval(() => {
                const parent = node || document;
                const found = parent.querySelector(selector);
                if (waitForHidden) {
                    if (!found) {
                        clearInterval(timer);
                        resolve(null);
                    }
                }
                else if (found) {
                    clearInterval(timer);
                    resolve(found);
                }
            }, 200);
        });
    }
    /**
     * Wait for an element to be found from a XPath
     *
     * @param selector CSS selector
     * @param node Element
     * @param options Options
     * @returns Selected element
     */
    async waitForXPath(selector, node, options) {
        const waitForHidden = options && options.hidden;
        return new Promise((resolve, reject) => {
            const timer = setInterval(() => {
                const parent = node || document;
                const iterator = document.evaluate(selector, parent, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
                const found = iterator && iterator.iterateNext();
                if (waitForHidden) {
                    if (!found) {
                        clearInterval(timer);
                        resolve(null);
                    }
                }
                else if (found) {
                    clearInterval(timer);
                    resolve(found);
                }
            }, 200);
        });
    }
    /**
     * Delete all cells of the active notebook
     */
    async deleteNotebookCells() {
        const nbPanel = this._app.shell.currentWidget;
        const nb = nbPanel.content;
        void this._app.commands.execute('notebook:delete-cell');
        nb.update();
    }
    /**
     * Add a cell to the active notebook
     *
     * @param cellType Cell type
     * @param source Cell input source
     * @returns Action success result
     */
    addNotebookCell(cellType, source) {
        const nbPanel = this._app.shell.currentWidget;
        const nb = nbPanel.content;
        if (nb !== null) {
            void this._app.commands.execute('notebook:insert-cell-below');
            const numCells = nb.widgets.length;
            if (nb.model) {
                nb.model.cells.beginCompoundOperation();
                nb.model.cells.set(numCells - 1, nb.model.contentFactory.createCell(cellType, {
                    cell: {
                        cell_type: cellType,
                        source: source,
                        metadata: {}
                    }
                }));
                nb.model.cells.endCompoundOperation();
            }
            nb.update();
        }
        else {
            return false;
        }
        return true;
    }
    /**
     * Set the type and content of a cell in the active notebook
     *
     * @param cellIndex Cell index
     * @param cellType Cell type
     * @param source Cell input source
     * @returns Action success status
     */
    setNotebookCell(cellIndex, cellType, source) {
        const nbPanel = this._app.shell.currentWidget;
        const nb = nbPanel.content;
        if (nb) {
            const numCells = nb.widgets.length;
            if (cellIndex < 0 || cellIndex >= numCells) {
                return false;
            }
            if (nb.model) {
                nb.model.cells.beginCompoundOperation();
                nb.model.cells.set(cellIndex, nb.model.contentFactory.createCell(cellType, {
                    cell: {
                        cell_type: cellType,
                        source: source,
                        metadata: {}
                    }
                }));
                nb.model.cells.endCompoundOperation();
            }
            nb.update();
        }
        else {
            return false;
        }
        return true;
    }
    /**
     * Test if a cell is selected in the active notebook
     *
     * @param cellIndex Cell index
     * @returns Whether the cell is selected or not
     */
    isNotebookCellSelected(cellIndex) {
        const nbPanel = this._app.shell.currentWidget;
        const nb = nbPanel.content;
        const numCells = nb.widgets.length;
        if (cellIndex < 0 || cellIndex >= numCells) {
            return false;
        }
        return nb.isSelected(nb.widgets[cellIndex]);
    }
    /**
     * Save the active notebook
     */
    async saveActiveNotebook() {
        const nbPanel = this._app.shell.currentWidget;
        await nbPanel.context.save();
    }
    /**
     * Run the active notebook
     */
    async runActiveNotebook() {
        await this._app.commands.execute('notebook:run-all-cells');
    }
    /**
     * Wait for the active notebook to be run
     */
    async waitForNotebookRun() {
        const nbPanel = this._app.shell.currentWidget;
        const notebook = nbPanel.content;
        if (!notebook.widgets) {
            console.error('NOTEBOOK CELL PROBLEM', notebook);
        }
        const numCells = notebook.widgets.length;
        if (numCells === 0) {
            return;
        }
        const promises = [];
        for (let i = 0; i < numCells; ++i) {
            const cell = notebook.widgets[i];
            promises.push(this.waitForCellRun(cell));
        }
        await Promise.all(promises);
    }
    /**
     * Wait for a Markdown cell to be rendered
     *
     * @param cell Cell
     */
    async waitForMarkdownCellRendered(cell) {
        await cell.ready;
        let resolver;
        const delegate = new Promise(resolve => {
            resolver = resolve;
        });
        let timer = window.setInterval(() => {
            if (cell.rendered) {
                if (timer) {
                    clearInterval(timer);
                }
                timer = null;
                resolver();
            }
        }, 200);
        return delegate;
    }
    /**
     * Wait for a cell to be run and return its output element
     *
     * @param cell Cell
     * @param timeout Timeout
     * @returns Output element
     */
    async waitForCellRun(cell, timeout = 2000) {
        const model = cell.model;
        const code = model.value.text;
        if (!code.trim()) {
            return null;
        }
        const emptyPrompt = '[ ]:';
        const runningPrompt = '[*]:';
        await this.waitForXPath(`.//div[${xpContainsClass('jp-InputArea-prompt')} and text()="${emptyPrompt}"]`, cell.node, { hidden: true });
        await this.waitForXPath(`.//div[${xpContainsClass('jp-InputArea-prompt')} and text()="${runningPrompt}"]`, cell.node, { hidden: true });
        const cellType = cell.model.type;
        if (cellType === 'markdown') {
            await this.waitForMarkdownCellRendered(cell);
            return null;
        }
        else if (cellType === 'raw') {
            return null;
        }
        else {
            // 'code'
            let resolver;
            const delegate = new Promise(resolve => {
                resolver = resolve;
            });
            let numTries = 0;
            let timer = null;
            let timeoutTimer = null;
            const clearAndResolve = (output) => {
                clearInterval(timer);
                timer = null;
                clearTimeout(timeoutTimer);
                timeoutTimer = null;
                resolver(output);
            };
            const startTimeout = () => {
                if (!timeoutTimer) {
                    timeoutTimer = setTimeout(() => {
                        clearAndResolve(null);
                    }, timeout);
                }
            };
            const checkIfDone = () => {
                const output = cell.node.querySelector('.jp-Cell-outputArea .jp-OutputArea-output');
                if (output) {
                    if (output.textContent === 'Loading widget...') {
                        startTimeout();
                    }
                    else {
                        clearAndResolve(output);
                    }
                }
                else {
                    if (numTries > 0) {
                        clearAndResolve(null);
                    }
                }
                numTries++;
            };
            checkIfDone();
            timer = setInterval(() => {
                checkIfDone();
            }, 200);
            return delegate;
        }
    }
    /**
     * Whether the given notebook will scroll or not
     *
     * @param notebook Notebook
     * @param position Position
     * @param threshold Threshold
     * @returns Test result
     */
    notebookWillScroll(notebook, position, threshold = 25) {
        const node = notebook.node;
        const ar = node.getBoundingClientRect();
        const delta = position - ar.top - ar.height / 2;
        return Math.abs(delta) > (ar.height * threshold) / 100;
    }
    /**
     * Run the active notebook cell by cell
     * and execute the callback after each cell execution
     *
     * @param callback Callback
     */
    async runActiveNotebookCellByCell(callback) {
        const nbPanel = this._app.shell.currentWidget;
        const notebook = nbPanel.content;
        if (!notebook.widgets) {
            console.error('NOTEBOOK CELL PROBLEM', notebook);
        }
        const numCells = notebook.widgets.length;
        if (numCells === 0) {
            return;
        }
        void this._app.commands.execute('notebook:deselect-all');
        for (let i = 0; i < numCells; ++i) {
            const cell = notebook.widgets[i];
            notebook.activeCellIndex = i;
            notebook.select(cell);
            await this._app.commands.execute('notebook:run-cell');
            const output = await this.waitForCellRun(cell);
            if (callback && callback.onAfterCellRun) {
                await callback.onAfterCellRun(i);
            }
            const rectNode = output
                ? cell.node.querySelector('.jp-Cell-outputArea')
                : cell.inputArea.node;
            const rect = rectNode === null || rectNode === void 0 ? void 0 : rectNode.getBoundingClientRect();
            const scrollThreshold = 45;
            let prevScroll = notebook.node.scrollTop;
            let willScroll = false;
            if (rect) {
                willScroll = this.notebookWillScroll(notebook, rect.bottom, scrollThreshold);
                if (willScroll && callback && callback.onBeforeScroll) {
                    await callback.onBeforeScroll();
                }
                prevScroll = notebook.node.scrollTop;
                notebook.scrollToPosition(rect.bottom, scrollThreshold);
            }
            notebook.update();
            if (willScroll && callback && callback.onAfterScroll) {
                const newScroll = notebook.node.scrollTop;
                if (newScroll !== prevScroll) {
                    console.error('Notebook scroll mispredicted!');
                }
                await callback.onAfterScroll();
            }
        }
    }
    /**
     * Get the index of a toolbar item
     *
     * @param itemName Item name
     * @returns Index
     */
    getNotebookToolbarItemIndex(itemName) {
        const nbPanel = this._app.shell.currentWidget;
        const names = algorithm_1.toArray(nbPanel.toolbar.names());
        return names.indexOf(itemName);
    }
    /**
     * Test if a element is visible or not
     *
     * @param el Element
     * @returns Test result
     */
    isElementVisible(el) {
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    }
    /**
     * Set the application theme
     *
     * @param themeName Theme name
     */
    async setTheme(themeName) {
        await this._app.commands.execute('apputils:change-theme', {
            theme: themeName
        });
        await this.waitFor(async () => {
            return document.body.dataset.jpThemeName === themeName;
        });
    }
    /**
     * Application object
     */
    get app() {
        return this._app;
    }
}
exports.GalataInpage = GalataInpage;
window.galataip = new GalataInpage();
//# sourceMappingURL=index.js.map