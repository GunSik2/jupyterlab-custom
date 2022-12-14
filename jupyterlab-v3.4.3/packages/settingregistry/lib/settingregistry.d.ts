import { IDataConnector } from '@jupyterlab/statedb';
import { JSONValue, PartialJSONValue, ReadonlyJSONObject, ReadonlyPartialJSONObject, ReadonlyPartialJSONValue } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';
import { ISignal } from '@lumino/signaling';
import { ISettingRegistry } from './tokens';
/**
 * An implementation of a schema validator.
 */
export interface ISchemaValidator {
    /**
     * Validate a plugin's schema and user data; populate the `composite` data.
     *
     * @param plugin - The plugin being validated. Its `composite` data will be
     * populated by reference.
     *
     * @param populate - Whether plugin data should be populated, defaults to
     * `true`.
     *
     * @return A list of errors if either the schema or data fail to validate or
     * `null` if there are no errors.
     */
    validateData(plugin: ISettingRegistry.IPlugin, populate?: boolean): ISchemaValidator.IError[] | null;
}
/**
 * A namespace for schema validator interfaces.
 */
export declare namespace ISchemaValidator {
    /**
     * A schema validation error definition.
     */
    interface IError {
        /**
         * The path in the data where the error occurred.
         */
        dataPath: string;
        /**
         * The keyword whose validation failed.
         */
        keyword: string;
        /**
         * The error message.
         */
        message: string;
        /**
         * Optional parameter metadata that might be included in an error.
         */
        params?: ReadonlyJSONObject;
        /**
         * The path in the schema where the error occurred.
         */
        schemaPath: string;
    }
}
/**
 * The default implementation of a schema validator.
 */
export declare class DefaultSchemaValidator implements ISchemaValidator {
    /**
     * Instantiate a schema validator.
     */
    constructor();
    /**
     * Validate a plugin's schema and user data; populate the `composite` data.
     *
     * @param plugin - The plugin being validated. Its `composite` data will be
     * populated by reference.
     *
     * @param populate - Whether plugin data should be populated, defaults to
     * `true`.
     *
     * @return A list of errors if either the schema or data fail to validate or
     * `null` if there are no errors.
     */
    validateData(plugin: ISettingRegistry.IPlugin, populate?: boolean): ISchemaValidator.IError[] | null;
    /**
     * Add a schema to the validator.
     *
     * @param plugin - The plugin ID.
     *
     * @param schema - The schema being added.
     *
     * @return A list of errors if the schema fails to validate or `null` if there
     * are no errors.
     *
     * #### Notes
     * It is safe to call this function multiple times with the same plugin name.
     */
    private _addSchema;
    private _composer;
    private _validator;
}
/**
 * The default concrete implementation of a setting registry.
 */
