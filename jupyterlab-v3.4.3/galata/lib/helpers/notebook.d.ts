import * as nbformat from '@jupyterlab/nbformat';
import { ElementHandle, Page } from '@playwright/test';
import { galata } from '../galata';
import { INotebookRunCallback } from '../inpage/tokens';
import { ActivityHelper } from './activity';
import { ContentsHelper } from '../contents';
import { FileBrowserHelper } from './filebrowser';
import { MenuHelper } from './menu';
/**
 * Notebook helpers
 */
export declare class NotebookHelper {
    readonly page: Page;
    readonly activity: ActivityHelper;
    readonly contents: ContentsHelper;
    readonly filebrowser: FileBrowserHelper;
    readonly menu: MenuHelper;
    constructor(page: Page, activity: ActivityHelper, contents: ContentsHelper, filebrowser: FileBrowserHelper, menu: MenuHelper);
    /**
     * Whether a given notebook is opened or not
     *
     * @param name Notebook name
     * @returns Notebook opened status
     */
    isOpen(name: string): Promise<boolean>;
    /**
     * Whether a given notebook is active or not
     *
     * @param name Notebook name
     * @returns Notebook active status
     */
    isActive(name: string): Promise<boolean>;
    /**
     * Whether a notebook is currently active or not
     *
     * @returns Notebook active status
     */
    isAnyActive(): Promise<boolean>;
    /**
     * Open a notebook from its name
     *
     * The notebook needs to exist in the current folder.
     *
     * @param name Notebook name
     * @returns Action success status
     */
    open(name: string): Promise<boolean>;
    /**
     * Open a notebook from its path
     *
     * The notebook do not need to exist in the current folder
     *
     * @param filePath Notebook path
     * @returns Action success status
     */
    openByPath(filePath: string): Promise<boolean>;
    /**
     * Get the handle to a notebook panel
     *
     * @param name Notebook name
     * @returns Handle to the Notebook panel
     */
    getNotebookInPanel(name?: string): Promise<ElementHandle<Element> | null>;
    /**
     * Get the handle to a notebook toolbar
     *
     * @param name Notebook name
     * @returns Handle to the Notebook toolbar
     */
    getToolbar(name?: string): Promise<ElementHandle<Element> | null>;
    /**
     * Get the handle to a notebook toolbar item from its index
     *
     * @param itemIndex Toolbar item index
     * @param notebookName Notebook name
     * @returns Handle to the notebook toolbar item
     */
    getToolbarItemByIndex(itemIndex: number, notebookName?: string): Promise<ElementHandle<Element> | null>;
    /**
     * Get the handle to a notebook toolbar item from its id
     *
     * @param itemId Toolbar item id
     * @param notebookName Notebook name
     * @returns Handle to the notebook toolbar item
     */
    getToolbarItem(itemId: galata.NotebookToolbarItemId, notebookName?: string): Promise<ElementHandle<Element> | null>;
    /**
     * Click on a notebook toolbar item
     *
     * @param itemId Toolbar item id
     * @param notebookName Notebook name
     * @returns Action success status
     */
    clickToolbarItem(itemId: galata.NotebookToolbarItemId, notebookName?: string): Promise<boolean>;
    /**
     * Activate a notebook
     *
     * @param name Notebook name
     * @returns Action success status
     */
    activate(name: string): Promise<boolean>;
    /**
     * Save the currently active notebook
     *
     * @returns Action success status
     */
    save(): Promise<boolean>;
    /**
     * Revert changes to the currently active notebook
     *
     * @returns Action success status
     */
    revertChanges(): Promise<boolean>;
    /**
     * Run all cells of the currently active notebook
     *
     * @returns Action success status
     */
    run(): Promise<boolean>;
    /**
     * Run the currently active notebook cell by cell.
     *
     * @param callback Cell ran callback
     * @returns Action success status
     */
    runCellByCell(callback?: INotebookRunCallback): Promise<boolean>;
    /**
     * Wait for notebook cells execution to finish
     */
    waitForRun(): Promise<void>;
    /**
     * Close the notebook with or without reverting unsaved changes
     *
     * @param revertChanges Whether to revert changes or not
     * @returns Action success status
     */
    close(revertChanges?: boolean): Promise<boolean>;
    /**
     * Get the number of cells in the currently active notebook
     *
     * @returns Number of cells
     */
    getCellCount: () => Promise<number>;
    /**
     * Get a cell handle
     *
     * @param cellIndex Cell index
     * @returns Handle to the cell
     */
    getCell(cellIndex: number): Promise<ElementHandle<Element> | null>;
    /**
     * Get the handle to the input of a cell
     *
     * @param cellIndex Cell index
     * @returns Handle to the cell input
     */
    getCellInput(cellIndex: number): Promise<ElementHandle<Element> | null>;
    /**
     * Get the handle to the input expander of a cell
     *
     * @param cellIndex Cell index
     * @returns Handle to the cell input expander
     */
    getCellInputExpander(cellIndex: number): Promise<ElementHandle<Element> | null>;
    /**
     * Whether a cell input is expanded or not
     *
     * @param cellIndex Cell index
     * @returns Cell input expanded status
     */
    isCellInputExpanded(cellIndex: number): Promise<boolean | null>;
    /**
     * Set the expanded status of a given input cell
     *
     * @param cellIndex Cell index
     * @param expand Input expanded status
     * @returns Action success status
     */
    expandCellInput(cellIndex: number, expand: boolean): Promise<boolean>;
    /**
     * Get the handle to a cell output expander
     *
     * @param cellIndex Cell index
     * @returns Handle to the cell output expander
     */
    getCellOutputExpander(cellIndex: number): Promise<ElementHandle<Element> | null>;
    /**
     * Whether a cell output is expanded or not
     *
     * @param cellIndex Cell index
     * @returns Cell output expanded status
     */
    isCellOutputExpanded(cellIndex: number): Promise<boolean | null>;
    /**
     * Set the expanded status of a given output cell
     *
     * @param cellIndex Cell index
     * @param expand Output expanded status
     * @returns Action success status
     */
    expandCellOutput(cellIndex: number, expand: boolean): Promise<boolean>;
    /**
     * Get the handle on a given output cell
     *
     * @param cellIndex Cell index
     * @returns Output cell handle
     */
    getCellOutput(cellIndex: number): Promise<ElementHandle<Element> | null>;
    /**
     * Get all cell outputs as text
     *
     * @param cellIndex Cell index
     * @returns List of text outputs
     */
    getCellTextOutput(cellIndex: number): Promise<string[] | null>;
    /**
     * Whether the cell is in editing mode or not
     *
     * @param cellIndex Cell index
     * @returns Editing mode
     */
    isCellInEditingMode(cellIndex: number): Promise<boolean>;
    /**
     * Enter the editing mode on a given cell
     *
     * @param cellIndex Cell index
     * @returns Action success status
     */
    enterCellEditingMode(cellIndex: number): Promise<boolean>;
    /**
     * Leave the editing mode
     *
     * @param cellIndex Cell index
     * @returns Action success status
     */
    leaveCellEditingMode(cellIndex: number): Promise<boolean>;
    /**
     * Select cells
     *
     * @param startIndex Start cell index
     * @param endIndex End cell index
     * @returns Action success status
     */
    selectCells(startIndex: number, endIndex?: number): Promise<boolean>;
    /**
     * Whether a given cell is selected or not
     *
     * @param cellIndex Cell index
     * @returns Selection status
     */
    isCellSelected(cellIndex: number): Promise<boolean>;
    /**
     * Delete selected cells
     *
     * @returns Action success status
     */
    deleteCells(): Promise<boolean>;
    /**
     * Add a cell to the currently active notebook
     *
     * @param cellType Cell type
     * @param source Source
     * @returns Action success status
     */
    addCell(cellType: nbformat.CellType, source: string): Promise<boolean>;
    /**
     * Set the input source of a cell
     *
     * @param cellIndex Cell index
     * @param cellType Cell type
     * @param source Source
     * @returns Action success status
     */
    setCell(cellIndex: number, cellType: nbformat.CellType, source: string): Promise<boolean>;
    /**
     * Set the type of a cell
     *
     * @param cellIndex Cell index
     * @param cellType Cell type
     * @returns Action success status
     */
    setCellType(cellIndex: number, cellType: nbformat.CellType): Promise<boolean>;
    /**
     * Get the cell type of a cell
     *
     * @param cellIndex Cell index
     * @returns Cell type
     */
    getCellType(cellIndex: number): Promise<nbformat.CellType | null>;
    /**
     * Run a given cell
     *
     * @param cellIndex Cell index
     * @param inplace Whether to stay on the cell or select the next one
     * @returns Action success status
     */
    runCell(cellIndex: number, inplace?: boolean): Promise<boolean>;
    /**
     * Create a new notebook
     *
     * @param name Name of the notebook
     * @returns Name of the created notebook or null if it failed
     */
    createNew(name?: string): Promise<string | null>;
    private _runCallbacksExposed;
}
