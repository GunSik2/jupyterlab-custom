// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/**
 * @packageDocumentation
 * @module tooltip-extension
 */
import { IConsoleTracker } from '@jupyterlab/console';
import { Text } from '@jupyterlab/coreutils';
import { IEditorTracker } from '@jupyterlab/fileeditor';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ITooltipManager, Tooltip } from '@jupyterlab/tooltip';
import { find, toArray } from '@lumino/algorithm';
import { Widget } from '@lumino/widgets';
/**
 * The command IDs used by the tooltip plugin.
 */
var CommandIDs;
(function (CommandIDs) {
    CommandIDs.dismiss = 'tooltip:dismiss';
    CommandIDs.launchConsole = 'tooltip:launch-console';
    CommandIDs.launchNotebook = 'tooltip:launch-notebook';
    CommandIDs.launchFile = 'tooltip:launch-file';
})(CommandIDs || (CommandIDs = {}));
/**
 * The main tooltip manager plugin.
 */
const manager = {
    id: '@jupyterlab/tooltip-extension:manager',
    autoStart: true,
    provides: ITooltipManager,
    activate: (app) => {
        let tooltip = null;
        // Add tooltip dismiss command.
        app.commands.addCommand(CommandIDs.dismiss, {
            execute: () => {
                if (tooltip) {
                    tooltip.dispose();
                    tooltip = null;
                }
            }
        });
        return {
            invoke(options) {
                const detail = 0;
                const { anchor, editor, kernel, rendermime } = options;
                if (tooltip) {
                    tooltip.dispose();
                    tooltip = null;
                }
                return Private.fetch({ detail, editor, kernel })
                    .then(bundle => {
                    tooltip = new Tooltip({ anchor, bundle, editor, rendermime });
                    Widget.attach(tooltip, document.body);
                })
                    .catch(() => {
                    /* Fails silently. */
                });
            }
        };
    }
};
/**
 * The console tooltip plugin.
 */
const consoles = {
    id: '@jupyterlab/tooltip-extension:consoles',
    autoStart: true,
    requires: [ITooltipManager, IConsoleTracker],
    activate: (app, manager, consoles) => {
        // Add tooltip launch command.
        app.commands.addCommand(CommandIDs.launchConsole, {
            execute: () => {
                var _a, _b;
                const parent = consoles.currentWidget;
                if (!parent) {
                    return;
                }
                const anchor = parent.console;
                const editor = (_a = anchor.promptCell) === null || _a === void 0 ? void 0 : _a.editor;
                const kernel = (_b = anchor.sessionContext.session) === null || _b === void 0 ? void 0 : _b.kernel;
                const rendermime = anchor.rendermime;
                // If all components necessary for rendering exist, create a tooltip.
                if (!!editor && !!kernel && !!rendermime) {
                    return manager.invoke({ anchor, editor, kernel, rendermime });
                }
            }
        });
    }
};
/**
 * The notebook tooltip plugin.
 */
const notebooks = {
    id: '@jupyterlab/tooltip-extension:notebooks',
    autoStart: true,
    requires: [ITooltipManager, INotebookTracker],
    activate: (app, manager, notebooks) => {
        // Add tooltip launch command.
        app.commands.addCommand(CommandIDs.launchNotebook, {
            execute: () => {
                var _a, _b;
                const parent = notebooks.currentWidget;
                if (!parent) {
                    return;
                }
                const anchor = parent.content;
                const editor = (_a = anchor.activeCell) === null || _a === void 0 ? void 0 : _a.editor;
                const kernel = (_b = parent.sessionContext.session) === null || _b === void 0 ? void 0 : _b.kernel;
                const rendermime = anchor.rendermime;
                // If all components necessary for rendering exist, create a tooltip.
                if (!!editor && !!kernel && !!rendermime) {
                    return manager.invoke({ anchor, editor, kernel, rendermime });
                }
            }
        });
    }
};
/**
 * The file editor tooltip plugin.
 */
const files = {
    id: '@jupyterlab/tooltip-extension:files',
    autoStart: true,
    requires: [ITooltipManager, IEditorTracker, IRenderMimeRegistry],
    activate: (app, manager, editorTracker, rendermime) => {
        // Keep a list of active ISessions so that we can
        // clean them up when they are no longer needed.
        const activeSessions = {};
        const sessions = app.serviceManager.sessions;
        // When the list of running sessions changes,
        // check to see if there are any kernels with a
        // matching path for the file editors.
        const onRunningChanged = (sender, models) => {
            editorTracker.forEach(file => {
                const model = find(models, m => file.context.path === m.path);
                if (model) {
                    const oldSession = activeSessions[file.id];
                    // If there is a matching path, but it is the same
                    // session as we previously had, do nothing.
                    if (oldSession && oldSession.id === model.id) {
                        return;
                    }
                    // Otherwise, dispose of the old session and reset to
                    // a new CompletionConnector.
                    if (oldSession) {
                        delete activeSessions[file.id];
                        oldSession.dispose();
                    }
                    const session = sessions.connectTo({ model });
                    activeSessions[file.id] = session;
                }
                else {
                    const session = activeSessions[file.id];
                    if (session) {
                        session.dispose();
                        delete activeSessions[file.id];
                    }
                }
            });
        };
        onRunningChanged(sessions, toArray(sessions.running()));
        sessions.runningChanged.connect(onRunningChanged);
        // Clean up after a widget when it is disposed
        editorTracker.widgetAdded.connect((sender, widget) => {
            widget.disposed.connect(w => {
                const session = activeSessions[w.id];
                if (session) {
                    session.dispose();
                    delete activeSessions[w.id];
                }
            });
        });
        // Add tooltip launch command.
        app.commands.addCommand(CommandIDs.launchFile, {
            execute: async () => {
                const parent = editorTracker.currentWidget;
                const kernel = parent &&
                    activeSessions[parent.id] &&
                    activeSessions[parent.id].kernel;
                if (!kernel) {
                    return;
                }
                const anchor = parent.content;
                const editor = anchor === null || anchor === void 0 ? void 0 : anchor.editor;
                // If all components necessary for rendering exist, create a tooltip.
                if (!!editor && !!kernel && !!rendermime) {
                    return manager.invoke({ anchor, editor, kernel, rendermime });
                }
            }
        });
    }
};
/**
 * Export the plugins as default.
 */
const plugins = [
    manager,
    consoles,
    notebooks,
    files
];
export default plugins;
/**
 * A namespace for private data.
 */
var Private;
(function (Private) {
    /**
     * A counter for outstanding requests.
     */
    let pending = 0;
    /**
     * Fetch a tooltip's content from the API server.
     */
    function fetch(options) {
        const { detail, editor, kernel } = options;
        const code = editor.model.value.text;
        const position = editor.getCursorPosition();
        const offset = Text.jsIndexToCharIndex(editor.getOffsetAt(position), code);
        // Clear hints if the new text value is empty or kernel is unavailable.
        if (!code || !kernel) {
            return Promise.reject(void 0);
        }
        const contents = {
            code,
            cursor_pos: offset,
            detail_level: detail || 0
        };
        const current = ++pending;
        return kernel.requestInspect(contents).then(msg => {
            const value = msg.content;
            // If a newer request is pending, bail.
            if (current !== pending) {
                return Promise.reject(void 0);
            }
            // If request fails or returns negative results, bail.
            if (value.status !== 'ok' || !value.found) {
                return Promise.reject(void 0);
            }
            return Promise.resolve(value.data);
        });
    }
    Private.fetch = fetch;
})(Private || (Private = {}));
//# sourceMappingURL=index.js.map