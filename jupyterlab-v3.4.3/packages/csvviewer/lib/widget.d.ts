import { ABCWidgetFactory, DocumentRegistry, DocumentWidget, IDocumentWidget } from '@jupyterlab/docregistry';
import { CellRenderer, DataGrid, TextRenderer } from '@lumino/datagrid';
import { Message } from '@lumino/messaging';
import { ISignal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
/**
 * Configuration for cells textrenderer.
 */
export declare class TextRenderConfig {
    /**
     * default text color
     */
    textColor: string;
    /**
     * background color for a search match
     */
    matchBackgroundColor: string;
    /**
     * background color for the current search match.
     */
    currentMatchBackgroundColor: string;
    /**
     * horizontalAlignment of the text
     */
    horizontalAlignment: TextRenderer.HorizontalAlignment;
}
/**
 * Search service remembers the search state and the location of the last
 * match, for incremental searching.
 * Search service is also responsible of providing a cell renderer function
 * to set the background color of cells matching the search text.
 */
export declare class GridSearchService {
    constructor(grid: DataGrid);
    /**
     * A signal fired when the grid changes.
     */
    get changed(): ISignal<GridSearchService, void>;
    /**
     * Returns a cellrenderer config function to render each cell background.
     * If cell match, background is matchBackgroundColor, if it's the current
     * match, background is currentMatchBackgroundColor.
     */
    cellBackgroundColorRendererFunc(config: TextRenderConfig): CellRenderer.ConfigFunc<string>;
    /**
     * Clear the search.
     */
    clear(): void;
    /**
     * incrementally look for searchText.
     */
    find(query: RegExp, reverse?: boolean): boolean;
    /**
     * Wrap indices if needed to just before the start or just after the end.
     */
    private _wrapRows;
    get query(): RegExp | null;
    private _grid;
    private _query;
    private _row;
    private _column;
    private _looping;
    private _changed;
}
/**
 * A viewer for CSV tables.
 */
export declare class CSVViewer extends Widget {
    /**
     * Construct a new CSV viewer.
     */
    constructor(options: CSVViewer.IOptions);
    /**
     * The CSV widget's context.
     */
    get context(): DocumentRegistry.Context;
    /**
     * A promise that resolves when the csv viewer is ready to be revealed.
     */
    get revealed(): Promise<void>;
    /**
     * The delimiter for the file.
     */
    get delimiter(): string;
    set delimiter(value: string);
    /**
     * The style used by the data grid.
     */
    get style(): DataGrid.Style;
    set style(value: DataGrid.Style);
    /**
     * The config used to create text renderer.
     */
    set rendererConfig(rendererConfig: TextRenderConfig);
    /**
     * The search service
     */
    get searchService(): GridSearchService;
    /**
     * Dispose of the resources used by the widget.
     */
    dispose(): void;
    /**
     * Go to line
     */
    goToLine(lineNumber: number): void;
    /**
     * Handle `'activate-request'` messages.
     */
    protected onActivateRequest(msg: Message): void;
    /**
     * Create the model for the grid.
     */
    private _updateGrid;
    /**
     * Update the renderer for the grid.
     */
    private _updateRenderer;
    private _context;
    private _grid;
    private _searchService;
    private _monitor;
    private _delimiter;
    private _revealed;
    private _baseRenderer;
}
/**
 * A namespace for `CSVViewer` statics.
 */
export declare namespace CSVViewer {
    /**
     * Instantiation options for CSV widgets.
     */
    interface IOptions {
        /**
         * The document context for the CSV being rendered by the widget.
         */
        context: DocumentRegistry.Context;
    }
}
/**
 * A document widget for CSV content widgets.
 */
export declare class CSVDocumentWidget extends DocumentWidget<CSVViewer> {
    constructor(options: CSVDocumentWidget.IOptions);
    /**
     * Set URI fragment identifier for rows
     */
    setFragment(fragment: string): void;
}
export declare namespace CSVDocumentWidget {
    interface IOptions extends DocumentWidget.IOptionsOptionalContent<CSVViewer> {
        /**
         * Data delimiter character
         */
        delimiter?: string;
    }
}
/**
 * A widget factory for CSV widgets.
 */
export declare class CSVViewerFactory extends ABCWidgetFactory<IDocumentWidget<CSVViewer>> {
    /**
     * Create a new widget given a context.
     */
    protected createNewWidget(context: DocumentRegistry.Context): IDocumentWidget<CSVViewer>;
    /**
     * Default factory for toolbar items to be added after the widget is created.
     */
    protected defaultToolbarFactory(widget: IDocumentWidget<CSVViewer>): DocumentRegistry.IToolbarItem[];
}
/**
 * A widget factory for TSV widgets.
 */
export declare class TSVViewerFactory extends CSVViewerFactory {
    /**
     * Create a new widget given a context.
     */
    protected createNewWidget(context: DocumentRegistry.Context): IDocumentWidget<CSVViewer>;
}
