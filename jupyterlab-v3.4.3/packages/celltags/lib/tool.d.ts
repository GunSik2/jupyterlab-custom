import { JupyterFrontEnd } from '@jupyterlab/application';
import { Cell } from '@jupyterlab/cells';
import { INotebookTracker, NotebookTools } from '@jupyterlab/notebook';
import { ITranslator } from '@jupyterlab/translation';
/**
 * A Tool for tag operations.
 */
export declare class TagTool extends NotebookTools.Tool {
    /**
     * Construct a new tag Tool.
     *
     * @param tracker - The notebook tracker.
     */
    constructor(tracker: INotebookTracker, app: JupyterFrontEnd, translator?: ITranslator);
    /**
     * Add an AddWidget input box to the layout.
     */
    createTagInput(): void;
    /**
     * Check whether a tag is applied to the current active cell
     *
     * @param name - The name of the tag.
     *
     * @returns A boolean representing whether it is applied.
     */
    checkApplied(name: string): boolean;
    /**
     * Add a tag to the current active cell.
     *
     * @param name - The name of the tag.
     */
    addTag(name: string): void;
    /**
     * Remove a tag from the current active cell.
     *
     * @param name - The name of the tag.
     */
    removeTag(name: string): void;
    /**
     * Update each tag widget to represent whether it is applied to the current
     * active cell.
     */
    loadActiveTags(): void;
    /**
     * Pull from cell metadata all the tags used in the notebook and update the
     * stored tag list.
     */
    pullTags(): void;
    /**
     * Pull the most recent list of tags and update the tag widgets - dispose if
     * the tag no longer exists, and create new widgets for new tags.
     */
    refreshTags(): void;
    /**
     * Validate the 'tags' of cell metadata, ensuring it is a list of strings and
     * that each string doesn't include spaces.
     */
    validateTags(cell: Cell, tags: string[]): void;
    /**
     * Handle a change to the active cell.
     */
    protected onActiveCellChanged(): void;
    /**
     * Get all tags once available.
     */
    protected onAfterShow(): void;
    /**
     * Upon attach, add label if it doesn't already exist and listen for changes
     * from the notebook tracker.
     */
    protected onAfterAttach(): void;
    /**
     * Handle a change to active cell metadata.
     */
    protected onActiveCellMetadataChanged(): void;
    tracker: INotebookTracker;
    private tagList;
    private label;
    protected translator: ITranslator;
    private _trans;
}
