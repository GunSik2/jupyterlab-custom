// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { VDomModel } from '@jupyterlab/apputils';
import { ServerConnection } from '@jupyterlab/services';
import { nullTranslator } from '@jupyterlab/translation';
import { Debouncer } from '@lumino/polling';
import * as semver from 'semver';
import { doBuild } from './build-helper';
import { presentCompanions } from './companions';
import { reportInstallError } from './dialog';
import { Lister } from './listings';
import { isJupyterOrg, Searcher } from './npm';
/**
 * The server API path for querying/modifying installed extensions.
 */
const EXTENSION_API_PATH = 'lab/api/extensions';
/**
 * Model for an extension list.
 */
export class ListModel extends VDomModel {
    constructor(app, serviceManager, settings, translator) {
        super();
        /**
         * Contains an error message if an error occurred when querying installed extensions.
         */
        this.installedError = null;
        /**
         * Contains an error message if an error occurred when searching for extensions.
         */
        this.searchError = null;
        /**
         * Contains an error message if an error occurred when searching for lists.
         */
        this.blockedExtensionsError = null;
        /**
         * Contains an error message if an error occurred when querying the server extension.
         */
        this.serverConnectionError = null;
        /**
         * Contains an error message if the server has unfulfilled requirements.
         */
        this.serverRequirementsError = null;
        /**
         * Whether the model has finished async initialization.
         */
        this.initialized = false;
        /**
         * Whether a fresh build should be considered due to actions taken.
         */
        this.promptBuild = false;
        this.lister = new Lister();
        this._query = ''; // TODO: we may not need the null case?
        this._page = 0;
        this._pagination = 250;
        this._totalEntries = 0;
        this._pendingActions = [];
        this._totalblockedExtensionsFound = 0;
        this._totalallowedExtensionsFound = 0;
        this.translator = translator || nullTranslator;
        this._app = app;
        this._installed = [];
        this._searchResult = [];
        this.serviceManager = serviceManager;
        this.serverConnectionSettings = ServerConnection.makeSettings();
        this._debouncedUpdate = new Debouncer(this.update.bind(this), 1000);
        this.lister.listingsLoaded.connect(this._listingIsLoaded, this);
        this.searcher = new Searcher(settings.composite['npmRegistry'], settings.composite['npmCdn'], settings.composite['enableCdn']);
        _isDisclaimed = settings.composite['disclaimed'] === true;
        settings.changed.connect(() => {
            _isDisclaimed = settings.composite['disclaimed'] === true;
            this.searcher = new Searcher(settings.composite['npmRegistry'], settings.composite['npmCdn'], settings.composite['enableCdn']);
            void this.update();
        });
    }
    _listingIsLoaded(_, listings) {
        this._listMode = listings.mode;
        this._blockedExtensionsArray = new Array();
        if (this._listMode === 'block') {
            listings.entries.map(e => {
                this._blockedExtensionsArray.push({
                    name: e.name,
                    regexp: new RegExp(e.name),
                    type: e.type,
                    reason: e.reason,
                    creation_date: e.creation_date,
                    last_update_date: e.last_update_date
                });
            });
        }
        this._allowedExtensionsArray = new Array();
        if (this._listMode === 'allow') {
            listings.entries.map(e => {
                this._allowedExtensionsArray.push({
                    name: e.name,
                    regexp: new RegExp(e.name),
                    type: e.type,
                    reason: e.reason,
                    creation_date: e.creation_date,
                    last_update_date: e.last_update_date
                });
            });
        }
        void this.initialize();
    }
    /**
     * A readonly array of the installed extensions.
     */
    get installed() {
        return this._installed;
    }
    /**
     * A readonly array containing the latest search result
     */
    get searchResult() {
        return this._searchResult;
    }
    /**
     * The current NPM repository search query.
     *
     * Setting its value triggers a new search.
     */
    get query() {
        return this._query;
    }
    set query(value) {
        this._query = value;
        void this._debouncedUpdate.invoke();
    }
    /**
     * The current NPM repository search page.
     *
     * The npm repository search is paginated by the `pagination` attribute.
     * The `page` value selects which page is used.
     *
     * Setting its value triggers a new search.
     */
    get page() {
        return this._page;
    }
    set page(value) {
        this._page = value;
        void this.update();
    }
    /**
     * The NPM repository search pagination.
     *
     * The npm repository search is paginated by the `pagination` attribute.
     * The `page` value selects which page is used.
     *
     * Setting its value triggers a new search.
     */
    get pagination() {
        return this._pagination;
    }
    set pagination(value) {
        this._pagination = value;
        void this.update();
    }
    /**
     * The total number of results in the current search.
     */
    get totalEntries() {
        return this._totalEntries;
    }
    /**
     * The list mode.
     */
    get listMode() {
        return this._listMode;
    }
    /**
     * The total number of blockedExtensions results in the current search.
     */
    get totalblockedExtensionsFound() {
        return this._totalblockedExtensionsFound;
    }
    /**
     * The total number of allowedExtensions results in the current search.
     */
    get totalallowedExtensionsFound() {
        return this._totalallowedExtensionsFound;
    }
    /**
     * Initialize the model.
     */
    initialize() {
        return this.update()
            .then(() => {
            this.initialized = true;
            this.stateChanged.emit(undefined);
        })
            .catch(() => {
            this.initialized = true;
            this.stateChanged.emit(undefined);
        });
    }
    /**
     * Whether there are currently any actions pending.
     */
    hasPendingActions() {
        return this._pendingActions.length > 0;
    }
    /**
     * Install an extension.
     *
     * @param entry An entry indicating which extension to install.
     */
    async install(entry) {
        if (entry.installed) {
            // Updating
            await this._performAction('install', entry).then(data => {
                if (data.status !== 'ok') {
                    reportInstallError(entry.name, data.message, this.translator);
                }
                return this.update();
            });
        }
        await this.checkCompanionPackages(entry).then(shouldInstall => {
            if (shouldInstall) {
                return this._performAction('install', entry).then(data => {
                    if (data.status !== 'ok') {
                        reportInstallError(entry.name, data.message, this.translator);
                    }
                    return this.update();
                });
            }
        });
    }
    /**
     * Uninstall an extension.
     *
     * @param entry An entry indicating which extension to uninstall.
     */
    async uninstall(entry) {
        if (!entry.installed) {
            throw new Error(`Not installed, cannot uninstall: ${entry.name}`);
        }
        await this._performAction('uninstall', entry);
        return this.update();
    }
    /**
     * Enable an extension.
     *
     * @param entry An entry indicating which extension to enable.
     */
    async enable(entry) {
        if (entry.enabled) {
            throw new Error(`Already enabled: ${entry.name}`);
        }
        await this._performAction('enable', entry);
        await this.update();
    }
    /**
     * Disable an extension.
     *
     * @param entry An entry indicating which extension to disable.
     */
    async disable(entry) {
        if (!entry.enabled) {
            throw new Error(`Already disabled: ${entry.name}`);
        }
        await this._performAction('disable', entry);
        await this.update();
    }
    /**
     * Check for companion packages in kernels or server.
     *
     * @param entry An entry indicating which extension to check.
     */
    checkCompanionPackages(entry) {
        return this.searcher
            .fetchPackageData(entry.name, entry.latest_version)
            .then(data => {
            if (!data || !data.jupyterlab || !data.jupyterlab.discovery) {
                return true;
            }
            const discovery = data.jupyterlab.discovery;
            const kernelCompanions = [];
            if (discovery.kernel) {
                // match specs
                for (const kernelInfo of discovery.kernel) {
                    const matches = Private.matchSpecs(kernelInfo, this.serviceManager.kernelspecs.specs);
                    kernelCompanions.push({ kernelInfo, kernels: matches });
                }
            }
            if (kernelCompanions.length < 1 && !discovery.server) {
                return true;
            }
            return presentCompanions(kernelCompanions, discovery.server, this.translator);
        });
    }
    /**
     * Trigger a build check to incorporate actions taken.
     */
    triggerBuildCheck() {
        const builder = this.serviceManager.builder;
        if (builder.isAvailable && !this.promptBuild) {
            const completed = builder.getStatus().then(response => {
                if (response.status === 'building') {
                    // Piggy-back onto existing build
                    // TODO: Can this cause dialog collision on build completion?
                    return doBuild(this._app, builder);
                }
                if (response.status !== 'needed') {
                    return;
                }
                if (!this.promptBuild) {
                    this.promptBuild = true;
                    this.stateChanged.emit(undefined);
                }
            });
            this._addPendingAction(completed);
        }
    }
    /**
     * Perform a build on the server
     */
    performBuild() {
        if (this.promptBuild) {
            this.promptBuild = false;
            this.stateChanged.emit(undefined);
        }
        const completed = doBuild(this._app, this.serviceManager.builder);
        this._addPendingAction(completed);
    }
    /**
     * Ignore a build recommendation
     */
    ignoreBuildRecommendation() {
        if (this.promptBuild) {
            this.promptBuild = false;
            this.stateChanged.emit(undefined);
        }
    }
    /**
     * Ignore a build recommendation
     */
    refreshInstalled() {
        const refresh = this.update(true);
        this._addPendingAction(refresh);
    }
    /**
     * Translate search results from an npm repository query into entries
     * and remove entries with 'deprecated' in the keyword list
     *
     * @param res Promise to an npm query result.
     */
    async translateSearchResult(res) {
        const entries = {};
        this._totalblockedExtensionsFound = 0;
        this._totalallowedExtensionsFound = 0;
        this._totalEntries = 0;
        for (const obj of (await res).objects) {
            const pkg = obj.package;
            if (pkg.keywords.indexOf('deprecated') >= 0) {
                continue;
            }
            this._totalEntries = this._totalEntries + 1;
            const isblockedExtensions = this.isListed(pkg.name, this._blockedExtensionsArray);
            if (isblockedExtensions) {
                this._totalblockedExtensionsFound =
                    this._totalblockedExtensionsFound + 1;
            }
            const isallowedExtensions = this.isListed(pkg.name, this._allowedExtensionsArray);
            if (isallowedExtensions) {
                this._totalallowedExtensionsFound =
                    this._totalallowedExtensionsFound + 1;
            }
            entries[pkg.name] = {
                name: pkg.name,
                description: pkg.description,
                url: 'homepage' in pkg.links
                    ? pkg.links.homepage
                    : 'repository' in pkg.links
                        ? pkg.links.repository
                        : pkg.links.npm,
                installed: false,
                enabled: false,
                status: null,
                latest_version: pkg.version,
                installed_version: '',
                blockedExtensionsEntry: isblockedExtensions,
                allowedExtensionsEntry: isallowedExtensions,
                pkg_type: 'source',
                install: undefined
            };
        }
        return entries;
    }
    /**
     * Translate installed extensions information from the server into entries.
     *
     * @param res Promise to the server reply data.
     */
    async translateInstalled(res) {
        const promises = [];
        const entries = {};
        for (const pkg of await res) {
            promises.push(res.then(info => {
                var _a, _b, _c;
                entries[pkg.name] = {
                    name: pkg.name,
                    description: pkg.description,
                    url: pkg.url,
                    installed: pkg.installed !== false,
                    enabled: pkg.enabled,
                    status: pkg.status,
                    latest_version: pkg.latest_version,
                    installed_version: pkg.installed_version,
                    blockedExtensionsEntry: this.isListed(pkg.name, this._blockedExtensionsArray),
                    allowedExtensionsEntry: this.isListed(pkg.name, this._allowedExtensionsArray),
                    pkg_type: pkg.pkg_type,
                    install: {
                        packageManager: (_a = pkg.install) === null || _a === void 0 ? void 0 : _a.packageManager,
                        packageName: (_b = pkg.install) === null || _b === void 0 ? void 0 : _b.packageName,
                        uninstallInstructions: (_c = pkg.install) === null || _c === void 0 ? void 0 : _c.uninstallInstructions
                    }
                };
            }));
        }
        return Promise.all(promises).then(() => {
            return entries;
        });
    }
    isListed(name, listArray) {
        let entry = undefined;
        listArray.forEach((listEntry) => {
            var _a;
            if (listEntry.regexp && ((_a = listEntry.regexp) === null || _a === void 0 ? void 0 : _a.test(name))) {
                entry = listEntry;
            }
        });
        return entry;
    }
    /**
     * Make a request to the server for info about its installed extensions.
     */
    fetchInstalled(refreshInstalled = false) {
        const url = new URL(EXTENSION_API_PATH, this.serverConnectionSettings.baseUrl);
        if (refreshInstalled) {
            url.searchParams.append('refresh', '1');
        }
        const request = ServerConnection.makeRequest(url.toString(), {}, this.serverConnectionSettings).then(response => {
            Private.handleError(response);
            return response.json();
        });
        request.then(() => {
            this.serverConnectionError = null;
        }, reason => {
            this.serverConnectionError = reason.toString();
        });
        return request;
    }
    /**
     * Search with current query.
     *
     * Sets searchError and totalEntries as appropriate.
     *
     * @returns {Promise<{ [key: string]: IEntry; }>} The search result as a map of entries.
     */
    async performSearch() {
        if (this.query === null) {
            this.query = '';
        }
        // Start the search without waiting for it:
        const search = this.searcher.searchExtensions(this.query, this.page, this.pagination);
        const searchMapPromise = this.translateSearchResult(search);
        let searchMap;
        try {
            searchMap = await searchMapPromise;
            this.searchError = null;
        }
        catch (reason) {
            searchMap = {};
            this.searchError = reason.toString();
        }
        return searchMap;
    }
    /**
     * Query the installed extensions.
     *
     * Sets installedError as appropriate.
     *
     * @returns {Promise<{ [key: string]: IEntry; }>} A map of installed extensions.
     */
    async queryInstalled(refreshInstalled) {
        let installedMap;
        try {
            installedMap = await this.translateInstalled(this.fetchInstalled(refreshInstalled));
            this.installedError = null;
        }
        catch (reason) {
            installedMap = {};
            this.installedError = reason.toString();
        }
        return installedMap;
    }
    /**
     * Update the current model.
     *
     * This will query the NPM repository, and the notebook server.
     *
     * Emits the `stateChanged` signal on successful completion.
     */
    async update(refreshInstalled = false) {
        if (ListModel.isDisclaimed()) {
            const [searchMap, installedMap] = await Promise.all([
                this.performSearch(),
                this.queryInstalled(refreshInstalled)
            ]);
            // Map results to attributes:
            const installed = [];
            for (const key of Object.keys(installedMap)) {
                installed.push(installedMap[key]);
            }
            this._installed = installed.sort(Private.comparator);
            const searchResult = [];
            for (const key of Object.keys(searchMap)) {
                // Filter out installed entries from search results:
                if (installedMap[key] === undefined) {
                    searchResult.push(searchMap[key]);
                }
                else {
                    searchResult.push(installedMap[key]);
                }
            }
            this._searchResult = searchResult.sort(Private.comparator);
        }
        // Signal updated state
        this.stateChanged.emit(undefined);
    }
    /**
     * Send a request to the server to perform an action on an extension.
     *
     * @param action A valid action to perform.
     * @param entry The extension to perform the action on.
     */
    _performAction(action, entry) {
        const url = new URL(EXTENSION_API_PATH, this.serverConnectionSettings.baseUrl);
        const request = {
            method: 'POST',
            body: JSON.stringify({
                cmd: action,
                extension_name: entry.name
            })
        };
        const completed = ServerConnection.makeRequest(url.toString(), request, this.serverConnectionSettings).then(response => {
            Private.handleError(response);
            this.triggerBuildCheck();
            return response.json();
        });
        completed.then(() => {
            this.serverConnectionError = null;
        }, reason => {
            this.serverConnectionError = reason.toString();
        });
        this._addPendingAction(completed);
        return completed;
    }
    /**
     * Add a pending action.
     *
     * @param pending A promise that resolves when the action is completed.
     */
    _addPendingAction(pending) {
        // Add to pending actions collection
        this._pendingActions.push(pending);
        // Ensure action is removed when resolved
        const remove = () => {
            const i = this._pendingActions.indexOf(pending);
            this._pendingActions.splice(i, 1);
            this.stateChanged.emit(undefined);
        };
        pending.then(remove, remove);
        // Signal changed state
        this.stateChanged.emit(undefined);
    }
}
let _isDisclaimed = false;
/**
 * ListModel statics.
 */
