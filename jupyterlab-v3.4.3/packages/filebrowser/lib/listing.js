// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { Dialog, DOMUtils, showDialog, showErrorMessage } from '@jupyterlab/apputils';
import { PathExt, Time } from '@jupyterlab/coreutils';
import { isValidFileName, renameFile } from '@jupyterlab/docmanager';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { nullTranslator } from '@jupyterlab/translation';
import { caretDownIcon, caretUpIcon, classes, LabIcon } from '@jupyterlab/ui-components';
import { ArrayExt, ArrayIterator, each, filter, find, StringExt, toArray } from '@lumino/algorithm';
import { MimeData, PromiseDelegate } from '@lumino/coreutils';
import { ElementExt } from '@lumino/domutils';
import { Drag } from '@lumino/dragdrop';
import { MessageLoop } from '@lumino/messaging';
import { Signal } from '@lumino/signaling';
import { h, VirtualDOM } from '@lumino/virtualdom';
import { Widget } from '@lumino/widgets';
/**
 * The class name added to DirListing widget.
 */
const DIR_LISTING_CLASS = 'jp-DirListing';
/**
 * The class name added to a dir listing header node.
 */
const HEADER_CLASS = 'jp-DirListing-header';
/**
 * The class name added to a dir listing list header cell.
 */
const HEADER_ITEM_CLASS = 'jp-DirListing-headerItem';
/**
 * The class name added to a header cell text node.
 */
const HEADER_ITEM_TEXT_CLASS = 'jp-DirListing-headerItemText';
/**
 * The class name added to a header cell icon node.
 */
const HEADER_ITEM_ICON_CLASS = 'jp-DirListing-headerItemIcon';
/**
 * The class name added to the dir listing content node.
 */
const CONTENT_CLASS = 'jp-DirListing-content';
/**
 * The class name added to dir listing content item.
 */
const ITEM_CLASS = 'jp-DirListing-item';
/**
 * The class name added to the listing item text cell.
 */
const ITEM_TEXT_CLASS = 'jp-DirListing-itemText';
/**
 * The class name added to the listing item icon cell.
 */
const ITEM_ICON_CLASS = 'jp-DirListing-itemIcon';
/**
 * The class name added to the listing item modified cell.
 */
const ITEM_MODIFIED_CLASS = 'jp-DirListing-itemModified';
/**
 * The class name added to the dir listing editor node.
 */
const EDITOR_CLASS = 'jp-DirListing-editor';
/**
 * The class name added to the name column header cell.
 */
const NAME_ID_CLASS = 'jp-id-name';
/**
 * The class name added to the modified column header cell.
 */
const MODIFIED_ID_CLASS = 'jp-id-modified';
/**
 * The class name added to the narrow column header cell.
 */
const NARROW_ID_CLASS = 'jp-id-narrow';
/**
 * The class name added to the modified column header cell and modified item cell when hidden.
 */
const MODIFIED_COLUMN_HIDDEN = 'jp-LastModified-hidden';
/**
 * The mime type for a contents drag object.
 */
const CONTENTS_MIME = 'application/x-jupyter-icontents';
/**
 * The mime type for a rich contents drag object.
 */
const CONTENTS_MIME_RICH = 'application/x-jupyter-icontentsrich';
/**
 * The class name added to drop targets.
 */
const DROP_TARGET_CLASS = 'jp-mod-dropTarget';
/**
 * The class name added to selected rows.
 */
const SELECTED_CLASS = 'jp-mod-selected';
/**
 * The class name added to drag state icons to add space between the icon and the file name
 */
const DRAG_ICON_CLASS = 'jp-DragIcon';
/**
 * The class name added to the widget when there are items on the clipboard.
 */
const CLIPBOARD_CLASS = 'jp-mod-clipboard';
/**
 * The class name added to cut rows.
 */
const CUT_CLASS = 'jp-mod-cut';
/**
 * The class name added when there are more than one selected rows.
 */
const MULTI_SELECTED_CLASS = 'jp-mod-multiSelected';
/**
 * The class name added to indicate running notebook.
 */
const RUNNING_CLASS = 'jp-mod-running';
/**
 * The class name added for a descending sort.
 */
const DESCENDING_CLASS = 'jp-mod-descending';
/**
 * The maximum duration between two key presses when selecting files by prefix.
 */
const PREFIX_APPEND_DURATION = 1000;
/**
 * The threshold in pixels to start a drag event.
 */
const DRAG_THRESHOLD = 5;
/**
 * A boolean indicating whether the platform is Mac.
 */
const IS_MAC = !!navigator.platform.match(/Mac/i);
/**
 * The factory MIME type supported by lumino dock panels.
 */
const FACTORY_MIME = 'application/vnd.lumino.widget-factory';
/**
 * A widget which hosts a file list area.
 */
