// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/**
 * @packageDocumentation
 * @module application-extension
 */
import { ConnectionLost, IConnectionLost, ILabShell, ILabStatus, ILayoutRestorer, IRouter, ITreePathUpdater, JupyterFrontEnd, JupyterFrontEndContextMenu, JupyterLab, LabShell, LayoutRestorer, Router } from '@jupyterlab/application';
import { Dialog, ICommandPalette, IWindowResolver, MenuFactory, showDialog, showErrorMessage } from '@jupyterlab/apputils';
import { PageConfig, URLExt } from '@jupyterlab/coreutils';
import { IPropertyInspectorProvider, SideBarPropertyInspectorProvider } from '@jupyterlab/property-inspector';
import { ISettingRegistry, SettingRegistry } from '@jupyterlab/settingregistry';
import { IStateDB } from '@jupyterlab/statedb';
import { ITranslator } from '@jupyterlab/translation';
import { buildIcon, jupyterIcon, RankedMenu } from '@jupyterlab/ui-components';
import { each, iter, toArray } from '@lumino/algorithm';
import { JSONExt, PromiseDelegate } from '@lumino/coreutils';
import { DisposableDelegate, DisposableSet } from '@lumino/disposable';
import { Widget } from '@lumino/widgets';
import * as React from 'react';
/**
 * Default context menu item rank
 */
export const DEFAULT_CONTEXT_ITEM_RANK = 100;
/**
 * The command IDs used by the application plugin.
 */
var CommandIDs;
(function (CommandIDs) {
    CommandIDs.activateNextTab = 'application:activate-next-tab';
    CommandIDs.activatePreviousTab = 'application:activate-previous-tab';
    CommandIDs.activateNextTabBar = 'application:activate-next-tab-bar';
    CommandIDs.activatePreviousTabBar = 'application:activate-previous-tab-bar';
    CommandIDs.close = 'application:close';
    CommandIDs.closeOtherTabs = 'application:close-other-tabs';
    CommandIDs.closeRightTabs = 'application:close-right-tabs';
    CommandIDs.closeAll = 'application:close-all';
    CommandIDs.setMode = 'application:set-mode';
    CommandIDs.toggleMode = 'application:toggle-mode';
    CommandIDs.toggleLeftArea = 'application:toggle-left-area';
    CommandIDs.toggleRightArea = 'application:toggle-right-area';
    CommandIDs.togglePresentationMode = 'application:toggle-presentation-mode';
    CommandIDs.tree = 'router:tree';
    CommandIDs.switchSidebar = 'sidebar:switch';
})(CommandIDs || (CommandIDs = {}));
/**
 * A plugin to register the commands for the main application.
 */
