// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { VDomModel, VDomRenderer } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { TextItem } from '@jupyterlab/statusbar';
import React from 'react';
/**
 * A pure component for rendering a file path (or activity name).
 *
 * @param props - the props for the component.
 *
 * @returns a tsx component for a file path.
 */
function PathStatusComponent(props) {
    return React.createElement(TextItem, { source: props.name, title: props.fullPath });
}
/**
 * A status bar item for the current file path (or activity name).
 */
export class PathStatus extends VDomRenderer {
    /**
     * Construct a new PathStatus status item.
     */
    constructor(opts) {
        super(new PathStatus.Model(opts.docManager));
        this.node.title = this.model.path;
    }
    /**
     * Render the status item.
     */
    render() {
        return (React.createElement(PathStatusComponent, { fullPath: this.model.path, name: this.model.name }));
    }
}
/**
 * A namespace for PathStatus statics.
 */
(function (PathStatus) {
    /**
     * A VDomModel for rendering the PathStatus status item.
     */
    class Model extends VDomModel {
        /**
         * Construct a new model.
         *
         * @param docManager: the application document manager. Used to check
         *   whether the current widget is a document.
         */
        constructor(docManager) {
            super();
            /**
             * React to a title change for the current widget.
             */
            this._onTitleChange = (title) => {
                const oldState = this._getAllState();
                this._name = title.label;
                this._triggerChange(oldState, this._getAllState());
            };
            /**
             * React to a path change for the current document.
             */
            this._onPathChange = (_documentModel, newPath) => {
                const oldState = this._getAllState();
                this._path = newPath;
                this._name = PathExt.basename(newPath);
                this._triggerChange(oldState, this._getAllState());
            };
            this._path = '';
            this._name = '';
            this._widget = null;
            this._docManager = docManager;
        }
        /**
         * The current path for the application.
         */
        get path() {
            return this._path;
        }
        /**
         * The name of the current activity.
         */
        get name() {
            return this._name;
        }
        /**
         * The current widget for the application.
         */
        get widget() {
            return this._widget;
        }
        set widget(widget) {
            const oldWidget = this._widget;
            if (oldWidget !== null) {
                const oldContext = this._docManager.contextForWidget(oldWidget);
                if (oldContext) {
                    oldContext.pathChanged.disconnect(this._onPathChange);
                }
                else {
                    oldWidget.title.changed.disconnect(this._onTitleChange);
                }
            }
            const oldState = this._getAllState();
            this._widget = widget;
            if (this._widget === null) {
                this._path = '';
                this._name = '';
            }
            else {
                const widgetContext = this._docManager.contextForWidget(this._widget);
                if (widgetContext) {
                    this._path = widgetContext.path;
                    this._name = PathExt.basename(widgetContext.path);
                    widgetContext.pathChanged.connect(this._onPathChange);
                }
                else {
                    this._path = '';
                    this._name = this._widget.title.label;
                    this._widget.title.changed.connect(this._onTitleChange);
                }
            }
            this._triggerChange(oldState, this._getAllState());
        }
        /**
         * Get the current state of the model.
         */
        _getAllState() {
            return [this._path, this._name];
        }
        /**
         * Trigger a state change to rerender.
         */
        _triggerChange(oldState, newState) {
            if (oldState[0] !== newState[0] || oldState[1] !== newState[1]) {
                this.stateChanged.emit(void 0);
            }
        }
    }
    PathStatus.Model = Model;
})(PathStatus || (PathStatus = {}));
//# sourceMappingURL=pathstatus.js.map