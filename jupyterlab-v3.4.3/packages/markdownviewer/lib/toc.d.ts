import { IWidgetTracker } from '@jupyterlab/apputils';
import { IMarkdownParser } from '@jupyterlab/rendermime';
import { TableOfContents, TableOfContentsFactory, TableOfContentsModel, TableOfContentsUtils } from '@jupyterlab/toc';
import { MarkdownDocument } from './widget';
/**
 * Interface describing a Markdown viewer heading.
 */
export interface IMarkdownViewerHeading extends TableOfContentsUtils.Markdown.IMarkdownHeading {
}
/**
 * Table of content model for Markdown viewer files.
 */
export declare class MarkdownViewerTableOfContentsModel extends TableOfContentsModel<IMarkdownViewerHeading, MarkdownDocument> {
    protected parser: IMarkdownParser | null;
    /**
     * Constructor
     *
     * @param widget The widget to search in
     * @param parser Markdown parser
     * @param configuration Default model configuration
     */
    constructor(widget: MarkdownDocument, parser: IMarkdownParser | null, configuration?: TableOfContents.IConfig);
    /**
     * Type of document supported by the model.
     *
     * #### Notes
     * A `data-document-type` attribute with this value will be set
     * on the tree view `.jp-TableOfContents-content[data-document-type="..."]`
     */
    get documentType(): string;
    /**
     * Whether the model gets updated even if the table of contents panel
     * is hidden or not.
     */
    protected get isAlwaysActive(): boolean;
    /**
     * List of configuration options supported by the model.
     */
    get supportedOptions(): (keyof TableOfContents.IConfig)[];
    /**
     * Produce the headings for a document.
     *
     * @returns The list of new headings or `null` if nothing needs to be updated.
     */
    protected getHeadings(): Promise<IMarkdownViewerHeading[] | null>;
}
/**
 * Table of content model factory for Markdown viewer files.
 */
export declare class MarkdownViewerTableOfContentsFactory extends TableOfContentsFactory<MarkdownDocument> {
    protected parser: IMarkdownParser | null;
    /**
     * Constructor
     *
     * @param tracker Widget tracker
     * @param parser Markdown parser
     */
    constructor(tracker: IWidgetTracker<MarkdownDocument>, parser: IMarkdownParser | null);
    /**
     * Create a new table of contents model for the widget
     *
     * @param widget - widget
     * @param configuration - Table of contents configuration
     * @returns The table of contents model
     */
    protected _createNew(widget: MarkdownDocument, configuration?: TableOfContents.IConfig): TableOfContentsModel<TableOfContents.IHeading, MarkdownDocument>;
}
