import type { JupyterFrontEnd } from '@jupyterlab/application';
import type { Cell, MarkdownCell } from '@jupyterlab/cells';
import type * as nbformat from '@jupyterlab/nbformat';
import type { Notebook } from '@jupyterlab/notebook';
import { IGalataInpage, INotebookRunCallback, IPluginNameToInterfaceMap, IWaitForSelectorOptions } from './tokens';
/**
 * In-Page Galata helpers
 */
export declare class GalataInpage implements IGalataInpage {
    constructor();
    /**
     * Get an application plugin
     *
     * @param pluginId Plugin ID
     * @returns Application plugin
     */
    getPlugin<K extends keyof IPluginNameToInterfaceMap>(pluginId: K): Promise<IPluginNameToInterfaceMap[K] | undefined>;
    /**
     * Wait for a function to finish for max. timeout milliseconds
     *
     * @param fn Function
     * @param timeout Timeout
     */
    waitForFunction(fn: Function, timeout?: number): Promise<void>;
    /**
     * Waits for the given `timeout` in milliseconds.
     *
     * @param timeout A timeout to wait for
     */
    waitForTimeout(timeout: number): Promise<void>;
    /**
     * Wait for a condition to fulfill or for a certain time
     *
     * @param condition Condition or timeout to wait for
     * @param timeout Timeout
     */
    waitFor(condition: Function | number, timeout?: number): Promise<void>;
    /**
     * Wait for the route to be on path and close all documents
     *
     * @param path Path to monitor
     */
    waitForLaunch(path?: string): Promise<void>;
    /**
     * Wait for an element to be found from a CSS selector
     *
     * @param selector CSS selector
     * @param node Element
     * @param options Options
     * @returns Selected element
     */
    waitForSelector(selector: string, node?: Element, options?: IWaitForSelectorOptions): Promise<Node | null>;
    /**
     * Wait for an element to be found from a XPath
     *
     * @param selector CSS selector
     * @param node Element
     * @param options Options
     * @returns Selected element
     */
    waitForXPath(selector: string, node?: Element, options?: IWaitForSelectorOptions): Promise<Node | null>;
    /**
     * Delete all cells of the active notebook
     */
    deleteNotebookCells(): Promise<void>;
    /**
     * Add a cell to the active notebook
     *
     * @param cellType Cell type
     * @param source Cell input source
     * @returns Action success result
     */
    addNotebookCell(cellType: nbformat.CellType, source: string): boolean;
    /**
     * Set the type and content of a cell in the active notebook
     *
     * @param cellIndex Cell index
     * @param cellType Cell type
     * @param source Cell input source
     * @returns Action success status
     */
    setNotebookCell(cellIndex: number, cellType: nbformat.CellType, source: string): boolean;
    /**
     * Test if a cell is selected in the active notebook
     *
     * @param cellIndex Cell index
     * @returns Whether the cell is selected or not
     */
    isNotebookCellSelected(cellIndex: number): boolean;
    /**
     * Save the active notebook
     */
    saveActiveNotebook(): Promise<void>;
    /**
     * Run the active notebook
     */
    runActiveNotebook(): Promise<void>;
    /**
     * Wait for the active notebook to be run
     */
    waitForNotebookRun(): Promise<void>;
    /**
     * Wait for a Markdown cell to be rendered
     *
     * @param cell Cell
     */
    waitForMarkdownCellRendered(cell: MarkdownCell): Promise<void>;
    /**
     * Wait for a cell to be run and return its output element
     *
     * @param cell Cell
     * @param timeout Timeout
     * @returns Output element
     */
    waitForCellRun(cell: Cell, timeout?: number): Promise<Node | null>;
    /**
     * Whether the given notebook will scroll or not
     *
     * @param notebook Notebook
     * @param position Position
     * @param threshold Threshold
     * @returns Test result
     */
    notebookWillScroll(notebook: Notebook, position: number, threshold?: number): boolean;
    /**
     * Run the active notebook cell by cell
     * and execute the callback after each cell execution
     *
     * @param callback Callback
     */
    runActiveNotebookCellByCell(callback?: INotebookRunCallback): Promise<void>;
    /**
     * Get the index of a toolbar item
     *
     * @param itemName Item name
     * @returns Index
     */
    getNotebookToolbarItemIndex(itemName: string): number;
    /**
     * Test if a element is visible or not
     *
     * @param el Element
     * @returns Test result
     */
    isElementVisible(el: HTMLElement): boolean;
    /**
     * Set the application theme
     *
     * @param themeName Theme name
     */
    setTheme(themeName: string): Promise<void>;
    /**
     * Application object
     */
    get app(): JupyterFrontEnd;
    private _app;
}
