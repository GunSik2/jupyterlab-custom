// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { defaultSanitizer, HoverBox } from '@jupyterlab/apputils';
import { toArray } from '@lumino/algorithm';
import { JSONExt } from '@lumino/coreutils';
import { ElementExt } from '@lumino/domutils';
import { Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
/**
 * The class name added to completer menu items.
 */
const ITEM_CLASS = 'jp-Completer-item';
/**
 * The class name added to an active completer menu item.
 */
const ACTIVE_CLASS = 'jp-mod-active';
/**
 * The minimum height of a completer widget.
 */
const MIN_HEIGHT = 20;
/**
 * The maximum height of a completer widget.
 */
const MAX_HEIGHT = 300;
/**
 * A flag to indicate that event handlers are caught in the capture phase.
 */
const USE_CAPTURE = true;
/**
 * The number of colors defined for the completer type annotations.
 * These are listed in completer/style/index.css#102-152.
 */
const N_COLORS = 10;
/**
 * A widget that enables text completion.
 *
 * #### Notes
 * The completer is intended to be absolutely positioned on the
 * page and hover over any other content, so it should be attached directly
 * to `document.body`, or a node that is the full size of `document.body`.
 * Attaching it to other nodes may incorrectly locate the completer.
 */
export class Completer extends Widget {
    /**
     * Construct a text completer menu widget.
     */
    constructor(options) {
        super({ node: document.createElement('div') });
        this._activeIndex = 0;
        this._editor = null;
        this._model = null;
        this._resetFlag = false;
        this._selected = new Signal(this);
        this._visibilityChanged = new Signal(this);
        this._indexChanged = new Signal(this);
        this._lastSubsetMatch = '';
        this._renderer = options.renderer || Completer.defaultRenderer;
        this.model = options.model || null;
        this.editor = options.editor || null;
        this.addClass('jp-Completer');
    }
    /**
     * The active index.
     */
    get activeIndex() {
        return this._activeIndex;
    }
    /**
     * The editor used by the completion widget.
     */
    get editor() {
        return this._editor;
    }
    set editor(newValue) {
        this._editor = newValue;
    }
    /**
     * A signal emitted when a selection is made from the completer menu.
     */
    get selected() {
        return this._selected;
    }
    /**
     * A signal emitted when the completer widget's visibility changes.
     *
     * #### Notes
     * This signal is useful when there are multiple floating widgets that may
     * contend with the same space and ought to be mutually exclusive.
     */
    get visibilityChanged() {
        return this._visibilityChanged;
    }
    /**
     * A signal emitted when the active index changes.
     */
    get indexChanged() {
        return this._indexChanged;
    }
    /**
     * The model used by the completer widget.
     */
    get model() {
        return this._model;
    }
    set model(model) {
        if ((!model && !this._model) || model === this._model) {
            return;
        }
        if (this._model) {
            this._model.stateChanged.disconnect(this.onModelStateChanged, this);
        }
        this._model = model;
        if (this._model) {
            this._model.stateChanged.connect(this.onModelStateChanged, this);
        }
    }
    /**
     * Dispose of the resources held by the completer widget.
     */
    dispose() {
        this._model = null;
        super.dispose();
    }
    /**
     * Handle the DOM events for the widget.
     *
     * @param event - The DOM event sent to the widget.
     *
     * #### Notes
     * This method implements the DOM `EventListener` interface and is
     * called in response to events on the dock panel's node. It should
     * not be called directly by user code.
     */
    handleEvent(event) {
        if (this.isHidden || !this._editor) {
            return;
        }
        switch (event.type) {
            case 'keydown':
                this._evtKeydown(event);
                break;
            case 'mousedown':
                this._evtMousedown(event);
                break;
            case 'scroll':
                this._evtScroll(event);
                break;
            default:
                break;
        }
    }
    /**
     * Reset the widget.
     */
    reset() {
        this._activeIndex = 0;
        this._lastSubsetMatch = '';
        if (this._model) {
            this._model.reset(true);
        }
    }
    /**
     * Emit the selected signal for the current active item and reset.
     */
    selectActive() {
        const active = this.node.querySelector(`.${ACTIVE_CLASS}`);
        if (!active) {
            this.reset();
            return;
        }
        this._selected.emit(active.getAttribute('data-value'));
        this.reset();
    }
    /**
     * Handle `after-attach` messages for the widget.
     */
    onAfterAttach(msg) {
        document.addEventListener('keydown', this, USE_CAPTURE);
        document.addEventListener('mousedown', this, USE_CAPTURE);
        document.addEventListener('scroll', this, USE_CAPTURE);
    }
    /**
     * Handle `before-detach` messages for the widget.
     */
    onBeforeDetach(msg) {
        document.removeEventListener('keydown', this, USE_CAPTURE);
        document.removeEventListener('mousedown', this, USE_CAPTURE);
        document.removeEventListener('scroll', this, USE_CAPTURE);
    }
    /**
     * Handle model state changes.
     */
    onModelStateChanged() {
        if (this.isAttached) {
            this._activeIndex = 0;
            this._indexChanged.emit(this._activeIndex);
            this.update();
        }
    }
    /**
     * Handle `update-request` messages.
     */
    onUpdateRequest(msg) {
        const model = this._model;
        if (!model) {
            return;
        }
        if (this._resetFlag) {
            this._resetFlag = false;
            if (!this.isHidden) {
                this.hide();
                this._visibilityChanged.emit(undefined);
            }
            return;
        }
        let node = null;
        let completionItemList = model.completionItems && model.completionItems();
        if (completionItemList && completionItemList.length) {
            node = this._createCompletionItemNode(model, completionItemList);
        }
        else {
            node = this._createIItemNode(model);
        }
        if (!node) {
            return;
        }
        let active = node.querySelectorAll(`.${ITEM_CLASS}`)[this._activeIndex];
        active.classList.add(ACTIVE_CLASS);
        // Add the documentation panel
        let docPanel = document.createElement('div');
        docPanel.className = 'jp-Completer-docpanel';
        node.appendChild(docPanel);
        this._updateDocPanel();
        // If this is the first time the current completer session has loaded,
        // populate any initial subset match.
        if (!model.query) {
            const populated = this._populateSubset();
            if (populated) {
                this.update();
                return;
            }
        }
        if (this.isHidden) {
            this.show();
            this._setGeometry();
            this._visibilityChanged.emit(undefined);
        }
        else {
            this._setGeometry();
        }
    }
    _createCompletionItemNode(model, items) {
        // If there are no items, reset and bail.
        if (!items.length) {
            this._resetFlag = true;
            this.reset();
            if (!this.isHidden) {
                this.hide();
                this._visibilityChanged.emit(undefined);
            }
            return null;
        }
        // Clear the node.
        let node = this.node;
        node.textContent = '';
        // Compute an ordered list of all the types in the typeMap, this is computed
        // once by the model each time new data arrives for efficiency.
        let orderedTypes = model.orderedTypes();
        // Populate the completer items.
        let ul = document.createElement('ul');
        ul.className = 'jp-Completer-list';
        for (let item of items) {
            if (!this._renderer.createCompletionItemNode) {
                return null;
            }
            let li = this._renderer.createCompletionItemNode(item, orderedTypes);
            ul.appendChild(li);
        }
        node.appendChild(ul);
        return node;
    }
    _createIItemNode(model) {
        const items = toArray(model.items());
        // If there are no items, reset and bail.
        if (!items || !items.length) {
            this._resetFlag = true;
            this.reset();
            if (!this.isHidden) {
                this.hide();
                this._visibilityChanged.emit(undefined);
            }
            return null;
        }
        // If there is only one option, signal and bail.
        // We don't test the filtered `items`, as that
        // is too aggressive of completer behavior, it can
        // lead to double typing of an option.
        const options = toArray(model.options());
        if (options.length === 1) {
            this._selected.emit(options[0]);
            this.reset();
            return null;
        }
        // Clear the node.
        const node = this.node;
        node.textContent = '';
        // Compute an ordered list of all the types in the typeMap, this is computed
        // once by the model each time new data arrives for efficiency.
        const orderedTypes = model.orderedTypes();
        // Populate the completer items.
        let ul = document.createElement('ul');
        ul.className = 'jp-Completer-list';
        for (const item of items) {
            const li = this._renderer.createItemNode(item, model.typeMap(), orderedTypes);
            ul.appendChild(li);
        }
        node.appendChild(ul);
        return node;
    }
    /**
     * Cycle through the available completer items.
     *
     * #### Notes
     * When the user cycles all the way `down` to the last index, subsequent
     * `down` cycles will cycle to the first index. When the user cycles `up` to
     * the first item, subsequent `up` cycles will cycle to the last index.
     */
    _cycle(direction) {
        const items = this.node.querySelectorAll(`.${ITEM_CLASS}`);
        const index = this._activeIndex;
        let active = this.node.querySelector(`.${ACTIVE_CLASS}`);
        active.classList.remove(ACTIVE_CLASS);
        if (direction === 'up') {
            this._activeIndex = index === 0 ? items.length - 1 : index - 1;
        }
        else if (direction === 'down') {
            this._activeIndex = index < items.length - 1 ? index + 1 : 0;
        }
        else {
            // Measure the number of items on a page.
            const boxHeight = this.node.getBoundingClientRect().height;
            const itemHeight = active.getBoundingClientRect().height;
            const pageLength = Math.floor(boxHeight / itemHeight);
            // Update the index
            if (direction === 'pageUp') {
                this._activeIndex = index - pageLength;
            }
            else {
                this._activeIndex = index + pageLength;
            }
            // Clamp to the length of the list.
            this._activeIndex = Math.min(Math.max(0, this._activeIndex), items.length - 1);
        }
        active = items[this._activeIndex];
        active.classList.add(ACTIVE_CLASS);
        let completionList = this.node.querySelector('.jp-Completer-list');
        ElementExt.scrollIntoViewIfNeeded(completionList, active);
        this._indexChanged.emit(this._activeIndex);
        this._updateDocPanel();
    }
    /**
     * Handle keydown events for the widget.
     */
    _evtKeydown(event) {
        if (this.isHidden || !this._editor) {
            return;
        }
        if (!this._editor.host.contains(event.target)) {
            this.reset();
            return;
        }
        switch (event.keyCode) {
            case 9: {
                // Tab key
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                const model = this._model;
                if (!model) {
                    return;
                }
                // Autoinsert single completions on manual request (tab)
                const items = model.completionItems && model.completionItems();
                if (items && items.length === 1) {
                    this._selected.emit(items[0].insertText || items[0].label);
                    this.reset();
                    return;
                }
                const populated = this._populateSubset();
                // If the common subset was found and set on `query`,
                // or if there is a `query` in the initialization options,
                // then emit a completion signal with that `query` (=subset match),
                // but only if the query has actually changed.
                // See: https://github.com/jupyterlab/jupyterlab/issues/10439#issuecomment-875189540
                if (model.query && model.query != this._lastSubsetMatch) {
                    model.subsetMatch = true;
                    this._selected.emit(model.query);
                    model.subsetMatch = false;
                    this._lastSubsetMatch = model.query;
                }
                // If the query changed, update rendering of the options.
                if (populated) {
                    this.update();
                }
                this._cycle(event.shiftKey ? 'up' : 'down');
                return;
            }
            case 27: // Esc key
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                this.reset();
                return;
            case 33: // PageUp
            case 34: // PageDown
            case 38: // Up arrow key
            case 40: {
                // Down arrow key
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                const cycle = Private.keyCodeMap[event.keyCode];
                this._cycle(cycle);
                return;
            }
            default:
                return;
        }
    }
    /**
     * Handle mousedown events for the widget.
     */
    _evtMousedown(event) {
        if (this.isHidden || !this._editor) {
            return;
        }
        if (Private.nonstandardClick(event)) {
            this.reset();
            return;
        }
        let target = event.target;
        while (target !== document.documentElement) {
            // If the user has made a selection, emit its value and reset the widget.
            if (target.classList.contains(ITEM_CLASS)) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                this._selected.emit(target.getAttribute('data-value'));
                this.reset();
                return;
            }
            // If the mouse event happened anywhere else in the widget, bail.
            if (target === this.node) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                return;
            }
            target = target.parentElement;
        }
        this.reset();
    }
    /**
     * Handle scroll events for the widget
     */
    _evtScroll(event) {
        if (this.isHidden || !this._editor) {
            return;
        }
        const { node } = this;
        // All scrolls except scrolls in the actual hover box node may cause the
        // referent editor that anchors the node to move, so the only scroll events
        // that can safely be ignored are ones that happen inside the hovering node.
        if (node.contains(event.target)) {
            return;
        }
        // Set the geometry of the node asynchronously.
        requestAnimationFrame(() => {
            this._setGeometry();
        });
    }
    /**
     * Populate the completer up to the longest initial subset of items.
     *
     * @returns `true` if a subset match was found and populated.
     */
    _populateSubset() {
        const { model } = this;
        if (!model) {
            return false;
        }
        const items = this.node.querySelectorAll(`.${ITEM_CLASS}`);
        const subset = Private.commonSubset(Private.itemValues(items));
        const { query } = model;
        // If a common subset exists and it is not the current query, highlight it.
        if (subset && subset !== query && subset.indexOf(query) === 0) {
            model.query = subset;
            return true;
        }
        return false;
    }
    /**
     * Set the visible dimensions of the widget.
     */
    _setGeometry() {
        const { node } = this;
        const model = this._model;
        const editor = this._editor;
        // This is an overly defensive test: `cursor` will always exist if
        // `original` exists, except in contrived tests. But since it is possible
        // to generate a runtime error, the check occurs here.
        if (!editor || !model || !model.original || !model.cursor) {
            return;
        }
        const start = model.cursor.start;
        const position = editor.getPositionAt(start);
        const anchor = editor.getCoordinateForPosition(position);
        const style = window.getComputedStyle(node);
        const borderLeft = parseInt(style.borderLeftWidth, 10) || 0;
        const paddingLeft = parseInt(style.paddingLeft, 10) || 0;
        // Calculate the geometry of the completer.
        HoverBox.setGeometry({
            anchor,
            host: editor.host,
            maxHeight: MAX_HEIGHT,
            minHeight: MIN_HEIGHT,
            node: node,
            offset: { horizontal: borderLeft + paddingLeft },
            privilege: 'below',
            style: style
        });
    }
    /**
     * Update the display-state and contents of the documentation panel
     */
    _updateDocPanel() {
        var _a, _b;
        let docPanel = this.node.querySelector('.jp-Completer-docpanel');
        if (!docPanel) {
            return;
        }
        if (!((_a = this.model) === null || _a === void 0 ? void 0 : _a.completionItems)) {
            return;
        }
        let items = (_b = this.model) === null || _b === void 0 ? void 0 : _b.completionItems();
        if (!items) {
            docPanel.setAttribute('style', 'display:none');
            return;
        }
        let activeItem = items[this._activeIndex];
        if (!activeItem) {
            docPanel.setAttribute('style', 'display:none');
            return;
        }
        docPanel.textContent = '';
        if (activeItem.documentation) {
            let node;
            if (!this._renderer.createDocumentationNode) {
                node = Completer.defaultRenderer.createDocumentationNode(activeItem);
            }
            else {
                node = this._renderer.createDocumentationNode(activeItem);
            }
            docPanel.appendChild(node);
            docPanel.setAttribute('style', '');
        }
        else {
            docPanel.setAttribute('style', 'display:none');
        }
    }
}
(function (Completer) {
    /**
     * The default implementation of an `IRenderer`.
     */
    class Renderer {
        /**
         * Create an item node from an ICompletionItem for a text completer menu.
         */
        createCompletionItemNode(item, orderedTypes) {
            let baseNode = this._createBaseNode(item.insertText || item.label);
            if (item.deprecated) {
                baseNode.classList.add('jp-Completer-deprecated');
            }
            return this._constructNode(baseNode, this._createMatchNode(item.label), !!item.type, item.type, orderedTypes, item.icon);
        }
        /**
         * Create an item node for a text completer menu.
         */
        createItemNode(item, typeMap, orderedTypes) {
            return this._constructNode(this._createBaseNode(item.raw), this._createMatchNode(item.text), !JSONExt.deepEqual(typeMap, {}), typeMap[item.raw] || '', orderedTypes);
        }
        /**
         * Create a documentation node for documentation panel.
         */
        createDocumentationNode(activeItem) {
            let pre = document.createElement('pre');
            pre.textContent = activeItem.documentation || '';
            return pre;
        }
        /**
         * Create base node with the value to be inserted
         */
        _createBaseNode(value) {
            const li = document.createElement('li');
            li.className = ITEM_CLASS;
            // Set the raw, un-marked up value as a data attribute.
            li.setAttribute('data-value', value);
            return li;
        }
        /**
         * Create match node to highlight potential prefix match within result.
         */
        _createMatchNode(result) {
            const matchNode = document.createElement('code');
            matchNode.className = 'jp-Completer-match';
            // Use innerHTML because search results include <mark> tags.
            matchNode.innerHTML = defaultSanitizer.sanitize(result, {
                allowedTags: ['mark']
            });
            return matchNode;
        }
        /**
         * Attaches type and match nodes to base node.
         */
        _constructNode(li, matchNode, typesExist, type, orderedTypes, icon) {
            // Add the icon or type monogram
            if (icon) {
                const iconNode = icon.element({
                    className: 'jp-Completer-type jp-Completer-icon'
                });
                li.appendChild(iconNode);
            }
            else if (typesExist) {
                const typeNode = document.createElement('span');
                typeNode.textContent = (type[0] || '').toLowerCase();
                const colorIndex = (orderedTypes.indexOf(type) % N_COLORS) + 1;
                typeNode.className = 'jp-Completer-type jp-Completer-monogram';
                typeNode.setAttribute(`data-color-index`, colorIndex.toString());
                li.appendChild(typeNode);
            }
            else {
                // Create empty span to ensure consistent list styling.
                // Otherwise, in a list of two items,
                // if one item has an icon, but the other has type,
                // the icon grows out of its bounds.
                const dummyNode = document.createElement('span');
                dummyNode.className = 'jp-Completer-monogram';
                li.appendChild(dummyNode);
            }
            li.appendChild(matchNode);
            // If there is a type, add the type extension and title
            if (typesExist) {
                li.title = type;
                const typeExtendedNode = document.createElement('code');
                typeExtendedNode.className = 'jp-Completer-typeExtended';
                typeExtendedNode.textContent = type.toLocaleLowerCase();
                li.appendChild(typeExtendedNode);
            }
            else {
                // If no type is present on the right,
                // the highlighting of the completion item
                // doesn't cover the entire row.
                const dummyTypeExtendedNode = document.createElement('span');
                dummyTypeExtendedNode.className = 'jp-Completer-typeExtended';
                li.appendChild(dummyTypeExtendedNode);
            }
            return li;
        }
    }
    Completer.Renderer = Renderer;
    /**
     * The default `IRenderer` instance.
     */
    Completer.defaultRenderer = new Renderer();
})(Completer || (Completer = {}));
/**
 * A namespace for completer widget private data.
 */