export declare class SettingRegistry implements ISettingRegistry {
    /**
     * Create a new setting registry.
     */
    constructor(options: SettingRegistry.IOptions);
    /**
     * The data connector used by the setting registry.
     */
    readonly connector: IDataConnector<ISettingRegistry.IPlugin, string, string>;
    /**
     * The schema of the setting registry.
     */
    readonly schema: ISettingRegistry.ISchema;
    /**
     * The schema validator used by the setting registry.
     */
    readonly validator: ISchemaValidator;
    /**
     * A signal that emits the name of a plugin when its settings change.
     */
    get pluginChanged(): ISignal<this, string>;
    /**
     * The collection of setting registry plugins.
     */
    readonly plugins: {
        [name: string]: ISettingRegistry.IPlugin;
    };
    /**
     * Get an individual setting.
     *
     * @param plugin - The name of the plugin whose settings are being retrieved.
     *
     * @param key - The name of the setting being retrieved.
     *
     * @returns A promise that resolves when the setting is retrieved.
     */
    get(plugin: string, key: string): Promise<{
        composite: PartialJSONValue | undefined;
        user: PartialJSONValue | undefined;
    }>;
    /**
     * Load a plugin's settings into the setting registry.
     *
     * @param plugin - The name of the plugin whose settings are being loaded.
     *
     * @returns A promise that resolves with a plugin settings object or rejects
     * if the plugin is not found.
     */
    load(plugin: string): Promise<ISettingRegistry.ISettings>;
    /**
     * Reload a plugin's settings into the registry even if they already exist.
     *
     * @param plugin - The name of the plugin whose settings are being reloaded.
     *
     * @returns A promise that resolves with a plugin settings object or rejects
     * with a list of `ISchemaValidator.IError` objects if it fails.
     */
    reload(plugin: string): Promise<ISettingRegistry.ISettings>;
    /**
     * Remove a single setting in the registry.
     *
     * @param plugin - The name of the plugin whose setting is being removed.
     *
     * @param key - The name of the setting being removed.
     *
     * @returns A promise that resolves when the setting is removed.
     */
    remove(plugin: string, key: string): Promise<void>;
    /**
     * Set a single setting in the registry.
     *
     * @param plugin - The name of the plugin whose setting is being set.
     *
     * @param key - The name of the setting being set.
     *
     * @param value - The value of the setting being set.
     *
     * @returns A promise that resolves when the setting has been saved.
     *
     */
    set(plugin: string, key: string, value: JSONValue): Promise<void>;
    /**
     * Register a plugin transform function to act on a specific plugin.
     *
     * @param plugin - The name of the plugin whose settings are transformed.
     *
     * @param transforms - The transform functions applied to the plugin.
     *
     * @returns A disposable that removes the transforms from the registry.
     *
     * #### Notes
     * - `compose` transformations: The registry automatically overwrites a
     * plugin's default values with user overrides, but a plugin may instead wish
     * to merge values. This behavior can be accomplished in a `compose`
     * transformation.
     * - `fetch` transformations: The registry uses the plugin data that is
     * fetched from its connector. If a plugin wants to override, e.g. to update
     * its schema with dynamic defaults, a `fetch` transformation can be applied.
     */
    transform(plugin: string, transforms: {
        [phase in ISettingRegistry.IPlugin.Phase]?: ISettingRegistry.IPlugin.Transform;
    }): IDisposable;
    /**
     * Upload a plugin's settings.
     *
     * @param plugin - The name of the plugin whose settings are being set.
     *
     * @param raw - The raw plugin settings being uploaded.
     *
     * @returns A promise that resolves when the settings have been saved.
     */
    upload(plugin: string, raw: string): Promise<void>;
    /**
     * Load a plugin into the registry.
     */
    private _load;
    /**
     * Preload a list of plugins and fail gracefully.
     */
    private _preload;
    /**
     * Save a plugin in the registry.
     */
    private _save;
    /**
     * Transform the plugin if necessary.
     */
    private _transform;
    /**
     * Validate and preload a plugin, compose the `composite` data.
     */
    private _validate;
    private _pluginChanged;
    private _ready;
    private _timeout;
    private _transformers;
}
/**
 * A manager for a specific plugin's settings.
 */
export declare class Settings implements ISettingRegistry.ISettings {
    /**
     * Instantiate a new plugin settings manager.
     */
    constructor(options: Settings.IOptions);
    /**
     * The plugin name.
     */
    readonly id: string;
    /**
     * The setting registry instance used as a back-end for these settings.
     */
    readonly registry: ISettingRegistry;
    /**
     * A signal that emits when the plugin's settings have changed.
     */
    get changed(): ISignal<this, void>;
    /**
     * The composite of user settings and extension defaults.
     */
    get composite(): ReadonlyPartialJSONObject;
    /**
     * Test whether the plugin settings manager disposed.
     */
    get isDisposed(): boolean;
    get plugin(): ISettingRegistry.IPlugin;
    /**
     * The plugin's schema.
     */
    get schema(): ISettingRegistry.ISchema;
    /**
     * The plugin settings raw text value.
     */
    get raw(): string;
    /**
     * Checks if any fields are different from the default value.
     */
    isDefault(user: ReadonlyPartialJSONObject): boolean;
    get isModified(): boolean;
    /**
     * The user settings.
     */
    get user(): ReadonlyPartialJSONObject;
    /**
     * The published version of the NPM package containing these settings.
     */
    get version(): string;
    /**
     * Return the defaults in a commented JSON format.
     */
    annotatedDefaults(): string;
    /**
     * Calculate the default value of a setting by iterating through the schema.
     *
     * @param key - The name of the setting whose default value is calculated.
     *
     * @returns A calculated default JSON value for a specific setting.
     */
    default(key?: string): PartialJSONValue | undefined;
    /**
     * Dispose of the plugin settings resources.
     */
    dispose(): void;
    /**
     * Get an individual setting.
     *
     * @param key - The name of the setting being retrieved.
     *
     * @returns The setting value.
     *
     * #### Notes
     * This method returns synchronously because it uses a cached copy of the
     * plugin settings that is synchronized with the registry.
     */
    get(key: string): {
        composite: ReadonlyPartialJSONValue | undefined;
        user: ReadonlyPartialJSONValue | undefined;
    };
    /**
     * Remove a single setting.
     *
     * @param key - The name of the setting being removed.
     *
     * @returns A promise that resolves when the setting is removed.
     *
     * #### Notes
     * This function is asynchronous because it writes to the setting registry.
     */
    remove(key: string): Promise<void>;
    /**
     * Save all of the plugin's user settings at once.
     */
    save(raw: string): Promise<void>;
    /**
     * Set a single setting.
     *
     * @param key - The name of the setting being set.
     *
     * @param value - The value of the setting.
     *
     * @returns A promise that resolves when the setting has been saved.
     *
     * #### Notes
     * This function is asynchronous because it writes to the setting registry.
     */
    set(key: string, value: JSONValue): Promise<void>;
    /**
     * Validates raw settings with comments.
     *
     * @param raw - The JSON with comments string being validated.
     *
     * @returns A list of errors or `null` if valid.
     */
    validate(raw: string): ISchemaValidator.IError[] | null;
    /**
     * Handle plugin changes in the setting registry.
     */
    private _onPluginChanged;
    private _changed;
    private _isDisposed;
}
/**
 * A namespace for `SettingRegistry` statics.
 */
