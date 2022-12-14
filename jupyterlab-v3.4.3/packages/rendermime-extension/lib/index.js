/* -----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
/**
 * @packageDocumentation
 * @module rendermime-extension
 */
import { ISanitizer } from '@jupyterlab/apputils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { ILatexTypesetter, IRenderMimeRegistry, RenderMimeRegistry, standardRendererFactories } from '@jupyterlab/rendermime';
import { ITranslator } from '@jupyterlab/translation';
var CommandIDs;
(function (CommandIDs) {
    CommandIDs.handleLink = 'rendermime:handle-local-link';
})(CommandIDs || (CommandIDs = {}));
/**
 * A plugin providing a rendermime registry.
 */
const plugin = {
    id: '@jupyterlab/rendermime-extension:plugin',
    requires: [ITranslator],
    optional: [IDocumentManager, ILatexTypesetter, ISanitizer],
    provides: IRenderMimeRegistry,
    activate: activate,
    autoStart: true
};
/**
 * Export the plugin as default.
 */
export default plugin;
/**
 * Activate the rendermine plugin.
 */
function activate(app, translator, docManager, latexTypesetter, sanitizer) {
    const trans = translator.load('jupyterlab');
    if (docManager) {
        app.commands.addCommand(CommandIDs.handleLink, {
            label: trans.__('Handle Local Link'),
            execute: args => {
                const path = args['path'];
                const id = args['id'];
                if (!path) {
                    return;
                }
                // First check if the path exists on the server.
                return docManager.services.contents
                    .get(path, { content: false })
                    .then(() => {
                    // Open the link with the default rendered widget factory,
                    // if applicable.
                    const factory = docManager.registry.defaultRenderedWidgetFactory(path);
                    const widget = docManager.openOrReveal(path, factory.name);
                    // Handle the hash if one has been provided.
                    if (widget && id) {
                        widget.setFragment(id);
                    }
                });
            }
        });
    }
    return new RenderMimeRegistry({
        initialFactories: standardRendererFactories,
        linkHandler: !docManager
            ? undefined
            : {
                handleLink: (node, path, id) => {
                    // If node has the download attribute explicitly set, use the
                    // default browser downloading behavior.
                    if (node.tagName === 'A' && node.hasAttribute('download')) {
                        return;
                    }
                    app.commandLinker.connectNode(node, CommandIDs.handleLink, {
                        path,
                        id
                    });
                }
            },
        latexTypesetter: latexTypesetter !== null && latexTypesetter !== void 0 ? latexTypesetter : undefined,
        translator: translator,
        sanitizer: sanitizer !== null && sanitizer !== void 0 ? sanitizer : undefined
    });
}
//# sourceMappingURL=index.js.map