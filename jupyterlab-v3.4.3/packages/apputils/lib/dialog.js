// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { Button, closeIcon, LabIcon } from '@jupyterlab/ui-components';
import { ArrayExt, each, map, toArray } from '@lumino/algorithm';
import { PromiseDelegate } from '@lumino/coreutils';
import { MessageLoop } from '@lumino/messaging';
import { Panel, PanelLayout, Widget } from '@lumino/widgets';
import * as React from 'react';
import { Styling } from './styling';
import { ReactWidget } from './vdom';
import { WidgetTracker } from './widgettracker';
/**
 * Create and show a dialog.
 *
 * @param options - The dialog setup options.
 *
 * @returns A promise that resolves with whether the dialog was accepted.
 */
export function showDialog(options = {}) {
    const dialog = new Dialog(options);
    return dialog.launch();
}
/**
 * Show an error message dialog.
 *
 * @param title - The title of the dialog box.
 *
 * @param error - the error to show in the dialog body (either a string
 *   or an object with a string `message` property).
 */
export function showErrorMessage(title, error, buttons = [
    Dialog.okButton({ label: 'Dismiss' })
]) {
    console.warn('Showing error:', error);
    // Cache promises to prevent multiple copies of identical dialogs showing
    // to the user.
    const body = typeof error === 'string' ? error : error.message;
    const key = title + '----' + body;
    const promise = Private.errorMessagePromiseCache.get(key);
    if (promise) {
        return promise;
    }
    else {
        const dialogPromise = showDialog({
            title: title,
            body: body,
            buttons: buttons
        }).then(() => {
            Private.errorMessagePromiseCache.delete(key);
        }, error => {
            // TODO: Use .finally() above when supported
            Private.errorMessagePromiseCache.delete(key);
            throw error;
        });
        Private.errorMessagePromiseCache.set(key, dialogPromise);
        return dialogPromise;
    }
}
/**
 * A modal dialog widget.
 */