export declare namespace SettingRegistry {
    /**
     * The instantiation options for a setting registry
     */
    interface IOptions {
        /**
         * The data connector used by the setting registry.
         */
        connector: IDataConnector<ISettingRegistry.IPlugin, string>;
        /**
         * Preloaded plugin data to populate the setting registry.
         */
        plugins?: ISettingRegistry.IPlugin[];
        /**
         * The number of milliseconds before a `load()` call to the registry waits
         * before timing out if it requires a transformation that has not been
         * registered.
         *
         * #### Notes
         * The default value is 7000.
         */
        timeout?: number;
        /**
         * The validator used to enforce the settings JSON schema.
         */
        validator?: ISchemaValidator;
    }
    /**
     * Reconcile the menus.
     *
     * @param reference The reference list of menus.
     * @param addition The list of menus to add.
     * @param warn Warn if the command items are duplicated within the same menu.
     * @returns The reconciled list of menus.
     */
    function reconcileMenus(reference: ISettingRegistry.IMenu[] | null, addition: ISettingRegistry.IMenu[] | null, warn?: boolean, addNewItems?: boolean): ISettingRegistry.IMenu[];
    /**
     * Merge two set of menu items.
     *
     * @param reference Reference set of menu items
     * @param addition New items to add
     * @param warn Whether to warn if item is duplicated; default to false
     * @returns The merged set of items
     */
    function reconcileItems<T extends ISettingRegistry.IMenuItem>(reference?: T[], addition?: T[], warn?: boolean, addNewItems?: boolean): T[] | undefined;
    /**
     * Remove disabled entries from menu items
     *
     * @param items Menu items
     * @returns Filtered menu items
     */
    function filterDisabledItems<T extends ISettingRegistry.IMenuItem>(items: T[]): T[];
    /**
     * Reconcile default and user shortcuts and return the composite list.
     *
     * @param defaults - The list of default shortcuts.
     *
     * @param user - The list of user shortcut overrides and additions.
     *
     * @returns A loadable list of shortcuts (omitting disabled and overridden).
     */
    function reconcileShortcuts(defaults: ISettingRegistry.IShortcut[], user: ISettingRegistry.IShortcut[]): ISettingRegistry.IShortcut[];
    /**
     * Merge two set of toolbar items.
     *
     * @param reference Reference set of toolbar items
     * @param addition New items to add
     * @param warn Whether to warn if item is duplicated; default to false
     * @returns The merged set of items
     */
    function reconcileToolbarItems(reference?: ISettingRegistry.IToolbarItem[], addition?: ISettingRegistry.IToolbarItem[], warn?: boolean): ISettingRegistry.IToolbarItem[] | undefined;
}
/**
 * A namespace for `Settings` statics.
 */
export declare namespace Settings {
    /**
     * The instantiation options for a `Settings` object.
     */
    interface IOptions {
        /**
         * The setting values for a plugin.
         */
        plugin: ISettingRegistry.IPlugin;
        /**
         * The system registry instance used by the settings manager.
         */
        registry: ISettingRegistry;
    }
}