const mainCommands = {
    id: '@jupyterlab/application-extension:commands',
    autoStart: true,
    requires: [ITranslator],
    optional: [ILabShell, ICommandPalette],
    activate: (app, translator, labShell, palette) => {
        const { commands, shell } = app;
        const trans = translator.load('jupyterlab');
        const category = trans.__('Main Area');
        // Add Command to override the JLab context menu.
        commands.addCommand(JupyterFrontEndContextMenu.contextMenu, {
            label: trans.__('Shift+Right Click for Browser Menu'),
            isEnabled: () => false,
            execute: () => void 0
        });
        // Returns the widget associated with the most recent contextmenu event.
        const contextMenuWidget = () => {
            const test = (node) => !!node.dataset.id;
            const node = app.contextMenuHitTest(test);
            if (!node) {
                // Fall back to active widget if path cannot be obtained from event.
                return shell.currentWidget;
            }
            const matches = toArray(shell.widgets('main')).filter(widget => widget.id === node.dataset.id);
            if (matches.length < 1) {
                return shell.currentWidget;
            }
            return matches[0];
        };
        // Closes an array of widgets.
        const closeWidgets = (widgets) => {
            widgets.forEach(widget => widget.close());
        };
        // Find the tab area for a widget within a specific dock area.
        const findTab = (area, widget) => {
            switch (area.type) {
                case 'split-area': {
                    const iterator = iter(area.children);
                    let tab = null;
                    let value;
                    do {
                        value = iterator.next();
                        if (value) {
                            tab = findTab(value, widget);
                        }
                    } while (!tab && value);
                    return tab;
                }
                case 'tab-area': {
                    const { id } = widget;
                    return area.widgets.some(widget => widget.id === id) ? area : null;
                }
                default:
                    return null;
            }
        };
        // Find the tab area for a widget within the main dock area.
        const tabAreaFor = (widget) => {
            var _a;
            const layout = labShell === null || labShell === void 0 ? void 0 : labShell.saveLayout();
            const mainArea = layout === null || layout === void 0 ? void 0 : layout.mainArea;
            if (!mainArea || PageConfig.getOption('mode') !== 'multiple-document') {
                return null;
            }
            const area = (_a = mainArea.dock) === null || _a === void 0 ? void 0 : _a.main;
            if (!area) {
                return null;
            }
            return findTab(area, widget);
        };
        // Returns an array of all widgets to the right of a widget in a tab area.
        const widgetsRightOf = (widget) => {
            const { id } = widget;
            const tabArea = tabAreaFor(widget);
            const widgets = tabArea ? tabArea.widgets || [] : [];
            const index = widgets.findIndex(widget => widget.id === id);
            if (index < 0) {
                return [];
            }
            return widgets.slice(index + 1);
        };
        commands.addCommand(CommandIDs.close, {
            label: () => trans.__('Close Tab'),
            isEnabled: () => {
                const widget = contextMenuWidget();
                return !!widget && widget.title.closable;
            },
            execute: () => {
                const widget = contextMenuWidget();
                if (widget) {
                    widget.close();
                }
            }
        });
        commands.addCommand(CommandIDs.closeOtherTabs, {
            label: () => trans.__('Close All Other Tabs'),
            isEnabled: () => {
                // Ensure there are at least two widgets.
                const iterator = shell.widgets('main');
                return !!iterator.next() && !!iterator.next();
            },
            execute: () => {
                const widget = contextMenuWidget();
                if (!widget) {
                    return;
                }
                const { id } = widget;
                const otherWidgets = toArray(shell.widgets('main')).filter(widget => widget.id !== id);
                closeWidgets(otherWidgets);
            }
        });
        commands.addCommand(CommandIDs.closeRightTabs, {
            label: () => trans.__('Close Tabs to Right'),
            isEnabled: () => !!contextMenuWidget() &&
                widgetsRightOf(contextMenuWidget()).length > 0,
            execute: () => {
                const widget = contextMenuWidget();
                if (!widget) {
                    return;
                }
                closeWidgets(widgetsRightOf(widget));
            }
        });
        if (labShell) {
            commands.addCommand(CommandIDs.activateNextTab, {
                label: trans.__('Activate Next Tab'),
                execute: () => {
                    labShell.activateNextTab();
                }
            });
            commands.addCommand(CommandIDs.activatePreviousTab, {
                label: trans.__('Activate Previous Tab'),
                execute: () => {
                    labShell.activatePreviousTab();
                }
            });
            commands.addCommand(CommandIDs.activateNextTabBar, {
                label: trans.__('Activate Next Tab Bar'),
                execute: () => {
                    labShell.activateNextTabBar();
                }
            });
            commands.addCommand(CommandIDs.activatePreviousTabBar, {
                label: trans.__('Activate Previous Tab Bar'),
                execute: () => {
                    labShell.activatePreviousTabBar();
                }
            });
            commands.addCommand(CommandIDs.closeAll, {
                label: trans.__('Close All Tabs'),
                execute: () => {
                    labShell.closeAll();
                }
            });
            commands.addCommand(CommandIDs.toggleLeftArea, {
                label: () => trans.__('Show Left Sidebar'),
                execute: () => {
                    if (labShell.leftCollapsed) {
                        labShell.expandLeft();
                    }
                    else {
                        labShell.collapseLeft();
                        if (labShell.currentWidget) {
                            labShell.activateById(labShell.currentWidget.id);
                        }
                    }
                },
                isToggled: () => !labShell.leftCollapsed,
                isVisible: () => !labShell.isEmpty('left')
            });
            commands.addCommand(CommandIDs.toggleRightArea, {
                label: () => trans.__('Show Right Sidebar'),
                execute: () => {
                    if (labShell.rightCollapsed) {
                        labShell.expandRight();
                    }
                    else {
                        labShell.collapseRight();
                        if (labShell.currentWidget) {
                            labShell.activateById(labShell.currentWidget.id);
                        }
                    }
                },
                isToggled: () => !labShell.rightCollapsed,
                isVisible: () => !labShell.isEmpty('right')
            });
            commands.addCommand(CommandIDs.togglePresentationMode, {
                label: () => trans.__('Presentation Mode'),
                execute: () => {
                    labShell.presentationMode = !labShell.presentationMode;
                },
                isToggled: () => labShell.presentationMode,
                isVisible: () => true
            });
            commands.addCommand(CommandIDs.setMode, {
                isVisible: args => {
                    const mode = args['mode'];
                    return mode === 'single-document' || mode === 'multiple-document';
                },
                execute: args => {
                    const mode = args['mode'];
                    if (mode === 'single-document' || mode === 'multiple-document') {
                        labShell.mode = mode;
                        return;
                    }
                    throw new Error(`Unsupported application shell mode: ${mode}`);
                }
            });
            commands.addCommand(CommandIDs.toggleMode, {
                label: trans.__('Simple Interface'),
                isToggled: () => labShell.mode === 'single-document',
                execute: () => {
                    const args = labShell.mode === 'multiple-document'
                        ? { mode: 'single-document' }
                        : { mode: 'multiple-document' };
                    return commands.execute(CommandIDs.setMode, args);
                }
            });
        }
        if (palette) {
            [
                CommandIDs.activateNextTab,
                CommandIDs.activatePreviousTab,
                CommandIDs.activateNextTabBar,
                CommandIDs.activatePreviousTabBar,
                CommandIDs.close,
                CommandIDs.closeAll,
                CommandIDs.closeOtherTabs,
                CommandIDs.closeRightTabs,
                CommandIDs.toggleLeftArea,
                CommandIDs.toggleRightArea,
                CommandIDs.togglePresentationMode,
                CommandIDs.toggleMode
            ].forEach(command => palette.addItem({ command, category }));
        }
    }
};
/**
 * The main extension.
 */
