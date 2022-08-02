// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { MainAreaWidget } from '@jupyterlab/apputils';
import { CodeMirrorEditor, CodeMirrorSearchProvider } from '@jupyterlab/codemirror';
import { FileEditor } from './widget';
/**
 * File editor search provider
 */
export class FileEditorSearchProvider extends CodeMirrorSearchProvider {
    /**
     * Constructor
     * @param widget File editor panel
     */
    constructor(widget) {
        super();
        this.editor = widget.content.editor;
    }
    /**
     * Instantiate a search provider for the widget.
     *
     * #### Notes
     * The widget provided is always checked using `isApplicable` before calling
     * this factory.
     *
     * @param widget The widget to search on
     * @param translator [optional] The translator object
     *
     * @returns The search provider on the widget
     */
    static createNew(widget, translator) {
        return new FileEditorSearchProvider(widget);
    }
    /**
     * Report whether or not this provider has the ability to search on the given object
     */
    static isApplicable(domain) {
        return (domain instanceof MainAreaWidget &&
            domain.content instanceof FileEditor &&
            domain.content.editor instanceof CodeMirrorEditor);
    }
    /**
     * Get an initial query value if applicable so that it can be entered
     * into the search box as an initial query
     *
     * @returns Initial value used to populate the search box.
     */
    getInitialQuery() {
        const cm = this.editor;
        const selection = cm.doc.getSelection();
        // if there are newlines, just return empty string
        return selection.search(/\r?\n|\r/g) === -1 ? selection : '';
    }
}
//# sourceMappingURL=searchprovider.js.map