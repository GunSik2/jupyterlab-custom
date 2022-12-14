// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { Dialog, showDialog, showErrorMessage } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { nullTranslator } from '@jupyterlab/translation';
import { Widget } from '@lumino/widgets';
/**
 * The class name added to file dialogs.
 */
const FILE_DIALOG_CLASS = 'jp-FileDialog';
/**
 * The class name added for the new name label in the rename dialog
 */
const RENAME_NEW_NAME_TITLE_CLASS = 'jp-new-name-title';
/**
 * Rename a file with a dialog.
 */
export function renameDialog(manager, oldPath, translator) {
    translator = translator || nullTranslator;
    const trans = translator.load('jupyterlab');
    return showDialog({
        title: trans.__('Rename File'),
        body: new RenameHandler(oldPath),
        focusNodeSelector: 'input',
        buttons: [
            Dialog.cancelButton({ label: trans.__('Cancel') }),
            Dialog.okButton({ label: trans.__('Rename') })
        ]
    }).then(result => {
        if (!result.value) {
            return null;
        }
        if (!isValidFileName(result.value)) {
            void showErrorMessage(trans.__('Rename Error'), Error(trans.__('"%1" is not a valid name for a file. Names must have nonzero length, and cannot include "/", "\\", or ":"', result.value)));
            return null;
        }
        const basePath = PathExt.dirname(oldPath);
        const newPath = PathExt.join(basePath, result.value);
        return renameFile(manager, oldPath, newPath);
    });
}
/**
 * Rename a file, asking for confirmation if it is overwriting another.
 */
export function renameFile(manager, oldPath, newPath) {
    return manager.rename(oldPath, newPath).catch(error => {
        if (error.response.status !== 409) {
            // if it's not caused by an already existing file, rethrow
            throw error;
        }
        // otherwise, ask for confirmation
        return shouldOverwrite(newPath).then((value) => {
            if (value) {
                return manager.overwrite(oldPath, newPath);
            }
            return Promise.reject('File not renamed');
        });
    });
}
/**
 * Ask the user whether to overwrite a file.
 */
export function shouldOverwrite(path, translator) {
    translator = translator || nullTranslator;
    const trans = translator.load('jupyterlab');
    const options = {
        title: trans.__('Overwrite file?'),
        body: trans.__('"%1" already exists, overwrite?', path),
        buttons: [
            Dialog.cancelButton({ label: trans.__('Cancel') }),
            Dialog.warnButton({ label: trans.__('Overwrite') })
        ]
    };
    return showDialog(options).then(result => {
        return Promise.resolve(result.button.accept);
    });
}
/**
 * Test whether a name is a valid file name
 *
 * Disallows "/", "\", and ":" in file names, as well as names with zero length.
 */
export function isValidFileName(name) {
    const validNameExp = /[\/\\:]/;
    return name.length > 0 && !validNameExp.test(name);
}
/**
 * A widget used to rename a file.
 */
class RenameHandler extends Widget {
    /**
     * Construct a new "rename" dialog.
     */
    constructor(oldPath) {
        super({ node: Private.createRenameNode(oldPath) });
        this.addClass(FILE_DIALOG_CLASS);
        const ext = PathExt.extname(oldPath);
        const value = (this.inputNode.value = PathExt.basename(oldPath));
        this.inputNode.setSelectionRange(0, value.length - ext.length);
    }
    /**
     * Get the input text node.
     */
    get inputNode() {
        return this.node.getElementsByTagName('input')[0];
    }
    /**
     * Get the value of the widget.
     */
    getValue() {
        return this.inputNode.value;
    }
}
/**
 * A namespace for private data.
 */
var Private;
(function (Private) {
    /**
     * Create the node for a rename handler.
     */
    function createRenameNode(oldPath, translator) {
        translator = translator || nullTranslator;
        const trans = translator.load('jupyterlab');
        const body = document.createElement('div');
        const existingLabel = document.createElement('label');
        existingLabel.textContent = trans.__('File Path');
        const existingPath = document.createElement('span');
        existingPath.textContent = oldPath;
        const nameTitle = document.createElement('label');
        nameTitle.textContent = trans.__('New Name');
        nameTitle.className = RENAME_NEW_NAME_TITLE_CLASS;
        const name = document.createElement('input');
        body.appendChild(existingLabel);
        body.appendChild(existingPath);
        body.appendChild(nameTitle);
        body.appendChild(name);
        return body;
    }
    Private.createRenameNode = createRenameNode;
})(Private || (Private = {}));
//# sourceMappingURL=dialogs.js.map