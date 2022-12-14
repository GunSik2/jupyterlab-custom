// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { IRankedMenu, MenuSvg, RankedMenu } from '@jupyterlab/ui-components';
import { ArrayExt } from '@lumino/algorithm';
import { MenuBar } from '@lumino/widgets';
import { EditMenu } from './edit';
import { FileMenu } from './file';
import { HelpMenu } from './help';
import { KernelMenu } from './kernel';
import { RunMenu } from './run';
import { SettingsMenu } from './settings';
import { TabsMenu } from './tabs';
import { ViewMenu } from './view';
/**
 * The main menu class.  It is intended to be used as a singleton.
 */
export class MainMenu extends MenuBar {
    /**
     * Construct the main menu bar.
     */
    constructor(commands) {
        super();
        this._items = [];
        this._commands = commands;
    }
    /**
     * The application "Edit" menu.
     */
    get editMenu() {
        if (!this._editMenu) {
            this._editMenu = new EditMenu({
                commands: this._commands,
                rank: 2,
                renderer: MenuSvg.defaultRenderer
            });
        }
        return this._editMenu;
    }
    /**
     * The application "File" menu.
     */
    get fileMenu() {
        if (!this._fileMenu) {
            this._fileMenu = new FileMenu({
                commands: this._commands,
                rank: 1,
                renderer: MenuSvg.defaultRenderer
            });
        }
        return this._fileMenu;
    }
    /**
     * The application "Help" menu.
     */
    get helpMenu() {
        if (!this._helpMenu) {
            this._helpMenu = new HelpMenu({
                commands: this._commands,
                rank: 1000,
                renderer: MenuSvg.defaultRenderer
            });
        }
        return this._helpMenu;
    }
    /**
     * The application "Kernel" menu.
     */
    get kernelMenu() {
        if (!this._kernelMenu) {
            this._kernelMenu = new KernelMenu({
                commands: this._commands,
                rank: 5,
                renderer: MenuSvg.defaultRenderer
            });
        }
        return this._kernelMenu;
    }
    /**
     * The application "Run" menu.
     */
    get runMenu() {
        if (!this._runMenu) {
            this._runMenu = new RunMenu({
                commands: this._commands,
                rank: 4,
                renderer: MenuSvg.defaultRenderer
            });
        }
        return this._runMenu;
    }
    /**
     * The application "Settings" menu.
     */
    get settingsMenu() {
        if (!this._settingsMenu) {
            this._settingsMenu = new SettingsMenu({
                commands: this._commands,
                rank: 999,
                renderer: MenuSvg.defaultRenderer
            });
        }
        return this._settingsMenu;
    }
    /**
     * The application "View" menu.
     */
    get viewMenu() {
        if (!this._viewMenu) {
            this._viewMenu = new ViewMenu({
                commands: this._commands,
                rank: 3,
                renderer: MenuSvg.defaultRenderer
            });
        }
        return this._viewMenu;
    }
    /**
     * The application "Tabs" menu.
     */
    get tabsMenu() {
        if (!this._tabsMenu) {
            this._tabsMenu = new TabsMenu({
                commands: this._commands,
                rank: 500,
                renderer: MenuSvg.defaultRenderer
            });
        }
        return this._tabsMenu;
    }
    /**
     * Add a new menu to the main menu bar.
     */
    addMenu(menu, options = {}) {
        if (ArrayExt.firstIndexOf(this.menus, menu) > -1) {
            return;
        }
        // override default renderer with svg-supporting renderer
        MenuSvg.overrideDefaultRenderer(menu);
        const rank = 'rank' in options
            ? options.rank
            : 'rank' in menu
                ? menu.rank
                : IRankedMenu.DEFAULT_RANK;
        const rankItem = { menu, rank };
        const index = ArrayExt.upperBound(this._items, rankItem, Private.itemCmp);
        // Upon disposal, remove the menu and its rank reference.
        menu.disposed.connect(this._onMenuDisposed, this);
        ArrayExt.insert(this._items, index, rankItem);
        /**
         * Create a new menu.
         */
        this.insertMenu(index, menu);
        // Link the menu to the API - backward compatibility when switching to menu description in settings
        switch (menu.id) {
            case 'jp-mainmenu-file':
                if (!this._fileMenu && menu instanceof FileMenu) {
                    this._fileMenu = menu;
                }
                break;
            case 'jp-mainmenu-edit':
                if (!this._editMenu && menu instanceof EditMenu) {
                    this._editMenu = menu;
                }
                break;
            case 'jp-mainmenu-view':
                if (!this._viewMenu && menu instanceof ViewMenu) {
                    this._viewMenu = menu;
                }
                break;
            case 'jp-mainmenu-run':
                if (!this._runMenu && menu instanceof RunMenu) {
                    this._runMenu = menu;
                }
                break;
            case 'jp-mainmenu-kernel':
                if (!this._kernelMenu && menu instanceof KernelMenu) {
                    this._kernelMenu = menu;
                }
                break;
            case 'jp-mainmenu-tabs':
                if (!this._tabsMenu && menu instanceof TabsMenu) {
                    this._tabsMenu = menu;
                }
                break;
            case 'jp-mainmenu-settings':
                if (!this._settingsMenu && menu instanceof SettingsMenu) {
                    this._settingsMenu = menu;
                }
                break;
            case 'jp-mainmenu-help':
                if (!this._helpMenu && menu instanceof HelpMenu) {
                    this._helpMenu = menu;
                }
                break;
        }
    }
    /**
     * Dispose of the resources held by the menu bar.
     */
    dispose() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        (_a = this._editMenu) === null || _a === void 0 ? void 0 : _a.dispose();
        (_b = this._fileMenu) === null || _b === void 0 ? void 0 : _b.dispose();
        (_c = this._helpMenu) === null || _c === void 0 ? void 0 : _c.dispose();
        (_d = this._kernelMenu) === null || _d === void 0 ? void 0 : _d.dispose();
        (_e = this._runMenu) === null || _e === void 0 ? void 0 : _e.dispose();
        (_f = this._settingsMenu) === null || _f === void 0 ? void 0 : _f.dispose();
        (_g = this._viewMenu) === null || _g === void 0 ? void 0 : _g.dispose();
        (_h = this._tabsMenu) === null || _h === void 0 ? void 0 : _h.dispose();
        super.dispose();
    }
    /**
     * Generate the menu.
     *
     * @param commands The command registry
     * @param options The main menu options.
     * @param trans - The application language translator.
     */
    static generateMenu(commands, options, trans) {
        let menu;
        const { id, label, rank } = options;
        switch (id) {
            case 'jp-mainmenu-file':
                menu = new FileMenu({
                    commands,
                    rank,
                    renderer: MenuSvg.defaultRenderer
                });
                break;
            case 'jp-mainmenu-edit':
                menu = new EditMenu({
                    commands,
                    rank,
                    renderer: MenuSvg.defaultRenderer
                });
                break;
            case 'jp-mainmenu-view':
                menu = new ViewMenu({
                    commands,
                    rank,
                    renderer: MenuSvg.defaultRenderer
                });
                break;
            case 'jp-mainmenu-run':
                menu = new RunMenu({
                    commands,
                    rank,
                    renderer: MenuSvg.defaultRenderer
                });
                break;
            case 'jp-mainmenu-kernel':
                menu = new KernelMenu({
                    commands,
                    rank,
                    renderer: MenuSvg.defaultRenderer
                });
                break;
            case 'jp-mainmenu-tabs':
                menu = new TabsMenu({
                    commands,
                    rank,
                    renderer: MenuSvg.defaultRenderer
                });
                break;
            case 'jp-mainmenu-settings':
                menu = new SettingsMenu({
                    commands,
                    rank,
                    renderer: MenuSvg.defaultRenderer
                });
                break;
            case 'jp-mainmenu-help':
                menu = new HelpMenu({
                    commands,
                    rank,
                    renderer: MenuSvg.defaultRenderer
                });
                break;
            default:
                menu = new RankedMenu({
                    commands,
                    rank,
                    renderer: MenuSvg.defaultRenderer
                });
        }
        if (label) {
            menu.title.label = trans._p('menu', label);
        }
        return menu;
    }
    /**
     * Handle the disposal of a menu.
     */
    _onMenuDisposed(menu) {
        this.removeMenu(menu);
        const index = ArrayExt.findFirstIndex(this._items, item => item.menu === menu);
        if (index !== -1) {
            ArrayExt.removeAt(this._items, index);
        }
    }
}
/**
 * A namespace for private data.
 */
var Private;
(function (Private) {
    /**
     * A comparator function for menu rank items.
     */
    function itemCmp(first, second) {
        return first.rank - second.rank;
    }
    Private.itemCmp = itemCmp;
})(Private || (Private = {}));
//# sourceMappingURL=mainmenu.js.map