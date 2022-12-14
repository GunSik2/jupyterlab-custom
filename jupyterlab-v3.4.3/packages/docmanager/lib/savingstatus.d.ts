/// <reference types="react" />
import { VDomModel, VDomRenderer } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { ITranslator } from '@jupyterlab/translation';
import { Widget } from '@lumino/widgets';
import { IDocumentManager } from './tokens';
/**
 * A VDomRenderer for a saving status item.
 */
export declare class SavingStatus extends VDomRenderer<SavingStatus.Model> {
    /**
     * Create a new SavingStatus item.
     */
    constructor(opts: SavingStatus.IOptions);
    /**
     * Render the SavingStatus item.
     */
    render(): JSX.Element | null;
    private _statusMap;
}
/**
 * A namespace for SavingStatus statics.
 */
export declare namespace SavingStatus {
    /**
     * A VDomModel for the SavingStatus item.
     */
    class Model extends VDomModel {
        /**
         * Create a new SavingStatus model.
         */
        constructor(docManager: IDocumentManager);
        /**
         * The current status of the model.
         */
        get status(): DocumentRegistry.SaveState | null;
        /**
         * The current widget for the model. Any widget can be assigned,
         * but it only has any effect if the widget is an IDocument widget
         * known to the application document manager.
         */
        get widget(): Widget | null;
        set widget(widget: Widget | null);
        /**
         * React to a saving status change from the current document widget.
         */
        private _onStatusChange;
        private _status;
        private _widget;
        private _docManager;
    }
    /**
     * Options for creating a new SaveStatus item
     */
    interface IOptions {
        /**
         * The application document manager.
         */
        docManager: IDocumentManager;
        /**
         * The application language translator.
         */
        translator?: ITranslator;
    }
}
