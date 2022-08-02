import { ISanitizer } from '@jupyterlab/apputils';
import { Cell, ICellModel } from '@jupyterlab/cells';
import { IMarkdownParser } from '@jupyterlab/rendermime';
import { TableOfContents, TableOfContentsFactory, TableOfContentsModel } from '@jupyterlab/toc';
import { NotebookPanel } from './panel';
import { INotebookTracker } from './tokens';
import { Notebook } from './widget';
/**
 * Cell running status
 */
export declare enum RunningStatus {
    /**
     * Cell is idle
     */
    Idle = -1,
    /**
     * Cell execution is scheduled
     */
    Scheduled = 0,
    /**
     * Cell is running
     */
    Running = 1
}
/**
 * Type of headings
 */
export declare enum HeadingType {
    /**
     * Heading from HTML output
     */
    HTML = 0,
    /**
     * Heading from Markdown cell or Markdown output
     */
    Markdown = 1
}
/**
 * Interface describing a notebook cell heading.
 */
export interface INotebookHeading extends TableOfContents.IHeading {
    /**
     * Reference to a notebook cell.
     */
    cellRef: Cell;
    /**
     * Running status of the cells in the heading
     */
    isRunning: RunningStatus;
    /**
     * Index of the output containing the heading
     */
    outputIndex?: number;
    /**
     * Type of heading
     */
    type: HeadingType;
}
/**
 * Table of content model for Notebook files.
 */
export declare class NotebookToCModel extends TableOfContentsModel<INotebookHeading, NotebookPanel> {
    protected parser: IMarkdownParser | null;
    protected sanitizer: ISanitizer;
    /**
     * Constructor
     *
     * @param widget The widget to search in
     * @param parser Markdown parser
     * @param sanitizer Sanitizer
     * @param configuration Default model configuration
     */
    constructor(widget: NotebookPanel, parser: IMarkdownParser | null, sanitizer: ISanitizer, configuration?: TableOfContents.IConfig);
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
     * Get the first heading of a given cell.
     *
     * It will be `null` if the cell has no headings.
     *
     * @param cell Cell
     * @returns The associated heading
     */
    getCellHeading(cell: Cell): INotebookHeading | null;
    /**
     * Dispose the object
     */
    dispose(): void;
    /**
     * Model configuration setter.
     *
     * @param c New configuration
     */
    setConfiguration(c: Partial<TableOfContents.IConfig>): void;
    /**
     * Callback on heading collapse.
     *
     * @param options.heading The heading to change state (all headings if not provided)
     * @param options.collapsed The new collapsed status (toggle existing status if not provided)
     */
    toggleCollapse(options: {
        heading?: INotebookHeading;
        collapsed?: boolean;
    }): void;
    /**
     * Produce the headings for a document.
     *
     * @returns The list of new headings or `null` if nothing needs to be updated.
     */
    protected getHeadings(): Promise<INotebookHeading[] | null>;
    /**
     * Read table of content configuration from notebook metadata.
     *
     * @returns ToC configuration from metadata
     */
    protected loadConfigurationFromMetadata(): Partial<TableOfContents.IConfig>;
    protected onActiveCellChanged(notebook: Notebook, cell: Cell<ICellModel>): void;
    protected onHeadingsChanged(): void;
    protected onExecuted(_: unknown, args: {
        notebook: Notebook;
        cell: Cell;
    }): void;
    protected onExecutionScheduled(_: unknown, args: {
        notebook: Notebook;
        cell: Cell;
    }): void;
    protected onMetadataChanged(): void;
    protected updateRunningStatus(headings: INotebookHeading[]): void;
    /**
     * Mapping between configuration options and notebook metadata.
     *
     * If it starts with `!`, the boolean value of the configuration option is
     * opposite to the one stored in metadata.
     * If it contains `/`, the metadata data is nested.
     */
    protected configMetadataMap: {
        [k: keyof TableOfContents.IConfig]: string[];
    };
    private _runningCells;
    private _cellToHeadingIndex;
}
/**
 * Table of content model factory for Notebook files.
 */
export declare class NotebookToCFactory extends TableOfContentsFactory<NotebookPanel> {
    protected parser: IMarkdownParser | null;
    protected sanitizer: ISanitizer;
    /**
     * Constructor
     *
     * @param tracker Widget tracker
     * @param parser Markdown parser
     * @param sanitizer Sanitizer
     */
    constructor(tracker: INotebookTracker, parser: IMarkdownParser | null, sanitizer: ISanitizer);
    /**
     * Create a new table of contents model for the widget
     *
     * @param widget - widget
     * @param configuration - Table of contents configuration
     * @returns The table of contents model
     */
    protected _createNew(widget: NotebookPanel, configuration?: TableOfContents.IConfig): TableOfContentsModel<TableOfContents.IHeading, NotebookPanel>;
}
