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
exports.FileBrowserHelper = void 0;
const path = __importStar(require("path"));
const Utils = __importStar(require("../utils"));
/**
 * File Browser Helpers
 */
class FileBrowserHelper {
    constructor(page, contents) {
        this.page = page;
        this.contents = contents;
    }
    /**
     * Create the selector for a file in the file browser
     *
     * @param fileName File name
     * @returns XPath to file in file browser
     */
    xpBuildFileSelector(fileName) {
        return `//div[@id='filebrowser']//li[./span[${Utils.xpContainsClass('jp-DirListing-itemText')} and ./span[text()="${fileName}"]]]`;
    }
    /**
     * Create the selector for a directory in the file browser
     *
     * @param dirName Directory name
     * @returns XPath to directory in file browser
     */
    xpBuildDirectorySelector(dirName) {
        return `//div[@id='filebrowser']//li[@data-isdir='true' and ./span[${Utils.xpContainsClass('jp-DirListing-itemText')} and ./span[text()="${dirName}"]]]`;
    }
    /**
     * Reveal a file in the file browser.
     *
     * It will open intermediate folders if needed.
     *
     * @param filePath File path
     */
    async revealFileInBrowser(filePath) {
        const pos = filePath.lastIndexOf('/');
        const fileName = path.basename(filePath);
        if (pos >= 0) {
            const dirPath = filePath.substring(0, pos);
            await this.openDirectory(dirPath);
        }
        await Utils.waitForCondition(async () => {
            return await this.isFileListedInBrowser(fileName);
        });
    }
    /**
     * Whether the file is listed in the file browser or not.
     *
     * @param fileName File name
     * @returns File status
     */
    async isFileListedInBrowser(fileName) {
        const item = await this.page.$(`xpath=${this.xpBuildFileSelector(fileName)}`);
        return item !== null;
    }
    /**
     * Get the full path of the currently opened directory
     *
     * @returns Directory full path
     */
    async getCurrentDirectory() {
        return await this.page.evaluate(() => {
            var _a;
            let directory = '';
            const spans = document.querySelectorAll('.jp-FileBrowser .jp-FileBrowser-crumbs span');
            const numSpans = spans.length;
            if (numSpans > 1) {
                directory = (_a = spans[numSpans - 2].getAttribute('title')) !== null && _a !== void 0 ? _a : '';
            }
            return directory;
        });
    }
    /**
     * Open a file
     *
     * Note: This will double click on the file;
     * an editor needs to be available for the given file type.
     *
     * @param filePath Notebook path
     * @returns Action success status
     */
    async open(filePath) {
        await this.revealFileInBrowser(filePath);
        const name = path.basename(filePath);
        const fileItem = await this.page.$(`xpath=${this.xpBuildFileSelector(name)}`);
        if (fileItem) {
            await fileItem.click({ clickCount: 2 });
            await this.page.waitForSelector(Utils.xpBuildActivityTabSelector(name), {
                state: 'visible'
            });
        }
        else {
            return false;
        }
        return true;
    }
    /**
     * Open the Home directory.
     *
     * @returns Action success status
     */
    async openHomeDirectory() {
        const homeButton = await this.page.$('.jp-FileBrowser .jp-FileBrowser-crumbs span');
        if (!homeButton) {
            return false;
        }
        await homeButton.click();
        await this.page.waitForFunction(() => {
            const spans = document.querySelectorAll('.jp-FileBrowser .jp-FileBrowser-crumbs span');
            return (spans.length === 2 && spans[0].classList.contains('jp-BreadCrumbs-home'));
        });
        // wait for DOM rerender
        await this.page.waitForTimeout(200);
        return true;
    }
    /**
     * Open a given directory in the file browser
     *
     * @param dirPath Directory path
     * @returns Action success status
     */
    async openDirectory(dirPath) {
        if (!(await this.openHomeDirectory())) {
            return false;
        }
        const directories = dirPath.split('/');
        let path = '';
        for (const directory of directories) {
            if (directory.trim() === '') {
                continue;
            }
            if (path !== '') {
                path += '/';
            }
            path += directory;
            if (!(await this._openDirectory(directory))) {
                return false;
            }
            await Utils.waitForCondition(async () => {
                return (await this.getCurrentDirectory()) === path;
            });
        }
        return true;
    }
    /**
     * Trigger a file browser refresh
     */
    async refresh() {
        const page = this.page;
        const item = await page.$(`xpath=//div[@id='filebrowser']//button[${Utils.xpContainsClass('jp-ToolbarButtonComponent')} and .//*[@data-icon='ui-components:refresh']]`);
        if (item) {
            // wait for network response or timeout
            await Promise.race([
                page.waitForTimeout(2000),
                this.contents.waitForAPIResponse(async () => {
                    await item.click();
                })
            ]);
            // wait for DOM rerender
            await page.waitForTimeout(200);
        }
        else {
            throw new Error('Could not find refresh toolbar item');
        }
    }
    async _openDirectory(dirName) {
        const item = await this.page.$(`xpath=${this.xpBuildDirectorySelector(dirName)}`);
        if (item === null) {
            return false;
        }
        await this.contents.waitForAPIResponse(async () => {
            await item.click({ clickCount: 2 });
        });
        // wait for DOM rerender
        await this.page.waitForTimeout(200);
        return true;
    }
}
exports.FileBrowserHelper = FileBrowserHelper;
//# sourceMappingURL=filebrowser.js.map