const main = {
    id: '@jupyterlab/application-extension:main',
    requires: [
        IRouter,
        IWindowResolver,
        ITranslator,
        JupyterFrontEnd.ITreeResolver
    ],
    optional: [IConnectionLost],
    provides: ITreePathUpdater,
    activate: (app, router, resolver, translator, treeResolver, connectionLost) => {
        const trans = translator.load('jupyterlab');
        if (!(app instanceof JupyterLab)) {
            throw new Error(`${main.id} must be activated in JupyterLab.`);
        }
        // These two internal state variables are used to manage the two source
        // of the tree part of the URL being updated: 1) path of the active document,
        // 2) path of the default browser if the active main area widget isn't a document.
        let _docTreePath = '';
        let _defaultBrowserTreePath = '';
        function updateTreePath(treePath) {
            // Wait for tree resolver to finish before updating the path because it use the PageConfig['treePath']
            void treeResolver.paths.then(() => {
                _defaultBrowserTreePath = treePath;
                if (!_docTreePath) {
                    const url = PageConfig.getUrl({ treePath });
                    const path = URLExt.parse(url).pathname;
                    router.navigate(path, { skipRouting: true });
                    // Persist the new tree path to PageConfig as it is used elsewhere at runtime.
                    PageConfig.setOption('treePath', treePath);
                }
            });
        }
        // Requiring the window resolver guarantees that the application extension
        // only loads if there is a viable window name. Otherwise, the application
        // will short-circuit and ask the user to navigate away.
        const workspace = resolver.name;
        console.debug(`Starting application in workspace: "${workspace}"`);
        // If there were errors registering plugins, tell the user.
        if (app.registerPluginErrors.length !== 0) {
            const body = (React.createElement("pre", null, app.registerPluginErrors.map(e => e.message).join('\n')));
            void showErrorMessage(trans.__('Error Registering Plugins'), {
                message: body
            });
        }
        // If the application shell layout is modified,
        // trigger a refresh of the commands.
        app.shell.layoutModified.connect(() => {
            app.commands.notifyCommandChanged();
        });
        // Watch the mode and update the page URL to /lab or /doc to reflect the
        // change.
        app.shell.modeChanged.connect((_, args) => {
            const url = PageConfig.getUrl({ mode: args });
            const path = URLExt.parse(url).pathname;
            router.navigate(path, { skipRouting: true });
            // Persist this mode change to PageConfig as it is used elsewhere at runtime.
            PageConfig.setOption('mode', args);
        });
        // Wait for tree resolver to finish before updating the path because it use the PageConfig['treePath']
        void treeResolver.paths.then(() => {
            // Watch the path of the current widget in the main area and update the page
            // URL to reflect the change.
            app.shell.currentPathChanged.connect((_, args) => {
                const maybeTreePath = args.newValue;
                const treePath = maybeTreePath || _defaultBrowserTreePath;
                const url = PageConfig.getUrl({ treePath: treePath });
                const path = URLExt.parse(url).pathname;
                router.navigate(path, { skipRouting: true });
                // Persist the new tree path to PageConfig as it is used elsewhere at runtime.
                PageConfig.setOption('treePath', treePath);
                _docTreePath = maybeTreePath;
            });
        });
        // If the connection to the server is lost, handle it with the
        // connection lost handler.
        connectionLost = connectionLost || ConnectionLost;
        app.serviceManager.connectionFailure.connect((manager, error) => connectionLost(manager, error, translator));
        const builder = app.serviceManager.builder;
        const build = () => {
            return builder
                .build()
                .then(() => {
                return showDialog({
                    title: trans.__('Build Complete'),
                    body: (React.createElement("div", null,
                        trans.__('Build successfully completed, reload page?'),
                        React.createElement("br", null),
                        trans.__('You will lose any unsaved changes.'))),
                    buttons: [
                        Dialog.cancelButton({
                            label: trans.__('Reload Without Saving'),
                            actions: ['reload']
                        }),
                        Dialog.okButton({ label: trans.__('Save and Reload') })
                    ],
                    hasClose: true
                });
            })
                .then(({ button: { accept, actions } }) => {
                if (accept) {
                    void app.commands
                        .execute('docmanager:save')
                        .then(() => {
                        router.reload();
                    })
                        .catch(err => {
                        void showErrorMessage(trans.__('Save Failed'), {
                            message: React.createElement("pre", null, err.message)
                        });
                    });
                }
                else if (actions.includes('reload')) {
                    router.reload();
                }
            })
                .catch(err => {
                void showErrorMessage(trans.__('Build Failed'), {
                    message: React.createElement("pre", null, err.message)
                });
            });
        };
        if (builder.isAvailable && builder.shouldCheck) {
            void builder.getStatus().then(response => {
                if (response.status === 'building') {
                    return build();
                }
                if (response.status !== 'needed') {
                    return;
                }
                const body = (React.createElement("div", null,
                    trans.__('JupyterLab build is suggested:'),
                    React.createElement("br", null),
                    React.createElement("pre", null, response.message)));
                void showDialog({
                    title: trans.__('Build Recommended'),
                    body,
                    buttons: [
                        Dialog.cancelButton(),
                        Dialog.okButton({ label: trans.__('Build') })
                    ]
                }).then(result => (result.button.accept ? build() : undefined));
            });
        }
        return updateTreePath;
    },
    autoStart: true
};
/**
 * Plugin to build the context menu from the settings.
 */