export class Dialog extends Widget {
    /**
     * Create a dialog panel instance.
     *
     * @param options - The dialog setup options.
     */
    constructor(options = {}) {
        super();
        this._focusNodeSelector = '';
        this.addClass('jp-Dialog');
        const normalized = Private.handleOptions(options);
        const renderer = normalized.renderer;
        this._host = normalized.host;
        this._defaultButton = normalized.defaultButton;
        this._buttons = normalized.buttons;
        this._hasClose = normalized.hasClose;
        this._buttonNodes = toArray(map(this._buttons, button => {
            return renderer.createButtonNode(button);
        }));
        this._lastMouseDownInDialog = false;
        const layout = (this.layout = new PanelLayout());
        const content = new Panel();
        content.addClass('jp-Dialog-content');
        if (typeof options.body === 'string') {
            content.addClass('jp-Dialog-content-small');
        }
        layout.addWidget(content);
        this._body = normalized.body;
        const header = renderer.createHeader(normalized.title, () => this.reject(), options);
        const body = renderer.createBody(normalized.body);
        const footer = renderer.createFooter(this._buttonNodes);
        content.addWidget(header);
        content.addWidget(body);
        content.addWidget(footer);
        this._primary = this._buttonNodes[this._defaultButton];
        this._focusNodeSelector = options.focusNodeSelector;
        // Add new dialogs to the tracker.
        void Dialog.tracker.add(this);
    }
    /**
     * Dispose of the resources used by the dialog.
     */
    dispose() {
        const promise = this._promise;
        if (promise) {
            this._promise = null;
            promise.reject(void 0);
            ArrayExt.removeFirstOf(Private.launchQueue, promise.promise);
        }
        super.dispose();
    }
    /**
     * Launch the dialog as a modal window.
     *
     * @returns a promise that resolves with the result of the dialog.
     */
    launch() {
        // Return the existing dialog if already open.
        if (this._promise) {
            return this._promise.promise;
        }
        const promise = (this._promise = new PromiseDelegate());
        const promises = Promise.all(Private.launchQueue);
        Private.launchQueue.push(this._promise.promise);
        return promises.then(() => {
            // Do not show Dialog if it was disposed of before it was at the front of the launch queue
            if (!this._promise) {
                return Promise.resolve({ button: Dialog.cancelButton(), value: null });
            }
            Widget.attach(this, this._host);
            return promise.promise;
        });
    }
    /**
     * Resolve the current dialog.
     *
     * @param index - An optional index to the button to resolve.
     *
     * #### Notes
     * Will default to the defaultIndex.
     * Will resolve the current `show()` with the button value.
     * Will be a no-op if the dialog is not shown.
     */
    resolve(index) {
        if (!this._promise) {
            return;
        }
        if (index === undefined) {
            index = this._defaultButton;
        }
        this._resolve(this._buttons[index]);
    }
    /**
     * Reject the current dialog with a default reject value.
     *
     * #### Notes
     * Will be a no-op if the dialog is not shown.
     */
    reject() {
        if (!this._promise) {
            return;
        }
        this._resolve(Dialog.cancelButton());
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
            case 'keydown':
                this._evtKeydown(event);
                break;
            case 'mousedown':
                this._evtMouseDown(event);
                break;
            case 'click':
                this._evtClick(event);
                break;
            case 'focus':
                this._evtFocus(event);
                break;
            case 'contextmenu':
                event.preventDefault();
                event.stopPropagation();
                break;
            default:
                break;
        }
    }
    /**
     *  A message handler invoked on an `'after-attach'` message.
     */
    onAfterAttach(msg) {
        var _a;
        const node = this.node;
        node.addEventListener('keydown', this, true);
        node.addEventListener('contextmenu', this, true);
        node.addEventListener('click', this, true);
        document.addEventListener('mousedown', this, true);
        document.addEventListener('focus', this, true);
        this._first = Private.findFirstFocusable(this.node);
        this._original = document.activeElement;
        if (this._focusNodeSelector) {
            const body = this.node.querySelector('.jp-Dialog-body');
            const el = body === null || body === void 0 ? void 0 : body.querySelector(this._focusNodeSelector);
            if (el) {
                this._primary = el;
            }
        }
        (_a = this._primary) === null || _a === void 0 ? void 0 : _a.focus();
    }
    /**
     *  A message handler invoked on an `'after-detach'` message.
     */
    onAfterDetach(msg) {
        const node = this.node;
        node.removeEventListener('keydown', this, true);
        node.removeEventListener('contextmenu', this, true);
        node.removeEventListener('click', this, true);
        document.removeEventListener('focus', this, true);
        document.removeEventListener('mousedown', this, true);
        this._original.focus();
    }
    /**
     * A message handler invoked on a `'close-request'` message.
     */
    onCloseRequest(msg) {
        if (this._promise) {
            this.reject();
        }
        super.onCloseRequest(msg);
    }
    /**
     * Handle the `'click'` event for a dialog button.
     *
     * @param event - The DOM event sent to the widget
     */
    _evtClick(event) {
        const content = this.node.getElementsByClassName('jp-Dialog-content')[0];
        if (!content.contains(event.target)) {
            event.stopPropagation();
            event.preventDefault();
            if (this._hasClose && !this._lastMouseDownInDialog) {
                this.reject();
            }
            return;
        }
        for (const buttonNode of this._buttonNodes) {
            if (buttonNode.contains(event.target)) {
                const index = this._buttonNodes.indexOf(buttonNode);
                this.resolve(index);
            }
        }
    }
    /**
     * Handle the `'keydown'` event for the widget.
     *
     * @param event - The DOM event sent to the widget
     */
    _evtKeydown(event) {
        // Check for escape key
        switch (event.keyCode) {
            case 27: // Escape.
                event.stopPropagation();
                event.preventDefault();
                if (this._hasClose) {
                    this.reject();
                }
                break;
            case 37: {
                // Left arrow
                const activeEl = document.activeElement;
                if (activeEl instanceof HTMLButtonElement) {
                    let idx = this._buttonNodes.indexOf(activeEl) - 1;
                    // Handle a left arrows on the first button
                    if (idx < 0) {
                        idx = this._buttonNodes.length - 1;
                    }
                    const node = this._buttonNodes[idx];
                    event.stopPropagation();
                    event.preventDefault();
                    node.focus();
                }
                break;
            }
            case 39: {
                // Right arrow
                const activeEl = document.activeElement;
                if (activeEl instanceof HTMLButtonElement) {
                    let idx = this._buttonNodes.indexOf(activeEl) + 1;
                    // Handle a right arrows on the last button
                    if (idx == this._buttons.length) {
                        idx = 0;
                    }
                    const node = this._buttonNodes[idx];
                    event.stopPropagation();
                    event.preventDefault();
                    node.focus();
                }
                break;
            }
            case 9: {
                // Tab.
                // Handle a tab on the last button.
                const node = this._buttonNodes[this._buttons.length - 1];
                if (document.activeElement === node && !event.shiftKey) {
                    event.stopPropagation();
                    event.preventDefault();
                    this._first.focus();
                }
                break;
            }
            case 13: {
                // Enter.
                event.stopPropagation();
                event.preventDefault();
                const activeEl = document.activeElement;
                let index;
                if (activeEl instanceof HTMLButtonElement) {
                    index = this._buttonNodes.indexOf(activeEl);
                }
                this.resolve(index);
                break;
            }
            default:
                break;
        }
    }
    /**
     * Handle the `'focus'` event for the widget.
     *
     * @param event - The DOM event sent to the widget
     */
    _evtFocus(event) {
        var _a;
        const target = event.target;
        if (!this.node.contains(target)) {
            event.stopPropagation();
            (_a = this._buttonNodes[this._defaultButton]) === null || _a === void 0 ? void 0 : _a.focus();
        }
    }
    /**
     * Handle the `'mousedown'` event for the widget.
     *
     * @param event - The DOM event sent to the widget
     */
    _evtMouseDown(event) {
        const content = this.node.getElementsByClassName('jp-Dialog-content')[0];
        const target = event.target;
        this._lastMouseDownInDialog = content.contains(target);
    }
    /**
     * Resolve a button item.
     */
    _resolve(button) {
        // Prevent loopback.
        const promise = this._promise;
        if (!promise) {
            this.dispose();
            return;
        }
        this._promise = null;
        ArrayExt.removeFirstOf(Private.launchQueue, promise.promise);
        const body = this._body;
        let value = null;
        if (button.accept &&
            body instanceof Widget &&
            typeof body.getValue === 'function') {
            value = body.getValue();
        }
        this.dispose();
        promise.resolve({ button, value });
    }
}
/**
 * The namespace for Dialog class statics.
 */
