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
exports.JupyterLabPage = void 0;
const path = __importStar(require("path"));
const contents_1 = require("./contents");
const helpers_1 = require("./helpers");
const Utils = __importStar(require("./utils"));
/**
 * Wrapper class around Playwright Page object.
 */
class JupyterLabPage {
    /**
     * Page object model for JupyterLab
     *
     * @param page Playwright page object
     * @param baseURL Server base URL
     * @param waitForApplication Callback that resolved when the application page is ready
     * @param appPath Application URL path fragment
     */
    constructor(page, baseURL, waitForApplication, appPath = '/lab') {
        this.page = page;
        this.baseURL = baseURL;
        this.appPath = appPath;
        /**
         * Whether JupyterLab is in simple mode or not
         */
        this.isInSimpleMode = async () => {
            const toggle = await this.page.$('#jp-single-document-mode button.jp-switch');
            const checked = (await (toggle === null || toggle === void 0 ? void 0 : toggle.getAttribute('aria-checked'))) === 'true';
            return checked;
        };
        /**
         * Wait for the application to be started
         */
        this.waitForAppStarted = async () => {
            return this.waitForCondition(() => this.page.evaluate(async () => {
                if (typeof window.jupyterlab === 'object') {
                    // Wait for plugins to be loaded
                    await window.jupyterlab.started;
                    return true;
                }
                else if (typeof window.jupyterapp === 'object') {
                    // Wait for plugins to be loaded
                    await window.jupyterapp.started;
                    return true;
                }
                return false;
            }));
        };
        this.waitIsReady = waitForApplication;
        this.activity = new helpers_1.ActivityHelper(page);
        this.contents = new contents_1.ContentsHelper(baseURL, page);
        this.filebrowser = new helpers_1.FileBrowserHelper(page, this.contents);
        this.kernel = new helpers_1.KernelHelper(page);
        this.logconsole = new helpers_1.LogConsoleHelper(page);
        this.menu = new helpers_1.MenuHelper(page);
        this.notebook = new helpers_1.NotebookHelper(page, this.activity, this.contents, this.filebrowser, this.menu);
        this.performance = new helpers_1.PerformanceHelper(page);
        this.statusbar = new helpers_1.StatusBarHelper(page, this.menu);
        this.sidebar = new helpers_1.SidebarHelper(page, this.menu);
        this.theme = new helpers_1.ThemeHelper(page);
    }
    /**
     * Selector for launcher tab
     */
    get launcherSelector() {
        return this.activity.launcherSelector;
    }
    /**
     * Getter for JupyterLab base URL
     */
    async getBaseUrl() {
        return Utils.getBaseUrl(this.page);
    }
    /**
     * Getter for JupyterLab page configuration property
     *
     * @param name Option name
     * @returns The property value
     */
    async getOption(name) {
        return Utils.getOption(this.page, name);
    }
    /**
     * Getter for JupyterLab server root folder
     */
    async getServerRoot() {
        var _a;
        return (_a = (await Utils.getOption(this.page, 'serverRoot'))) !== null && _a !== void 0 ? _a : null;
    }
    /**
     * Getter for JupyterLab token
     */
    async getToken() {
        return Utils.getToken(this.page);
    }
    /**
     * Returns the main resource response. In case of multiple redirects, the navigation will resolve with the response of the
     * last redirect.
     *
     * This overrides the standard Playwright `page.goto` method by waiting for:
     * - the application to be started (plugins are loaded)
     * - the galata in page code to be injected
     * - the splash screen to have disappeared
     * - the launcher to be visible
     *
     * `page.goto` will throw an error if:
     * - there's an SSL error (e.g. in case of self-signed certificates).
     * - target URL is invalid.
     * - the `timeout` is exceeded during navigation.
     * - the remote server does not respond or is unreachable.
     * - the main resource failed to load.
     *
     * `page.goto` will not throw an error when any valid HTTP status code is returned by the remote server, including 404 "Not
     * Found" and 500 "Internal Server Error".  The status code for such responses can be retrieved by calling
     * [response.status()](https://playwright.dev/docs/api/class-response#response-status).
     *
     * > NOTE: `page.goto` either throws an error or returns a main resource response. The only exceptions are navigation to
     * `about:blank` or navigation to the same URL with a different hash, which would succeed and return `null`.
     * > NOTE: Headless mode doesn't support navigation to a PDF document. See the
     * [upstream issue](https://bugs.chromium.org/p/chromium/issues/detail?id=761295).
     *
     * Shortcut for main frame's [frame.goto(url[, options])](https://playwright.dev/docs/api/class-frame#frame-goto)
     * @param url URL to navigate page to. The url should include scheme, e.g. `https://`. When a `baseURL` via the context options was provided and the passed URL is a path, it gets merged via the
     * [`new URL()`](https://developer.mozilla.org/en-US/docs/Web/API/URL/URL) constructor.
     * @param options
     */
    async goto(url, options) {
        var _a;
        const target = (url === null || url === void 0 ? void 0 : url.startsWith('http')) ? url
            : `${this.baseURL}${this.appPath}/${url !== null && url !== void 0 ? url : ''}`;
        const response = await this.page.goto(target, Object.assign(Object.assign({}, (options !== null && options !== void 0 ? options : {})), { waitUntil: (_a = options === null || options === void 0 ? void 0 : options.waitUntil) !== null && _a !== void 0 ? _a : 'domcontentloaded' }));
        await this.waitForAppStarted();
        await this.hookHelpersUp();
        await this.waitIsReady(this.page, this);
        return response;
    }
    /**
     * Returns the main resource response. In case of multiple redirects, the navigation will resolve with the response of the
     * last redirect.
     *
     * This overrides the standard Playwright `page.reload` method by waiting for:
     * - the application to be started (plugins are loaded)
     * - the galata in page code to be injected
     * - the splash screen to have disappeared
     * - the launcher to be visible
     *
     * @param options
     */
    async reload(options) {
        var _a;
        const response = await this.page.reload(Object.assign(Object.assign({}, (options !== null && options !== void 0 ? options : {})), { waitUntil: (_a = options === null || options === void 0 ? void 0 : options.waitUntil) !== null && _a !== void 0 ? _a : 'domcontentloaded' }));
        await this.waitForAppStarted();
        await this.hookHelpersUp();
        await this.waitIsReady(this.page, this);
        return response;
    }
    /**
     * Reset the User Interface
     */
    async resetUI() {
        // close menus
        await this.menu.closeAll();
        // close all panels
        await this.activity.closeAll();
        // shutdown kernels
        await this.kernel.shutdownAll();
        // show status bar
        await this.statusbar.show();
        // make sure all sidebar tabs are on left
        await this.sidebar.moveAllTabsToLeft();
        // show Files tab on sidebar
        await this.sidebar.openTab('filebrowser');
        // go to home folder
        await this.filebrowser.openHomeDirectory();
    }
    /**
     * Set JupyterLab simple mode
     *
     * @param simple Simple mode value
     * @returns Whether this operation succeeds or not
     */
    async setSimpleMode(simple) {
        const toggle = await this.page.$('#jp-single-document-mode button.jp-switch');
        if (toggle) {
            const checked = (await toggle.getAttribute('aria-checked')) === 'true';
            if ((checked && !simple) || (!checked && simple)) {
                await Promise.all([
                    Utils.waitForTransition(this.page, toggle),
                    toggle.click()
                ]);
            }
            await Utils.waitForCondition(async () => {
                return (await this.isInSimpleMode()) === simple;
            });
            return true;
        }
        return false;
    }
    /**
     * Wait for a  condition to be fulfilled
     *
     * @param condition Condition to fulfill
     * @param timeout Maximal time to wait for the condition to be true
     */
    async waitForCondition(condition, timeout) {
        return Utils.waitForCondition(condition, timeout);
    }
    /**
     * Wait for an element to emit 'transitionend' event.
     *
     * @param element Element or selector to watch
     */
    async waitForTransition(element) {
        return Utils.waitForTransition(this.page, element);
    }
    /**
     * Factory for active activity tab xpath
     */
    xpBuildActiveActivityTabSelector() {
        return Utils.xpBuildActiveActivityTabSelector();
    }
    /**
     * Factory for activity panel xpath by id
     * @param id Panel id
     */
    xpBuildActivityPanelSelector(id) {
        return Utils.xpBuildActivityPanelSelector(id);
    }
    /**
     * Factory for activity tab xpath by name
     * @param name Activity name
     */
    xpBuildActivityTabSelector(name) {
        return Utils.xpBuildActivityTabSelector(name);
    }
    /**
     * Factory for element containing a given class xpath
     * @param className Class name
     */
    xpContainsClass(className) {
        return Utils.xpContainsClass(className);
    }
    /**
     * Inject the galata in-page helpers
     */
    async hookHelpersUp() {
        // Insert Galata in page helpers
        await this.page.addScriptTag({
            path: path.resolve(__dirname, './lib-inpage/inpage.js')
        });
        const galataipDefined = await this.page.evaluate(() => {
            return Promise.resolve(typeof window.galataip === 'object');
        });
        if (!galataipDefined) {
            throw new Error('Failed to inject galataip object into browser context');
        }
        const jlabAccessible = await this.page.evaluate(() => {
            return Promise.resolve(typeof window.galataip.app === 'object');
        });
        if (!jlabAccessible) {
            throw new Error('Failed to access JupyterLab object in browser context');
        }
    }
}
exports.JupyterLabPage = JupyterLabPage;
//# sourceMappingURL=jupyterlabpage.js.map