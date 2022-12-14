/// <reference types="react" />
import { VDomModel, VDomRenderer } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import { IDocumentManager } from './tokens';
/**
 * A status bar item for the current file path (or activity name).
 */
export declare class PathStatus extends VDomRenderer<PathStatus.Model> {
    /**
     * Construct a new PathStatus status item.
     */
    constructor(opts: PathStatus.IOptions);
    /**
     * Render the status item.
     */
    render(): JSX.Element;
}
/**
 * A namespace for PathStatus statics.
 */
export declare namespace PathStatus {
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
        constructor(docManager: IDocumentManager);
        /**
         * The current path for the application.
         */
        get path(): string;
        /**
         * The name of the current activity.
         */
        get name(): string;
        /**
         * The current widget for the application.
         */
        get widget(): Widget | null;
        set widget(widget: Widget | null);
        /**
         * React to a title change for the current widget.
         */
        private _onTitleChange;
        /**
         * React to a path change for the current document.
         */
        private _onPathChange;
        /**
         * Get the current state of the model.
         */
        private _getAllState;
        /**
         * Trigger a state change to rerender.
         */
        private _triggerChange;
        private _path;
        private _name;
        private _widget;
        private _docManager;
    }
    /**
     * Options for creating the PathStatus widget.
     */
    interface IOptions {
        /**
         * The application document manager.
         */
        docManager: IDocumentManager;
    }
}
