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
exports.xpBuildActiveActivityTabSelector = exports.xpBuildActivityPanelSelector = exports.xpBuildActivityTabSelector = exports.xpContainsClass = exports.waitForTransition = exports.waitForCondition = exports.getToken = exports.getOption = exports.getFilesInDirectory = exports.getElementClassList = exports.getBaseUrl = exports.base64EncodeFile = void 0;
const coreutils_1 = require("@jupyterlab/coreutils");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
/**
 * Read a file as a base-64 string
 *
 * @param filePath Local file path
 * @returns Base 64 encoded file content
 */
function base64EncodeFile(filePath) {
    const content = fs.readFileSync(filePath);
    return content.toString('base64');
}
exports.base64EncodeFile = base64EncodeFile;
/**
 * Private page config data for the Jupyter application.
 */
let configData = null;
// Get config data
async function getConfigData(page) {
    var _a;
    if (configData) {
        return configData;
    }
    configData = Object.create(null);
    const el = await page.$('#jupyter-config-data');
    if (!el) {
        return {};
    }
    configData = JSON.parse((_a = (await (el === null || el === void 0 ? void 0 : el.textContent()))) !== null && _a !== void 0 ? _a : '{}');
    for (const key in configData) {
        // PageConfig expects strings
        if (typeof configData[key] !== 'string') {
            configData[key] = JSON.stringify(configData[key]);
        }
    }
    return configData;
}
/**
 * Get a url-encoded item from `body.data` and decode it
 * We should never have any encoded URLs anywhere else in code
 * until we are building an actual request.
 */
async function getBodyData(page, key) {
    const val = await page.evaluate(key => document.body.dataset[key], key);
    if (typeof val === 'undefined') {
        return '';
    }
    return decodeURIComponent(val);
}
/**
 * Get the Jupyter server base URL stored in the index.html file
 *
 * @param page Playwright page model
 * @returns Base URL
 */
async function getBaseUrl(page) {
    return coreutils_1.URLExt.normalize((await getOption(page, 'baseUrl')) || '/');
}
exports.getBaseUrl = getBaseUrl;
/**
 * Get the classes of an element
 *
 * @param element Element handle
 * @returns Classes list
 */
async function getElementClassList(element) {
    if (!element) {
        return [];
    }
    const className = await element.getProperty('className');
    if (className) {
        const classNameList = await className.jsonValue();
        if (typeof classNameList === 'string') {
            return classNameList.split(' ');
        }
    }
    return [];
}
exports.getElementClassList = getElementClassList;
/**
 * List the content of a local directory
 *
 * @param dirPath Local directory path
 * @param filePaths List to populate with the directory content
 * @returns Content of the directory
 */
function getFilesInDirectory(dirPath, filePaths) {
    const files = fs.readdirSync(dirPath);
    filePaths = filePaths || [];
    for (const file of files) {
        if (file.startsWith('.')) {
            continue;
        }
        if (fs.statSync(dirPath + '/' + file).isDirectory()) {
            filePaths = getFilesInDirectory(dirPath + '/' + file, filePaths);
        }
        else {
            filePaths.push(path.join(dirPath, '/', file));
        }
    }
    return filePaths;
}
exports.getFilesInDirectory = getFilesInDirectory;
/**
 * Get the value of an option stored in the page config object
 *
 * @param page Playwright page model
 * @param name Option name
 * @returns Option value
 */
async function getOption(page, name) {
    var _a;
    return (_a = (await getConfigData(page))[name]) !== null && _a !== void 0 ? _a : (await getBodyData(page, name));
}
exports.getOption = getOption;
/**
 * Get the token stored in the page config object
 *
 * @param page Playwright page model
 * @returns Token
 */
async function getToken(page) {
    return ((await getOption(page, 'token')) ||
        (await getBodyData(page, 'jupyterApiToken')));
}
exports.getToken = getToken;
/**
 * Wait for a function to return true until timeout
 *
 * @param fn Condition
 * @param timeout Time out
 */
async function waitForCondition(fn, timeout) {
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
                checkTimer = setTimeout(check, 200);
            }
        };
        void check();
        if (timeout) {
            timeoutTimer = setTimeout(() => {
                timeoutTimer = null;
                if (checkTimer) {
                    clearTimeout(checkTimer);
                }
                reject(new Error('Timed out waiting for condition to be fulfilled.'));
            }, timeout);
        }
    });
}
exports.waitForCondition = waitForCondition;
/**
 * Wait for an element to emit 'transitionend' event.
 *
 * @param page Playwright page model object
 * @param element Element or selector to watch
 */
async function waitForTransition(page, element) {
    const el = typeof element === 'string' ? await page.$(element) : element;
    if (el) {
        return page.evaluate(el => {
            return new Promise(resolve => {
                const onEndHandler = () => {
                    el.removeEventListener('transitionend', onEndHandler);
                    resolve();
                };
                el.addEventListener('transitionend', onEndHandler);
            });
        }, el);
    }
    return Promise.reject();
}
exports.waitForTransition = waitForTransition;
// Selector builders
/**
 * Get the selector to look for a specific class
 *
 * @param className Class name
 * @returns Selector
 */
function xpContainsClass(className) {
    return `contains(concat(" ", normalize-space(@class), " "), " ${className} ")`;
}
exports.xpContainsClass = xpContainsClass;
/**
 * Get the selector to look for a specific activity tab
 *
 * @param name Activity name
 * @returns Selector
 */
function xpBuildActivityTabSelector(name) {
    return `//div[${xpContainsClass('jp-Activity')}]/ul/li[${xpContainsClass('lm-TabBar-tab')} and ./div[text()="${name}" and ${xpContainsClass('lm-TabBar-tabLabel')}]]`;
}
exports.xpBuildActivityTabSelector = xpBuildActivityTabSelector;
/**
 * Get the selector to look for a specific activity panel
 *
 * @param id Activity id
 * @returns Selector
 */
function xpBuildActivityPanelSelector(id) {
    return `//div[@id='${id}' and ${xpContainsClass('jp-Activity')} and ${xpContainsClass('lm-DockPanel-widget')}]`;
}
exports.xpBuildActivityPanelSelector = xpBuildActivityPanelSelector;
/**
 * Get the selector to look for the currently active activity tab
 *
 * @returns Selector
 */
function xpBuildActiveActivityTabSelector() {
    return `//div[${xpContainsClass('jp-Activity')}]/ul/li[${xpContainsClass('lm-TabBar-tab')} and ${xpContainsClass('lm-mod-current')} and ./div[${xpContainsClass('lm-TabBar-tabLabel')}]]`;
}
exports.xpBuildActiveActivityTabSelector = xpBuildActiveActivityTabSelector;
//# sourceMappingURL=utils.js.map