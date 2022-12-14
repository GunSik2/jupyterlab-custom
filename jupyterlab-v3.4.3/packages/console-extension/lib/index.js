// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/**
 * @packageDocumentation
 * @module console-extension
 */
import { ILabStatus, ILayoutRestorer } from '@jupyterlab/application';
import { Dialog, ICommandPalette, ISessionContextDialogs, sessionContextDialogs, showDialog, WidgetTracker } from '@jupyterlab/apputils';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { ConsolePanel, IConsoleTracker } from '@jupyterlab/console';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { ILauncher } from '@jupyterlab/launcher';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITranslator } from '@jupyterlab/translation';
import { consoleIcon } from '@jupyterlab/ui-components';
import { find } from '@lumino/algorithm';
import { JSONExt, UUID } from '@lumino/coreutils';
import { DisposableSet } from '@lumino/disposable';
import foreign from './foreign';
/**
 * The command IDs used by the console plugin.
 */
var CommandIDs;
(function (CommandIDs) {
    CommandIDs.autoClosingBrackets = 'console:toggle-autoclosing-brackets';
    CommandIDs.create = 'console:create';
    CommandIDs.clear = 'console:clear';
    CommandIDs.runUnforced = 'console:run-unforced';
    CommandIDs.runForced = 'console:run-forced';
    CommandIDs.linebreak = 'console:linebreak';
    CommandIDs.interrupt = 'console:interrupt-kernel';
    CommandIDs.restart = 'console:restart-kernel';
    CommandIDs.closeAndShutdown = 'console:close-and-shutdown';
    CommandIDs.open = 'console:open';
    CommandIDs.inject = 'console:inject';
    CommandIDs.changeKernel = 'console:change-kernel';
    CommandIDs.enterToExecute = 'console:enter-to-execute';
    CommandIDs.shiftEnterToExecute = 'console:shift-enter-to-execute';
    CommandIDs.interactionMode = 'console:interaction-mode';
    CommandIDs.replaceSelection = 'console:replace-selection';
})(CommandIDs || (CommandIDs = {}));
/**
 * The console widget tracker provider.
 */
const tracker = {
    id: '@jupyterlab/console-extension:tracker',
    provides: IConsoleTracker,
    requires: [
        ConsolePanel.IContentFactory,
        IEditorServices,
        IRenderMimeRegistry,
        ISettingRegistry,
        ITranslator
    ],
    optional: [
        ILayoutRestorer,
        IFileBrowserFactory,
        IMainMenu,
        ICommandPalette,
        ILauncher,
        ILabStatus,
        ISessionContextDialogs
    ],
    activate: activateConsole,
    autoStart: true
};
/**
 * The console widget content factory.
 */
const factory = {
    id: '@jupyterlab/console-extension:factory',
    provides: ConsolePanel.IContentFactory,
    requires: [IEditorServices],
    autoStart: true,
    activate: (app, editorServices) => {
        const editorFactory = editorServices.factoryService.newInlineEditor;
        return new ConsolePanel.ContentFactory({ editorFactory });
    }
};
/**
 * Export the plugins as the default.
 */
const plugins = [factory, tracker, foreign];
export default plugins;
/**
 * Activate the console extension.
 */