const contextMenuPlugin = {
    id: '@jupyterlab/application-extension:context-menu',
    autoStart: true,
    requires: [ISettingRegistry, ITranslator],
    activate: (app, settingRegistry, translator) => {
        const trans = translator.load('jupyterlab');
        function createMenu(options) {
            const menu = new RankedMenu(Object.assign(Object.assign({}, options), { commands: app.commands }));
            if (options.label) {
                menu.title.label = trans.__(options.label);
            }
            return menu;
        }
        // Load the context menu lately so plugins are loaded.
        app.started
            .then(() => {
            return Private.loadSettingsContextMenu(app.contextMenu, settingRegistry, createMenu, translator);
        })
            .catch(reason => {
            console.error('Failed to load context menu items from settings registry.', reason);
        });
    }
};
/**
 * Check if the application is dirty before closing the browser tab.
 */
const dirty = {
    id: '@jupyterlab/application-extension:dirty',
    autoStart: true,
    requires: [ITranslator],
    activate: (app, translator) => {
        if (!(app instanceof JupyterLab)) {
            throw new Error(`${dirty.id} must be activated in JupyterLab.`);
        }
        const trans = translator.load('jupyterlab');
        const message = trans.__('Are you sure you want to exit JupyterLab?\n\nAny unsaved changes will be lost.');
        // The spec for the `beforeunload` event is implemented differently by
        // the different browser vendors. Consequently, the `event.returnValue`
        // attribute needs to set in addition to a return value being returned.
        // For more information, see:
        // https://developer.mozilla.org/en/docs/Web/Events/beforeunload
        window.addEventListener('beforeunload', event => {
            if (app.status.isDirty) {
                return (event.returnValue = message);
            }
        });
    }
};
/**
 * The default layout restorer provider.
 */
