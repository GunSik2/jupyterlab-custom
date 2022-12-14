// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/**
 * @packageDocumentation
 * @module vdom
 */
import { Token } from '@lumino/coreutils';
import { Widget } from '@lumino/widgets';
import VDOM from '@nteract/transform-vdom';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
/**
 * The CSS class to add to the VDOM Widget.
 */
const CSS_CLASS = 'jp-RenderedVDOM';
/**
 * The VDOM tracker token.
 */
export const IVDOMTracker = new Token('@jupyterlab/vdom:IVDOMTracker');
/**
 * A renderer for declarative virtual DOM content.
 */
export class RenderedVDOM extends Widget {
    /**
     * Create a new widget for rendering DOM.
     */
    constructor(options, context) {
        super();
        /**
         * Handle events for VDOM element.
         */
        this.handleVDOMEvent = (targetName, event) => {
            var _a, _b;
            // When a VDOM element's event handler is called, send a serialized
            // representation of the event to the registered comm channel for the
            // kernel to handle
            if (this._timer) {
                window.clearTimeout(this._timer);
            }
            const kernel = (_b = (_a = this._sessionContext) === null || _a === void 0 ? void 0 : _a.session) === null || _b === void 0 ? void 0 : _b.kernel;
            if (kernel) {
                this._timer = window.setTimeout(() => {
                    if (!this._comms[targetName]) {
                        this._comms[targetName] = kernel.createComm(targetName);
                        this._comms[targetName].open();
                    }
                    this._comms[targetName].send(JSON.stringify(event));
                }, 16);
            }
        };
        this._comms = {};
        this.addClass(CSS_CLASS);
        this.addClass('jp-RenderedHTML');
        this.addClass('jp-RenderedHTMLCommon');
        this._mimeType = options.mimeType;
        if (context) {
            this._sessionContext = context.sessionContext;
        }
    }
    /**
     * Dispose of the widget.
     */
    dispose() {
        // Dispose of comm disposables
        for (const targetName in this._comms) {
            this._comms[targetName].dispose();
        }
        super.dispose();
    }
    /**
     * Called before the widget is detached from the DOM.
     */
    onBeforeDetach(msg) {
        // Dispose of React component(s).
        ReactDOM.unmountComponentAtNode(this.node);
    }
    /**
     * Render VDOM into this widget's node.
     */
    renderModel(model) {
        return new Promise((resolve, reject) => {
            const data = model.data[this._mimeType];
            ReactDOM.render(React.createElement(VDOM, { data: data, onVDOMEvent: this.handleVDOMEvent }), this.node, () => {
                resolve();
            });
        });
    }
}
//# sourceMappingURL=index.js.map