async function activateConsole(app, contentFactory, editorServices, rendermime, settingRegistry, translator, restorer, browserFactory, mainMenu, palette, launcher, status, sessionDialogs) {
    const trans = translator.load('jupyterlab');
    const manager = app.serviceManager;
    const { commands, shell } = app;
    const category = trans.__('Console');
    sessionDialogs = sessionDialogs !== null && sessionDialogs !== void 0 ? sessionDialogs : sessionContextDialogs;
    // Create a widget tracker for all console panels.
    const tracker = new WidgetTracker({
        namespace: 'console'
    });
    // Handle state restoration.
    if (restorer) {
        void restorer.restore(tracker, {
            command: CommandIDs.create,
            args: widget => {
                const { path, name, kernelPreference } = widget.console.sessionContext;
                return {
                    path,
                    name,
                    kernelPreference: Object.assign({}, kernelPreference)
                };
            },
            name: widget => { var _a; return (_a = widget.console.sessionContext.path) !== null && _a !== void 0 ? _a : UUID.uuid4(); },
            when: manager.ready
        });
    }
    // Add a launcher item if the launcher is available.
    if (launcher) {
        void manager.ready.then(() => {
            let disposables = null;
            const onSpecsChanged = () => {
                if (disposables) {
                    disposables.dispose();
                    disposables = null;
                }
                const specs = manager.kernelspecs.specs;
                if (!specs) {
                    return;
                }
                disposables = new DisposableSet();
                for (const name in specs.kernelspecs) {
                    const rank = name === specs.default ? 0 : Infinity;
                    const spec = specs.kernelspecs[name];
                    let kernelIconUrl = spec.resources['logo-64x64'];
                    disposables.add(launcher.add({
                        command: CommandIDs.create,
                        args: { isLauncher: true, kernelPreference: { name } },
                        category: trans.__('Console'),
                        rank,
                        kernelIconUrl,
                        metadata: {
                            kernel: JSONExt.deepCopy(spec.metadata || {})
                        }
                    }));
                }
            };
            onSpecsChanged();
            manager.kernelspecs.specsChanged.connect(onSpecsChanged);
        });
    }
    /**
     * Create a console for a given path.
     */
    async function createConsole(options) {
        var _a;
        await manager.ready;
        const panel = new ConsolePanel(Object.assign({ manager,
            contentFactory, mimeTypeService: editorServices.mimeTypeService, rendermime,
            translator, setBusy: (_a = (status && (() => status.setBusy()))) !== null && _a !== void 0 ? _a : undefined }, options));
        const interactionMode = (await settingRegistry.get('@jupyterlab/console-extension:tracker', 'interactionMode')).composite;
        panel.console.node.dataset.jpInteractionMode = interactionMode;
        // Add the console panel to the tracker. We want the panel to show up before
        // any kernel selection dialog, so we do not await panel.session.ready;
        await tracker.add(panel);
        panel.sessionContext.propertyChanged.connect(() => {
            void tracker.save(panel);
        });
        shell.add(panel, 'main', {
            ref: options.ref,
            mode: options.insertMode,
            activate: options.activate !== false
        });
        return panel;
    }
    const mapOption = (editor, config, option) => {
        if (config[option] === undefined) {
            return;
        }
        switch (option) {
            case 'autoClosingBrackets':
                editor.setOption('autoClosingBrackets', config['autoClosingBrackets']);
                break;
            case 'cursorBlinkRate':
                editor.setOption('cursorBlinkRate', config['cursorBlinkRate']);
                break;
            case 'fontFamily':
                editor.setOption('fontFamily', config['fontFamily']);
                break;
            case 'fontSize':
                editor.setOption('fontSize', config['fontSize']);
                break;
            case 'lineHeight':
                editor.setOption('lineHeight', config['lineHeight']);
                break;
            case 'lineNumbers':
                editor.setOption('lineNumbers', config['lineNumbers']);
                break;
            case 'lineWrap':
                editor.setOption('lineWrap', config['lineWrap']);
                break;
            case 'matchBrackets':
                editor.setOption('matchBrackets', config['matchBrackets']);
                break;
            case 'readOnly':
                editor.setOption('readOnly', config['readOnly']);
                break;
            case 'insertSpaces':
                editor.setOption('insertSpaces', config['insertSpaces']);
                break;
            case 'tabSize':
                editor.setOption('tabSize', config['tabSize']);
                break;
            case 'wordWrapColumn':
                editor.setOption('wordWrapColumn', config['wordWrapColumn']);
                break;
            case 'rulers':
                editor.setOption('rulers', config['rulers']);
                break;
            case 'codeFolding':
                editor.setOption('codeFolding', config['codeFolding']);
                break;
        }
    };
    const setOption = (editor, config) => {
        if (editor === undefined) {
            return;
        }
        mapOption(editor, config, 'autoClosingBrackets');
        mapOption(editor, config, 'cursorBlinkRate');
        mapOption(editor, config, 'fontFamily');
        mapOption(editor, config, 'fontSize');
        mapOption(editor, config, 'lineHeight');
        mapOption(editor, config, 'lineNumbers');
        mapOption(editor, config, 'lineWrap');
        mapOption(editor, config, 'matchBrackets');
        mapOption(editor, config, 'readOnly');
        mapOption(editor, config, 'insertSpaces');
        mapOption(editor, config, 'tabSize');
        mapOption(editor, config, 'wordWrapColumn');
        mapOption(editor, config, 'rulers');
        mapOption(editor, config, 'codeFolding');
    };
    const pluginId = '@jupyterlab/console-extension:tracker';
    let interactionMode;
    let promptCellConfig;
    /**
     * Update settings for one console or all consoles.
     *
     * @param panel Optional - single console to update.
     */
    async function updateSettings(panel) {
        interactionMode = (await settingRegistry.get(pluginId, 'interactionMode'))
            .composite;
        promptCellConfig = (await settingRegistry.get(pluginId, 'promptCellConfig'))
            .composite;
        const setWidgetOptions = (widget) => {
            var _a;
            widget.console.node.dataset.jpInteractionMode = interactionMode;
            // Update future promptCells
            widget.console.editorConfig = promptCellConfig;
            // Update promptCell already on screen
            setOption((_a = widget.console.promptCell) === null || _a === void 0 ? void 0 : _a.editor, promptCellConfig);
        };
        if (panel) {
            setWidgetOptions(panel);
        }
        else {
            tracker.forEach(setWidgetOptions);
        }
    }
    settingRegistry.pluginChanged.connect((sender, plugin) => {
        if (plugin === pluginId) {
            void updateSettings();
        }
    });
    await updateSettings();
    // Apply settings when a console is created.
    tracker.widgetAdded.connect((sender, panel) => {
        void updateSettings(panel);
    });
    commands.addCommand(CommandIDs.autoClosingBrackets, {
        execute: async (args) => {
            var _a;
            promptCellConfig.autoClosingBrackets = !!((_a = args['force']) !== null && _a !== void 0 ? _a : !promptCellConfig.autoClosingBrackets);
            await settingRegistry.set(pluginId, 'promptCellConfig', promptCellConfig);
        },
        label: trans.__('Auto Close Brackets for Code Console Prompt'),
        isToggled: () => promptCellConfig.autoClosingBrackets
    });
    /**
     * Whether there is an active console.
     */
    function isEnabled() {
        return (tracker.currentWidget !== null &&
            tracker.currentWidget === shell.currentWidget);
    }
    let command = CommandIDs.open;
    commands.addCommand(command, {
        execute: (args) => {
            const path = args['path'];
            const widget = tracker.find(value => {
                var _a;
                return ((_a = value.console.sessionContext.session) === null || _a === void 0 ? void 0 : _a.path) === path;
            });
            if (widget) {
                if (args.activate !== false) {
                    shell.activateById(widget.id);
                }
                return widget;
            }
            else {
                return manager.ready.then(() => {
                    const model = find(manager.sessions.running(), item => {
                        return item.path === path;
                    });
                    if (model) {
                        return createConsole(args);
                    }
                    return Promise.reject(`No running kernel session for path: ${path}`);
                });
            }
        }
    });
    command = CommandIDs.create;
    commands.addCommand(command, {
        label: args => {
            var _a, _b, _c, _d;
            if (args['isPalette']) {
                return trans.__('New Console');
            }
            else if (args['isLauncher'] && args['kernelPreference']) {
                const kernelPreference = args['kernelPreference'];
                // TODO: Lumino command functions should probably be allowed to return undefined?
                return ((_d = (_c = (_b = (_a = manager.kernelspecs) === null || _a === void 0 ? void 0 : _a.specs) === null || _b === void 0 ? void 0 : _b.kernelspecs[kernelPreference.name || '']) === null || _c === void 0 ? void 0 : _c.display_name) !== null && _d !== void 0 ? _d : '');
            }
            return trans.__('Console');
        },
        icon: args => (args['isPalette'] ? undefined : consoleIcon),
        execute: args => {
            var _a;
            const basePath = (_a = (args['basePath'] ||
                args['cwd'] || (browserFactory === null || browserFactory === void 0 ? void 0 : browserFactory.defaultBrowser.model.path))) !== null && _a !== void 0 ? _a : '';
            return createConsole(Object.assign({ basePath }, args));
        }
    });
    // Get the current widget and activate unless the args specify otherwise.
    function getCurrent(args) {
        const widget = tracker.currentWidget;
        const activate = args['activate'] !== false;
        if (activate && widget) {
            shell.activateById(widget.id);
        }
        return widget !== null && widget !== void 0 ? widget : null;
    }
    commands.addCommand(CommandIDs.clear, {
        label: trans.__('Clear Console Cells'),
        execute: args => {
            const current = getCurrent(args);
            if (!current) {
                return;
            }
            current.console.clear();
        },
        isEnabled
    });
    commands.addCommand(CommandIDs.runUnforced, {
        label: trans.__('Run Cell (unforced)'),
        execute: args => {
            const current = getCurrent(args);
            if (!current) {
                return;
            }
            return current.console.execute();
        },
        isEnabled
    });
    commands.addCommand(CommandIDs.runForced, {
        label: trans.__('Run Cell (forced)'),
        execute: args => {
            const current = getCurrent(args);
            if (!current) {
                return;
            }
            return current.console.execute(true);
        },
        isEnabled
    });
    commands.addCommand(CommandIDs.linebreak, {
        label: trans.__('Insert Line Break'),
        execute: args => {
            const current = getCurrent(args);
            if (!current) {
                return;
            }
            current.console.insertLinebreak();
        },
        isEnabled
    });
    commands.addCommand(CommandIDs.replaceSelection, {
        label: trans.__('Replace Selection in Console'),
        execute: args => {
            const current = getCurrent(args);
            if (!current) {
                return;
            }
            const text = args['text'] || '';
            current.console.replaceSelection(text);
        },
        isEnabled
    });
    commands.addCommand(CommandIDs.interrupt, {
        label: trans.__('Interrupt Kernel'),
        execute: args => {
            var _a;
            const current = getCurrent(args);
            if (!current) {
                return;
            }
            const kernel = (_a = current.console.sessionContext.session) === null || _a === void 0 ? void 0 : _a.kernel;
            if (kernel) {
                return kernel.interrupt();
            }
        },
        isEnabled
    });
    commands.addCommand(CommandIDs.restart, {
        label: trans.__('Restart Kernel???'),
        execute: args => {
            const current = getCurrent(args);
            if (!current) {
                return;
            }
            return sessionDialogs.restart(current.console.sessionContext, translator);
        },
        isEnabled
    });
    commands.addCommand(CommandIDs.closeAndShutdown, {
        label: trans.__('Close and Shut Down???'),
        execute: args => {
            const current = getCurrent(args);
            if (!current) {
                return;
            }
            return showDialog({
                title: trans.__('Shut down the console?'),
                body: trans.__('Are you sure you want to close "%1"?', current.title.label),
                buttons: [Dialog.cancelButton(), Dialog.warnButton()]
            }).then(result => {
                if (result.button.accept) {
                    return current.console.sessionContext.shutdown().then(() => {
                        current.dispose();
                        return true;
                    });
                }
                else {
                    return false;
                }
            });
        },
        isEnabled
    });
    commands.addCommand(CommandIDs.inject, {
        execute: args => {
            const path = args['path'];
            tracker.find(widget => {
                var _a;
                if (((_a = widget.console.sessionContext.session) === null || _a === void 0 ? void 0 : _a.path) === path) {
                    if (args['activate'] !== false) {
                        shell.activateById(widget.id);
                    }
                    void widget.console.inject(args['code'], args['metadata']);
                    return true;
                }
                return false;
            });
        },
        isEnabled
    });
    commands.addCommand(CommandIDs.changeKernel, {
        label: trans.__('Change Kernel???'),
        execute: args => {
            const current = getCurrent(args);
            if (!current) {
                return;
            }
            return sessionDialogs.selectKernel(current.console.sessionContext, translator);
        },
        isEnabled
    });
    if (palette) {
        // Add command palette items
        [
            CommandIDs.create,
            CommandIDs.linebreak,
            CommandIDs.clear,
            CommandIDs.runUnforced,
            CommandIDs.runForced,
            CommandIDs.restart,
            CommandIDs.interrupt,
            CommandIDs.changeKernel,
            CommandIDs.closeAndShutdown
        ].forEach(command => {
            palette.addItem({ command, category, args: { isPalette: true } });
        });
    }
    if (mainMenu) {
        // Add a close and shutdown command to the file menu.
        mainMenu.fileMenu.closeAndCleaners.add({
            tracker,
            closeAndCleanupLabel: (n) => trans.__('Shutdown Console'),
            closeAndCleanup: (current) => {
                return showDialog({
                    title: trans.__('Shut down the Console?'),
                    body: trans.__('Are you sure you want to close "%1"?', current.title.label),
                    buttons: [Dialog.cancelButton(), Dialog.warnButton()]
                }).then(result => {
                    if (result.button.accept) {
                        return current.console.sessionContext.shutdown().then(() => {
                            current.dispose();
                        });
                    }
                    else {
                        return void 0;
                    }
                });
            }
        });
        // Add a kernel user to the Kernel menu
        mainMenu.kernelMenu.kernelUsers.add({
            tracker,
            restartKernelAndClearLabel: n => trans.__('Restart Kernel and Clear Console'),
            interruptKernel: current => {
                var _a;
                const kernel = (_a = current.console.sessionContext.session) === null || _a === void 0 ? void 0 : _a.kernel;
                if (kernel) {
                    return kernel.interrupt();
                }
                return Promise.resolve(void 0);
            },
            restartKernel: current => sessionDialogs.restart(current.console.sessionContext, translator),
            restartKernelAndClear: current => {
                return sessionDialogs
                    .restart(current.console.sessionContext)
                    .then(restarted => {
                    if (restarted) {
                        current.console.clear();
                    }
                    return restarted;
                });
            },
            changeKernel: current => sessionDialogs.selectKernel(current.console.sessionContext, translator),
            shutdownKernel: current => current.console.sessionContext.shutdown()
        });
        // Add a code runner to the Run menu.
        mainMenu.runMenu.codeRunners.add({
            tracker,
            runLabel: (n) => trans.__('Run Cell'),
            run: current => current.console.execute(true)
        });
        // Add a clearer to the edit menu
        mainMenu.editMenu.clearers.add({
            tracker,
            clearCurrentLabel: (n) => trans.__('Clear Console Cell'),
            clearCurrent: (current) => {
                return current.console.clear();
            }
        });
    }
    // For backwards compatibility and clarity, we explicitly label the run
    // keystroke with the actual effected change, rather than the generic
    // "notebook" or "terminal" interaction mode. When this interaction mode
    // affects more than just the run keystroke, we can make this menu title more
    // generic.
    const runShortcutTitles = {
        notebook: trans.__('Execute with Shift+Enter'),
        terminal: trans.__('Execute with Enter')
    };
    // Add the execute keystroke setting submenu.
    commands.addCommand(CommandIDs.interactionMode, {
        label: args => runShortcutTitles[args['interactionMode']] || '',
        execute: async (args) => {
            const key = 'keyMap';
            try {
                await settingRegistry.set(pluginId, 'interactionMode', args['interactionMode']);
            }
            catch (reason) {
                console.error(`Failed to set ${pluginId}:${key} - ${reason.message}`);
            }
        },
        isToggled: args => args['interactionMode'] === interactionMode
    });
    if (mainMenu) {
        // Add kernel information to the application help menu.
        mainMenu.helpMenu.kernelUsers.add({
            tracker,
            getKernel: current => { var _a; return (_a = current.sessionContext.session) === null || _a === void 0 ? void 0 : _a.kernel; }
        });
    }
    return tracker;
}
//# sourceMappingURL=index.js.map