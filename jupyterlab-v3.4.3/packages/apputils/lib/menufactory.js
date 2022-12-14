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
import { Text } from '@jupyterlab/coreutils';
import { LabIcon } from '@jupyterlab/ui-components';
import { JSONExt } from '@lumino/coreutils';
/**
 * Helper functions to build a menu from the settings
 */
export var MenuFactory;
(function (MenuFactory) {
    /**
     * Create menus from their description
     *
     * @param data Menubar description
     * @param menuFactory Factory for empty menu
     */
    function createMenus(data, menuFactory) {
        return data
            .filter(item => !item.disabled)
            .sort((a, b) => { var _a, _b; return ((_a = a.rank) !== null && _a !== void 0 ? _a : Infinity) - ((_b = b.rank) !== null && _b !== void 0 ? _b : Infinity); })
            .map(menuItem => {
            return dataToMenu(menuItem, menuFactory);
        });
    }
    MenuFactory.createMenus = createMenus;
    /**
     * Convert a menu description in a JupyterLabMenu object
     *
     * @param item Menu description
     * @param menuFactory Empty menu factory
     * @returns The menu widget
     */
    function dataToMenu(item, menuFactory) {
        var _a, _b;
        const menu = menuFactory(item);
        menu.id = item.id;
        // Set the label in case the menu factory did not.
        if (!menu.title.label) {
            menu.title.label = (_a = item.label) !== null && _a !== void 0 ? _a : Text.titleCase(menu.id.trim());
        }
        if (item.icon) {
            menu.title.icon = LabIcon.resolve({ icon: item.icon });
        }
        if (item.mnemonic !== undefined) {
            menu.title.mnemonic = item.mnemonic;
        }
        (_b = item.items) === null || _b === void 0 ? void 0 : _b.filter(item => !item.disabled).sort((a, b) => { var _a, _b; return ((_a = a.rank) !== null && _a !== void 0 ? _a : Infinity) - ((_b = b.rank) !== null && _b !== void 0 ? _b : Infinity); }).map(item => {
            addItem(item, menu, menuFactory);
        });
        return menu;
    }
    /**
     * Convert an item description in a context menu item object
     *
     * @param item Context menu item
     * @param menu Context menu to populate
     * @param menuFactory Empty menu factory
     */
    function addContextItem(item, menu, menuFactory) {
        const { submenu } = item, newItem = __rest(item, ["submenu"]);
        // Commands may not have been registered yet; so we don't force it to exist
        menu.addItem(Object.assign(Object.assign({}, newItem), { submenu: submenu ? dataToMenu(submenu, menuFactory) : null }));
    }
    MenuFactory.addContextItem = addContextItem;
    /**
     * Convert an item description in a menu item object
     *
     * @param item Menu item
     * @param menu Menu to populate
     * @param menuFactory Empty menu factory
     */
    function addItem(item, menu, menuFactory) {
        const { submenu } = item, newItem = __rest(item, ["submenu"]);
        // Commands may not have been registered yet; so we don't force it to exist
        menu.addItem(Object.assign(Object.assign({}, newItem), { submenu: submenu ? dataToMenu(submenu, menuFactory) : null }));
    }
    /**
     * Update an existing list of menu and returns
     * the new elements.
     *
     * #### Note
     * New elements are added to the current menu list.
     *
     * @param menus Current menus
     * @param data New description to take into account
     * @param menuFactory Empty menu factory
     * @returns Newly created menus
     */
    function updateMenus(menus, data, menuFactory) {
        const newMenus = [];
        data.forEach(item => {
            const menu = menus.find(menu => menu.id === item.id);
            if (menu) {
                mergeMenus(item, menu, menuFactory);
            }
            else {
                if (!item.disabled) {
                    newMenus.push(dataToMenu(item, menuFactory));
                }
            }
        });
        menus.push(...newMenus);
        return newMenus;
    }
    MenuFactory.updateMenus = updateMenus;
    function mergeMenus(item, menu, menuFactory) {
        var _a;
        if (item.disabled) {
            menu.dispose();
        }
        else {
            (_a = item.items) === null || _a === void 0 ? void 0 : _a.forEach(entry => {
                var _a, _b;
                const existingItem = menu === null || menu === void 0 ? void 0 : menu.items.find((i, idx) => {
                    var _a, _b, _c;
                    return i.type === entry.type &&
                        i.command === ((_a = entry.command) !== null && _a !== void 0 ? _a : '') &&
                        ((_b = i.submenu) === null || _b === void 0 ? void 0 : _b.id) === ((_c = entry.submenu) === null || _c === void 0 ? void 0 : _c.id);
                });
                if (existingItem && entry.type !== 'separator') {
                    if (entry.disabled) {
                        menu.removeItem(existingItem);
                    }
                    else {
                        switch ((_a = entry.type) !== null && _a !== void 0 ? _a : 'command') {
                            case 'command':
                                if (entry.command) {
                                    if (!JSONExt.deepEqual(existingItem.args, (_b = entry.args) !== null && _b !== void 0 ? _b : {})) {
                                        addItem(entry, menu, menuFactory);
                                    }
                                }
                                break;
                            case 'submenu':
                                if (entry.submenu) {
                                    mergeMenus(entry.submenu, existingItem.submenu, menuFactory);
                                }
                        }
                    }
                }
                else {
                    addItem(entry, menu, menuFactory);
                }
            });
        }
    }
})(MenuFactory || (MenuFactory = {}));
//# sourceMappingURL=menufactory.js.map