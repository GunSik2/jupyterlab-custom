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
exports.NotebookHelper = void 0;
const path = __importStar(require("path"));
const Utils = __importStar(require("../utils"));
/**
 * Notebook helpers
 */
class NotebookHelper {
    constructor(page, activity, contents, filebrowser, menu) {
        this.page = page;
        this.activity = activity;
        this.contents = contents;
        this.filebrowser = filebrowser;
        this.menu = menu;
        /**
         * Get the number of cells in the currently active notebook
         *
         * @returns Number of cells
         */
        this.getCellCount = async () => {
            const notebook = await this.getNotebookInPanel();
            if (!notebook) {
                return -1;
            }
            const cells = await notebook.$$('div.jp-Cell');
            return cells.length;
        };
        this._runCallbacksExposed = 0;
    }
    /**
     * Whether a given notebook is opened or not
     *
     * @param name Notebook name
     * @returns Notebook opened status
     */
    async isOpen(name) {
        const tab = await this.activity.getTab(name);
        return tab !== null;
    }
    /**
     * Whether a given notebook is active or not
     *
     * @param name Notebook name
     * @returns Notebook active status
     */
    async isActive(name) {
        return this.activity.isTabActive(name);
    }
    /**
     * Whether a notebook is currently active or not
     *
     * @returns Notebook active status
     */
    async isAnyActive() {
        return (await this.getNotebookInPanel()) !== null;
    }
    /**
     * Open a notebook from its name
     *
     * The notebook needs to exist in the current folder.
     *
     * @param name Notebook name
     * @returns Action success status
     */
    async open(name) {
        const isListed = await this.filebrowser.isFileListedInBrowser(name);
        if (!isListed) {
            return false;
        }
        await this.filebrowser.open(name);
        return await this.isOpen(name);
    }
    /**
     * Open a notebook from its path
     *
     * The notebook do not need to exist in the current folder
     *
     * @param filePath Notebook path
     * @returns Action success status
     */
    async openByPath(filePath) {
        await this.filebrowser.open(filePath);
        const name = path.basename(filePath);
        return await this.isOpen(name);
    }
    /**
     * Get the handle to a notebook panel
     *
     * @param name Notebook name
     * @returns Handle to the Notebook panel
     */
    async getNotebookInPanel(name) {
        const nbPanel = await this.activity.getPanel(name);
        if (nbPanel) {
            return await nbPanel.$('.jp-NotebookPanel-notebook');
        }
        return null;
    }
    /**
     * Get the handle to a notebook toolbar
     *
     * @param name Notebook name
     * @returns Handle to the Notebook toolbar
     */
    async getToolbar(name) {
        const nbPanel = await this.activity.getPanel(name);
        if (nbPanel) {
            return await nbPanel.$('.jp-NotebookPanel-toolbar');
        }
        return null;
    }
    /**
     * Get the handle to a notebook toolbar item from its index
     *
     * @param itemIndex Toolbar item index
     * @param notebookName Notebook name
     * @returns Handle to the notebook toolbar item
     */
    async getToolbarItemByIndex(itemIndex, notebookName) {
        if (itemIndex === -1) {
            return null;
        }
        const toolbar = await this.getToolbar(notebookName);
        if (toolbar) {
            const toolbarItems = await toolbar.$$('.jp-Toolbar-item');
            if (itemIndex < toolbarItems.length) {
                return toolbarItems[itemIndex];
            }
        }
        return null;
    }
    /**
     * Get the handle to a notebook toolbar item from its id
     *
     * @param itemId Toolbar item id
     * @param notebookName Notebook name
     * @returns Handle to the notebook toolbar item
     */
    async getToolbarItem(itemId, notebookName) {
        const toolbar = await this.getToolbar(notebookName);
        if (toolbar) {
            const itemIndex = await this.page.evaluate(async (itemId) => {
                return window.galataip.getNotebookToolbarItemIndex(itemId);
            }, itemId);
            return this.getToolbarItemByIndex(itemIndex);
        }
        return null;
    }
    /**
     * Click on a notebook toolbar item
     *
     * @param itemId Toolbar item id
     * @param notebookName Notebook name
     * @returns Action success status
     */
    async clickToolbarItem(itemId, notebookName) {
        const toolbarItem = await this.getToolbarItem(itemId, notebookName);
        if (toolbarItem) {
            await toolbarItem.click();
            return true;
        }
        return false;
    }
    /**
     * Activate a notebook
     *
     * @param name Notebook name
     * @returns Action success status
     */
    async activate(name) {
        if (await this.activity.activateTab(name)) {
            await this.page.evaluate(async () => {
                const galataip = window.galataip;
                const nbPanel = galataip.app.shell.currentWidget;
                await nbPanel.sessionContext.ready;
                // Assuming that if the session is ready, the kernel is ready also for now and commenting out this line
                // await nbPanel.session.kernel.ready;
                galataip.app.shell.activateById(nbPanel.id);
            });
            return true;
        }
        return false;
    }
    /**
     * Save the currently active notebook
     *
     * @returns Action success status
     */
    async save() {
        if (!(await this.isAnyActive())) {
            return false;
        }
        await this.page.evaluate(async () => {
            await window.galataip.saveActiveNotebook();
        });
        return true;
    }
    /**
     * Revert changes to the currently active notebook
     *
     * @returns Action success status
     */
    async revertChanges() {
        if (!(await this.isAnyActive())) {
            return false;
        }
        await this.page.evaluate(async () => {
            const app = window.galataip.app;
            const nbPanel = app.shell.currentWidget;
            await nbPanel.context.revert();
        });
        return true;
    }
    /**
     * Run all cells of the currently active notebook
     *
     * @returns Action success status
     */
    async run() {
        if (!(await this.isAnyActive())) {
            return false;
        }
        await this.menu.clickMenuItem('Run>Run All Cells');
        await this.waitForRun();
        return true;
    }
    /**
     * Run the currently active notebook cell by cell.
     *
     * @param callback Cell ran callback
     * @returns Action success status
     */
    async runCellByCell(callback) {
        if (!(await this.isAnyActive())) {
            return false;
        }
        let callbackName = '';
        if (callback) {
            callbackName = `_runCallbacksExposed${++this._runCallbacksExposed}`;
            await this.page.exposeFunction(`${callbackName}_onBeforeScroll`, async () => {
                if (callback && callback.onBeforeScroll) {
                    await callback.onBeforeScroll();
                }
            });
            await this.page.exposeFunction(`${callbackName}_onAfterScroll`, async () => {
                if (callback && callback.onAfterScroll) {
                    await callback.onAfterScroll();
                }
            });
            await this.page.exposeFunction(`${callbackName}_onAfterCellRun`, async (cellIndex) => {
                if (callback && callback.onAfterCellRun) {
                    await callback.onAfterCellRun(cellIndex);
                }
            });
        }
        await this.page.evaluate(async (callbackName) => {
            const callbacks = callbackName === ''
                ? undefined
                : {
                    onBeforeScroll: async () => {
                        await window[`${callbackName}_onBeforeScroll`]();
                    },
                    onAfterScroll: async () => {
                        await window[`${callbackName}_onAfterScroll`]();
                    },
                    onAfterCellRun: async (cellIndex) => {
                        await window[`${callbackName}_onAfterCellRun`](cellIndex);
                    }
                };
            await window.galataip.runActiveNotebookCellByCell(callbacks);
        }, callbackName);
        return true;
    }
    /**
     * Wait for notebook cells execution to finish
     */
    async waitForRun() {
        await this.page.evaluate(async () => {
            await window.galataip.waitForNotebookRun();
        });
    }
    /**
     * Close the notebook with or without reverting unsaved changes
     *
     * @param revertChanges Whether to revert changes or not
     * @returns Action success status
     */
    async close(revertChanges = true) {
        if (!(await this.isAnyActive())) {
            return false;
        }
        const page = this.page;
        const tab = await this.activity.getTab();
        if (!tab) {
            return false;
        }
        if (revertChanges) {
            if (!(await this.revertChanges())) {
                return false;
            }
        }
        const closeIcon = await tab.$('.lm-TabBar-tabCloseIcon');
        if (!closeIcon) {
            return false;
        }
        await closeIcon.click();
        // close save prompt
        const dialogSelector = '.jp-Dialog .jp-Dialog-content';
        const dialog = await page.$(dialogSelector);
        if (dialog) {
            const dlgBtnSelector = revertChanges
                ? 'button.jp-mod-accept.jp-mod-warn' // discard
                : 'button.jp-mod-accept:not(.jp-mod-warn)'; // save
            const dlgBtn = await dialog.$(dlgBtnSelector);
            if (dlgBtn) {
                await dlgBtn.click();
            }
        }
        await page.waitForSelector(dialogSelector, { state: 'hidden' });
        return true;
    }
    /**
     * Get a cell handle
     *
     * @param cellIndex Cell index
     * @returns Handle to the cell
     */
    async getCell(cellIndex) {
        const notebook = await this.getNotebookInPanel();
        if (!notebook) {
            return null;
        }
        const cells = await notebook.$$('div.jp-Cell');
        if (cellIndex < 0 || cellIndex >= cells.length) {
            return null;
        }
        return cells[cellIndex];
    }
    /**
     * Get the handle to the input of a cell
     *
     * @param cellIndex Cell index
     * @returns Handle to the cell input
     */
    async getCellInput(cellIndex) {
        const cell = await this.getCell(cellIndex);
        if (!cell) {
            return null;
        }
        const cellEditor = await cell.$('.jp-InputArea-editor');
        if (!cellEditor) {
            return null;
        }
        const isRenderedMarkdown = await cellEditor.evaluate(editor => editor.classList.contains('lm-mod-hidden'));
        if (isRenderedMarkdown) {
            return await cell.$('.jp-MarkdownOutput');
        }
        return cellEditor;
    }
    /**
     * Get the handle to the input expander of a cell
     *
     * @param cellIndex Cell index
     * @returns Handle to the cell input expander
     */
    async getCellInputExpander(cellIndex) {
        const cell = await this.getCell(cellIndex);
        if (!cell) {
            return null;
        }
        return await cell.$('.jp-InputCollapser');
    }
    /**
     * Whether a cell input is expanded or not
     *
     * @param cellIndex Cell index
     * @returns Cell input expanded status
     */
    async isCellInputExpanded(cellIndex) {
        const cell = await this.getCell(cellIndex);
        if (!cell) {
            return null;
        }
        return (await cell.$('.jp-InputPlaceholder')) === null;
    }
    /**
     * Set the expanded status of a given input cell
     *
     * @param cellIndex Cell index
     * @param expand Input expanded status
     * @returns Action success status
     */
    async expandCellInput(cellIndex, expand) {
        const expanded = await this.isCellInputExpanded(cellIndex);
        if ((expanded && expand) || (!expanded && !expand)) {
            return false;
        }
        const inputExpander = await this.getCellInputExpander(cellIndex);
        if (!inputExpander) {
            return false;
        }
        await inputExpander.click();
        return true;
    }
    /**
     * Get the handle to a cell output expander
     *
     * @param cellIndex Cell index
     * @returns Handle to the cell output expander
     */
    async getCellOutputExpander(cellIndex) {
        const cell = await this.getCell(cellIndex);
        if (!cell) {
            return null;
        }
        const cellType = await this.getCellType(cellIndex);
        return cellType === 'code' ? await cell.$('.jp-OutputCollapser') : null;
    }
    /**
     * Whether a cell output is expanded or not
     *
     * @param cellIndex Cell index
     * @returns Cell output expanded status
     */
    async isCellOutputExpanded(cellIndex) {
        const cell = await this.getCell(cellIndex);
        if (!cell) {
            return null;
        }
        return (await cell.$('.jp-OutputPlaceholder')) === null;
    }
    /**
     * Set the expanded status of a given output cell
     *
     * @param cellIndex Cell index
     * @param expand Output expanded status
     * @returns Action success status
     */
    async expandCellOutput(cellIndex, expand) {
        const expanded = await this.isCellOutputExpanded(cellIndex);
        if ((expanded && expand) || (!expanded && !expand)) {
            return false;
        }
        const outputExpander = await this.getCellOutputExpander(cellIndex);
        if (!outputExpander) {
            return false;
        }
        await outputExpander.click();
        return true;
    }
    /**
     * Get the handle on a given output cell
     *
     * @param cellIndex Cell index
     * @returns Output cell handle
     */
    async getCellOutput(cellIndex) {
        const cell = await this.getCell(cellIndex);
        if (!cell) {
            return null;
        }
        const codeCellOutput = await cell.$('.jp-Cell-outputArea');
        if (codeCellOutput) {
            return codeCellOutput;
        }
        const mdCellOutput = await cell.$('.jp-MarkdownOutput');
        if (mdCellOutput) {
            return mdCellOutput;
        }
        return null;
    }
    /**
     * Get all cell outputs as text
     *
     * @param cellIndex Cell index
     * @returns List of text outputs
     */
    async getCellTextOutput(cellIndex) {
        const cellOutput = await this.getCellOutput(cellIndex);
        if (!cellOutput) {
            return null;
        }
        const textOutputs = await cellOutput.$$('.jp-OutputArea-output');
        if (textOutputs.length > 0) {
            const outputs = [];
            for (const textOutput of textOutputs) {
                outputs.push((await (await textOutput.getProperty('textContent')).jsonValue()));
            }
            return outputs;
        }
        return null;
    }
    /**
     * Whether the cell is in editing mode or not
     *
     * @param cellIndex Cell index
     * @returns Editing mode
     */
    async isCellInEditingMode(cellIndex) {
        const cell = await this.getCell(cellIndex);
        if (!cell) {
            return false;
        }
        const cellEditor = await cell.$('.jp-InputArea-editor');
        if (cellEditor) {
            return await cellEditor.evaluate(editor => editor.classList.contains('jp-mod-focused'));
        }
        return false;
    }
    /**
     * Enter the editing mode on a given cell
     *
     * @param cellIndex Cell index
     * @returns Action success status
     */
    async enterCellEditingMode(cellIndex) {
        const cell = await this.getCell(cellIndex);
        if (!cell) {
            return false;
        }
        const cellEditor = await cell.$('.jp-Cell-inputArea');
        if (cellEditor) {
            let isMarkdown = false;
            const cellType = await this.getCellType(cellIndex);
            if (cellType === 'markdown') {
                const renderedMarkdown = await cell.$('.jp-MarkdownOutput');
                if (renderedMarkdown) {
                    isMarkdown = true;
                }
            }
            if (isMarkdown) {
                await cellEditor.dblclick();
            }
            await cellEditor.click();
            return true;
        }
        return false;
    }
    /**
     * Leave the editing mode
     *
     * @param cellIndex Cell index
     * @returns Action success status
     */
    async leaveCellEditingMode(cellIndex) {
        if (await this.isCellInEditingMode(cellIndex)) {
            await this.page.keyboard.press('Escape');
            return true;
        }
        return false;
    }
    /**
     * Select cells
     *
     * @param startIndex Start cell index
     * @param endIndex End cell index
     * @returns Action success status
     */
    async selectCells(startIndex, endIndex) {
        const startCell = await this.getCell(startIndex);
        if (!startCell) {
            return false;
        }
        const clickPosition = { x: 15, y: 5 };
        await startCell.click({ position: clickPosition });
        if (endIndex !== undefined) {
            const endCell = await this.getCell(endIndex);
            if (!endCell) {
                return false;
            }
            await endCell.click({ position: clickPosition, modifiers: ['Shift'] });
        }
        return true;
    }
    /**
     * Whether a given cell is selected or not
     *
     * @param cellIndex Cell index
     * @returns Selection status
     */
    async isCellSelected(cellIndex) {
        return await this.page.evaluate((cellIndex) => {
            return window.galataip.isNotebookCellSelected(cellIndex);
        }, cellIndex);
    }
    /**
     * Delete selected cells
     *
     * @returns Action success status
     */
    async deleteCells() {
        if (!(await this.isAnyActive())) {
            return false;
        }
        await this.page.evaluate(() => {
            return window.galataip.deleteNotebookCells();
        });
        return true;
    }
    /**
     * Add a cell to the currently active notebook
     *
     * @param cellType Cell type
     * @param source Source
     * @returns Action success status
     */
    async addCell(cellType, source) {
        if (!(await this.isAnyActive())) {
            return false;
        }
        const numCells = await this.getCellCount();
        await this.selectCells(numCells - 1);
        await this.clickToolbarItem('insert');
        await Utils.waitForCondition(async () => {
            return (await this.getCellCount()) === numCells + 1;
        });
        return await this.setCell(numCells, cellType, source);
    }
    /**
     * Set the input source of a cell
     *
     * @param cellIndex Cell index
     * @param cellType Cell type
     * @param source Source
     * @returns Action success status
     */
    async setCell(cellIndex, cellType, source) {
        if (!(await this.isAnyActive())) {
            return false;
        }
        await this.setCellType(cellIndex, cellType);
        if (!(await this.isCellSelected(cellIndex)) &&
            !(await this.selectCells(cellIndex))) {
            return false;
        }
        await this.enterCellEditingMode(cellIndex);
        const keyboard = this.page.keyboard;
        await keyboard.press('Control+A');
        // give CodeMirror time to style properly
        await keyboard.type(source, { delay: cellType === 'code' ? 100 : 0 });
        await this.leaveCellEditingMode(cellIndex);
        // give CodeMirror time to style properly
        if (cellType === 'code') {
            await this.page.waitForTimeout(500);
        }
        return true;
    }
    /**
     * Set the type of a cell
     *
     * @param cellIndex Cell index
     * @param cellType Cell type
     * @returns Action success status
     */
    async setCellType(cellIndex, cellType) {
        const nbPanel = await this.activity.getPanel();
        if (!nbPanel) {
            return false;
        }
        if ((await this.getCellType(cellIndex)) === cellType) {
            return false;
        }
        if (!(await this.selectCells(cellIndex))) {
            return false;
        }
        await this.clickToolbarItem('cellType');
        const selectInput = await nbPanel.$('div.jp-Notebook-toolbarCellTypeDropdown select');
        if (!selectInput) {
            return false;
        }
        await selectInput.selectOption(cellType);
        return true;
    }
    /**
     * Get the cell type of a cell
     *
     * @param cellIndex Cell index
     * @returns Cell type
     */
    async getCellType(cellIndex) {
        const notebook = await this.getNotebookInPanel();
        if (!notebook) {
            return null;
        }
        const cells = await notebook.$$('div.jp-Cell');
        if (cellIndex < 0 || cellIndex >= cells.length) {
            return null;
        }
        const cell = cells[cellIndex];
        const classList = await Utils.getElementClassList(cell);
        if (classList.indexOf('jp-CodeCell') !== -1) {
            return 'code';
        }
        else if (classList.indexOf('jp-MarkdownCell') !== -1) {
            return 'markdown';
        }
        else if (classList.indexOf('jp-RawCell') !== -1) {
            return 'raw';
        }
        return null;
    }
    /**
     * Run a given cell
     *
     * @param cellIndex Cell index
     * @param inplace Whether to stay on the cell or select the next one
     * @returns Action success status
     */
    async runCell(cellIndex, inplace) {
        if (!(await this.isAnyActive())) {
            return false;
        }
        if (!(await this.isCellSelected(cellIndex)) &&
            !(await this.selectCells(cellIndex))) {
            return false;
        }
        await this.page.keyboard.press(inplace === true ? 'Control+Enter' : 'Shift+Enter');
        await this.waitForRun();
        return true;
    }
    /**
     * Create a new notebook
     *
     * @param name Name of the notebook
     * @returns Name of the created notebook or null if it failed
     */
    async createNew(name) {
        await this.menu.clickMenuItem('File>New>Notebook');
        const page = this.page;
        await page.waitForSelector('.jp-Dialog');
        await page.click('.jp-Dialog .jp-mod-accept');
        const activeTab = await this.activity.getTab();
        if (!activeTab) {
            return null;
        }
        const label = await activeTab.$('div.lm-TabBar-tabLabel');
        if (!label) {
            return null;
        }
        const assignedName = (await (await label.getProperty('textContent')).jsonValue());
        if (!name) {
            return assignedName;
        }
        const currentDir = await this.filebrowser.getCurrentDirectory();
        await this.contents.renameFile(`${currentDir}/${assignedName}`, `${currentDir}/${name}`);
        const renamedTab = await this.activity.getTab(name);
        return renamedTab ? name : null;
    }
}
exports.NotebookHelper = NotebookHelper;
//# sourceMappingURL=notebook.js.map