(function (ListModel) {
    /**
     * Utility function to check whether an entry can be updated.
     *
     * @param entry The entry to check.
     */
    function entryHasUpdate(entry) {
        if (!entry.installed || !entry.latest_version) {
            return false;
        }
        return semver.lt(entry.installed_version, entry.latest_version);
    }
    ListModel.entryHasUpdate = entryHasUpdate;
    function isDisclaimed() {
        return _isDisclaimed;
    }
    ListModel.isDisclaimed = isDisclaimed;
    function toogleDisclaimed() {
        _isDisclaimed = !_isDisclaimed;
    }
    ListModel.toogleDisclaimed = toogleDisclaimed;
})(ListModel || (ListModel = {}));
/**
 * A namespace for private functionality.
 */
var Private;
(function (Private) {
    /**
     * A comparator function that sorts allowedExtensions orgs to the top.
     */
    function comparator(a, b) {
        if (a.name === b.name) {
            return 0;
        }
        const testA = isJupyterOrg(a.name);
        const testB = isJupyterOrg(b.name);
        if (testA === testB) {
            // Retain sort-order from API
            return 0;
        }
        else if (testA && !testB) {
            return -1;
        }
        else {
            return 1;
        }
    }
    Private.comparator = comparator;
    /**
     * Match kernel specs against kernel spec regexps
     *
     * @param kernelInfo The info containing the regexp patterns
     * @param specs The available kernel specs.
     */
    function matchSpecs(kernelInfo, specs) {
        if (!specs) {
            return [];
        }
        const matches = [];
        let reLang = null;
        let reName = null;
        if (kernelInfo.kernel_spec.language) {
            reLang = new RegExp(kernelInfo.kernel_spec.language);
        }
        if (kernelInfo.kernel_spec.display_name) {
            reName = new RegExp(kernelInfo.kernel_spec.display_name);
        }
        for (const key of Object.keys(specs.kernelspecs)) {
            const spec = specs.kernelspecs[key];
            let match = false;
            if (reLang) {
                match = reLang.test(spec.language);
            }
            if (!match && reName) {
                match = reName.test(spec.display_name);
            }
            if (match) {
                matches.push(spec);
                continue;
            }
        }
        return matches;
    }
    Private.matchSpecs = matchSpecs;
    /**
     * Convert a response to an exception on error.
     *
     * @param response The response to inspect.
     */
    function handleError(response) {
        if (!response.ok) {
            throw new Error(`${response.status} (${response.statusText})`);
        }
        return response;
    }
    Private.handleError = handleError;
})(Private || (Private = {}));
//# sourceMappingURL=model.js.map