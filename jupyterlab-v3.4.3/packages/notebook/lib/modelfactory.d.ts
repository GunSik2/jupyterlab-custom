import { CodeCellModel } from '@jupyterlab/cells';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IModelDB } from '@jupyterlab/observables';
import { Contents } from '@jupyterlab/services';
import { INotebookModel, NotebookModel } from './model';
/**
 * A model factory for notebooks.
 */
export declare class NotebookModelFactory implements DocumentRegistry.IModelFactory<INotebookModel> {
    /**
     * Construct a new notebook model factory.
     */
    constructor(options: NotebookModelFactory.IOptions);
    /**
     * The content model factory used by the NotebookModelFactory.
     */
    readonly contentFactory: NotebookModel.IContentFactory;
    /**
     * Define the disableDocumentWideUndoRedo property.
     */
    set disableDocumentWideUndoRedo(disableDocumentWideUndoRedo: boolean);
    /**
     * The name of the model.
     */
    get name(): string;
    /**
     * The content type of the file.
     */
    get contentType(): Contents.ContentType;
    /**
     * The format of the file.
     */
    get fileFormat(): Contents.FileFormat;
    /**
     * Get whether the model factory has been disposed.
     */
    get isDisposed(): boolean;
    /**
     * Dispose of the model factory.
     */
    dispose(): void;
    /**
     * Create a new model for a given path.
     *
     * @param languagePreference - An optional kernel language preference.
     *
     * @returns A new document model.
     */
    createNew(languagePreference?: string, modelDB?: IModelDB, isInitialized?: boolean): INotebookModel;
    /**
     * Get the preferred kernel language given a path.
     */
    preferredLanguage(path: string): string;
    /**
     * Defines if the document can be undo/redo.
     */
    private _disableDocumentWideUndoRedo;
    private _disposed;
}
/**
 * The namespace for notebook model factory statics.
 */
export declare namespace NotebookModelFactory {
    /**
     * The options used to initialize a NotebookModelFactory.
     */
    interface IOptions {
        /**
         * Defines if the document can be undo/redo.
         */
        disableDocumentWideUndoRedo?: boolean;
        /**
         * The factory for code cell content.
         */
        codeCellContentFactory?: CodeCellModel.IContentFactory;
        /**
         * The content factory used by the NotebookModelFactory.  If
         * given, it will supersede the `codeCellContentFactory`.
         */
        contentFactory?: NotebookModel.IContentFactory;
    }
}
