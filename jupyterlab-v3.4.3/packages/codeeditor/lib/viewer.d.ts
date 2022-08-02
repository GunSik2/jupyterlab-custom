import { Widget } from '@lumino/widgets';
import { CodeEditor } from './editor';
export declare class CodeViewerWidget extends Widget {
    /**
     * Construct a new code viewer widget.
     */
    constructor(options: CodeViewerWidget.IOptions);
    static createCodeViewer(options: CodeViewerWidget.INoModelOptions): CodeViewerWidget;
    get content(): string;
    get mimeType(): string;
    model: CodeEditor.IModel;
    editor: CodeEditor.IEditor;
}
/**
 * The namespace for code viewer widget.
 */
export declare namespace CodeViewerWidget {
    /**
     * The options used to create an code viewer widget.
     */
    interface IOptions {
        /**
         * A code editor factory.
         */
        factory: CodeEditor.Factory;
        /**
         * The content model for the viewer.
         */
        model: CodeEditor.Model;
    }
    /**
     * The options used to create an code viewer widget without a model.
     */
    interface INoModelOptions {
        /**
         * A code editor factory.
         */
        factory: CodeEditor.Factory;
        /**
         * The content to display in the viewer.
         */
        content: string;
        /**
         * The mime type for the content.
         */
        mimeType?: string;
    }
}