(function (Dialog) {
    /**
     * Create a button item.
     */
    function createButton(value) {
        value.accept = value.accept !== false;
        const defaultLabel = value.accept ? 'OK' : 'Cancel';
        return {
            label: value.label || defaultLabel,
            iconClass: value.iconClass || '',
            iconLabel: value.iconLabel || '',
            caption: value.caption || '',
            className: value.className || '',
            accept: value.accept,
            actions: value.actions || [],
            displayType: value.displayType || 'default'
        };
    }
    Dialog.createButton = createButton;
    /**
     * Create a reject button.
     */
    function cancelButton(options = {}) {
        options.accept = false;
        return createButton(options);
    }
    Dialog.cancelButton = cancelButton;
    /**
     * Create an accept button.
     */
    function okButton(options = {}) {
        options.accept = true;
        return createButton(options);
    }
    Dialog.okButton = okButton;
    /**
     * Create a warn button.
     */
    function warnButton(options = {}) {
        options.displayType = 'warn';
        return createButton(options);
    }
    Dialog.warnButton = warnButton;
    /**
     * Disposes all dialog instances.
     *
     * #### Notes
     * This function should only be used in tests or cases where application state
     * may be discarded.
     */
    function flush() {
        Dialog.tracker.forEach(dialog => {
            dialog.dispose();
        });
    }
    Dialog.flush = flush;
    /**
     * The default implementation of a dialog renderer.
     */
    class Renderer {
        /**
         * Create the header of the dialog.
         *
         * @param title - The title of the dialog.
         *
         * @returns A widget for the dialog header.
         */
        createHeader(title, reject = () => {
            /* empty */
        }, options = {}) {
            let header;
            const handleMouseDown = (event) => {
                // Fire action only when left button is pressed.
                if (event.button === 0) {
                    event.preventDefault();
                    reject();
                }
            };
            const handleKeyDown = (event) => {
                const { key } = event;
                if (key === 'Enter' || key === ' ') {
                    reject();
                }
            };
            if (typeof title === 'string') {
                header = ReactWidget.create(React.createElement(React.Fragment, null,
                    title,
                    options.hasClose && (React.createElement(Button, { className: "jp-Dialog-close-button", onMouseDown: handleMouseDown, onKeyDown: handleKeyDown, title: "Cancel", minimal: true },
                        React.createElement(LabIcon.resolveReact, { icon: closeIcon, iconClass: "jp-Icon", className: "jp-ToolbarButtonComponent-icon", tag: "span" })))));
            }
            else {
                header = ReactWidget.create(title);
            }
            header.addClass('jp-Dialog-header');
            Styling.styleNode(header.node);
            return header;
        }
        /**
         * Create the body of the dialog.
         *
         * @param value - The input value for the body.
         *
         * @returns A widget for the body.
         */
        createBody(value) {
            let body;
            if (typeof value === 'string') {
                body = new Widget({ node: document.createElement('span') });
                body.node.textContent = value;
            }
            else if (value instanceof Widget) {
                body = value;
            }
            else {
                body = ReactWidget.create(value);
                // Immediately update the body even though it has not yet attached in
                // order to trigger a render of the DOM nodes from the React element.
                MessageLoop.sendMessage(body, Widget.Msg.UpdateRequest);
            }
            body.addClass('jp-Dialog-body');
            Styling.styleNode(body.node);
            return body;
        }
        /**
         * Create the footer of the dialog.
         *
         * @param buttonNodes - The buttons nodes to add to the footer.
         *
         * @returns A widget for the footer.
         */
        createFooter(buttons) {
            const footer = new Widget();
            footer.addClass('jp-Dialog-footer');
            each(buttons, button => {
                footer.node.appendChild(button);
            });
            Styling.styleNode(footer.node);
            return footer;
        }
        /**
         * Create a button node for the dialog.
         *
         * @param button - The button data.
         *
         * @returns A node for the button.
         */
        createButtonNode(button) {
            const e = document.createElement('button');
            e.className = this.createItemClass(button);
            e.appendChild(this.renderIcon(button));
            e.appendChild(this.renderLabel(button));
            return e;
        }
        /**
         * Create the class name for the button.
         *
         * @param data - The data to use for the class name.
         *
         * @returns The full class name for the button.
         */
        createItemClass(data) {
            // Setup the initial class name.
            let name = 'jp-Dialog-button';
            // Add the other state classes.
            if (data.accept) {
                name += ' jp-mod-accept';
            }
            else {
                name += ' jp-mod-reject';
            }
            if (data.displayType === 'warn') {
                name += ' jp-mod-warn';
            }
            // Add the extra class.
            const extra = data.className;
            if (extra) {
                name += ` ${extra}`;
            }
            // Return the complete class name.
            return name;
        }
        /**
         * Render an icon element for a dialog item.
         *
         * @param data - The data to use for rendering the icon.
         *
         * @returns An HTML element representing the icon.
         */
        renderIcon(data) {
            const e = document.createElement('div');
            e.className = this.createIconClass(data);
            e.appendChild(document.createTextNode(data.iconLabel));
            return e;
        }
        /**
         * Create the class name for the button icon.
         *
         * @param data - The data to use for the class name.
         *
         * @returns The full class name for the item icon.
         */
        createIconClass(data) {
            const name = 'jp-Dialog-buttonIcon';
            const extra = data.iconClass;
            return extra ? `${name} ${extra}` : name;
        }
        /**
         * Render the label element for a button.
         *
         * @param data - The data to use for rendering the label.
         *
         * @returns An HTML element representing the item label.
         */
        renderLabel(data) {
            const e = document.createElement('div');
            e.className = 'jp-Dialog-buttonLabel';
            e.title = data.caption;
            e.appendChild(document.createTextNode(data.label));
            return e;
        }
    }
    Dialog.Renderer = Renderer;
    /**
     * The default renderer instance.
     */
    Dialog.defaultRenderer = new Renderer();
    /**
     * The dialog widget tracker.
     */
    Dialog.tracker = new WidgetTracker({
        namespace: '@jupyterlab/apputils:Dialog'
    });
})(Dialog || (Dialog = {}));
/**
 * The namespace for module private data.
 */
