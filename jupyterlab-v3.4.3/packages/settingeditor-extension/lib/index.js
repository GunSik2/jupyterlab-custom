/* -----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
/**
 * @packageDocumentation
 * @module settingeditor-extension
 */
import { ILabStatus, ILayoutRestorer } from '@jupyterlab/application';
import { CommandToolbarButton, ICommandPalette, MainAreaWidget, Toolbar, WidgetTracker } from '@jupyterlab/apputils';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { IFormComponentRegistry, launchIcon } from '@jupyterlab/ui-components';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { IJSONSettingEditorTracker, ISettingEditorTracker } from '@jupyterlab/settingeditor/lib/tokens';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { IStateDB } from '@jupyterlab/statedb';
import { ITranslator } from '@jupyterlab/translation';
import { saveIcon, settingsIcon, undoIcon } from '@jupyterlab/ui-components';
/**
 * The command IDs used by the setting editor.
 */
var CommandIDs;
(function (CommandIDs) {
    CommandIDs.open = 'settingeditor:open';
    CommandIDs.openJSON = 'settingeditor:open-json';
    CommandIDs.revert = 'settingeditor:revert';
    CommandIDs.save = 'settingeditor:save';
})(CommandIDs || (CommandIDs = {}));
/**
 * The default setting editor extension.
 */
const plugin = {
    id: '@jupyterlab/settingeditor-extension:form-ui',
    requires: [
        ISettingRegistry,
        IStateDB,
        ITranslator,
        IFormComponentRegistry,
        ILabStatus
    ],
    optional: [ILayoutRestorer, ICommandPalette, IJSONSettingEditorTracker],
    autoStart: true,
    provides: ISettingEditorTracker,
    activate
};
/**
 * Activate the setting editor extension.
 */
function activate(app, registry, state, translator, editorRegistry, status, restorer, palette, jsonEditor) {
    const trans = translator.load('jupyterlab');
    const { commands, shell } = app;
    const namespace = 'setting-editor';
    const tracker = new WidgetTracker({
        namespace
    });
    // Handle state restoration.
    if (restorer) {
        void restorer.restore(tracker, {
            command: CommandIDs.open,
            args: widget => ({}),
            name: widget => namespace
        });
    }
    const openUi = async (args) => {
        if (tracker.currentWidget && !tracker.currentWidget.isDisposed) {
            if (!tracker.currentWidget.isAttached) {
                shell.add(tracker.currentWidget);
            }
            shell.activateById(tracker.currentWidget.id);
            return;
        }
        const key = plugin.id;
        const { SettingsEditor } = await import('@jupyterlab/settingeditor');
        const editor = new MainAreaWidget({
            content: new SettingsEditor({
                editorRegistry,
                key,
                registry,
                state,
                commands,
                toSkip: [
                    '@jupyterlab/application-extension:context-menu',
                    '@jupyterlab/mainmenu-extension:plugin'
                ],
                translator,
                status,
                query: args.query
            })
        });
        if (jsonEditor) {
            editor.toolbar.addItem('spacer', Toolbar.createSpacerItem());
            editor.toolbar.addItem('open-json-editor', new CommandToolbarButton({
                commands,
                id: CommandIDs.openJSON,
                icon: launchIcon,
                label: trans.__('JSON Settings Editor')
            }));
        }
        editor.id = namespace;
        editor.title.icon = settingsIcon;
        editor.title.label = trans.__('Settings');
        editor.title.closable = true;
        void tracker.add(editor);
        shell.add(editor);
    };
    commands.addCommand(CommandIDs.open, {
        execute: async (args) => {
            registry.load(plugin.id).then(settings => {
                var _a, _b;
                ((_a = args.settingEditorType) !== null && _a !== void 0 ? _a : settings.get('settingEditorType').composite ===
                    'json') ? commands.execute(CommandIDs.openJSON)
                    : openUi({ query: (_b = args.query) !== null && _b !== void 0 ? _b : '' });
            });
        },
        label: args => {
            if (args.label) {
                return args.label;
            }
            return trans.__('Advanced Settings Editor');
        }
    });
    if (palette) {
        palette.addItem({
            category: trans.__('Settings'),
            command: CommandIDs.open,
            args: { settingEditorType: 'ui' }
        });
    }
    return tracker;
}
/**
 * The default setting editor extension.
 */