export class DirListing extends Widget {
    /**
     * Construct a new file browser directory listing widget.
     *
     * @param model - The file browser view model.
     */
    constructor(options) {
        super({
            node: (options.renderer || DirListing.defaultRenderer).createNode()
        });
        this._items = [];
        this._sortedItems = [];
        this._sortState = {
            direction: 'ascending',
            key: 'name'
        };
        this._onItemOpened = new Signal(this);
        this._drag = null;
        this._dragData = null;
        this._selectTimer = -1;
        this._isCut = false;
        this._prevPath = '';
        this._clipboard = [];
        this._softSelection = '';
        this.selection = Object.create(null);
        this._searchPrefix = '';
        this._searchPrefixTimer = -1;
        this._inRename = false;
        this._isDirty = false;
        this._hiddenColumns = new Set();
        this.addClass(DIR_LISTING_CLASS);
        this.translator = options.translator || nullTranslator;
        this._trans = this.translator.load('jupyterlab');
        this._model = options.model;
        this._model.fileChanged.connect(this._onFileChanged, this);
        this._model.refreshed.connect(this._onModelRefreshed, this);
        this._model.pathChanged.connect(this._onPathChanged, this);
        this._editNode = document.createElement('input');
        this._editNode.className = EDITOR_CLASS;
        this._manager = this._model.manager;
        this._renderer = options.renderer || DirListing.defaultRenderer;
        const headerNode = DOMUtils.findElement(this.node, HEADER_CLASS);
        this._renderer.populateHeaderNode(headerNode, this.translator, this._hiddenColumns);
        this._manager.activateRequested.connect(this._onActivateRequested, this);
    }
    /**
     * Dispose of the resources held by the directory listing.
     */
    dispose() {
        this._items.length = 0;
        this._sortedItems.length = 0;
        this._clipboard.length = 0;
        super.dispose();
    }
    /**
     * Get the model used by the listing.
     */
    get model() {
        return this._model;
    }
    /**
     * Get the dir listing header node.
     *
     * #### Notes
     * This is the node which holds the header cells.
     *
     * Modifying this node directly can lead to undefined behavior.
     */
    get headerNode() {
        return DOMUtils.findElement(this.node, HEADER_CLASS);
    }
    /**
     * Get the dir listing content node.
     *
     * #### Notes
     * This is the node which holds the item nodes.
     *
     * Modifying this node directly can lead to undefined behavior.
     */
    get contentNode() {
        return DOMUtils.findElement(this.node, CONTENT_CLASS);
    }
    /**
     * The renderer instance used by the directory listing.
     */
    get renderer() {
        return this._renderer;
    }
    /**
     * The current sort state.
     */
    get sortState() {
        return this._sortState;
    }
    /**
     * A signal fired when an item is opened.
     */
    get onItemOpened() {
        return this._onItemOpened;
    }
    /**
     * Create an iterator over the listing's selected items.
     *
     * @returns A new iterator over the listing's selected items.
     */
    selectedItems() {
        const items = this._sortedItems;
        return filter(items, item => this.selection[item.path]);
    }
    /**
     * Create an iterator over the listing's sorted items.
     *
     * @returns A new iterator over the listing's sorted items.
     */
    sortedItems() {
        return new ArrayIterator(this._sortedItems);
    }
    /**
     * Sort the items using a sort condition.
     */
    sort(state) {
        this._sortedItems = Private.sort(this.model.items(), state);
        this._sortState = state;
        this.update();
    }
    /**
     * Rename the first currently selected item.
     *
     * @returns A promise that resolves with the new name of the item.
     */
    rename() {
        return this._doRename();
    }
    /**
     * Cut the selected items.
     */
    cut() {
        this._isCut = true;
        this._copy();
        this.update();
    }
    /**
     * Copy the selected items.
     */
    copy() {
        this._copy();
    }
    /**
     * Paste the items from the clipboard.
     *
     * @returns A promise that resolves when the operation is complete.
     */
    paste() {
        if (!this._clipboard.length) {
            this._isCut = false;
            return Promise.resolve(undefined);
        }
        const basePath = this._model.path;
        const promises = [];
        each(this._clipboard, path => {
            if (this._isCut) {
                const parts = path.split('/');
                const name = parts[parts.length - 1];
                const newPath = PathExt.join(basePath, name);
                promises.push(this._model.manager.rename(path, newPath));
            }
            else {
                promises.push(this._model.manager.copy(path, basePath));
            }
        });
        // Remove any cut modifiers.
        each(this._items, item => {
            item.classList.remove(CUT_CLASS);
        });
        this._clipboard.length = 0;
        this._isCut = false;
        this.removeClass(CLIPBOARD_CLASS);
        return Promise.all(promises)
            .then(() => {
            return undefined;
        })
            .catch(error => {
            void showErrorMessage(this._trans._p('showErrorMessage', 'Paste Error'), error);
        });
    }
    /**
     * Delete the currently selected item(s).
     *
     * @returns A promise that resolves when the operation is complete.
     */
    async delete() {
        const items = this._sortedItems.filter(item => this.selection[item.path]);
        if (!items.length) {
            return;
        }
        const message = items.length === 1
            ? this._trans.__('Are you sure you want to permanently delete: %1?', items[0].name)
            : this._trans._n('Are you sure you want to permanently delete the %1 selected item?', 'Are you sure you want to permanently delete the %1 selected items?', items.length);
        const result = await showDialog({
            title: this._trans.__('Delete'),
            body: message,
            buttons: [
                Dialog.cancelButton({ label: this._trans.__('Cancel') }),
                Dialog.warnButton({ label: this._trans.__('Delete') })
            ],
            // By default focus on "Cancel" to protect from accidental deletion
            // ("delete" and "Enter" are next to each other on many keyboards).
            defaultButton: 0
        });
        if (!this.isDisposed && result.button.accept) {
            await this._delete(items.map(item => item.path));
        }
    }
    /**
     * Duplicate the currently selected item(s).
     *
     * @returns A promise that resolves when the operation is complete.
     */
    duplicate() {
        const basePath = this._model.path;
        const promises = [];
        each(this.selectedItems(), item => {
            if (item.type !== 'directory') {
                promises.push(this._model.manager.copy(item.path, basePath));
            }
        });
        return Promise.all(promises)
            .then(() => {
            return undefined;
        })
            .catch(error => {
            void showErrorMessage(this._trans._p('showErrorMessage', 'Duplicate file'), error);
        });
    }
    /**
     * Download the currently selected item(s).
     */
    async download() {
        await Promise.all(toArray(this.selectedItems())
            .filter(item => item.type !== 'directory')
            .map(item => this._model.download(item.path)));
    }
    /**
     * Shut down kernels on the applicable currently selected items.
     *
     * @returns A promise that resolves when the operation is complete.
     */
    shutdownKernels() {
        const model = this._model;
        const items = this._sortedItems;
        const paths = items.map(item => item.path);
        const promises = toArray(this._model.sessions())
            .filter(session => {
            const index = ArrayExt.firstIndexOf(paths, session.path);
            return this.selection[items[index].path];
        })
            .map(session => model.manager.services.sessions.shutdown(session.id));
        return Promise.all(promises)
            .then(() => {
            return undefined;
        })
            .catch(error => {
            void showErrorMessage(this._trans._p('showErrorMessage', 'Shut down kernel'), error);
        });
    }
    /**
     * Select next item.
     *
     * @param keepExisting - Whether to keep the current selection and add to it.
     */
    selectNext(keepExisting = false) {
        let index = -1;
        const selected = Object.keys(this.selection);
        const items = this._sortedItems;
        if (selected.length === 1 || keepExisting) {
            // Select the next item.
            const path = selected[selected.length - 1];
            index = ArrayExt.findFirstIndex(items, value => value.path === path);
            index += 1;
            if (index === this._items.length) {
                index = 0;
            }
        }
        else if (selected.length === 0) {
            // Select the first item.
            index = 0;
        }
        else {
            // Select the last selected item.
            const path = selected[selected.length - 1];
            index = ArrayExt.findFirstIndex(items, value => value.path === path);
        }
        if (index !== -1) {
            this._selectItem(index, keepExisting);
            ElementExt.scrollIntoViewIfNeeded(this.contentNode, this._items[index]);
        }
    }
    /**
     * Select previous item.
     *
     * @param keepExisting - Whether to keep the current selection and add to it.
     */
    selectPrevious(keepExisting = false) {
        let index = -1;
        const selected = Object.keys(this.selection);
        const items = this._sortedItems;
        if (selected.length === 1 || keepExisting) {
            // Select the previous item.
            const path = selected[0];
            index = ArrayExt.findFirstIndex(items, value => value.path === path);
            index -= 1;
            if (index === -1) {
                index = this._items.length - 1;
            }
        }
        else if (selected.length === 0) {
            // Select the last item.
            index = this._items.length - 1;
        }
        else {
            // Select the first selected item.
            const path = selected[0];
            index = ArrayExt.findFirstIndex(items, value => value.path === path);
        }
        if (index !== -1) {
            this._selectItem(index, keepExisting);
            ElementExt.scrollIntoViewIfNeeded(this.contentNode, this._items[index]);
        }
    }
    /**
     * Select the first item that starts with prefix being typed.
     */
    selectByPrefix() {
        const prefix = this._searchPrefix.toLowerCase();
        const items = this._sortedItems;
        const index = ArrayExt.findFirstIndex(items, value => {
            return value.name.toLowerCase().substr(0, prefix.length) === prefix;
        });
        if (index !== -1) {
            this._selectItem(index, false);
            ElementExt.scrollIntoViewIfNeeded(this.contentNode, this._items[index]);
        }
    }
    /**
     * Get whether an item is selected by name.
     *
     * @param name - The name of of the item.
     *
     * @returns Whether the item is selected.
     */
    isSelected(name) {
        const items = this._sortedItems;
        return (toArray(filter(items, item => item.name === name && this.selection[item.path])).length !== 0);
    }
    /**
     * Find a model given a click.
     *
     * @param event - The mouse event.
     *
     * @returns The model for the selected file.
     */
    modelForClick(event) {
        const items = this._sortedItems;
        const index = Private.hitTestNodes(this._items, event);
        if (index !== -1) {
            return items[index];
        }
        return undefined;
    }
    /**
     * Clear the selected items.
     */
    clearSelectedItems() {
        this.selection = Object.create(null);
    }
    /**
     * Select an item by name.
     *
     * @param name - The name of the item to select.
     * @param focus - Whether to move focus the selected item.
     *
     * @returns A promise that resolves when the name is selected.
     */
    async selectItemByName(name, focus = false) {
        // Make sure the file is available.
        await this.model.refresh();
        if (this.isDisposed) {
            throw new Error('File browser is disposed.');
        }
        const items = this._sortedItems;
        const index = ArrayExt.findFirstIndex(items, value => value.name === name);
        if (index === -1) {
            throw new Error('Item does not exist.');
        }
        this._selectItem(index, false, focus);
        MessageLoop.sendMessage(this, Widget.Msg.UpdateRequest);
        ElementExt.scrollIntoViewIfNeeded(this.contentNode, this._items[index]);
    }
    /**
     * Handle the DOM events for the directory listing.
     *
     * @param event - The DOM event sent to the widget.
     *
     * #### Notes
     * This method implements the DOM `EventListener` interface and is
     * called in response to events on the panel's DOM node. It should
     * not be called directly by user code.
     */
    handleEvent(event) {
        switch (event.type) {
            case 'mousedown':
                this._evtMousedown(event);
                break;
            case 'mouseup':
                this._evtMouseup(event);
                break;
            case 'mousemove':
                this._evtMousemove(event);
                break;
            case 'keydown':
                this.evtKeydown(event);
                break;
            case 'click':
                this._evtClick(event);
                break;
            case 'dblclick':
                this.evtDblClick(event);
                break;
            case 'dragenter':
            case 'dragover':
                this.addClass('jp-mod-native-drop');
                event.preventDefault();
                break;
            case 'dragleave':
            case 'dragend':
                this.removeClass('jp-mod-native-drop');
                break;
            case 'drop':
                this.removeClass('jp-mod-native-drop');
                //this.evtNativeDrop(event as DragEvent);
                break;
            case 'scroll':
                this._evtScroll(event);
                break;
            case 'lm-dragenter':
                this.evtDragEnter(event);
                break;
            case 'lm-dragleave':
                this.evtDragLeave(event);
                break;
            case 'lm-dragover':
                this.evtDragOver(event);
                break;
            case 'lm-drop':
                this.evtDrop(event);
                break;
            default:
                break;
        }
    }
    /**
     * A message handler invoked on an `'after-attach'` message.
     */
    onAfterAttach(msg) {
        super.onAfterAttach(msg);
        const node = this.node;
        const content = DOMUtils.findElement(node, CONTENT_CLASS);
        node.addEventListener('mousedown', this);
        node.addEventListener('keydown', this);
        node.addEventListener('click', this);
        node.addEventListener('dblclick', this);
        content.addEventListener('dragenter', this);
        content.addEventListener('dragover', this);
        content.addEventListener('dragleave', this);
        content.addEventListener('dragend', this);
        content.addEventListener('drop', this);
        content.addEventListener('scroll', this);
        content.addEventListener('lm-dragenter', this);
        content.addEventListener('lm-dragleave', this);
        content.addEventListener('lm-dragover', this);
        content.addEventListener('lm-drop', this);
    }
    /**
     * A message handler invoked on a `'before-detach'` message.
     */
    onBeforeDetach(msg) {
        super.onBeforeDetach(msg);
        const node = this.node;
        const content = DOMUtils.findElement(node, CONTENT_CLASS);
        node.removeEventListener('mousedown', this);
        node.removeEventListener('keydown', this);
        node.removeEventListener('click', this);
        node.removeEventListener('dblclick', this);
        content.removeEventListener('scroll', this);
        content.removeEventListener('dragover', this);
        content.removeEventListener('dragover', this);
        content.removeEventListener('dragleave', this);
        content.removeEventListener('dragend', this);
        content.removeEventListener('drop', this);
        content.removeEventListener('lm-dragenter', this);
        content.removeEventListener('lm-dragleave', this);
        content.removeEventListener('lm-dragover', this);
        content.removeEventListener('lm-drop', this);
        document.removeEventListener('mousemove', this, true);
        document.removeEventListener('mouseup', this, true);
    }
    /**
     * A message handler invoked on an `'after-show'` message.
     */
    onAfterShow(msg) {
        if (this._isDirty) {
            // Update the sorted items.
            this.sort(this.sortState);
            this.update();
        }
    }
    /**
     * A handler invoked on an `'update-request'` message.
     */
    onUpdateRequest(msg) {
        this._isDirty = false;
        // Fetch common variables.
        const items = this._sortedItems;
        const nodes = this._items;
        const content = DOMUtils.findElement(this.node, CONTENT_CLASS);
        const renderer = this._renderer;
        this.removeClass(MULTI_SELECTED_CLASS);
        this.removeClass(SELECTED_CLASS);
        // Remove any excess item nodes.
        while (nodes.length > items.length) {
            content.removeChild(nodes.pop());
        }
        // Add any missing item nodes.
        while (nodes.length < items.length) {
            const node = renderer.createItemNode(this._hiddenColumns);
            node.classList.add(ITEM_CLASS);
            nodes.push(node);
            content.appendChild(node);
        }
        // Remove extra classes from the nodes.
        nodes.forEach(item => {
            item.classList.remove(SELECTED_CLASS);
            item.classList.remove(RUNNING_CLASS);
            item.classList.remove(CUT_CLASS);
        });
        // Add extra classes to item nodes based on widget state.
        items.forEach((item, i) => {
            const node = nodes[i];
            const ft = this._manager.registry.getFileTypeForModel(item);
            renderer.updateItemNode(node, item, ft, this.translator, this._hiddenColumns);
            if (this.selection[item.path]) {
                node.classList.add(SELECTED_CLASS);
                if (this._isCut && this._model.path === this._prevPath) {
                    node.classList.add(CUT_CLASS);
                }
            }
            // add metadata to the node
            node.setAttribute('data-isdir', item.type === 'directory' ? 'true' : 'false');
        });
        // Handle the selectors on the widget node.
        const selected = Object.keys(this.selection).length;
        if (selected) {
            this.addClass(SELECTED_CLASS);
            if (selected > 1) {
                this.addClass(MULTI_SELECTED_CLASS);
            }
        }
        // Handle file session statuses.
        const paths = items.map(item => item.path);
        each(this._model.sessions(), session => {
            var _a;
            const index = ArrayExt.firstIndexOf(paths, session.path);
            const node = nodes[index];
            // Node may have been filtered out.
            if (node) {
                let name = (_a = session.kernel) === null || _a === void 0 ? void 0 : _a.name;
                const specs = this._model.specs;
                node.classList.add(RUNNING_CLASS);
                if (specs && name) {
                    const spec = specs.kernelspecs[name];
                    name = spec ? spec.display_name : 'unknown'; // FIXME-TRANS: Is this localizable?
                }
                node.title = this._trans.__('%1\nKernel: %2', node.title, name);
            }
        });
        this._prevPath = this._model.path;
    }
    onResize(msg) {
        const { width } = msg.width === -1 ? this.node.getBoundingClientRect() : msg;
        this.toggleClass('jp-DirListing-narrow', width < 250);
    }
    setColumnVisibility(name, visible) {
        if (visible) {
            this._hiddenColumns.delete(name);
        }
        else {
            this._hiddenColumns.add(name);
        }
        this.headerNode.innerHTML = '';
        this._renderer.populateHeaderNode(this.headerNode, this.translator, this._hiddenColumns);
    }
    /**
     * Handle the `'click'` event for the widget.
     */
    _evtClick(event) {
        const target = event.target;
        const header = this.headerNode;
        if (header.contains(target)) {
            const state = this.renderer.handleHeaderClick(header, event);
            if (state) {
                this.sort(state);
            }
            return;
        }
    }
    /**
     * Handle the `'scroll'` event for the widget.
     */
    _evtScroll(event) {
        this.headerNode.scrollLeft = this.contentNode.scrollLeft;
    }
    /**
     * Handle the `'mousedown'` event for the widget.
     */
    _evtMousedown(event) {
        // Bail if clicking within the edit node
        if (event.target === this._editNode) {
            return;
        }
        // Blur the edit node if necessary.
        if (this._editNode.parentNode) {
            if (this._editNode !== event.target) {
                this._editNode.focus();
                this._editNode.blur();
                clearTimeout(this._selectTimer);
            }
            else {
                return;
            }
        }
        let index = Private.hitTestNodes(this._items, event);
        if (index === -1) {
            return;
        }
        this.handleFileSelect(event);
        if (event.button !== 0) {
            clearTimeout(this._selectTimer);
        }
        // Check for clearing a context menu.
        const newContext = (IS_MAC && event.ctrlKey) || event.button === 2;
        if (newContext) {
            return;
        }
        // Left mouse press for drag start.
        if (event.button === 0) {
            this._dragData = {
                pressX: event.clientX,
                pressY: event.clientY,
                index: index
            };
            document.addEventListener('mouseup', this, true);
            document.addEventListener('mousemove', this, true);
        }
    }
    /**
     * Handle the `'mouseup'` event for the widget.
     */
    _evtMouseup(event) {
        // Handle any soft selection from the previous mouse down.
        if (this._softSelection) {
            const altered = event.metaKey || event.shiftKey || event.ctrlKey;
            // See if we need to clear the other selection.
            if (!altered && event.button === 0) {
                this.clearSelectedItems();
                this.selection[this._softSelection] = true;
                this.update();
            }
            this._softSelection = '';
        }
        // Re-focus the selected file. This is needed because nodes corresponding
        // to files selected in mousedown handler will not retain the focus
        // as mousedown event is always followed by a blur/focus event.
        if (event.button === 0) {
            this._focusSelectedFile();
        }
        // Remove the drag listeners if necessary.
        if (event.button !== 0 || !this._drag) {
            document.removeEventListener('mousemove', this, true);
            document.removeEventListener('mouseup', this, true);
            return;
        }
        event.preventDefault();
        event.stopPropagation();
    }
    /**
     * Handle the `'mousemove'` event for the widget.
     */
    _evtMousemove(event) {
        event.preventDefault();
        event.stopPropagation();
        // Bail if we are the one dragging.
        if (this._drag || !this._dragData) {
            return;
        }
        // Check for a drag initialization.
        const data = this._dragData;
        const dx = Math.abs(event.clientX - data.pressX);
        const dy = Math.abs(event.clientY - data.pressY);
        if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
            return;
        }
        this._startDrag(data.index, event.clientX, event.clientY);
    }
    /**
     * Handle the opening of an item.
     */
    handleOpen(item) {
        this._onItemOpened.emit(item);
        if (item.type === 'directory') {
            const localPath = this._manager.services.contents.localPath(item.path);
            this._model
                .cd(`/${localPath}`)
                .catch(error => showErrorMessage(this._trans._p('showErrorMessage', 'Open directory'), error));
        }
        else {
            const path = item.path;
            this._manager.openOrReveal(path);
        }
    }
    /**
     * Handle the `'keydown'` event for the widget.
     */
    evtKeydown(event) {
        switch (event.keyCode) {
            case 13: {
                // Enter
                // Do nothing if any modifier keys are pressed.
                if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                const selected = Object.keys(this.selection);
                const path = selected[0];
                const items = this._sortedItems;
                const i = ArrayExt.findFirstIndex(items, value => value.path === path);
                if (i === -1) {
                    return;
                }
                const item = this._sortedItems[i];
                this.handleOpen(item);
                break;
            }
            case 38: // Up arrow
                this.selectPrevious(event.shiftKey);
                event.stopPropagation();
                event.preventDefault();
                break;
            case 40: // Down arrow
                this.selectNext(event.shiftKey);
                event.stopPropagation();
                event.preventDefault();
                break;
            default:
                break;
        }
        // Detects printable characters typed by the user.
        // Not all browsers support .key, but it discharges us from reconstructing
        // characters from key codes.
        if (!this._inRename && event.key !== undefined && event.key.length === 1) {
            if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
                return;
            }
            this._searchPrefix += event.key;
            clearTimeout(this._searchPrefixTimer);
            this._searchPrefixTimer = window.setTimeout(() => {
                this._searchPrefix = '';
            }, PREFIX_APPEND_DURATION);
            this.selectByPrefix();
            event.stopPropagation();
            event.preventDefault();
        }
    }
    /**
     * Handle the `'dblclick'` event for the widget.
     */
    evtDblClick(event) {
        // Do nothing if it's not a left mouse press.
        if (event.button !== 0) {
            return;
        }
        // Do nothing if any modifier keys are pressed.
        if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
            return;
        }
        // Stop the event propagation.
        event.preventDefault();
        event.stopPropagation();
        clearTimeout(this._selectTimer);
        this._editNode.blur();
        // Find a valid double click target.
        const target = event.target;
        const i = ArrayExt.findFirstIndex(this._items, node => node.contains(target));
        if (i === -1) {
            return;
        }
        const item = this._sortedItems[i];
        this.handleOpen(item);
    }
    /**
     * Handle the `drop` event for the widget.
     */
    evtNativeDrop(event) {
        var _a, _b, _c;
        const files = (_a = event.dataTransfer) === null || _a === void 0 ? void 0 : _a.files;
        if (!files || files.length === 0) {
            return;
        }
        const length = (_b = event.dataTransfer) === null || _b === void 0 ? void 0 : _b.items.length;
        if (!length) {
            return;
        }
        for (let i = 0; i < length; i++) {
            let entry = (_c = event.dataTransfer) === null || _c === void 0 ? void 0 : _c.items[i].webkitGetAsEntry();
            if (entry.isDirectory) {
                console.log('currently not supporting drag + drop for folders');
                void showDialog({
                    title: this._trans.__('Error Uploading Folder'),
                    body: this._trans.__('Drag and Drop is currently not supported for folders'),
                    buttons: [Dialog.cancelButton({ label: this._trans.__('Close') })]
                });
            }
        }
        event.preventDefault();
        for (let i = 0; i < files.length; i++) {
            void this._model.upload(files[i]);
        }
    }
    /**
     * Handle the `'lm-dragenter'` event for the widget.
     */
    evtDragEnter(event) {
        if (event.mimeData.hasData(CONTENTS_MIME)) {
            const index = Private.hitTestNodes(this._items, event);
            if (index === -1) {
                return;
            }
            const item = this._sortedItems[index];
            if (item.type !== 'directory' || this.selection[item.path]) {
                return;
            }
            const target = event.target;
            target.classList.add(DROP_TARGET_CLASS);
            event.preventDefault();
            event.stopPropagation();
        }
    }
    /**
     * Handle the `'lm-dragleave'` event for the widget.
     */
    evtDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        const dropTarget = DOMUtils.findElement(this.node, DROP_TARGET_CLASS);
        if (dropTarget) {
            dropTarget.classList.remove(DROP_TARGET_CLASS);
        }
    }
    /**
     * Handle the `'lm-dragover'` event for the widget.
     */
    evtDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.dropAction = event.proposedAction;
        const dropTarget = DOMUtils.findElement(this.node, DROP_TARGET_CLASS);
        if (dropTarget) {
            dropTarget.classList.remove(DROP_TARGET_CLASS);
        }
        const index = Private.hitTestNodes(this._items, event);
        this._items[index].classList.add(DROP_TARGET_CLASS);
    }
    /**
     * Handle the `'lm-drop'` event for the widget.
     */
    evtDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        clearTimeout(this._selectTimer);
        if (event.proposedAction === 'none') {
            event.dropAction = 'none';
            return;
        }
        if (!event.mimeData.hasData(CONTENTS_MIME)) {
            return;
        }
        let target = event.target;
        while (target && target.parentElement) {
            if (target.classList.contains(DROP_TARGET_CLASS)) {
                target.classList.remove(DROP_TARGET_CLASS);
                break;
            }
            target = target.parentElement;
        }
        // Get the path based on the target node.
        const index = ArrayExt.firstIndexOf(this._items, target);
        const items = this._sortedItems;
        let basePath = this._model.path;
        if (items[index].type === 'directory') {
            basePath = PathExt.join(basePath, items[index].name);
        }
        const manager = this._manager;
        // Handle the items.
        const promises = [];
        const paths = event.mimeData.getData(CONTENTS_MIME);
        if (event.ctrlKey && event.proposedAction === 'move') {
            event.dropAction = 'copy';
        }
        else {
            event.dropAction = event.proposedAction;
        }
        for (const path of paths) {
            const localPath = manager.services.contents.localPath(path);
            const name = PathExt.basename(localPath);
            const newPath = PathExt.join(basePath, name);
            // Skip files that are not moving.
            if (newPath === path) {
                continue;
            }
            if (event.dropAction === 'copy') {
                promises.push(manager.copy(path, basePath));
            }
            else {
                promises.push(renameFile(manager, path, newPath));
            }
        }
        Promise.all(promises).catch(error => {
            void showErrorMessage(this._trans._p('showErrorMessage', 'Error while copying/moving files'), error);
        });
    }
    /**
     * Start a drag event.
     */
    _startDrag(index, clientX, clientY) {
        let selectedPaths = Object.keys(this.selection);
        const source = this._items[index];
        const items = this._sortedItems;
        let selectedItems;
        let item;
        // If the source node is not selected, use just that node.
        if (!source.classList.contains(SELECTED_CLASS)) {
            item = items[index];
            selectedPaths = [item.path];
            selectedItems = [item];
        }
        else {
            const path = selectedPaths[0];
            item = find(items, value => value.path === path);
            selectedItems = toArray(this.selectedItems());
        }
        if (!item) {
            return;
        }
        // Create the drag image.
        const ft = this._manager.registry.getFileTypeForModel(item);
        const dragImage = this.renderer.createDragImage(source, selectedPaths.length, this._trans, ft);
        // Set up the drag event.
        this._drag = new Drag({
            dragImage,
            mimeData: new MimeData(),
            supportedActions: 'move',
            proposedAction: 'move'
        });
        this._drag.mimeData.setData(CONTENTS_MIME, selectedPaths);
        // Add thunks for getting mime data content.
        // We thunk the content so we don't try to make a network call
        // when it's not needed. E.g. just moving files around
        // in a filebrowser
        const services = this.model.manager.services;
        for (const item of selectedItems) {
            this._drag.mimeData.setData(CONTENTS_MIME_RICH, {
                model: item,
                withContent: async () => {
                    return await services.contents.get(item.path);
                }
            });
        }
        if (item && item.type !== 'directory') {
            const otherPaths = selectedPaths.slice(1).reverse();
            this._drag.mimeData.setData(FACTORY_MIME, () => {
                if (!item) {
                    return;
                }
                const path = item.path;
                let widget = this._manager.findWidget(path);
                if (!widget) {
                    widget = this._manager.open(item.path);
                }
                if (otherPaths.length) {
                    const firstWidgetPlaced = new PromiseDelegate();
                    void firstWidgetPlaced.promise.then(() => {
                        let prevWidget = widget;
                        otherPaths.forEach(path => {
                            const options = {
                                ref: prevWidget === null || prevWidget === void 0 ? void 0 : prevWidget.id,
                                mode: 'tab-after'
                            };
                            prevWidget = this._manager.openOrReveal(path, void 0, void 0, options);
                            this._manager.openOrReveal(item.path);
                        });
                    });
                    firstWidgetPlaced.resolve(void 0);
                }
                return widget;
            });
        }
        // Start the drag and remove the mousemove and mouseup listeners.
        document.removeEventListener('mousemove', this, true);
        document.removeEventListener('mouseup', this, true);
        clearTimeout(this._selectTimer);
        void this._drag.start(clientX, clientY).then(action => {
            this._drag = null;
            clearTimeout(this._selectTimer);
        });
    }
    /**
     * Handle selection on a file node.
     */
    handleFileSelect(event) {
        // Fetch common variables.
        const items = this._sortedItems;
        const index = Private.hitTestNodes(this._items, event);
        clearTimeout(this._selectTimer);
        if (index === -1) {
            return;
        }
        // Clear any existing soft selection.
        this._softSelection = '';
        const path = items[index].path;
        const selected = Object.keys(this.selection);
        // Handle toggling.
        if ((IS_MAC && event.metaKey) || (!IS_MAC && event.ctrlKey)) {
            if (this.selection[path]) {
                delete this.selection[path];
            }
            else {
                this.selection[path] = true;
            }
            // Handle multiple select.
        }
        else if (event.shiftKey) {
            this._handleMultiSelect(selected, index);
            // Handle a 'soft' selection
        }
        else if (path in this.selection && selected.length > 1) {
            this._softSelection = path;
            // Default to selecting the only the item.
        }
        else {
            // Select only the given item.
            return this._selectItem(index, false);
        }
        this.update();
    }
    /**
     * (Re-)focus on the selected file.
     *
     * If index is not given, it will be inferred from the current selection;
     * providing index saves on the iteration time.
     */
    _focusSelectedFile(index) {
        if (typeof index === 'undefined') {
            const selected = Object.keys(this.selection);
            if (selected.length > 1) {
                // Multiselect - do not focus on any single file
                return;
            }
            index = ArrayExt.findFirstIndex(this._sortedItems, value => value.path === selected[0]);
        }
        if (index === -1) {
            return;
        }
        // Focus on text to make shortcuts works
        const node = this._items[index];
        const text = DOMUtils.findElement(node, ITEM_TEXT_CLASS);
        if (text) {
            text.focus();
        }
    }
    /**
     * Handle a multiple select on a file item node.
     */
    _handleMultiSelect(selected, index) {
        // Find the "nearest selected".
        const items = this._sortedItems;
        let nearestIndex = -1;
        for (let i = 0; i < this._items.length; i++) {
            if (i === index) {
                continue;
            }
            const path = items[i].path;
            if (selected.indexOf(path) !== -1) {
                if (nearestIndex === -1) {
                    nearestIndex = i;
                }
                else {
                    if (Math.abs(index - i) < Math.abs(nearestIndex - i)) {
                        nearestIndex = i;
                    }
                }
            }
        }
        // Default to the first element (and fill down).
        if (nearestIndex === -1) {
            nearestIndex = 0;
        }
        // Select the rows between the current and the nearest selected.
        for (let i = 0; i < this._items.length; i++) {
            if ((nearestIndex >= i && index <= i) ||
                (nearestIndex <= i && index >= i)) {
                this.selection[items[i].path] = true;
            }
        }
    }
    /**
     * Copy the selected items, and optionally cut as well.
     */
    _copy() {
        this._clipboard.length = 0;
        each(this.selectedItems(), item => {
            this._clipboard.push(item.path);
        });
    }
    /**
     * Delete the files with the given paths.
     */
    async _delete(paths) {
        await Promise.all(paths.map(path => this._model.manager.deleteFile(path).catch(err => {
            void showErrorMessage(this._trans._p('showErrorMessage', 'Delete Failed'), err);
        })));
    }
    /**
     * Allow the user to rename item on a given row.
     */
    _doRename() {
        this._inRename = true;
        const items = this._sortedItems;
        const path = Object.keys(this.selection)[0];
        const index = ArrayExt.findFirstIndex(items, value => value.path === path);
        const row = this._items[index];
        const item = items[index];
        const nameNode = this.renderer.getNameNode(row);
        const original = item.name;
        this._editNode.value = original;
        this._selectItem(index, false);
        return Private.doRename(nameNode, this._editNode, original).then(newName => {
            this.node.focus();
            if (!newName || newName === original) {
                this._inRename = false;
                return original;
            }
            if (!isValidFileName(newName)) {
                void showErrorMessage(this._trans.__('Rename Error'), Error(this._trans._p('showErrorMessage', '"%1" is not a valid name for a file. Names must have nonzero length, and cannot include "/", "\\", or ":"', newName)));
                this._inRename = false;
                return original;
            }
            if (this.isDisposed) {
                this._inRename = false;
                throw new Error('File browser is disposed.');
            }
            const manager = this._manager;
            const oldPath = PathExt.join(this._model.path, original);
            const newPath = PathExt.join(this._model.path, newName);
            const promise = renameFile(manager, oldPath, newPath);
            return promise
                .catch(error => {
                if (error !== 'File not renamed') {
                    void showErrorMessage(this._trans._p('showErrorMessage', 'Rename Error'), error);
                }
                this._inRename = false;
                return original;
            })
                .then(() => {
                if (this.isDisposed) {
                    this._inRename = false;
                    throw new Error('File browser is disposed.');
                }
                if (this._inRename) {
                    // No need to catch because `newName` will always exit.
                    void this.selectItemByName(newName);
                }
                this._inRename = false;
                return newName;
            });
        });
    }
    /**
     * Select a given item.
     */
    _selectItem(index, keepExisting, focus = true) {
        // Selected the given row(s)
        const items = this._sortedItems;
        if (!keepExisting) {
            this.clearSelectedItems();
        }
        const path = items[index].path;
        this.selection[path] = true;
        if (!keepExisting && focus) {
            this._focusSelectedFile(index);
        }
        this.update();
    }
    /**
     * Handle the `refreshed` signal from the model.
     */
    _onModelRefreshed() {
        // Update the selection.
        const existing = Object.keys(this.selection);
        this.clearSelectedItems();
        each(this._model.items(), item => {
            const path = item.path;
            if (existing.indexOf(path) !== -1) {
                this.selection[path] = true;
            }
        });
        if (this.isVisible) {
            // Update the sorted items.
            this.sort(this.sortState);
        }
        else {
            this._isDirty = true;
        }
    }
    /**
     * Handle a `pathChanged` signal from the model.
     */
    _onPathChanged() {
        // Reset the selection.
        this.clearSelectedItems();
        // Update the sorted items.
        this.sort(this.sortState);
    }
    /**
     * Handle a `fileChanged` signal from the model.
     */
    _onFileChanged(sender, args) {
        const newValue = args.newValue;
        if (!newValue) {
            return;
        }
        const name = newValue.name;
        if (args.type !== 'new' || !name) {
            return;
        }
        void this.selectItemByName(name).catch(() => {
            /* Ignore if file does not exist. */
        });
    }
    /**
     * Handle an `activateRequested` signal from the manager.
     */
    _onActivateRequested(sender, args) {
        const dirname = PathExt.dirname(args);
        if (dirname !== this._model.path) {
            return;
        }
        const basename = PathExt.basename(args);
        this.selectItemByName(basename).catch(() => {
            /* Ignore if file does not exist. */
        });
    }
}
/**
 * The namespace for the `DirListing` class statics.
 */