var Private;
(function (Private) {
    /**
     * The queue for launching dialogs.
     */
    Private.launchQueue = [];
    Private.errorMessagePromiseCache = new Map();
    /**
     * Handle the input options for a dialog.
     *
     * @param options - The input options.
     *
     * @returns A new options object with defaults applied.
     */
    function handleOptions(options = {}) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const buttons = (_a = options.buttons) !== null && _a !== void 0 ? _a : [
            Dialog.cancelButton(),
            Dialog.okButton()
        ];
        return {
            title: (_b = options.title) !== null && _b !== void 0 ? _b : '',
            body: (_c = options.body) !== null && _c !== void 0 ? _c : '',
            host: (_d = options.host) !== null && _d !== void 0 ? _d : document.body,
            buttons,
            defaultButton: (_e = options.defaultButton) !== null && _e !== void 0 ? _e : buttons.length - 1,
            renderer: (_f = options.renderer) !== null && _f !== void 0 ? _f : Dialog.defaultRenderer,
            focusNodeSelector: (_g = options.focusNodeSelector) !== null && _g !== void 0 ? _g : '',
            hasClose: (_h = options.hasClose) !== null && _h !== void 0 ? _h : true
        };
    }
    Private.handleOptions = handleOptions;
    /**
     *  Find the first focusable item in the dialog.
     */
    function findFirstFocusable(node) {
        const candidateSelectors = [
            'input',
            'select',
            'a[href]',
            'textarea',
            'button',
            '[tabindex]'
        ].join(',');
        return node.querySelectorAll(candidateSelectors)[0];
    }
    Private.findFirstFocusable = findFirstFocusable;
})(Private || (Private = {}));
//# sourceMappingURL=dialog.js.map