const layout = {
    id: '@jupyterlab/application-extension:layout',
    requires: [IStateDB, ILabShell, ISettingRegistry, ITranslator],
    activate: (app, state, labShell, settingRegistry, translator) => {
        const first = app.started;
        const registry = app.commands;
        const restorer = new LayoutRestorer({ connector: state, first, registry });
        void restorer.fetch().then(saved => {
            labShell.restoreLayout(PageConfig.getOption('mode'), saved);
            labShell.layoutModified.connect(() => {
                void restorer.save(labShell.saveLayout());
            });
            Private.activateSidebarSwitcher(app, labShell, settingRegistry, translator, saved);
        });
        return restorer;
    },
    autoStart: true,
    provides: ILayoutRestorer
};
/**
 * The default URL router provider.
 */
const router = {
    id: '@jupyterlab/application-extension:router',
    requires: [JupyterFrontEnd.IPaths],
    activate: (app, paths) => {
        const { commands } = app;
        const base = paths.urls.base;
        const router = new Router({ base, commands });
        void app.started.then(() => {
            // Route the very first request on load.
            void router.route();
            // Route all pop state events.
            window.addEventListener('popstate', () => {
                void router.route();
            });
        });
        return router;
    },
    autoStart: true,
    provides: IRouter
};
/**
 * The default tree route resolver plugin.
 */
const tree = {
    id: '@jupyterlab/application-extension:tree-resolver',
    autoStart: true,
    requires: [IRouter],
    provides: JupyterFrontEnd.ITreeResolver,
    activate: (app, router) => {
        const { commands } = app;
        const set = new DisposableSet();
        const delegate = new PromiseDelegate();
        const treePattern = new RegExp('/(lab|doc)(/workspaces/[a-zA-Z0-9-_]+)?(/tree/.*)?');
        set.add(commands.addCommand(CommandIDs.tree, {
            execute: async (args) => {
                var _a;
                if (set.isDisposed) {
                    return;
                }
                const query = URLExt.queryStringToObject((_a = args.search) !== null && _a !== void 0 ? _a : '');
                const browser = query['file-browser-path'] || '';
                // Remove the file browser path from the query string.
                delete query['file-browser-path'];
                // Clean up artifacts immediately upon routing.
                set.dispose();
                delegate.resolve({ browser, file: PageConfig.getOption('treePath') });
            }
        }));
        set.add(router.register({ command: CommandIDs.tree, pattern: treePattern }));
        // If a route is handled by the router without the tree command being
        // invoked, resolve to `null` and clean up artifacts.
        const listener = () => {
            if (set.isDisposed) {
                return;
            }
            set.dispose();
            delegate.resolve(null);
        };
        router.routed.connect(listener);
        set.add(new DisposableDelegate(() => {
            router.routed.disconnect(listener);
        }));
        return { paths: delegate.promise };
    }
};
/**
 * The default URL not found extension.
 */
const notfound = {
    id: '@jupyterlab/application-extension:notfound',
    requires: [JupyterFrontEnd.IPaths, IRouter, ITranslator],
    activate: (_, paths, router, translator) => {
        const trans = translator.load('jupyterlab');
        const bad = paths.urls.notFound;
        if (!bad) {
            return;
        }
        const base = router.base;
        const message = trans.__('The path: %1 was not found. JupyterLab redirected to: %2', bad, base);
        // Change the URL back to the base application URL.
        router.navigate('');
        void showErrorMessage(trans.__('Path Not Found'), { message });
    },
    autoStart: true
};
/**
 * Change the favicon changing based on the busy status;
 */
