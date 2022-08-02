// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/**
 * @packageDocumentation
 * @module user-extension
 */
import { IToolbarWidgetRegistry } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils';
import { ICurrentUser, IUserMenu, RendererUserMenu, User, UserMenu } from '@jupyterlab/user';
import { MenuBar } from '@lumino/widgets';
/**
 * Jupyter plugin providing the ICurrentUser.
 */
const userPlugin = {
    id: '@jupyterlab/user-extension:user',
    autoStart: true,
    provides: ICurrentUser,
    activate: (app) => {
        return new User();
    }
};
/**
 * Jupyter plugin providing the IUserMenu.
 */
const userMenuPlugin = {
    id: '@jupyterlab/user-extension:user-menu',
    autoStart: true,
    requires: [ICurrentUser],
    provides: IUserMenu,
    activate: (app, user) => {
        const { commands } = app;
        return new UserMenu({ commands, user });
    }
};
/**
 * Jupyter plugin adding the IUserMenu to the menu bar if collaborative flag enabled.
 */
const menuBarPlugin = {
    id: '@jupyterlab/user-extension:user-menu-bar',
    autoStart: true,
    requires: [ICurrentUser, IUserMenu, IToolbarWidgetRegistry],
    activate: (app, user, menu, toolbarRegistry) => {
        if (PageConfig.getOption('collaborative') !== 'true') {
            return;
        }
        toolbarRegistry.addFactory('TopBar', 'user-menu', () => {
            const menuBar = new MenuBar({
                forceItemsPosition: {
                    forceX: false,
                    forceY: false
                },
                renderer: new RendererUserMenu(user)
            });
            menuBar.id = 'jp-UserMenu';
            user.changed.connect(() => {
                menuBar.update();
            });
            menuBar.addMenu(menu);
            return menuBar;
        });
    }
};
/**
 * Export the plugins as default.
 */
const plugins = [
    userPlugin,
    userMenuPlugin,
    menuBarPlugin
];
export default plugins;
//# sourceMappingURL=index.js.map