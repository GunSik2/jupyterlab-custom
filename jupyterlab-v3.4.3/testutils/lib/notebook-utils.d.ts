import { CodeEditorWrapper } from '@jupyterlab/codeeditor';
import * as nbformat from '@jupyterlab/nbformat';
import { Context, DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel, Notebook, NotebookPanel, NotebookWidgetFactory } from '@jupyterlab/notebook';
import { RenderMimeRegistry } from '@jupyterlab/rendermime';
import { Cell, CodeCellModel } from '@jupyterlab/cells';
/**
 * The default notebook content.
 */
export declare namespace NBTestUtils {
    /**
     * The default outputs used for testing.
     */
    const DEFAULT_OUTPUTS: nbformat.IOutput[];
    const DEFAULT_CONTENT: nbformat.INotebookContent;
    const DEFAULT_CONTENT_45: nbformat.INotebookContent;
    const defaultEditorConfig: {
        code: Partial<import("@jupyterlab/codeeditor").CodeEditor.IConfig>;
        markdown: Partial<import("@jupyterlab/codeeditor").CodeEditor.IConfig>;
        raw: Partial<import("@jupyterlab/codeeditor").CodeEditor.IConfig>;
    };
    const editorFactory: any;
    const mimeTypeService: import("@jupyterlab/codeeditor").IEditorMimeTypeService;
    /**
     * Get a copy of the default rendermime instance.
     */
    function defaultRenderMime(): RenderMimeRegistry;
    const clipboard: import("@lumino/coreutils").MimeData;
    /**
     * Create a base cell content factory.
     */
    function createBaseCellFactory(): Cell.IContentFactory;
    /**
     * Create a new code cell content factory.
     */
    function createCodeCellFactory(): Cell.IContentFactory;
    /**
     * Create a cell editor widget.
     */
    function createCellEditor(model?: CodeCellModel): CodeEditorWrapper;
    /**
     * Create a default notebook content factory.
     */
    function createNotebookFactory(): Notebook.IContentFactory;
    /**
     * Create a default notebook panel content factory.
     */
    function createNotebookPanelFactory(): NotebookPanel.IContentFactory;
    /**
     * Create a notebook widget.
     */
    function createNotebook(): Notebook;
    /**
     * Create a notebook panel widget.
     */
    function createNotebookPanel(context: Context<INotebookModel>): NotebookPanel;
    /**
     * Populate a notebook with default content.
     */
    function populateNotebook(notebook: Notebook): void;
    function createNotebookWidgetFactory(toolbarFactory?: (widget: NotebookPanel) => DocumentRegistry.IToolbarItem[]): NotebookWidgetFactory;
    /**
     * Create a context for a file.
     */
    function createMockContext(startKernel?: boolean): Promise<Context<INotebookModel>>;
}
