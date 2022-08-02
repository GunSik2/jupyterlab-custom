"use strict";
/* eslint-disable camelcase */
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.galata = void 0;
const json5 = __importStar(require("json5"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const contents_1 = require("./contents");
const helpers_1 = require("./helpers");
const jupyterlabpage_1 = require("./jupyterlabpage");
/**
 * Galata namespace
 */
var galata;
(function (galata) {
    /**
     * Default user settings:
     * - Deactivate codemirror cursor blinking to avoid noise in screenshots
     */
    galata.DEFAULT_SETTINGS = {
        '@jupyterlab/fileeditor-extension:plugin': {
            editorConfig: { cursorBlinkRate: 0 }
        },
        '@jupyterlab/notebook-extension:tracker': {
            codeCellConfig: { cursorBlinkRate: 0 },
            markdownCellConfig: { cursorBlinkRate: 0 },
            rawCellConfig: { cursorBlinkRate: 0 }
        }
    };
    /**
     * Add the Galata helpers to the page model
     *
     * @param page Playwright page model
     * @param baseURL Application base URL
     * @param waitForApplication Callback that resolved when the application page is ready
     * @param appPath Application URL path fragment
     * @returns Playwright page model with Galata helpers
     */
    function addHelpersToPage(page, baseURL, waitForApplication, appPath) {
        const jlabPage = new jupyterlabpage_1.JupyterLabPage(page, baseURL, waitForApplication, appPath);
        const handler = {
            get: function (obj, prop) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                return prop in obj ? obj[prop] : page[prop];
            }
        };
        // Proxy playwright page object
        return new Proxy(jlabPage, handler);
    }
    galata.addHelpersToPage = addHelpersToPage;
    async function initTestPage(appPath, autoGoto, baseURL, mockSettings, mockState, page, sessions, terminals, tmpPath, waitForApplication) {
        // Hook the helpers
        const jlabWithPage = addHelpersToPage(page, baseURL, waitForApplication, appPath);
        // Add server mocks
        const settings = [];
        if (mockSettings) {
            // Settings will be stored in-memory (after loading the initial version from disk)
            await Mock.mockSettings(page, settings, typeof mockSettings === 'boolean' ? {} : Object.assign({}, mockSettings));
        }
        const workspace = {
            data: {},
            metadata: { id: 'default' }
        };
        if (mockState) {
            if (typeof mockState !== 'boolean') {
                workspace.data = Object.assign({}, mockState);
            }
            // State will be stored in-memory (after loading the initial version from disk)
            await Mock.mockState(page, workspace);
        }
        // Add sessions and terminals trackers
        if (sessions) {
            await Mock.mockRunners(page, sessions, 'sessions');
        }
        if (terminals) {
            await Mock.mockRunners(page, terminals, 'terminals');
        }
        if (autoGoto) {
            // Load and initialize JupyterLab and goto test folder
            await jlabWithPage.goto(`tree/${tmpPath}`);
        }
        return jlabWithPage;
    }
    galata.initTestPage = initTestPage;
    /**
     * Create a contents REST API helpers object
     *
     * @param baseURL Application base URL
     * @param page Playwright page model
     * @returns Contents REST API helpers
     */
    function newContentsHelper(baseURL, page) {
        return new contents_1.ContentsHelper(baseURL, page);
    }
    galata.newContentsHelper = newContentsHelper;
    /**
     * Create a page with Galata helpers for the given browser
     *
     * @param browser Playwright browser model
     * @param baseURL Application base URL
     * @param waitForApplication Callback that resolved when the application page is ready
     * @param appPath Application URL path fragment
     * @returns Playwright page model with Galata helpers
     */
    async function newPage(appPath, autoGoto, baseURL, browser, mockSettings, mockState, sessions, terminals, tmpPath, waitForApplication) {
        const context = await browser.newContext();
        const page = await context.newPage();
        return initTestPage(appPath, autoGoto, baseURL, mockSettings, mockState, page, sessions, terminals, tmpPath, waitForApplication);
    }
    galata.newPage = newPage;
    /**
     * Create a new performance helper
     *
     * @param page Playwright page model
     * @returns Performance helper
     */
    function newPerformanceHelper(page) {
        return new helpers_1.PerformanceHelper(page);
    }
    galata.newPerformanceHelper = newPerformanceHelper;
    /**
     * Regex to capture JupyterLab API call
     */
    let Routes;
    (function (Routes) {
        /**
         * Sessions API
         *
         * The session id can be found in the named group `id`.
         *
         * The id will be suffixed by '/'.
         */
        Routes.sessions = /.*\/api\/sessions(?<id>\/[@:-\w]+)?/;
        /**
         * Settings API
         *
         * The schema name can be found in the named group `id`.
         *
         * The id will be suffixed by '/'.
         */
        Routes.settings = /.*\/api\/settings(?<id>(\/[@:-\w]+)*)/;
        /**
         * Terminals API
         *
         * The terminal id can be found in the named group `id`.
         *
         * The id will be suffixed by '/'.
         */
        Routes.terminals = /.*\/api\/terminals(?<id>\/[@:-\w]+)?/;
        /**
         * Translations API
         *
         * The locale can be found in the named group `id`.
         *
         * The id will be suffixed by '/'.
         */
        Routes.translations = /.*\/api\/translations(?<id>\/[@:-\w]+)?/;
        /**
         * Workspaces API
         *
         * The space name can be found in the named group `id`.
         *
         * The id will be suffixed by '/'.
         */
        Routes.workspaces = /.*\/api\/workspaces(?<id>(\/[-\w]+)+)/;
    })(Routes = galata.Routes || (galata.Routes = {}));
    /**
     * Notebook generation helpers
     */
    let Notebook;
    (function (Notebook) {
        /**
         * Generate a notebook with identical cells
         *
         * @param nCells Number of cells
         * @param cellType Type of cells
         * @param defaultInput Default input source
         * @param defaultOutput Default outputs
         * @returns The notebook
         */
        function generateNotebook(nCells = 0, cellType = 'code', defaultInput = [], defaultOutput = []) {
            const cells = new Array();
            for (let i = 0; i < nCells; i++) {
                const execution_count = cellType === 'code'
                    ? defaultOutput.length > 0
                        ? i + 1
                        : null
                    : undefined;
                const cell = makeCell({
                    cell_type: cellType,
                    source: [...defaultInput],
                    outputs: cellType === 'code' ? [...defaultOutput] : undefined,
                    execution_count
                });
                cells.push(cell);
            }
            return makeNotebook(cells);
        }
        Notebook.generateNotebook = generateNotebook;
        /**
         * Generate a cell object
         *
         * @param skeleton Cell description template
         * @returns A cell
         */
        function makeCell(skeleton) {
            var _a;
            switch ((_a = skeleton.cell_type) !== null && _a !== void 0 ? _a : 'code') {
                case 'code':
                    return Object.assign({ cell_type: 'code', execution_count: null, metadata: {}, outputs: [], source: [] }, skeleton);
                default: {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { execution_count, outputs } = skeleton, others = __rest(skeleton, ["execution_count", "outputs"]);
                    return Object.assign({ cell_type: 'markdown', metadata: {}, source: [] }, others);
                }
            }
        }
        Notebook.makeCell = makeCell;
        /**
         * Generate a notebook object from a cell list
         *
         * @param cells Notebook cells
         * @returns Notebook
         */
        function makeNotebook(cells) {
            return {
                cells,
                metadata: {
                    kernelspec: {
                        display_name: 'Python 3',
                        language: 'python',
                        name: 'python3'
                    },
                    language_info: {
                        codemirror_mode: {
                            name: 'ipython',
                            version: 3
                        },
                        file_extension: '.py',
                        mimetype: 'text/x-python',
                        name: 'python',
                        nbconvert_exporter: 'python',
                        pygments_lexer: 'ipython3',
                        version: '3.8.0'
                    }
                },
                nbformat: 4,
                nbformat_minor: 4
            };
        }
        Notebook.makeNotebook = makeNotebook;
    })(Notebook = galata.Notebook || (galata.Notebook = {}));
    /**
     * Mock methods
     */
    let Mock;
    (function (Mock) {
        /**
         * Clear all wanted sessions or terminals.
         *
         * @param baseURL Application base URL
         * @param runners Session or terminal ids to stop
         * @param type Type of runner; session or terminal
         * @returns Whether the runners were closed or not
         */
        async function clearRunners(baseURL, runners, type) {
            const responses = await Promise.all([...new Set(runners)].map(id => node_fetch_1.default(`${baseURL}/api/${type}/${id}`, { method: 'DELETE' })));
            return responses.every(response => response.ok);
        }
        Mock.clearRunners = clearRunners;
        /**
         * Mock the runners API to display only those created during a test
         *
         * @param page Page model object
         * @param runners Mapping of current test runners
         * @param type Type of runner; session or terminal
         */
        function mockRunners(page, runners, type) {
            var _a;
            const routeRegex = type === 'sessions' ? Routes.sessions : Routes.terminals;
            // Listen for closing connection (may happen when request are still being processed)
            let isClosed = false;
            const ctxt = page.context();
            ctxt.on('close', () => {
                isClosed = true;
            });
            (_a = ctxt.browser()) === null || _a === void 0 ? void 0 : _a.on('disconnected', () => {
                isClosed = true;
            });
            return page.route(routeRegex, async (route, request) => {
                var _a, _b, _c, _d, _e, _f;
                switch (request.method()) {
                    case 'DELETE': {
                        // slice is used to remove the '/' prefix
                        const id = (_c = (_b = (_a = routeRegex.exec(request.url())) === null || _a === void 0 ? void 0 : _a.groups) === null || _b === void 0 ? void 0 : _b.id) === null || _c === void 0 ? void 0 : _c.slice(1);
                        await route.continue();
                        if (id && runners.has(id)) {
                            runners.delete(id);
                        }
                        break;
                    }
                    case 'GET': {
                        // slice is used to remove the '/' prefix
                        const id = (_f = (_e = (_d = routeRegex.exec(request.url())) === null || _d === void 0 ? void 0 : _d.groups) === null || _e === void 0 ? void 0 : _e.id) === null || _f === void 0 ? void 0 : _f.slice(1);
                        if (id) {
                            if (runners.has(id)) {
                                // Proxy the GET request
                                const response = await node_fetch_1.default(request.url(), {
                                    headers: await request.allHeaders(),
                                    method: request.method()
                                });
                                if (!response.ok) {
                                    if (!page.isClosed() && !isClosed) {
                                        return route.fulfill({
                                            status: response.status,
                                            body: await response.text()
                                        });
                                    }
                                    break;
                                }
                                const data = await response.json();
                                // Update stored runners
                                runners.set(type === 'sessions' ? data.id : data.name, data);
                                if (!page.isClosed() && !isClosed) {
                                    return route.fulfill({
                                        status: 200,
                                        body: JSON.stringify(data),
                                        contentType: 'application/json'
                                    });
                                }
                                break;
                            }
                            else {
                                if (!page.isClosed() && !isClosed) {
                                    return route.fulfill({
                                        status: 404
                                    });
                                }
                                break;
                            }
                        }
                        else {
                            // Proxy the GET request
                            const response = await node_fetch_1.default(request.url(), {
                                headers: await request.allHeaders(),
                                method: request.method()
                            });
                            if (!response.ok) {
                                if (!page.isClosed() && !isClosed) {
                                    return route.fulfill({
                                        status: response.status,
                                        body: await response.text()
                                    });
                                }
                                break;
                            }
                            const data = (await response.json());
                            const updated = new Set();
                            data.forEach(item => {
                                const itemID = type === 'sessions' ? item.id : item.name;
                                if (runners.has(itemID)) {
                                    updated.add(itemID);
                                    runners.set(itemID, item);
                                }
                            });
                            if (updated.size !== runners.size) {
                                for (const [runnerID] of runners) {
                                    if (!updated.has(runnerID)) {
                                        runners.delete(runnerID);
                                    }
                                }
                            }
                            if (!page.isClosed() && !isClosed) {
                                return route.fulfill({
                                    status: 200,
                                    body: JSON.stringify([...runners.values()]),
                                    contentType: 'application/json'
                                });
                            }
                            break;
                        }
                    }
                    case 'PATCH': {
                        // Proxy the PATCH request
                        const response = await node_fetch_1.default(request.url(), {
                            body: request.postDataBuffer(),
                            headers: await request.allHeaders(),
                            method: request.method()
                        });
                        if (!response.ok) {
                            if (!page.isClosed() && !isClosed) {
                                return route.fulfill({
                                    status: response.status,
                                    body: await response.text()
                                });
                            }
                            break;
                        }
                        const data = await response.json();
                        // Update stored runners
                        runners.set(type === 'sessions' ? data.id : data.name, data);
                        if (!page.isClosed() && !isClosed) {
                            return route.fulfill({
                                status: 200,
                                body: JSON.stringify(data),
                                contentType: 'application/json'
                            });
                        }
                        break;
                    }
                    case 'POST': {
                        // Proxy the POST request
                        const response = await node_fetch_1.default(request.url(), {
                            body: request.postDataBuffer(),
                            headers: await request.allHeaders(),
                            method: request.method()
                        });
                        if (!response.ok) {
                            if (!page.isClosed() && !isClosed) {
                                return route.fulfill({
                                    status: response.status,
                                    body: await response.text()
                                });
                            }
                            break;
                        }
                        const data = await response.json();
                        const id = type === 'sessions' ? data.id : data.name;
                        runners.set(id, data);
                        if (!page.isClosed() && !isClosed) {
                            return route.fulfill({
                                status: type === 'sessions' ? 201 : 200,
                                body: JSON.stringify(data),
                                contentType: 'application/json',
                                headers: response.headers
                            });
                        }
                        break;
                    }
                    default:
                        return route.continue();
                }
            });
        }
        Mock.mockRunners = mockRunners;
        /**
         * Mock workspace route.
         *
         * @param page Page model object
         * @param workspace In-memory workspace
         */
        function mockState(page, workspace) {
            return page.route(Routes.workspaces, (route, request) => {
                switch (request.method()) {
                    case 'GET':
                        return route.fulfill({
                            status: 200,
                            body: JSON.stringify(workspace)
                        });
                    case 'PUT': {
                        const data = request.postDataJSON();
                        workspace.data = Object.assign(Object.assign({}, workspace.data), data.data);
                        workspace.metadata = Object.assign(Object.assign({}, workspace.metadata), data.metadata);
                        return route.fulfill({ status: 204 });
                    }
                    default:
                        return route.continue();
                }
            });
        }
        Mock.mockState = mockState;
        /**
         * Settings REST API endpoint
         */
        const settingsRegex = Routes.settings;
        /**
         * Mock settings route.
         *
         * @param page Page model object
         * @param settings In-memory settings
         * @param mockedSettings Test mocked settings
         */
        function mockSettings(page, settings, mockedSettings) {
            var _a;
            // Listen for closing connection (may happen when request are still being processed)
            let isClosed = false;
            const ctxt = page.context();
            ctxt.on('close', () => {
                isClosed = true;
            });
            (_a = ctxt.browser()) === null || _a === void 0 ? void 0 : _a.on('disconnected', () => {
                isClosed = true;
            });
            return page.route(settingsRegex, async (route, request) => {
                var _a, _b, _c, _d, _e, _f;
                switch (request.method()) {
                    case 'GET': {
                        // slice is used to remove the '/' prefix
                        const id = (_b = (_a = settingsRegex.exec(request.url())) === null || _a === void 0 ? void 0 : _a.groups) === null || _b === void 0 ? void 0 : _b.id.slice(1);
                        if (!id) {
                            // Get all settings
                            if (settings.length === 0) {
                                const response = await node_fetch_1.default(request.url(), {
                                    headers: await request.allHeaders()
                                });
                                const loadedSettings = (await response.json())
                                    .settings;
                                settings.push(...loadedSettings.map(plugin => {
                                    var _a;
                                    const mocked = (_a = mockedSettings[plugin.id]) !== null && _a !== void 0 ? _a : {};
                                    return Object.assign(Object.assign({}, plugin), { raw: JSON.stringify(mocked), settings: mocked });
                                }));
                            }
                            if (!page.isClosed() && !isClosed) {
                                return route.fulfill({
                                    status: 200,
                                    body: JSON.stringify({ settings })
                                });
                            }
                            break;
                        }
                        else {
                            // Get specific settings
                            let pluginSettings = settings.find(setting => setting.id === id);
                            if (!pluginSettings) {
                                const response = await node_fetch_1.default(request.url(), {
                                    headers: await request.allHeaders()
                                });
                                pluginSettings = await response.json();
                                if (pluginSettings) {
                                    const mocked = (_c = mockedSettings[id]) !== null && _c !== void 0 ? _c : {};
                                    pluginSettings = Object.assign(Object.assign({}, pluginSettings), { raw: JSON.stringify(mocked), settings: mocked });
                                    settings.push(pluginSettings);
                                }
                            }
                            if (!page.isClosed() && !isClosed) {
                                return route.fulfill({
                                    status: 200,
                                    body: JSON.stringify(pluginSettings)
                                });
                            }
                            break;
                        }
                    }
                    case 'PUT': {
                        // slice is used to remove the '/' prefix
                        const id = (_f = (_e = (_d = settingsRegex.exec(request.url())) === null || _d === void 0 ? void 0 : _d.groups) === null || _e === void 0 ? void 0 : _e.id) === null || _f === void 0 ? void 0 : _f.slice(1);
                        if (!id) {
                            return route.abort('addressunreachable');
                        }
                        const pluginSettings = settings.find(setting => setting.id === id);
                        const data = request.postDataJSON();
                        if (pluginSettings) {
                            pluginSettings.raw = data.raw;
                            try {
                                pluginSettings.settings = json5.parse(pluginSettings.raw);
                            }
                            catch (e) {
                                console.warn(`Failed to read raw settings ${pluginSettings.raw}`);
                                pluginSettings.settings = {};
                            }
                        }
                        else {
                            settings.push(Object.assign({ id }, data));
                        }
                        // Stop mocking if a new version is pushed
                        delete mockedSettings[id];
                        return route.fulfill({
                            status: 204
                        });
                    }
                    default:
                        return route.continue();
                }
            });
        }
        Mock.mockSettings = mockSettings;
    })(Mock = galata.Mock || (galata.Mock = {}));
})(galata = exports.galata || (exports.galata = {}));
//# sourceMappingURL=galata.js.map