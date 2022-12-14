import { IDisposable } from '@lumino/disposable';
import { Menu } from '@lumino/widgets';
/**
 * Interface for disposable item menu
 */
export interface IDisposableMenuItem extends IDisposable, Menu.IItem {
}
/**
 * A common interface for extensible JupyterLab application menus.
 *
 * Plugins are still free to define their own menus in any way
 * they like. However, JupyterLab defines a few top-level
 * application menus that may be extended by plugins as well,
 * such as "Edit" and "View"
 */
export interface IRankedMenu extends IDisposable {
    /**
     * Add a group of menu items specific to a particular
     * plugin.
     *
     * The rank can be set for all items in the group using the
     * function argument or per item.
     *
     * @param items - the list of menu items to add.
     * @param rank - the default rank in the menu in which to insert the group.
     * @returns Disposable of the group
     */
    addGroup(items: Menu.IItemOptions[], rank?: number): IDisposable;
    /**
     * Add a menu item to the end of the menu.
     *
     * @param options - The options for creating the menu item.
     *
     * @returns The menu item added to the menu.
     *
     * @deprecated It will return a `IDisposable` object in v4
     */
    addItem(options: IRankedMenu.IItemOptions): Menu.IItem;
    /**
     * A read-only array of the menu items in the menu.
     */
    readonly items: ReadonlyArray<Menu.IItem>;
    /**
     * The underlying Lumino menu.
     *
     * @deprecated will be removed in v4
     */
    readonly menu: Menu;
    /**
     * Menu rank
     */
    readonly rank?: number;
}
/**
 * Namespace for JupyterLabMenu interfaces
 */
export declare namespace IRankedMenu {
    /**
     * Default menu item rank
     */
    const DEFAULT_RANK = 100;
    /**
     * An options object for creating a menu item.
     */
    interface IItemOptions extends Menu.IItemOptions {
        /**
         * Menu item rank
         */
        rank?: number;
    }
    /**
     * An options object for creating a JupyterLab menu.
     */
    interface IOptions extends Menu.IOptions {
        /**
         * Whether to include separators between the
         *   groups that are added to the menu.
         *
         * Default: true
         */
        includeSeparators?: boolean;
        /**
         * Menu rank
         */
        rank?: number;
    }
}
/**
 * An extensible menu for JupyterLab application menus.
 */
export declare class RankedMenu extends Menu implements IRankedMenu {
    /**
     * Construct a new menu.
     *
     * @param options - Options for the lumino menu.
     */
    constructor(options: IRankedMenu.IOptions);
    /**
     * The underlying Lumino menu.
     *
     * @deprecated since v3.1
     * RankMenu inherits from Menu since v3.1
     */
    get menu(): Menu;
    /**
     * Menu rank.
     */
    get rank(): number | undefined;
    /**
     * Add a group of menu items specific to a particular
     * plugin.
     *
     * The rank can be set for all items in the group using the
     * function argument or per item.
     *
     * @param items - the list of menu items to add.
     * @param rank - the default rank in the menu in which to insert the group.
     * @returns Disposable of the group
     */
    addGroup(items: IRankedMenu.IItemOptions[], rank?: number): IDisposable;
    /**
     * Add a menu item to the end of the menu.
     *
     * @param options - The options for creating the menu item.
     *
     * @returns The menu item added to the menu.
     */
    addItem(options: IRankedMenu.IItemOptions): IDisposableMenuItem;
    /**
     * Remove all menu items from the menu.
     */
    clearItems(): void;
    /**
     * Dispose of the resources held by the menu.
     */
    dispose(): void;
    /**
     * Get the rank of the item at index.
     *
     * @param index Item index.
     * @returns Rank of the item.
     */
    getRankAt(index: number): number;
    /**
     * Insert a menu item into the menu at the specified index.
     *
     * @param index - The index at which to insert the item.
     *
     * @param options - The options for creating the menu item.
     *
     * @returns The menu item added to the menu.
     *
     * #### Notes
     * The index will be clamped to the bounds of the items.
     */
    insertItem(index: number, options: IRankedMenu.IItemOptions): IDisposableMenuItem;
    /**
     * Remove the item at a given index from the menu.
     *
     * @param index - The index of the item to remove.
     *
     * #### Notes
     * This is a no-op if the index is out of range.
     */
    removeItemAt(index: number): void;
    private _includeSeparators;
    private _rank;
    private _ranks;
}
