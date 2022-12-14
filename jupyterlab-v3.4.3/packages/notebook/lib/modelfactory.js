// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { NotebookModel } from './model';
/**
 * A model factory for notebooks.
 */
export class NotebookModelFactory {
    /**
     * Construct a new notebook model factory.
     */
    constructor(options) {
        this._disposed = false;
        this._disableDocumentWideUndoRedo =
            options.disableDocumentWideUndoRedo || false;
        const codeCellContentFactory = options.codeCellContentFactory;
        this.contentFactory =
            options.contentFactory ||
                new NotebookModel.ContentFactory({ codeCellContentFactory });
    }
    /**
     * Define the disableDocumentWideUndoRedo property.
     */
    set disableDocumentWideUndoRedo(disableDocumentWideUndoRedo) {
        this._disableDocumentWideUndoRedo = disableDocumentWideUndoRedo;
    }
    /**
     * The name of the model.
     */
    get name() {
        return 'notebook';
    }
    /**
     * The content type of the file.
     */
    get contentType() {
        return 'notebook';
    }
    /**
     * The format of the file.
     */
    get fileFormat() {
        return 'json';
    }
    /**
     * Get whether the model factory has been disposed.
     */
    get isDisposed() {
        return this._disposed;
    }
    /**
     * Dispose of the model factory.
     */
    dispose() {
        this._disposed = true;
    }
    /**
     * Create a new model for a given path.
     *
     * @param languagePreference - An optional kernel language preference.
     *
     * @returns A new document model.
     */
    createNew(languagePreference, modelDB, isInitialized) {
        const contentFactory = this.contentFactory;
        return new NotebookModel({
            languagePreference,
            contentFactory,
            modelDB,
            isInitialized,
            disableDocumentWideUndoRedo: this._disableDocumentWideUndoRedo
        });
    }
    /**
     * Get the preferred kernel language given a path.
     */
    preferredLanguage(path) {
        return '';
    }
}
//# sourceMappingURL=modelfactory.js.map