const busy = {
    id: '@jupyterlab/application-extension:faviconbusy',
    requires: [ILabStatus],
    activate: async (_, status) => {
        status.busySignal.connect((_, isBusy) => {
            const favicon = document.querySelector(`link[rel="icon"]${isBusy ? '.idle.favicon' : '.busy.favicon'}`);
            if (!favicon) {
                return;
            }
            const newFavicon = document.querySelector(`link${isBusy ? '.busy.favicon' : '.idle.favicon'}`);
            if (!newFavicon) {
                return;
            }
            // If we have the two icons with the special classes, then toggle them.
            if (favicon !== newFavicon) {
                favicon.rel = '';
                newFavicon.rel = 'icon';
                // Firefox doesn't seem to recognize just changing rel, so we also
                // reinsert the link into the DOM.
                newFavicon.parentNode.replaceChild(newFavicon, newFavicon);
            }
        });
    },
    autoStart: true
};
/**
 * The default JupyterLab application shell.
 */
const shell = {
    id: '@jupyterlab/application-extension:shell',
    optional: [ISettingRegistry],
    activate: (app, settingRegistry) => {
        if (!(app.shell instanceof LabShell)) {
            throw new Error(`${shell.id} did not find a LabShell instance.`);
        }
        if (settingRegistry) {
            settingRegistry
                .load(shell.id)
                .then(settings => {
                app.shell.updateConfig(settings.composite);
                settings.changed.connect(() => {
                    app.shell.updateConfig(settings.composite);
                });
            })
                .catch(error => {
                console.error('Failed to load shell settings.', error);
            });
        }
        return app.shell;
    },
    autoStart: true,
    provides: ILabShell
};
/**
 * The default JupyterLab application status provider.
 */
const status = {
    id: '@jupyterlab/application-extension:status',
    activate: (app) => {
        if (!(app instanceof JupyterLab)) {
            throw new Error(`${status.id} must be activated in JupyterLab.`);
        }
        return app.status;
    },
    autoStart: true,
    provides: ILabStatus
};
/**
 * The default JupyterLab application-specific information provider.
 *
 * #### Notes
 * This plugin should only be used by plugins that specifically need to access
 * JupyterLab application information, e.g., listing extensions that have been
 * loaded or deferred within JupyterLab.
 */
const info = {
    id: '@jupyterlab/application-extension:info',
    activate: (app) => {
        if (!(app instanceof JupyterLab)) {
            throw new Error(`${info.id} must be activated in JupyterLab.`);
        }
        return app.info;
    },
    autoStart: true,
    provides: JupyterLab.IInfo
};
/**
 * The default JupyterLab paths dictionary provider.
 */
const paths = {
    id: '@jupyterlab/apputils-extension:paths',
    activate: (app) => {
        if (!(app instanceof JupyterLab)) {
            throw new Error(`${paths.id} must be activated in JupyterLab.`);
        }
        return app.paths;
    },
    autoStart: true,
    provides: JupyterFrontEnd.IPaths
};
/**
 * The default property inspector provider.
 */
const propertyInspector = {
    id: '@jupyterlab/application-extension:property-inspector',
    autoStart: true,
    requires: [ILabShell, ITranslator],
    optional: [ILayoutRestorer],
    provides: IPropertyInspectorProvider,
    activate: (app, labshell, translator, restorer) => {
        const trans = translator.load('jupyterlab');
        const widget = new SideBarPropertyInspectorProvider(labshell, undefined, translator);
        widget.title.icon = buildIcon;
        widget.title.caption = trans.__('Property Inspector');
        widget.id = 'jp-property-inspector';
        labshell.add(widget, 'right', { rank: 100 });
        if (restorer) {
            restorer.add(widget, 'jp-property-inspector');
        }
        return widget;
    }
};
const JupyterLogo = {
    id: '@jupyterlab/application-extension:logo',
    autoStart: true,
    requires: [ILabShell],
    activate: (app, shell) => {
        const logo = new Widget();
        jupyterIcon.element({
            container: logo.node,
            elementPosition: 'center',
            margin: '2px 2px 2px 8px',
            height: 'auto',
            width: '16px'
        });
        logo.id = 'jp-MainLogo';
        shell.add(logo, 'top', { rank: 0 });
    }
};
/**
 * Export the plugins as default.
 */
