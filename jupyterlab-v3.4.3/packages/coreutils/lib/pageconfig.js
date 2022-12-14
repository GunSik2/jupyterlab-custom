"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageConfig = void 0;
const coreutils_1 = require("@lumino/coreutils");
const minimist_1 = __importDefault(require("minimist"));
const url_1 = require("./url");
/**
 * The namespace for `PageConfig` functions.
 */
var PageConfig;
(function (PageConfig) {
    /**
     * Get global configuration data for the Jupyter application.
     *
     * @param name - The name of the configuration option.
     *
     * @returns The config value or an empty string if not found.
     *
     * #### Notes
     * All values are treated as strings.
     * For browser based applications, it is assumed that the page HTML
     * includes a script tag with the id `jupyter-config-data` containing the
     * configuration as valid JSON.  In order to support the classic Notebook,
     * we fall back on checking for `body` data of the given `name`.
     *
     * For node applications, it is assumed that the process was launched
     * with a `--jupyter-config-data` option pointing to a JSON settings
     * file.
     */
    function getOption(name) {
        if (configData) {
            return configData[name] || getBodyData(name);
        }
        configData = Object.create(null);
        let found = false;
        // Use script tag if available.
        if (typeof document !== 'undefined' && document) {
            const el = document.getElementById('jupyter-config-data');
            if (el) {
                configData = JSON.parse(el.textContent || '');
                found = true;
            }
        }
        // Otherwise use CLI if given.
        if (!found && typeof process !== 'undefined' && process.argv) {
            try {
                const cli = minimist_1.default(process.argv.slice(2));
                const path = require('path');
                let fullPath = '';
                if ('jupyter-config-data' in cli) {
                    fullPath = path.resolve(cli['jupyter-config-data']);
                }
                else if ('JUPYTER_CONFIG_DATA' in process.env) {
                    fullPath = path.resolve(process.env['JUPYTER_CONFIG_DATA']);
                }
                if (fullPath) {
                    // Force Webpack to ignore this require.
                    // eslint-disable-next-line
                    configData = eval('require')(fullPath);
                }
            }
            catch (e) {
                console.error(e);
            }
        }
        if (!coreutils_1.JSONExt.isObject(configData)) {
            configData = Object.create(null);
        }
        else {
            for (const key in configData) {
                // PageConfig expects strings
                if (typeof configData[key] !== 'string') {
                    configData[key] = JSON.stringify(configData[key]);
                }
            }
        }
        return configData[name] || getBodyData(name);
    }
    PageConfig.getOption = getOption;
    /**
     * Set global configuration data for the Jupyter application.
     *
     * @param name - The name of the configuration option.
     * @param value - The value to set the option to.
     *
     * @returns The last config value or an empty string if it doesn't exist.
     */
    function setOption(name, value) {
        const last = getOption(name);
        configData[name] = value;
        return last;
    }
    PageConfig.setOption = setOption;
    /**
     * Get the base url for a Jupyter application, or the base url of the page.
     */
    function getBaseUrl() {
        return url_1.URLExt.normalize(getOption('baseUrl') || '/');
    }
    PageConfig.getBaseUrl = getBaseUrl;
    /**
     * Get the tree url for a JupyterLab application.
     */
    function getTreeUrl() {
        return url_1.URLExt.join(getBaseUrl(), getOption('treeUrl'));
    }
    PageConfig.getTreeUrl = getTreeUrl;
    /**
     * Get the base url for sharing links (usually baseUrl)
     */
    function getShareUrl() {
        return url_1.URLExt.normalize(getOption('shareUrl') || getBaseUrl());
    }
    PageConfig.getShareUrl = getShareUrl;
    /**
     * Get the tree url for shareable links.
     * Usually the same as treeUrl,
     * but overrideable e.g. when sharing with JupyterHub.
     */
    function getTreeShareUrl() {
        return url_1.URLExt.normalize(url_1.URLExt.join(getShareUrl(), getOption('treeUrl')));
    }
    PageConfig.getTreeShareUrl = getTreeShareUrl;
    /**
     * Create a new URL given an optional mode and tree path.
     *
     * This is used to create URLS when the mode or tree path change as the user
     * changes mode or the current document in the main area. If fields in
     * options are omitted, the value in PageConfig will be used.
     *
     * @param options - IGetUrlOptions for the new path.
     */
    function getUrl(options) {
        var _a, _b, _c, _d;
        let path = options.toShare ? getShareUrl() : getBaseUrl();
        const mode = (_a = options.mode) !== null && _a !== void 0 ? _a : getOption('mode');
        const workspace = (_b = options.workspace) !== null && _b !== void 0 ? _b : getOption('workspace');
        const labOrDoc = mode === 'single-document' ? 'doc' : 'lab';
        path = url_1.URLExt.join(path, labOrDoc);
        if (workspace !== PageConfig.defaultWorkspace) {
            path = url_1.URLExt.join(path, 'workspaces', encodeURIComponent((_c = getOption('workspace')) !== null && _c !== void 0 ? _c : PageConfig.defaultWorkspace));
        }
        const treePath = (_d = options.treePath) !== null && _d !== void 0 ? _d : getOption('treePath');
        if (treePath) {
            path = url_1.URLExt.join(path, 'tree', url_1.URLExt.encodeParts(treePath));
        }
        return path;
    }
    PageConfig.getUrl = getUrl;
    PageConfig.defaultWorkspace = 'default';
    /**
     * Get the base websocket url for a Jupyter application, or an empty string.
     */
    function getWsUrl(baseUrl) {
        let wsUrl = getOption('wsUrl');
        if (!wsUrl) {
            baseUrl = baseUrl ? url_1.URLExt.normalize(baseUrl) : getBaseUrl();
            if (baseUrl.indexOf('http') !== 0) {
                return '';
            }
            wsUrl = 'ws' + baseUrl.slice(4);
        }
        return url_1.URLExt.normalize(wsUrl);
    }
    PageConfig.getWsUrl = getWsUrl;
    /**
     * Returns the URL converting this notebook to a certain
     * format with nbconvert.
     */
    function getNBConvertURL({ path, format, download }) {
        const notebookPath = url_1.URLExt.encodeParts(path);
        const url = url_1.URLExt.join(getBaseUrl(), 'nbconvert', format, notebookPath);
        if (download) {
            return url + '?download=true';
        }
        return url;
    }
    PageConfig.getNBConvertURL = getNBConvertURL;
    /**
     * Get the authorization token for a Jupyter application.
     */
    function getToken() {
        return getOption('token') || getBodyData('jupyterApiToken');
    }
    PageConfig.getToken = getToken;
    /**
     * Get the Notebook version info [major, minor, patch].
     */
    function getNotebookVersion() {
        const notebookVersion = getOption('notebookVersion');
        if (notebookVersion === '') {
            return [0, 0, 0];
        }
        return JSON.parse(notebookVersion);
    }
    PageConfig.getNotebookVersion = getNotebookVersion;
    /**
     * Private page config data for the Jupyter application.
     */
    let configData = null;
    /**
     * Get a url-encoded item from `body.data` and decode it
     * We should never have any encoded URLs anywhere else in code
     * until we are building an actual request.
     */
    function getBodyData(key) {
        if (typeof document === 'undefined' || !document.body) {
            return '';
        }
        const val = document.body.dataset[key];
        if (typeof val === 'undefined') {
            return '';
        }
        return decodeURIComponent(val);
    }
    /**
     * The namespace for page config `Extension` functions.
     */
    let Extension;
    (function (Extension) {
        /**
         * Populate an array from page config.
         *
         * @param key - The page config key (e.g., `deferredExtensions`).
         *
         * #### Notes
         * This is intended for `deferredExtensions` and `disabledExtensions`.
         */
        function populate(key) {
            try {
                const raw = getOption(key);
                if (raw) {
                    return JSON.parse(raw);
                }
            }
            catch (error) {
                console.warn(`Unable to parse ${key}.`, error);
            }
            return [];
        }
        /**
         * The collection of deferred extensions in page config.
         */
        Extension.deferred = populate('deferredExtensions');
        /**
         * The collection of disabled extensions in page config.
         */
        Extension.disabled = populate('disabledExtensions');
        /**
         * Returns whether a plugin is deferred.
         *
         * @param id - The plugin ID.
         */
        function isDeferred(id) {
            // Check for either a full plugin id match or an extension
            // name match.
            const separatorIndex = id.indexOf(':');
            let extName = '';
            if (separatorIndex !== -1) {
                extName = id.slice(0, separatorIndex);
            }
            return Extension.deferred.some(val => val === id || (extName && val === extName));
        }
        Extension.isDeferred = isDeferred;
        /**
         * Returns whether a plugin is disabled.
         *
         * @param id - The plugin ID.
         */
        function isDisabled(id) {
            // Check for either a full plugin id match or an extension
            // name match.
            const separatorIndex = id.indexOf(':');
            let extName = '';
            if (separatorIndex !== -1) {
                extName = id.slice(0, separatorIndex);
            }
            return Extension.disabled.some(val => val === id || (extName && val === extName));
        }
        Extension.isDisabled = isDisabled;
    })(Extension = PageConfig.Extension || (PageConfig.Extension = {}));
})(PageConfig = exports.PageConfig || (exports.PageConfig = {}));
//# sourceMappingURL=pageconfig.js.map