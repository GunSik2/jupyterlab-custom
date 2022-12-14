// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { nullTranslator } from '@jupyterlab/translation';
import { CodeMirrorEditor } from './editor';
/**
 * CodeMirror editor factory.
 */
export class CodeMirrorEditorFactory {
    /**
     * Construct an IEditorFactoryService for CodeMirrorEditors.
     */
    constructor(defaults = {}, translator) {
        /**
         * Create a new editor for inline code.
         */
        this.newInlineEditor = (options) => {
            options.host.dataset.type = 'inline';
            return new CodeMirrorEditor(Object.assign(Object.assign({}, options), { config: Object.assign(Object.assign({}, this.inlineCodeMirrorConfig), (options.config || {})), translator: this.translator }));
        };
        /**
         * Create a new editor for a full document.
         */
        this.newDocumentEditor = (options) => {
            options.host.dataset.type = 'document';
            return new CodeMirrorEditor(Object.assign(Object.assign({}, options), { config: Object.assign(Object.assign({}, this.documentCodeMirrorConfig), (options.config || {})), translator: this.translator }));
        };
        this.translator = translator || nullTranslator;
        this.inlineCodeMirrorConfig = Object.assign(Object.assign(Object.assign({}, CodeMirrorEditor.defaultConfig), { extraKeys: {
                'Cmd-Right': 'goLineRight',
                End: 'goLineRight',
                'Cmd-Left': 'goLineLeft',
                Tab: 'indentMoreOrinsertTab',
                'Shift-Tab': 'indentLess',
                'Cmd-/': cm => cm.toggleComment({ indent: true }),
                'Ctrl-/': cm => cm.toggleComment({ indent: true }),
                'Ctrl-G': 'find',
                'Cmd-G': 'find'
            } }), defaults);
        this.documentCodeMirrorConfig = Object.assign(Object.assign(Object.assign({}, CodeMirrorEditor.defaultConfig), { extraKeys: {
                Tab: 'indentMoreOrinsertTab',
                'Shift-Tab': 'indentLess',
                'Cmd-/': cm => cm.toggleComment({ indent: true }),
                'Ctrl-/': cm => cm.toggleComment({ indent: true }),
                'Shift-Enter': () => {
                    /* no-op */
                }
            }, lineNumbers: true, scrollPastEnd: true }), defaults);
    }
}
//# sourceMappingURL=factory.js.map