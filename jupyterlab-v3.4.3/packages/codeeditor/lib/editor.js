// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { ModelDB } from '@jupyterlab/observables';
import * as models from '@jupyterlab/shared-models';
import { Signal } from '@lumino/signaling';
const globalModelDBMutex = models.createMutex();
/**
 * A namespace for code editors.
 *
 * #### Notes
 * - A code editor is a set of common assumptions which hold for all concrete editors.
 * - Changes in implementations of the code editor should only be caused by changes in concrete editors.
 * - Common JLab services which are based on the code editor should belong to `IEditorServices`.
 */
export var CodeEditor;
(function (CodeEditor) {
    /**
     * The default selection style.
     */
    CodeEditor.defaultSelectionStyle = {
        className: '',
        displayName: '',
        color: 'black'
    };
    /**
     * The default implementation of the editor model.
     */
    class Model {
        /**
         * Construct a new Model.
         */
        constructor(options) {
            this._isDisposed = false;
            this._mimeTypeChanged = new Signal(this);
            this._sharedModelSwitched = new Signal(this);
            options = options || {};
            if (options.modelDB) {
                this.modelDB = options.modelDB;
            }
            else {
                this.modelDB = new ModelDB();
            }
            this.sharedModel = models.createStandaloneCell(this.type, options.id);
            this.sharedModel.changed.connect(this._onSharedModelChanged, this);
            const value = this.modelDB.createString('value');
            value.changed.connect(this._onModelDBValueChanged, this);
            value.text = value.text || options.value || '';
            const mimeType = this.modelDB.createValue('mimeType');
            mimeType.changed.connect(this._onModelDBMimeTypeChanged, this);
            mimeType.set(options.mimeType || 'text/plain');
            this.modelDB.createMap('selections');
        }
        /**
         * When we initialize a cell model, we create a standalone model that cannot be shared in a YNotebook.
         * Call this function to re-initialize the local representation based on a fresh shared model (e.g. models.YFile or models.YCodeCell).
         *
         * @param sharedModel
         * @param reinitialize Whether to reinitialize the shared model.
         */
        switchSharedModel(sharedModel, reinitialize) {
            if (reinitialize) {
                // update local modeldb
                // @todo also change metadata
                this.value.text = sharedModel.getSource();
            }
            this.sharedModel.changed.disconnect(this._onSharedModelChanged, this);
            // clone model retrieve a shared (not standalone) model
            this.sharedModel = sharedModel;
            this.sharedModel.changed.connect(this._onSharedModelChanged, this);
            this._sharedModelSwitched.emit(true);
        }
        /**
         * We update the modeldb store when the shared model changes.
         * To ensure that we don't run into infinite loops, we wrap this call in a "mutex".
         * The "mutex" ensures that the wrapped code can only be executed by either the sharedModelChanged handler
         * or the modelDB change handler.
         */
        _onSharedModelChanged(sender, change) {
            globalModelDBMutex(() => {
                if (change.sourceChange) {
                    const value = this.modelDB.get('value');
                    let currpos = 0;
                    change.sourceChange.forEach(delta => {
                        if (delta.insert != null) {
                            value.insert(currpos, delta.insert);
                            currpos += delta.insert.length;
                        }
                        else if (delta.delete != null) {
                            value.remove(currpos, currpos + delta.delete);
                        }
                        else if (delta.retain != null) {
                            currpos += delta.retain;
                        }
                    });
                }
            });
        }
        /**
         * Handle a change to the modelDB value.
         */
        _onModelDBValueChanged(value, event) {
            globalModelDBMutex(() => {
                this.sharedModel.transact(() => {
                    switch (event.type) {
                        case 'insert':
                            this.sharedModel.updateSource(event.start, event.start, event.value);
                            break;
                        case 'remove':
                            this.sharedModel.updateSource(event.start, event.end);
                            break;
                        default:
                            this.sharedModel.setSource(value.text);
                            break;
                    }
                });
            });
        }
        get type() {
            return 'code';
        }
        /**
         * A signal emitted when a mimetype changes.
         */
        get mimeTypeChanged() {
            return this._mimeTypeChanged;
        }
        /**
         * A signal emitted when the shared model was switched.
         */
        get sharedModelSwitched() {
            return this._sharedModelSwitched;
        }
        /**
         * Get the value of the model.
         */
        get value() {
            return this.modelDB.get('value');
        }
        /**
         * Get the selections for the model.
         */
        get selections() {
            return this.modelDB.get('selections');
        }
        /**
         * A mime type of the model.
         */
        get mimeType() {
            return this.modelDB.getValue('mimeType');
        }
        set mimeType(newValue) {
            const oldValue = this.mimeType;
            if (oldValue === newValue) {
                return;
            }
            this.modelDB.setValue('mimeType', newValue);
        }
        /**
         * Whether the model is disposed.
         */
        get isDisposed() {
            return this._isDisposed;
        }
        /**
         * Dispose of the resources used by the model.
         */
        dispose() {
            if (this._isDisposed) {
                return;
            }
            this._isDisposed = true;
            Signal.clearData(this);
        }
        _onModelDBMimeTypeChanged(mimeType, args) {
            this._mimeTypeChanged.emit({
                name: 'mimeType',
                oldValue: args.oldValue,
                newValue: args.newValue
            });
        }
    }
    CodeEditor.Model = Model;
    /**
     * The default configuration options for an editor.
     */
    CodeEditor.defaultConfig = {
        autoClosingBrackets: false,
        codeFolding: false,
        cursorBlinkRate: 530,
        fontFamily: null,
        fontSize: null,
        handlePaste: true,
        insertSpaces: true,
        lineHeight: null,
        lineNumbers: false,
        lineWrap: 'on',
        matchBrackets: true,
        readOnly: false,
        tabSize: 4,
        rulers: [],
        showTrailingSpace: false,
        wordWrapColumn: 80
    };
})(CodeEditor || (CodeEditor = {}));
//# sourceMappingURL=editor.js.map