var Private;
(function (Private) {
    /**
     * Mapping from keyCodes to scrollTypes.
     */
    Private.keyCodeMap = {
        38: 'up',
        40: 'down',
        33: 'pageUp',
        34: 'pageDown'
    };
    /**
     * Returns the common subset string that a list of strings shares.
     */
    function commonSubset(values) {
        const len = values.length;
        let subset = '';
        if (len < 2) {
            return subset;
        }
        const strlen = values[0].length;
        for (let i = 0; i < strlen; i++) {
            const ch = values[0][i];
            for (let j = 1; j < len; j++) {
                if (values[j][i] !== ch) {
                    return subset;
                }
            }
            subset += ch;
        }
        return subset;
    }
    Private.commonSubset = commonSubset;
    /**
     * Returns the list of raw item values currently in the DOM.
     */
    function itemValues(items) {
        const values = [];
        for (let i = 0, len = items.length; i < len; i++) {
            const attr = items[i].getAttribute('data-value');
            if (attr) {
                values.push(attr);
            }
        }
        return values;
    }
    Private.itemValues = itemValues;
    /**
     * Returns true for any modified click event (i.e., not a left-click).
     */
    function nonstandardClick(event) {
        return (event.button !== 0 ||
            event.altKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.metaKey);
    }
    Private.nonstandardClick = nonstandardClick;
})(Private || (Private = {}));
//# sourceMappingURL=widget.js.map