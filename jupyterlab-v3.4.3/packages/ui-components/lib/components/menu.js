// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { ArrayExt } from '@lumino/algorithm';
import { DisposableDelegate } from '@lumino/disposable';
import { Menu } from '@lumino/widgets';
/**
 * Namespace for JupyterLabMenu interfaces
 */
export var IRankedMenu;
(function (IRankedMenu) {
    /**
     * Default menu item rank
     */
    IRankedMenu.DEFAULT_RANK = 100;
})(IRankedMenu || (IRankedMenu = {}));
/**
 * An extensible menu for JupyterLab application menus.
 */
export class RankedMenu extends Menu {
    /**
     * Construct a new menu.
     *
     * @param options - Options for the lumino menu.
     */
    constructor(options) {
        var _a;
        super(options);
        this._ranks = [];
        this._rank = options.rank;
        this._includeSeparators = (_a = options.includeSeparators) !== null && _a !== void 0 ? _a : true;
    }
    /**
     * The underlying Lumino menu.
     *
     * @deprecated since v3.1
     * RankMenu inherits from Menu since v3.1
     */
    get menu() {
        return this;
    }
    /**
     * Menu rank.
     */
    get rank() {
        return this._rank;
    }
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
    addGroup(items, rank) {
        if (items.length === 0) {
            return new DisposableDelegate(() => void 0);
        }
        const defaultRank = rank !== null && rank !== void 0 ? rank : IRankedMenu.DEFAULT_RANK;
        const sortedItems = items
            .map(item => {
            var _a;
            return Object.assign(Object.assign({}, item), { rank: (_a = item.rank) !== null && _a !== void 0 ? _a : defaultRank });
        })
            .sort((a, b) => a.rank - b.rank);
        // Insert the plugin group into the menu.
        let insertIndex = this._ranks.findIndex(rank => sortedItems[0].rank < rank);
        if (insertIndex < 0) {
            insertIndex = this._ranks.length; // Insert at the end of the menu
        }
        // Keep an array of the menu items that have been created.
        const added = [];
        // Insert a separator before the group.
        // Phosphor takes care of superfluous leading,
        // trailing, and duplicate separators.
        if (this._includeSeparators) {
            added.push(this.insertItem(insertIndex++, { type: 'separator', rank: defaultRank }));
        }
        // Insert the group.
        added.push(...sortedItems.map(item => {
            return this.insertItem(insertIndex++, item);
        }));
        // Insert a separator after the group.
        if (this._includeSeparators) {
            added.push(this.insertItem(insertIndex++, { type: 'separator', rank: defaultRank }));
        }
        return new DisposableDelegate(() => {
            added.forEach(i => i.dispose());
        });
    }
    /**
     * Add a menu item to the end of the menu.
     *
     * @param options - The options for creating the menu item.
     *
     * @returns The menu item added to the menu.
     */
    addItem(options) {
        let insertIndex = -1;
        if (options.rank) {
            insertIndex = this._ranks.findIndex(rank => options.rank < rank);
        }
        if (insertIndex < 0) {
            insertIndex = this._ranks.length; // Insert at the end of the menu
        }
        return this.insertItem(insertIndex, options);
    }
    /**
     * Remove all menu items from the menu.
     */
    clearItems() {
        this._ranks.length = 0;
        super.clearItems();
    }
    /**
     * Dispose of the resources held by the menu.
     */
    dispose() {
        this._ranks.length = 0;
        super.dispose();
    }
    /**
     * Get the rank of the item at index.
     *
     * @param index Item index.
     * @returns Rank of the item.
     */
    getRankAt(index) {
        return this._ranks[index];
    }
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
    insertItem(index, options) {
        var _a, _b;
        const clampedIndex = Math.max(0, Math.min(index, this._ranks.length));
        ArrayExt.insert(this._ranks, clampedIndex, (_a = options.rank) !== null && _a !== void 0 ? _a : Math.max(IRankedMenu.DEFAULT_RANK, (_b = this._ranks[this._ranks.length - 1]) !== null && _b !== void 0 ? _b : IRankedMenu.DEFAULT_RANK));
        const item = super.insertItem(clampedIndex, options);
        return new DisposableMenuItem(item, this);
    }
    /**
     * Remove the item at a given index from the menu.
     *
     * @param index - The index of the item to remove.
     *
     * #### Notes
     * This is a no-op if the index is out of range.
     */
    removeItemAt(index) {
        ArrayExt.removeAt(this._ranks, index);
        super.removeItemAt(index);
    }
}
/**
 * Disposable Menu Item
 */
class DisposableMenuItem {
    /**
     * Create a disposable menu item from an item and the menu it belongs to
     *
     * @param item Menu item
     * @param menu Menu
     */
    constructor(item, menu) {
        this._item = item;
        this._menu = menu;
        // dispose this item if the parent menu is disposed
        const dispose = (menu) => {
            menu.disposed.disconnect(dispose);
            this.dispose();
        };
        this._menu.disposed.connect(dispose);
    }
    /**
     * Whether the menu item is disposed or not.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * The type of the menu item.
     */
    get type() {
        return this._item.type;
    }
    /**
     * The command to execute when the item is triggered.
     */
    get command() {
        return this._item.command;
    }
    /**
     * The arguments for the command.
     */
    get args() {
        return this._item.args;
    }
    /**
     * The submenu for a `'submenu'` type item.
     */
    get submenu() {
        return this._item.submenu;
    }
    /**
     * The display label for the menu item.
     */
    get label() {
        return this._item.label;
    }
    /**
     * The mnemonic index for the menu item.
     */
    get mnemonic() {
        return this._item.mnemonic;
    }
    /**
     * The icon renderer for the menu item.
     */
    get icon() {
        return this._item.icon;
    }
    /**
     * The icon class for the menu item.
     */
    get iconClass() {
        return this._item.iconClass;
    }
    /**
     * The icon label for the menu item.
     */
    get iconLabel() {
        return this._item.iconLabel;
    }
    /**
     * The display caption for the menu item.
     */
    get caption() {
        return this._item.caption;
    }
    /**
     * The extra class name for the menu item.
     */
    get className() {
        return this._item.className;
    }
    /**
     * The dataset for the menu item.
     */
    get dataset() {
        return this._item.dataset;
    }
    /**
     * Whether the menu item is enabled.
     */
    get isEnabled() {
        return this._item.isEnabled;
    }
    /**
     * Whether the menu item is toggled.
     */
    get isToggled() {
        return this._item.isToggled;
    }
    /**
     * Whether the menu item is visible.
     */
    get isVisible() {
        return this.isVisible;
    }
    /**
     * The key binding for the menu item.
     */
    get keyBinding() {
        return this._item.keyBinding;
    }
    /**
     * Dispose the menu item by removing it from its menu.
     */
    dispose() {
        this._isDisposed = true;
        if (this._menu.isDisposed) {
            // Bail early
            return;
        }
        this._menu.removeItem(this._item);
    }
}
//# sourceMappingURL=menu.js.map