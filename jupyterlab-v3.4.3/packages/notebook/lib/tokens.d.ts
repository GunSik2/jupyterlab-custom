import { IWidgetTracker } from '@jupyterlab/apputils';
import { Cell } from '@jupyterlab/cells';
import { Token } from '@lumino/coreutils';
import { ISignal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import { NotebookTools } from './notebooktools';
import { NotebookPanel } from './panel';
import { NotebookWidgetFactory } from './widgetfactory';
/**
 * The notebook widget factory token.
 */
export declare const INotebookWidgetFactory: Token<NotebookWidgetFactory.IFactory>;
/**
 * The notebook tools token.
 */
export declare const INotebookTools: Token<INotebookTools>;
/**
 * The interface for notebook metadata tools.
 */
export interface INotebookTools extends Widget {
    activeNotebookPanel: NotebookPanel | null;
    activeCell: Cell | null;
    selectedCells: Cell[];
    addItem(options: NotebookTools.IAddOptions): void;
}
/**
 * The namespace for NotebookTools class statics.
 */
export declare namespace INotebookTools {
    /**
     * The options used to add an item to the notebook tools.
     */
    interface IAddOptions {
        /**
         * The tool to add to the notebook tools area.
         */
        tool: ITool;
        /**
         * The section to which the tool should be added.
         */
        section?: 'common' | 'advanced';
        /**
         * The rank order of the widget among its siblings.
         */
        rank?: number;
    }
    interface ITool extends Widget {
        /**
         * The notebook tools object.
         */
        notebookTools: INotebookTools;
    }
}
/**
 * The notebook tracker token.
 */
export declare const INotebookTracker: Token<INotebookTracker>;
/**
 * An object that tracks notebook widgets.
 */
export interface INotebookTracker extends IWidgetTracker<NotebookPanel> {
    /**
     * The currently focused cell.
     *
     * #### Notes
     * If there is no cell with the focus, then this value is `null`.
     */
    readonly activeCell: Cell | null;
    /**
     * A signal emitted when the current active cell changes.
     *
     * #### Notes
     * If there is no cell with the focus, then `null` will be emitted.
     */
    readonly activeCellChanged: ISignal<this, Cell | null>;
    /**
     * A signal emitted when the selection state changes.
     */
    readonly selectionChanged: ISignal<this, void>;
}