(function (DirListing) {
    /**
     * The default implementation of an `IRenderer`.
     */
    class Renderer {
        /**
         * Create the DOM node for a dir listing.
         */
        createNode() {
            const node = document.createElement('div');
            const header = document.createElement('div');
            const content = document.createElement('ul');
            content.className = CONTENT_CLASS;
            header.className = HEADER_CLASS;
            node.appendChild(header);
            node.appendChild(content);
            node.tabIndex = 0;
            return node;
        }
        /**
         * Populate and empty header node for a dir listing.
         *
         * @param node - The header node to populate.
         */
        populateHeaderNode(node, translator, hiddenColumns) {
            var _a;
            translator = translator || nullTranslator;
            const trans = translator.load('jupyterlab');
            const name = this.createHeaderItemNode(trans.__('Name'));
            const narrow = document.createElement('div');
            const modified = this.createHeaderItemNode(trans.__('Last Modified'));
            name.classList.add(NAME_ID_CLASS);
            name.classList.add(SELECTED_CLASS);
            modified.classList.add(MODIFIED_ID_CLASS);
            narrow.classList.add(NARROW_ID_CLASS);
            narrow.textContent = '...';
            node.appendChild(name);
            node.appendChild(narrow);
            node.appendChild(modified);
            if ((_a = hiddenColumns === null || hiddenColumns === void 0 ? void 0 : hiddenColumns.has) === null || _a === void 0 ? void 0 : _a.call(hiddenColumns, 'last_modified')) {
                modified.classList.add(MODIFIED_COLUMN_HIDDEN);
            }
            else {
                modified.classList.remove(MODIFIED_COLUMN_HIDDEN);
            }
            // set the initial caret icon
            Private.updateCaret(DOMUtils.findElement(name, HEADER_ITEM_ICON_CLASS), 'right', 'up');
        }
        /**
         * Handle a header click.
         *
         * @param node - A node populated by [[populateHeaderNode]].
         *
         * @param event - A click event on the node.
         *
         * @returns The sort state of the header after the click event.
         */
        handleHeaderClick(node, event) {
            const name = DOMUtils.findElement(node, NAME_ID_CLASS);
            const modified = DOMUtils.findElement(node, MODIFIED_ID_CLASS);
            const state = { direction: 'ascending', key: 'name' };
            const target = event.target;
            if (name.contains(target)) {
                const modifiedIcon = DOMUtils.findElement(modified, HEADER_ITEM_ICON_CLASS);
                const nameIcon = DOMUtils.findElement(name, HEADER_ITEM_ICON_CLASS);
                if (name.classList.contains(SELECTED_CLASS)) {
                    if (!name.classList.contains(DESCENDING_CLASS)) {
                        state.direction = 'descending';
                        name.classList.add(DESCENDING_CLASS);
                        Private.updateCaret(nameIcon, 'right', 'down');
                    }
                    else {
                        name.classList.remove(DESCENDING_CLASS);
                        Private.updateCaret(nameIcon, 'right', 'up');
                    }
                }
                else {
                    name.classList.remove(DESCENDING_CLASS);
                    Private.updateCaret(nameIcon, 'right', 'up');
                }
                name.classList.add(SELECTED_CLASS);
                modified.classList.remove(SELECTED_CLASS);
                modified.classList.remove(DESCENDING_CLASS);
                Private.updateCaret(modifiedIcon, 'left');
                return state;
            }
            if (modified.contains(target)) {
                const modifiedIcon = DOMUtils.findElement(modified, HEADER_ITEM_ICON_CLASS);
                const nameIcon = DOMUtils.findElement(name, HEADER_ITEM_ICON_CLASS);
                state.key = 'last_modified';
                if (modified.classList.contains(SELECTED_CLASS)) {
                    if (!modified.classList.contains(DESCENDING_CLASS)) {
                        state.direction = 'descending';
                        modified.classList.add(DESCENDING_CLASS);
                        Private.updateCaret(modifiedIcon, 'left', 'down');
                    }
                    else {
                        modified.classList.remove(DESCENDING_CLASS);
                        Private.updateCaret(modifiedIcon, 'left', 'up');
                    }
                }
                else {
                    modified.classList.remove(DESCENDING_CLASS);
                    Private.updateCaret(modifiedIcon, 'left', 'up');
                }
                modified.classList.add(SELECTED_CLASS);
                name.classList.remove(SELECTED_CLASS);
                name.classList.remove(DESCENDING_CLASS);
                Private.updateCaret(nameIcon, 'right');
                return state;
            }
            return state;
        }
        /**
         * Create a new item node for a dir listing.
         *
         * @returns A new DOM node to use as a content item.
         */
        createItemNode(hiddenColumns) {
            var _a;
            const node = document.createElement('li');
            const icon = document.createElement('span');
            const text = document.createElement('span');
            const modified = document.createElement('span');
            icon.className = ITEM_ICON_CLASS;
            text.className = ITEM_TEXT_CLASS;
            modified.className = ITEM_MODIFIED_CLASS;
            node.appendChild(icon);
            node.appendChild(text);
            node.appendChild(modified);
            // Make the text note focusable so that it receives keyboard events;
            // text node was specifically chosen to receive shortcuts because
            // text element gets substituted with input area during file name edits
            // which conveniently deactivate irrelevant shortcuts.
            text.tabIndex = 0;
            if ((_a = hiddenColumns === null || hiddenColumns === void 0 ? void 0 : hiddenColumns.has) === null || _a === void 0 ? void 0 : _a.call(hiddenColumns, 'last_modified')) {
                modified.classList.add(MODIFIED_COLUMN_HIDDEN);
            }
            else {
                modified.classList.remove(MODIFIED_COLUMN_HIDDEN);
            }
            return node;
        }
        /**
         * Update an item node to reflect the current state of a model.
         *
         * @param node - A node created by [[createItemNode]].
         *
         * @param model - The model object to use for the item state.
         *
         * @param fileType - The file type of the item, if applicable.
         *
         */
        updateItemNode(node, model, fileType, translator, hiddenColumns) {
            var _a;
            translator = translator || nullTranslator;
            fileType =
                fileType || DocumentRegistry.getDefaultTextFileType(translator);
            const { icon, iconClass, name } = fileType;
            translator = translator || nullTranslator;
            const trans = translator.load('jupyterlab');
            const iconContainer = DOMUtils.findElement(node, ITEM_ICON_CLASS);
            const text = DOMUtils.findElement(node, ITEM_TEXT_CLASS);
            const modified = DOMUtils.findElement(node, ITEM_MODIFIED_CLASS);
            if ((_a = hiddenColumns === null || hiddenColumns === void 0 ? void 0 : hiddenColumns.has) === null || _a === void 0 ? void 0 : _a.call(hiddenColumns, 'last_modified')) {
                modified.classList.add(MODIFIED_COLUMN_HIDDEN);
            }
            else {
                modified.classList.remove(MODIFIED_COLUMN_HIDDEN);
            }
            // render the file item's icon
            LabIcon.resolveElement({
                icon,
                iconClass: classes(iconClass, 'jp-Icon'),
                container: iconContainer,
                className: ITEM_ICON_CLASS,
                stylesheet: 'listing'
            });
            let hoverText = trans.__('Name: %1', model.name);
            // add file size to pop up if its available
            if (model.size !== null && model.size !== undefined) {
                hoverText += trans.__('\nSize: %1', Private.formatFileSize(model.size, 1, 1024));
            }
            if (model.path) {
                const dirname = PathExt.dirname(model.path);
                if (dirname) {
                    hoverText += trans.__('\nPath: %1', dirname.substr(0, 50));
                    if (dirname.length > 50) {
                        hoverText += '...';
                    }
                }
            }
            if (model.created) {
                hoverText += trans.__('\nCreated: %1', Time.format(new Date(model.created), 'YYYY-MM-DD HH:mm:ss'));
            }
            if (model.last_modified) {
                hoverText += trans.__('\nModified: %1', Time.format(new Date(model.last_modified), 'YYYY-MM-DD HH:mm:ss'));
            }
            hoverText += trans.__('\nWritable: %1', model.writable);
            node.title = hoverText;
            node.setAttribute('data-file-type', name);
            if (model.name.startsWith('.')) {
                node.setAttribute('data-is-dot', 'true');
            }
            else {
                node.removeAttribute('data-is-dot');
            }
            // If an item is being edited currently, its text node is unavailable.
            if (text) {
                const indices = !model.indices ? [] : model.indices;
                let highlightedName = StringExt.highlight(model.name, indices, h.mark);
                VirtualDOM.render(h.span(highlightedName), text);
            }
            let modText = '';
            let modTitle = '';
            if (model.last_modified) {
                modText = Time.formatHuman(new Date(model.last_modified));
                modTitle = Time.format(new Date(model.last_modified), 'lll');
            }
            modified.textContent = modText;
            modified.title = modTitle;
        }
        /**
         * Get the node containing the file name.
         *
         * @param node - A node created by [[createItemNode]].
         *
         * @returns The node containing the file name.
         */
        getNameNode(node) {
            return DOMUtils.findElement(node, ITEM_TEXT_CLASS);
        }
        /**
         * Create a drag image for an item.
         *
         * @param node - A node created by [[createItemNode]].
         *
         * @param count - The number of items being dragged.
         *
         * @param fileType - The file type of the item, if applicable.
         *
         * @returns An element to use as the drag image.
         */
        createDragImage(node, count, trans, fileType) {
            const dragImage = node.cloneNode(true);
            const modified = DOMUtils.findElement(dragImage, ITEM_MODIFIED_CLASS);
            const icon = DOMUtils.findElement(dragImage, ITEM_ICON_CLASS);
            dragImage.removeChild(modified);
            if (!fileType) {
                icon.textContent = '';
                icon.className = '';
            }
            else {
                icon.textContent = fileType.iconLabel || '';
                icon.className = fileType.iconClass || '';
            }
            icon.classList.add(DRAG_ICON_CLASS);
            if (count > 1) {
                const nameNode = DOMUtils.findElement(dragImage, ITEM_TEXT_CLASS);
                nameNode.textContent = trans._n('%1 Item', '%1 Items', count);
            }
            return dragImage;
        }
        /**
         * Create a node for a header item.
         */
        createHeaderItemNode(label) {
            const node = document.createElement('div');
            const text = document.createElement('span');
            const icon = document.createElement('span');
            node.className = HEADER_ITEM_CLASS;
            text.className = HEADER_ITEM_TEXT_CLASS;
            icon.className = HEADER_ITEM_ICON_CLASS;
            text.textContent = label;
            node.appendChild(text);
            node.appendChild(icon);
            return node;
        }
    }
    DirListing.Renderer = Renderer;
    /**
     * The default `IRenderer` instance.
     */
    DirListing.defaultRenderer = new Renderer();
})(DirListing || (DirListing = {}));
/**
 * The namespace for the listing private data.
 */
