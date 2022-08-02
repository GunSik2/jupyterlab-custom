import * as nbformat from '@jupyterlab/nbformat';
import { Session, TerminalAPI, Workspace } from '@jupyterlab/services';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { Browser, Page } from '@playwright/test';
import { ContentsHelper } from './contents';
import { PerformanceHelper } from './helpers';
import { IJupyterLabPage, IJupyterLabPageFixture } from './jupyterlabpage';
/**
 * Galata namespace
 */
export declare namespace galata {
    /**
     * Default user settings:
     * - Deactivate codemirror cursor blinking to avoid noise in screenshots
     */
    const DEFAULT_SETTINGS: Record<string, any>;
    /**
     * Sidebar position
     */
    type SidebarPosition = 'left' | 'right';
    /**
     * Default sidebar ids
     */
    type DefaultSidebarTabId = 'filebrowser' | 'jp-running-sessions' | 'tab-manager' | 'jp-property-inspector' | 'table-of-contents' | 'extensionmanager.main-view' | 'jp-debugger-sidebar';
    /**
     * Sidebar id type
     */
    type SidebarTabId = DefaultSidebarTabId | string;
    /**
     * Default toolbar item ids
     */
    type DefaultNotebookToolbarItemId = 'save' | 'insert' | 'cut' | 'copy' | 'paste' | 'run' | 'interrupt' | 'restart' | 'restart-and-run' | 'cellType' | 'kernelName' | 'kernelStatus';
    /**
     * Notebook toolbar item type
     */
    type NotebookToolbarItemId = DefaultNotebookToolbarItemId | string;
    /**
     * Add the Galata helpers to the page model
     *
     * @param page Playwright page model
     * @param baseURL Application base URL
     * @param waitForApplication Callback that resolved when the application page is ready
     * @param appPath Application URL path fragment
     * @returns Playwright page model with Galata helpers
     */
    function addHelpersToPage(page: Page, baseURL: string, waitForApplication: (page: Page, helpers: IJupyterLabPage) => Promise<void>, appPath?: string): IJupyterLabPageFixture;
    function initTestPage(appPath: string, autoGoto: boolean, baseURL: string, mockSettings: boolean | Record<string, unknown>, mockState: boolean | Record<string, unknown>, page: Page, sessions: Map<string, Session.IModel> | null, terminals: Map<string, TerminalAPI.IModel> | null, tmpPath: string, waitForApplication: (page: Page, helpers: IJupyterLabPage) => Promise<void>): Promise<IJupyterLabPageFixture>;
    /**
     * Create a contents REST API helpers object
     *
     * @param baseURL Application base URL
     * @param page Playwright page model
     * @returns Contents REST API helpers
     */
    function newContentsHelper(baseURL: string, page?: Page): ContentsHelper;
    /**
     * Create a page with Galata helpers for the given browser
     *
     * @param browser Playwright browser model
     * @param baseURL Application base URL
     * @param waitForApplication Callback that resolved when the application page is ready
     * @param appPath Application URL path fragment
     * @returns Playwright page model with Galata helpers
     */
    function newPage(appPath: string, autoGoto: boolean, baseURL: string, browser: Browser, mockSettings: boolean | Record<string, unknown>, mockState: boolean | Record<string, unknown>, sessions: Map<string, Session.IModel> | null, terminals: Map<string, TerminalAPI.IModel> | null, tmpPath: string, waitForApplication: (page: Page, helpers: IJupyterLabPage) => Promise<void>): Promise<IJupyterLabPageFixture>;
    /**
     * Create a new performance helper
     *
     * @param page Playwright page model
     * @returns Performance helper
     */
    function newPerformanceHelper(page: Page): PerformanceHelper;
    /**
     * Regex to capture JupyterLab API call
     */
    namespace Routes {
        /**
         * Sessions API
         *
         * The session id can be found in the named group `id`.
         *
         * The id will be suffixed by '/'.
         */
        const sessions: RegExp;
        /**
         * Settings API
         *
         * The schema name can be found in the named group `id`.
         *
         * The id will be suffixed by '/'.
         */
        const settings: RegExp;
        /**
         * Terminals API
         *
         * The terminal id can be found in the named group `id`.
         *
         * The id will be suffixed by '/'.
         */
        const terminals: RegExp;
        /**
         * Translations API
         *
         * The locale can be found in the named group `id`.
         *
         * The id will be suffixed by '/'.
         */
        const translations: RegExp;
        /**
         * Workspaces API
         *
         * The space name can be found in the named group `id`.
         *
         * The id will be suffixed by '/'.
         */
        const workspaces: RegExp;
    }
    /**
     * Notebook generation helpers
     */
    namespace Notebook {
        /**
         * Generate a notebook with identical cells
         *
         * @param nCells Number of cells
         * @param cellType Type of cells
         * @param defaultInput Default input source
         * @param defaultOutput Default outputs
         * @returns The notebook
         */
        function generateNotebook(nCells?: number, cellType?: nbformat.CellType, defaultInput?: string[], defaultOutput?: nbformat.IOutput[]): nbformat.INotebookContent;
        /**
         * Generate a cell object
         *
         * @param skeleton Cell description template
         * @returns A cell
         */
        function makeCell(skeleton: Partial<nbformat.ICell>): nbformat.ICell;
        /**
         * Generate a notebook object from a cell list
         *
         * @param cells Notebook cells
         * @returns Notebook
         */
        function makeNotebook(cells: Array<nbformat.ICell>): nbformat.INotebookContent;
    }
    /**
     * Mock methods
     */
    namespace Mock {
        /**
         * Clear all wanted sessions or terminals.
         *
         * @param baseURL Application base URL
         * @param runners Session or terminal ids to stop
         * @param type Type of runner; session or terminal
         * @returns Whether the runners were closed or not
         */
        function clearRunners(baseURL: string, runners: string[], type: 'sessions' | 'terminals'): Promise<boolean>;
        /**
         * Mock the runners API to display only those created during a test
         *
         * @param page Page model object
         * @param runners Mapping of current test runners
         * @param type Type of runner; session or terminal
         */
        function mockRunners(page: Page, runners: Map<string, any>, type: 'sessions' | 'terminals'): Promise<void>;
        /**
         * Mock workspace route.
         *
         * @param page Page model object
         * @param workspace In-memory workspace
         */
        function mockState(page: Page, workspace: Workspace.IWorkspace): Promise<void>;
        /**
         * Mock settings route.
         *
         * @param page Page model object
         * @param settings In-memory settings
         * @param mockedSettings Test mocked settings
         */
        function mockSettings(page: Page, settings: ISettingRegistry.IPlugin[], mockedSettings: Record<string, any>): Promise<void>;
    }
}