const jsonPlugin = {
    id: '@jupyterlab/settingeditor-extension:plugin',
    requires: [
        ISettingRegistry,
        IEditorServices,
        IStateDB,
        IRenderMimeRegistry,
        ILabStatus,
        ITranslator
    ],
    optional: [ILayoutRestorer, ICommandPalette],
    autoStart: true,
    provides: IJSONSettingEditorTracker,
    activate: activateJSON
};
/**
 * Activate the setting editor extension.
 */
function activateJSON(app, registry, editorServices, state, rendermime, status, translator, restorer, palette) {
    const trans = translator.load('jupyterlab');
    const { commands, shell } = app;
    const namespace = 'json-setting-editor';
    const factoryService = editorServices.factoryService;
    const editorFactory = factoryService.newInlineEditor;
    const tracker = new WidgetTracker({
        namespace
    });
    // Handle state restoration.
    if (restorer) {
        void restorer.restore(tracker, {
            command: CommandIDs.openJSON,
            args: widget => ({}),
            name: widget => namespace
        });
    }
    commands.addCommand(CommandIDs.openJSON, {
        execute: async () => {
            if (tracker.currentWidget && !tracker.currentWidget.isDisposed) {
                if (!tracker.currentWidget.isAttached) {
                    shell.add(tracker.currentWidget);
                }
                shell.activateById(tracker.currentWidget.id);
                return;
            }
            const key = plugin.id;
            const when = app.restored;
            const { JsonSettingEditor } = await import('@jupyterlab/settingeditor');
            const editor = new JsonSettingEditor({
                commands: {
                    registry: commands,
                    revert: CommandIDs.revert,
                    save: CommandIDs.save
                },
                editorFactory,
                key,
                registry,
                rendermime,
                state,
                translator,
                when
            });
            let disposable = null;
            // Notify the command registry when the visibility status of the setting
            // editor's commands change. The setting editor toolbar listens for this
            // signal from the command registry.
            editor.commandsChanged.connect((sender, args) => {
                args.forEach(id => {
                    commands.notifyCommandChanged(id);
                });
                if (editor.canSaveRaw) {
                    if (!disposable) {
                        disposable = status.setDirty();
                    }
                }
                else if (disposable) {
                    disposable.dispose();
                    disposable = null;
                }
                editor.disposed.connect(() => {
                    if (disposable) {
                        disposable.dispose();
                    }
                });
            });
            const container = new MainAreaWidget({
                content: editor
            });
            container.id = namespace;
            container.title.icon = settingsIcon;
            container.title.label = trans.__('Advanced Settings Editor');
            container.title.closable = true;
            void tracker.add(container);
            shell.add(container);
        },
        label: trans.__('Advanced JSON Settings Editor')
    });
    if (palette) {
        palette.addItem({
            category: trans.__('Settings'),
            command: CommandIDs.openJSON
        });
    }
    commands.addCommand(CommandIDs.revert, {
        execute: () => {
            var _a;
            (_a = tracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content.revert();
        },
        icon: undoIcon,
        label: trans.__('Revert User Settings'),
        isEnabled: () => { var _a, _b; return (_b = (_a = tracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content.canRevertRaw) !== null && _b !== void 0 ? _b : false; }
    });
    commands.addCommand(CommandIDs.save, {
        execute: () => { var _a; return (_a = tracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content.save(); },
        icon: saveIcon,
        label: trans.__('Save User Settings'),
        isEnabled: () => { var _a, _b; return (_b = (_a = tracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content.canSaveRaw) !== null && _b !== void 0 ? _b : false; }
    });
    return tracker;
}
export default [plugin, jsonPlugin];
//# sourceMappingURL=index.js.map