const plugins = [
    contextMenuPlugin,
    dirty,
    main,
    mainCommands,
    layout,
    router,
    tree,
    notfound,
    busy,
    shell,
    status,
    info,
    paths,
    propertyInspector,
    JupyterLogo
];
export default plugins;
var Private;
(function (Private) {
    async function displayInformation(trans) {
        const result = await showDialog({
            title: trans.__('Information'),
            body: trans.__('Context menu customization has changed. You will need to reload JupyterLab to see the changes.'),
            buttons: [
                Dialog.cancelButton(),
                Dialog.okButton({ label: trans.__('Reload') })
            ]
        });
        if (result.button.accept) {
            location.reload();
        }
    }
    async function loadSettingsContextMenu(contextMenu, registry, menuFactory, translator) {
        var _a;
        const trans = translator.load('jupyterlab');
        const pluginId = contextMenuPlugin.id;
        let canonical = null;
        let loaded = {};
        /**
         * Populate the plugin's schema defaults.
         *
         * We keep track of disabled entries in case the plugin is loaded
         * after the menu initialization.
         */
        function populate(schema) {
            var _a, _b;
            loaded = {};
            const pluginDefaults = Object.keys(registry.plugins)
                .map(plugin => {
                var _a, _b;
                const items = (_b = (_a = registry.plugins[plugin].schema['jupyter.lab.menus']) === null || _a === void 0 ? void 0 : _a.context) !== null && _b !== void 0 ? _b : [];
                loaded[plugin] = items;
                return items;
            })
                .concat([(_b = (_a = schema['jupyter.lab.menus']) === null || _a === void 0 ? void 0 : _a.context) !== null && _b !== void 0 ? _b : []])
                .reduceRight((acc, val) => SettingRegistry.reconcileItems(acc, val, true), []);
            // Apply default value as last step to take into account overrides.json
            // The standard default being [] as the plugin must use `jupyter.lab.menus.context`
            // to define their default value.
            schema.properties.contextMenu.default = SettingRegistry.reconcileItems(pluginDefaults, schema.properties.contextMenu.default, true)
                // flatten one level
                .sort((a, b) => { var _a, _b; return ((_a = a.rank) !== null && _a !== void 0 ? _a : Infinity) - ((_b = b.rank) !== null && _b !== void 0 ? _b : Infinity); });
        }
        // Transform the plugin object to return different schema than the default.
        registry.transform(pluginId, {
            compose: plugin => {
                var _a, _b, _c, _d;
                // Only override the canonical schema the first time.
                if (!canonical) {
                    canonical = JSONExt.deepCopy(plugin.schema);
                    populate(canonical);
                }
                const defaults = (_c = (_b = (_a = canonical.properties) === null || _a === void 0 ? void 0 : _a.contextMenu) === null || _b === void 0 ? void 0 : _b.default) !== null && _c !== void 0 ? _c : [];
                const user = Object.assign(Object.assign({}, plugin.data.user), { contextMenu: (_d = plugin.data.user.contextMenu) !== null && _d !== void 0 ? _d : [] });
                const composite = Object.assign(Object.assign({}, plugin.data.composite), { contextMenu: SettingRegistry.reconcileItems(defaults, user.contextMenu, false) });
                plugin.data = { composite, user };
                return plugin;
            },
            fetch: plugin => {
                // Only override the canonical schema the first time.
                if (!canonical) {
                    canonical = JSONExt.deepCopy(plugin.schema);
                    populate(canonical);
                }
                return {
                    data: plugin.data,
                    id: plugin.id,
                    raw: plugin.raw,
                    schema: canonical,
                    version: plugin.version
                };
            }
        });
        // Repopulate the canonical variable after the setting registry has
        // preloaded all initial plugins.
        const settings = await registry.load(pluginId);
        const contextItems = (_a = settings.composite.contextMenu) !== null && _a !== void 0 ? _a : [];
        // Create menu item for non-disabled element
        SettingRegistry.filterDisabledItems(contextItems).forEach(item => {
            MenuFactory.addContextItem(Object.assign({ 
                // We have to set the default rank because Lumino is sorting the visible items
                rank: DEFAULT_CONTEXT_ITEM_RANK }, item), contextMenu, menuFactory);
        });
        settings.changed.connect(() => {
            var _a;
            // As extension may change the context menu through API,
            // prompt the user to reload if the menu has been updated.
            const newItems = (_a = settings.composite.contextMenu) !== null && _a !== void 0 ? _a : [];
            if (!JSONExt.deepEqual(contextItems, newItems)) {
                void displayInformation(trans);
            }
        });
        registry.pluginChanged.connect(async (sender, plugin) => {
            var _a, _b, _c, _d;
            if (plugin !== pluginId) {
                // If the plugin changed its menu.
                const oldItems = (_a = loaded[plugin]) !== null && _a !== void 0 ? _a : [];
                const newItems = (_c = (_b = registry.plugins[plugin].schema['jupyter.lab.menus']) === null || _b === void 0 ? void 0 : _b.context) !== null && _c !== void 0 ? _c : [];
                if (!JSONExt.deepEqual(oldItems, newItems)) {
                    if (loaded[plugin]) {
                        // The plugin has changed, request the user to reload the UI
                        await displayInformation(trans);
                    }
                    else {
                        // The plugin was not yet loaded when the menu was built => update the menu
                        loaded[plugin] = JSONExt.deepCopy(newItems);
                        // Merge potential disabled state
                        const toAdd = (_d = SettingRegistry.reconcileItems(newItems, contextItems, false, false)) !== null && _d !== void 0 ? _d : [];
                        SettingRegistry.filterDisabledItems(toAdd).forEach(item => {
                            MenuFactory.addContextItem(Object.assign({ 
                                // We have to set the default rank because Lumino is sorting the visible items
                                rank: DEFAULT_CONTEXT_ITEM_RANK }, item), contextMenu, menuFactory);
                        });
                    }
                }
            }
        });
    }
    Private.loadSettingsContextMenu = loadSettingsContextMenu;
    function activateSidebarSwitcher(app, labShell, settingRegistry, translator, initial) {
        const setting = '@jupyterlab/application-extension:sidebar';
        const trans = translator.load('jupyterlab');
        let overrides = {};
        const update = (_, layout) => {
            each(labShell.widgets('left'), widget => {
                var _a;
                if (overrides[widget.id] && overrides[widget.id] === 'right') {
                    labShell.add(widget, 'right');
                    if (layout && ((_a = layout.rightArea) === null || _a === void 0 ? void 0 : _a.currentWidget) === widget) {
                        labShell.activateById(widget.id);
                    }
                }
            });
            each(labShell.widgets('right'), widget => {
                var _a;
                if (overrides[widget.id] && overrides[widget.id] === 'left') {
                    labShell.add(widget, 'left');
                    if (layout && ((_a = layout.leftArea) === null || _a === void 0 ? void 0 : _a.currentWidget) === widget) {
                        labShell.activateById(widget.id);
                    }
                }
            });
        };
        // Fetch overrides from the settings system.
        void Promise.all([settingRegistry.load(setting), app.restored]).then(([settings]) => {
            overrides = (settings.get('overrides').composite ||
                {});
            settings.changed.connect(settings => {
                overrides = (settings.get('overrides').composite ||
                    {});
                update(labShell);
            });
            labShell.layoutModified.connect(update);
            update(labShell, initial);
        });
        // Add a command to switch a side panels's side
        app.commands.addCommand(CommandIDs.switchSidebar, {
            label: trans.__('Switch Sidebar Side'),
            execute: () => {
                // First, try to find the correct panel based on the application
                // context menu click. Bail if we don't find a sidebar for the widget.
                const contextNode = app.contextMenuHitTest(node => !!node.dataset.id);
                if (!contextNode) {
                    return;
                }
                const id = contextNode.dataset['id'];
                const leftPanel = document.getElementById('jp-left-stack');
                const node = document.getElementById(id);
                let side;
                if (leftPanel && node && leftPanel.contains(node)) {
                    side = 'right';
                }
                else {
                    side = 'left';
                }
                // Move the panel to the other side.
                return settingRegistry.set(setting, 'overrides', Object.assign(Object.assign({}, overrides), { [id]: side }));
            }
        });
    }
    Private.activateSidebarSwitcher = activateSidebarSwitcher;
})(Private || (Private = {}));
//# sourceMappingURL=index.js.map