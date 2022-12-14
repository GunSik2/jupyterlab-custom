// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/**
 * @packageDocumentation
 * @module celltags-extension
 */
import { INotebookTools, INotebookTracker } from '@jupyterlab/notebook';
import { TagTool } from '@jupyterlab/celltags';
import { ITranslator } from '@jupyterlab/translation';
/**
 * Initialization data for the celltags extension.
 */
const celltags = {
    id: '@jupyterlab/celltags',
    autoStart: true,
    requires: [INotebookTools, INotebookTracker, ITranslator],
    activate: (app, tools, tracker, translator) => {
        const tool = new TagTool(tracker, app, translator);
        tools.addItem({ tool: tool, rank: 1.6 });
    }
};
export default celltags;
//# sourceMappingURL=index.js.map