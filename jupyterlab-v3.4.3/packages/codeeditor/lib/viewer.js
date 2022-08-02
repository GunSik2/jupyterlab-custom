// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { StackedLayout, Widget } from '@lumino/widgets';
import { CodeEditor } from './editor';
import { CodeEditorWrapper } from './widget';
export class CodeViewerWidget extends Widget {
    /**
     * Construct a new code viewer widget.
     */
    constructor(options) {
        super();
        this.model = options.model;
        const editorWidget = new CodeEditorWrapper({
            factory: options.factory,
            model: options.model
        });
        this.editor = editorWidget.editor;
        this.editor.setOption('readOnly', true);
        const layout = (this.layout = new StackedLayout());
        layout.addWidget(editorWidget);
    }
    static createCodeViewer(options) {
        const model = new CodeEditor.Model({
            value: options.content,
            mimeType: options.mimeType
        });
        return new CodeViewerWidget({ factory: options.factory, model });
    }
    get content() {
        return this.model.value.text;
    }
    get mimeType() {
        return this.model.mimeType;
    }
}
//# sourceMappingURL=viewer.js.map