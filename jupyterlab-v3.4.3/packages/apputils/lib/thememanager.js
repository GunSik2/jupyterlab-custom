// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { URLExt } from '@jupyterlab/coreutils';
import { nullTranslator } from '@jupyterlab/translation';
import { each } from '@lumino/algorithm';
import { DisposableDelegate } from '@lumino/disposable';
import { Signal } from '@lumino/signaling';
import { Dialog, showDialog } from './dialog';
/**
 * The number of milliseconds between theme loading attempts.
 */
const REQUEST_INTERVAL = 75;
/**
 * The number of times to attempt to load a theme before giving up.
 */
const REQUEST_THRESHOLD = 20;
/**
 * A class that provides theme management.
 */
export class ThemeManager {
    /**
     * Construct a new theme manager.
     */
    constructor(options) {
        this._current = null;
        this._links = [];
        this._overrides = {};
        this._overrideProps = {};
        this._outstanding = null;
        this._pending = 0;
        this._requests = {};
        this._themes = {};
        this._themeChanged = new Signal(this);
        const { host, key, splash, url } = options;
        this.translator = options.translator || nullTranslator;
        this._trans = this.translator.load('jupyterlab');
        const registry = options.settings;
        this._base = url;
        this._host = host;
        this._splash = splash || null;
        void registry.load(key).then(settings => {
            this._settings = settings;
            // set up css overrides once we have a pointer to the settings schema
            this._initOverrideProps();
            this._settings.changed.connect(this._loadSettings, this);
            this._loadSettings();
        });
    }
    /**
     * Get the name of the current theme.
     */
    get theme() {
        return this._current;
    }
    /**
     * The names of the registered themes.
     */
    get themes() {
        return Object.keys(this._themes);
    }
    /**
     * A signal fired when the application theme changes.
     */
    get themeChanged() {
        return this._themeChanged;
    }
    /**
     * Get the value of a CSS variable from its key.
     *
     * @param key - A Jupyterlab CSS variable, without the leading '--jp-'.
     *
     * @return value - The current value of the Jupyterlab CSS variable
     */
    getCSS(key) {
        var _a;
        return ((_a = this._overrides[key]) !== null && _a !== void 0 ? _a : getComputedStyle(document.documentElement).getPropertyValue(`--jp-${key}`));
    }
    /**
     * Load a theme CSS file by path.
     *
     * @param path - The path of the file to load.
     */
    loadCSS(path) {
        const base = this._base;
        const href = URLExt.isLocal(path) ? URLExt.join(base, path) : path;
        const links = this._links;
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.setAttribute('rel', 'stylesheet');
            link.setAttribute('type', 'text/css');
            link.setAttribute('href', href);
            link.addEventListener('load', () => {
                resolve(undefined);
            });
            link.addEventListener('error', () => {
                reject(`Stylesheet failed to load: ${href}`);
            });
            document.body.appendChild(link);
            links.push(link);
            // add any css overrides to document
            this.loadCSSOverrides();
        });
    }
    /**
     * Loads all current CSS overrides from settings. If an override has been
     * removed or is invalid, this function unloads it instead.
     */
    loadCSSOverrides() {
        var _a;
        const newOverrides = (_a = this._settings.user['overrides']) !== null && _a !== void 0 ? _a : {};
        // iterate over the union of current and new CSS override keys
        Object.keys(Object.assign(Object.assign({}, this._overrides), newOverrides)).forEach(key => {
            const val = newOverrides[key];
            if (val && this.validateCSS(key, val)) {
                // validation succeeded, set the override
                document.documentElement.style.setProperty(`--jp-${key}`, val);
            }
            else {
                // if key is not present or validation failed, the override will be removed
                delete newOverrides[key];
                document.documentElement.style.removeProperty(`--jp-${key}`);
            }
        });
        // replace the current overrides with the new ones
        this._overrides = newOverrides;
    }
    /**
     * Validate a CSS value w.r.t. a key
     *
     * @param key - A Jupyterlab CSS variable, without the leading '--jp-'.
     *
     * @param val - A candidate CSS value
     */
    validateCSS(key, val) {
        // determine the css property corresponding to the key
        const prop = this._overrideProps[key];
        if (!prop) {
            console.warn('CSS validation failed: could not find property corresponding to key.\n' +
                `key: '${key}', val: '${val}'`);
            return false;
        }
        // use built-in validation once we have the corresponding property
        if (CSS.supports(prop, val)) {
            return true;
        }
        else {
            console.warn('CSS validation failed: invalid value.\n' +
                `key: '${key}', val: '${val}', prop: '${prop}'`);
            return false;
        }
    }
    /**
     * Register a theme with the theme manager.
     *
     * @param theme - The theme to register.
     *
     * @returns A disposable that can be used to unregister the theme.
     */
    register(theme) {
        const { name } = theme;
        const themes = this._themes;
        if (themes[name]) {
            throw new Error(`Theme already registered for ${name}`);
        }
        themes[name] = theme;
        return new DisposableDelegate(() => {
            delete themes[name];
        });
    }
    /**
     * Add a CSS override to the settings.
     */
    setCSSOverride(key, value) {
        return this._settings.set('overrides', Object.assign(Object.assign({}, this._overrides), { [key]: value }));
    }
    /**
     * Set the current theme.
     */
    setTheme(name) {
        return this._settings.set('theme', name);
    }
    /**
     * Test whether a given theme is light.
     */
    isLight(name) {
        return this._themes[name].isLight;
    }
    /**
     * Increase a font size w.r.t. its current setting or its value in the
     * current theme.
     *
     * @param key - A Jupyterlab font size CSS variable, without the leading '--jp-'.
     */
    incrFontSize(key) {
        return this._incrFontSize(key, true);
    }
    /**
     * Decrease a font size w.r.t. its current setting or its value in the
     * current theme.
     *
     * @param key - A Jupyterlab font size CSS variable, without the leading '--jp-'.
     */
    decrFontSize(key) {
        return this._incrFontSize(key, false);
    }
    /**
     * Test whether a given theme styles scrollbars,
     * and if the user has scrollbar styling enabled.
     */
    themeScrollbars(name) {
        return (!!this._settings.composite['theme-scrollbars'] &&
            !!this._themes[name].themeScrollbars);
    }
    /**
     * Test if the user has scrollbar styling enabled.
     */
    isToggledThemeScrollbars() {
        return !!this._settings.composite['theme-scrollbars'];
    }
    /**
     * Toggle the `theme-scrollbars` setting.
     */
    toggleThemeScrollbars() {
        return this._settings.set('theme-scrollbars', !this._settings.composite['theme-scrollbars']);
    }
    /**
     * Get the display name of the theme.
     */
    getDisplayName(name) {
        var _a, _b;
        return (_b = (_a = this._themes[name]) === null || _a === void 0 ? void 0 : _a.displayName) !== null && _b !== void 0 ? _b : name;
    }
    /**
     * Change a font size by a positive or negative increment.
     */
    _incrFontSize(key, add = true) {
        var _a;
        // get the numeric and unit parts of the current font size
        const parts = ((_a = this.getCSS(key)) !== null && _a !== void 0 ? _a : '13px').split(/([a-zA-Z]+)/);
        // determine the increment
        const incr = (add ? 1 : -1) * (parts[1] === 'em' ? 0.1 : 1);
        // increment the font size and set it as an override
        return this.setCSSOverride(key, `${Number(parts[0]) + incr}${parts[1]}`);
    }
    /**
     * Initialize the key -> property dict for the overrides
     */
    _initOverrideProps() {
        const definitions = this._settings.schema.definitions;
        const overidesSchema = definitions.cssOverrides.properties;
        Object.keys(overidesSchema).forEach(key => {
            // override validation is against the CSS property in the description
            // field. Example: for key ui-font-family, .description is font-family
            this._overrideProps[key] = overidesSchema[key].description;
        });
    }
    /**
     * Handle the current settings.
     */
    _loadSettings() {
        const outstanding = this._outstanding;
        const pending = this._pending;
        const requests = this._requests;
        // If another request is pending, cancel it.
        if (pending) {
            window.clearTimeout(pending);
            this._pending = 0;
        }
        const settings = this._settings;
        const themes = this._themes;
        const theme = settings.composite['theme'];
        // If another promise is outstanding, wait until it finishes before
        // attempting to load the settings. Because outstanding promises cannot
        // be aborted, the order in which they occur must be enforced.
        if (outstanding) {
            outstanding
                .then(() => {
                this._loadSettings();
            })
                .catch(() => {
                this._loadSettings();
            });
            this._outstanding = null;
            return;
        }
        // Increment the request counter.
        requests[theme] = requests[theme] ? requests[theme] + 1 : 1;
        // If the theme exists, load it right away.
        if (themes[theme]) {
            this._outstanding = this._loadTheme(theme);
            delete requests[theme];
            return;
        }
        // If the request has taken too long, give up.
        if (requests[theme] > REQUEST_THRESHOLD) {
            const fallback = settings.default('theme');
            // Stop tracking the requests for this theme.
            delete requests[theme];
            if (!themes[fallback]) {
                this._onError(this._trans.__('Neither theme %1 nor default %2 loaded.', theme, fallback));
                return;
            }
            console.warn(`Could not load theme ${theme}, using default ${fallback}.`);
            this._outstanding = this._loadTheme(fallback);
            return;
        }
        // If the theme does not yet exist, attempt to wait for it.
        this._pending = window.setTimeout(() => {
            this._loadSettings();
        }, REQUEST_INTERVAL);
    }
    /**
     * Load the theme.
     *
     * #### Notes
     * This method assumes that the `theme` exists.
     */
    _loadTheme(theme) {
        var _a;
        const current = this._current;
        const links = this._links;
        const themes = this._themes;
        const splash = this._splash
            ? this._splash.show(themes[theme].isLight)
            : new DisposableDelegate(() => undefined);
        // Unload any CSS files that have been loaded.
        links.forEach(link => {
            if (link.parentElement) {
                link.parentElement.removeChild(link);
            }
        });
        links.length = 0;
        const themeProps = (_a = this._settings.schema.properties) === null || _a === void 0 ? void 0 : _a.theme;
        if (themeProps) {
            themeProps.enum = Object.keys(themes).map(value => { var _a; return (_a = themes[value].displayName) !== null && _a !== void 0 ? _a : value; });
        }
        // Unload the previously loaded theme.
        const old = current ? themes[current].unload() : Promise.resolve();
        return Promise.all([old, themes[theme].load()])
            .then(() => {
            this._current = theme;
            this._themeChanged.emit({
                name: 'theme',
                oldValue: current,
                newValue: theme
            });
            // Need to force a redraw of the app here to avoid a Chrome rendering
            // bug that can leave the scrollbars in an invalid state
            this._host.hide();
            // If we hide/show the widget too quickly, no redraw will happen.
            // requestAnimationFrame delays until after the next frame render.
            requestAnimationFrame(() => {
                this._host.show();
                Private.fitAll(this._host);
                splash.dispose();
            });
        })
            .catch(reason => {
            this._onError(reason);
            splash.dispose();
        });
    }
    /**
     * Handle a theme error.
     */
    _onError(reason) {
        void showDialog({
            title: this._trans.__('Error Loading Theme'),
            body: String(reason),
            buttons: [Dialog.okButton({ label: this._trans.__('OK') })]
        });
    }
}
/**
 * A namespace for module private data.
 */
var Private;
(function (Private) {
    /**
     * Fit a widget and all of its children, recursively.
     */
    function fitAll(widget) {
        each(widget.children(), fitAll);
        widget.fit();
    }
    Private.fitAll = fitAll;
})(Private || (Private = {}));
//# sourceMappingURL=thememanager.js.map