var Private;
(function (Private) {
    /**
     * Handle editing text on a node.
     *
     * @returns Boolean indicating whether the name changed.
     */
    function doRename(text, edit, original) {
        const parent = text.parentElement;
        parent.replaceChild(edit, text);
        edit.focus();
        const index = edit.value.lastIndexOf('.');
        if (index === -1) {
            edit.setSelectionRange(0, edit.value.length);
        }
        else {
            edit.setSelectionRange(0, index);
        }
        return new Promise((resolve, reject) => {
            edit.onblur = () => {
                parent.replaceChild(text, edit);
                resolve(edit.value);
            };
            edit.onkeydown = (event) => {
                switch (event.keyCode) {
                    case 13: // Enter
                        event.stopPropagation();
                        event.preventDefault();
                        edit.blur();
                        break;
                    case 27: // Escape
                        event.stopPropagation();
                        event.preventDefault();
                        edit.value = original;
                        edit.blur();
                        break;
                    case 38: // Up arrow
                        event.stopPropagation();
                        event.preventDefault();
                        if (edit.selectionStart !== edit.selectionEnd) {
                            edit.selectionStart = edit.selectionEnd = 0;
                        }
                        break;
                    case 40: // Down arrow
                        event.stopPropagation();
                        event.preventDefault();
                        if (edit.selectionStart !== edit.selectionEnd) {
                            edit.selectionStart = edit.selectionEnd = edit.value.length;
                        }
                        break;
                    default:
                        break;
                }
            };
        });
    }
    Private.doRename = doRename;
    /**
     * Sort a list of items by sort state as a new array.
     */
    function sort(items, state) {
        const copy = toArray(items);
        const reverse = state.direction === 'descending' ? 1 : -1;
        if (state.key === 'last_modified') {
            // Sort by last modified (grouping directories first)
            copy.sort((a, b) => {
                const t1 = a.type === 'directory' ? 0 : 1;
                const t2 = b.type === 'directory' ? 0 : 1;
                const valA = new Date(a.last_modified).getTime();
                const valB = new Date(b.last_modified).getTime();
                return t1 - t2 || (valA - valB) * reverse;
            });
        }
        else {
            // Sort by name (grouping directories first)
            copy.sort((a, b) => {
                const t1 = a.type === 'directory' ? 0 : 1;
                const t2 = b.type === 'directory' ? 0 : 1;
                return t1 - t2 || b.name.localeCompare(a.name) * reverse;
            });
        }
        return copy;
    }
    Private.sort = sort;
    /**
     * Get the index of the node at a client position, or `-1`.
     */
    function hitTestNodes(nodes, event) {
        return ArrayExt.findFirstIndex(nodes, node => ElementExt.hitTest(node, event.clientX, event.clientY) ||
            event.target === node);
    }
    Private.hitTestNodes = hitTestNodes;
    /**
     * Format bytes to human readable string.
     */
    function formatFileSize(bytes, decimalPoint, k) {
        // https://www.codexworld.com/how-to/convert-file-size-bytes-kb-mb-gb-javascript/
        if (bytes === 0) {
            return '0 Bytes';
        }
        const dm = decimalPoint || 2;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        if (i >= 0 && i < sizes.length) {
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        }
        else {
            return String(bytes);
        }
    }
    Private.formatFileSize = formatFileSize;
    /**
     * Update an inline svg caret icon in a node.
     */
    function updateCaret(container, float, state) {
        if (state) {
            (state === 'down' ? caretDownIcon : caretUpIcon).element({
                container,
                tag: 'span',
                stylesheet: 'listingHeaderItem',
                float
            });
        }
        else {
            LabIcon.remove(container);
            container.className = HEADER_ITEM_ICON_CLASS;
        }
    }
    Private.updateCaret = updateCaret;
})(Private || (Private = {}));
//# sourceMappingURL=listing.js.map