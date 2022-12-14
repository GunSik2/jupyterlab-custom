import { ISessionContext, ISessionContextDialogs, ReactWidget } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { ITranslator } from '@jupyterlab/translation';
import { Widget } from '@lumino/widgets';
import * as React from 'react';
import { NotebookPanel } from './panel';
import { Notebook } from './widget';
/**
 * A namespace for the default toolbar items.
 */
export declare namespace ToolbarItems {
    /**
     * Create save button toolbar item.
     *
     * @deprecated since v3.2
     * This is dead code now.
     */
    function createSaveButton(panel: NotebookPanel, translator?: ITranslator): Widget;
    /**
     * Create an insert toolbar item.
     *
     * @deprecated since v3.2
     * This is dead code now.
     */
    function createInsertButton(panel: NotebookPanel, translator?: ITranslator): Widget;
    /**
     * Create a cut toolbar item.
     *
     * @deprecated since v3.2
     * This is dead code now.
     */
    function createCutButton(panel: NotebookPanel, translator?: ITranslator): Widget;
    /**
     * Create a copy toolbar item.
     *
     * @deprecated since v3.2
     * This is dead code now.
     */
    function createCopyButton(panel: NotebookPanel, translator?: ITranslator): Widget;
    /**
     * Create a paste toolbar item.
     *
     * @deprecated since v3.2
     * This is dead code now.
     */
    function createPasteButton(panel: NotebookPanel, translator?: ITranslator): Widget;
    /**
     * Create a run toolbar item.
     *
     * @deprecated since v3.2
     * This is dead code now.
     */
    function createRunButton(panel: NotebookPanel, translator?: ITranslator): Widget;
    /**
     * Create a restart run all toolbar item
     *
     * @deprecated since v3.2
     * This is dead code now.
     */
    function createRestartRunAllButton(panel: NotebookPanel, dialogs?: ISessionContext.IDialogs, translator?: ITranslator): Widget;
    /**
     * Create a cell type switcher item.
     *
     * #### Notes
     * It will display the type of the current active cell.
     * If more than one cell is selected but are of different types,
     * it will display `'-'`.
     * When the user changes the cell type, it will change the
     * cell types of the selected cells.
     * It can handle a change to the context.
     */
    function createCellTypeItem(panel: NotebookPanel, translator?: ITranslator): Widget;
    /**
     * Get the default toolbar items for panel
     */
    function getDefaultItems(panel: NotebookPanel, sessionDialogs?: ISessionContextDialogs, translator?: ITranslator): DocumentRegistry.IToolbarItem[];
}
/**
 * A toolbar widget that switches cell types.
 */
export declare class CellTypeSwitcher extends ReactWidget {
    /**
     * Construct a new cell type switcher.
     */
    constructor(widget: Notebook, translator?: ITranslator);
    /**
     * Handle `change` events for the HTMLSelect component.
     */
    handleChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    /**
     * Handle `keydown` events for the HTMLSelect component.
     */
    handleKeyDown: (event: React.KeyboardEvent) => void;
    render(): JSX.Element;
    private _trans;
    private _notebook;
}
