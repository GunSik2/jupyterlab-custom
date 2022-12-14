import { VDomModel } from '@jupyterlab/ui-components';
import { ISignal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import { TableOfContents } from './tokens';
/**
 * Abstract table of contents model.
 */
export declare abstract class TableOfContentsModel<H extends TableOfContents.IHeading, T extends Widget = Widget> extends VDomModel implements TableOfContents.IModel<H> {
    protected widget: T;
    /**
     * Constructor
     *
     * @param widget The widget to search in
     * @param configuration Default model configuration
     */
    constructor(widget: T, configuration?: TableOfContents.IConfig);
    /**
     * Current active entry.
     *
     * @returns table of contents active entry
     */
    get activeHeading(): H | null;
    /**
     * Signal emitted when the active heading changes.
     */
    get activeHeadingChanged(): ISignal<TableOfContents.IModel<H>, H | null>;
    /**
     * Signal emitted when a table of content section collapse state changes.
     */
    get collapseChanged(): ISignal<TableOfContents.IModel<H>, H | null>;
    /**
     * Model configuration
     */
    get configuration(): TableOfContents.IConfig;
    /**
     * Type of document supported by the model.
     *
     * #### Notes
     * A `data-document-type` attribute with this value will be set
     * on the tree view `.jp-TableOfContents-content[data-document-type="..."]`
     */
    abstract readonly documentType: string;
    /**
     * List of headings.
     *
     * @returns table of contents list of headings
     */
    get headings(): H[];
    /**
     * Signal emitted when the headings changes.
     */
    get headingsChanged(): ISignal<TableOfContents.IModel<H>, void>;
    /**
     * Whether the model is active or not.
     *
     * #### Notes
     * An active model means it is displayed in the table of contents.
     * This can be used by subclass to limit updating the headings.
     */
    get isActive(): boolean;
    set isActive(v: boolean);
    /**
     * Whether the model gets updated even if the table of contents panel
     * is hidden or not.
     *
     * #### Notes
     * For example, ToC models use to add title numbering will
     * set this to true.
     */
    protected get isAlwaysActive(): boolean;
    /**
     * List of configuration options supported by the model.
     */
    get supportedOptions(): (keyof TableOfContents.IConfig)[];
    /**
     * Document title
     */
    get title(): string | undefined;
    set title(v: string | undefined);
    /**
     * Abstract function that will produce the headings for a document.
     *
     * @returns The list of new headings or `null` if nothing needs to be updated.
     */
    protected abstract getHeadings(): Promise<H[] | null>;
    /**
     * Refresh the headings list.
     */
    refresh(): Promise<void>;
    /**
     * Set a new active heading.
     *
     * @param heading The new active heading
     * @param emitSignal Whether to emit the activeHeadingChanged signal or not.
     */
    setActiveHeading(heading: H | null, emitSignal?: boolean): void;
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
        heading?: H;
        collapsed?: boolean;
    }): void;
    private _activeHeading;
    private _activeHeadingChanged;
    private _collapseChanged;
    private _configuration;
    private _headings;
    private _headingsChanged;
    private _isActive;
    private _isRefreshing;
    private _needsRefreshing;
    private _title?;
}
