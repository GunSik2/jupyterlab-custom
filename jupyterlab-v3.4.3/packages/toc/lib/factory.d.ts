import { IWidgetTracker } from '@jupyterlab/apputils';
import { IDocumentWidget } from '@jupyterlab/docregistry';
import { Widget } from '@lumino/widgets';
import { TableOfContentsModel } from './model';
import { TableOfContents } from './tokens';
/**
 * Abstract table of contents model factory for IDocumentWidget.
 */
export declare abstract class TableOfContentsFactory<W extends IDocumentWidget> implements TableOfContents.IFactory<W> {
    protected tracker: IWidgetTracker<W>;
    /**
     * Constructor
     *
     * @param tracker Widget tracker
     */
    constructor(tracker: IWidgetTracker<W>);
    /**
     * Whether the factory can handle the widget or not.
     *
     * @param widget - widget
     * @returns boolean indicating a ToC can be generated
     */
    isApplicable(widget: Widget): boolean;
    /**
     * Create a new table of contents model for the widget
     *
     * @param widget - widget
     * @param configuration - Table of contents configuration
     * @returns The table of contents model
     */
    createNew(widget: W, configuration?: TableOfContents.IConfig): TableOfContentsModel<TableOfContents.IHeading, W>;
    /**
     * Abstract table of contents model instantiation to allow
     * override by real implementation to customize it. The public
     * `createNew` contains the signal connections standards for IDocumentWidget
     * when the model has been instantiated.
     *
     * @param widget
     * @param configuration
     */
    protected abstract _createNew(widget: W, configuration?: TableOfContents.IConfig): TableOfContentsModel<TableOfContents.IHeading, W>;
}
