// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { ActivityMonitor } from '@jupyterlab/coreutils';
import { ABCWidgetFactory, DocumentWidget } from '@jupyterlab/docregistry';
import { PromiseDelegate } from '@lumino/coreutils';
import { BasicKeyHandler, BasicMouseHandler, BasicSelectionModel, DataGrid, TextRenderer } from '@lumino/datagrid';
import { Signal } from '@lumino/signaling';
import { PanelLayout, Widget } from '@lumino/widgets';
import { DSVModel } from './model';
import { CSVDelimiter } from './toolbar';
/**
 * The class name added to a CSV viewer.
 */
const CSV_CLASS = 'jp-CSVViewer';
/**
 * The class name added to a CSV viewer datagrid.
 */
const CSV_GRID_CLASS = 'jp-CSVViewer-grid';
/**
 * The timeout to wait for change activity to have ceased before rendering.
 */
const RENDER_TIMEOUT = 1000;
/**
 * Configuration for cells textrenderer.
 */
export class TextRenderConfig {
}
/**
 * Search service remembers the search state and the location of the last
 * match, for incremental searching.
 * Search service is also responsible of providing a cell renderer function
 * to set the background color of cells matching the search text.
 */
export class GridSearchService {
    constructor(grid) {
        this._looping = true;
        this._changed = new Signal(this);
        this._grid = grid;
        this._query = null;
        this._row = 0;
        this._column = -1;
    }
    /**
     * A signal fired when the grid changes.
     */
    get changed() {
        return this._changed;
    }
    /**
     * Returns a cellrenderer config function to render each cell background.
     * If cell match, background is matchBackgroundColor, if it's the current
     * match, background is currentMatchBackgroundColor.
     */
    cellBackgroundColorRendererFunc(config) {
        return ({ value, row, column }) => {
            if (this._query) {
                if (value.match(this._query)) {
                    if (this._row === row && this._column === column) {
                        return config.currentMatchBackgroundColor;
                    }
                    return config.matchBackgroundColor;
                }
            }
            return '';
        };
    }
    /**
     * Clear the search.
     */
    clear() {
        this._query = null;
        this._row = 0;
        this._column = -1;
        this._changed.emit(undefined);
    }
    /**
     * incrementally look for searchText.
     */
    find(query, reverse = false) {
        const model = this._grid.dataModel;
        const rowCount = model.rowCount('body');
        const columnCount = model.columnCount('body');
        if (this._query !== query) {
            // reset search
            this._row = 0;
            this._column = -1;
        }
        this._query = query;
        // check if the match is in current viewport
        const minRow = this._grid.scrollY / this._grid.defaultSizes.rowHeight;
        const maxRow = (this._grid.scrollY + this._grid.pageHeight) /
            this._grid.defaultSizes.rowHeight;
        const minColumn = this._grid.scrollX / this._grid.defaultSizes.columnHeaderHeight;
        const maxColumn = (this._grid.scrollX + this._grid.pageWidth) /
            this._grid.defaultSizes.columnHeaderHeight;
        const isInViewport = (row, column) => {
            return (row >= minRow &&
                row <= maxRow &&
                column >= minColumn &&
                column <= maxColumn);
        };
        const increment = reverse ? -1 : 1;
        this._column += increment;
        for (let row = this._row; reverse ? row >= 0 : row < rowCount; row += increment) {
            for (let col = this._column; reverse ? col >= 0 : col < columnCount; col += increment) {
                const cellData = model.data('body', row, col);
                if (cellData.match(query)) {
                    // to update the background of matching cells.
                    // TODO: we only really need to invalidate the previous and current
                    // cell rects, not the entire grid.
                    this._changed.emit(undefined);
                    if (!isInViewport(row, col)) {
                        this._grid.scrollToRow(row);
                    }
                    this._row = row;
                    this._column = col;
                    return true;
                }
            }
            this._column = reverse ? columnCount - 1 : 0;
        }
        // We've finished searching all the way to the limits of the grid. If this
        // is the first time through (looping is true), wrap the indices and search
        // again. Otherwise, give up.
        if (this._looping) {
            this._looping = false;
            this._row = reverse ? 0 : rowCount - 1;
            this._wrapRows(reverse);
            try {
                return this.find(query, reverse);
            }
            finally {
                this._looping = true;
            }
        }
        return false;
    }
    /**
     * Wrap indices if needed to just before the start or just after the end.
     */
    _wrapRows(reverse = false) {
        const model = this._grid.dataModel;
        const rowCount = model.rowCount('body');
        const columnCount = model.columnCount('body');
        if (reverse && this._row <= 0) {
            // if we are at the front, wrap to just past the end.
            this._row = rowCount - 1;
            this._column = columnCount;
        }
        else if (!reverse && this._row >= rowCount - 1) {
            // if we are at the end, wrap to just before the front.
            this._row = 0;
            this._column = -1;
        }
    }
    get query() {
        return this._query;
    }
}
/**
 * A viewer for CSV tables.
 */
export class CSVViewer extends Widget {
    /**
     * Construct a new CSV viewer.
     */
    constructor(options) {
        super();
        this._monitor = null;
        this._delimiter = ',';
        this._revealed = new PromiseDelegate();
        this._baseRenderer = null;
        const context = (this._context = options.context);
        const layout = (this.layout = new PanelLayout());
        this.addClass(CSV_CLASS);
        this._grid = new DataGrid({
            defaultSizes: {
                rowHeight: 24,
                columnWidth: 144,
                rowHeaderWidth: 64,
                columnHeaderHeight: 36
            }
        });
        this._grid.addClass(CSV_GRID_CLASS);
        this._grid.headerVisibility = 'all';
        this._grid.keyHandler = new BasicKeyHandler();
        this._grid.mouseHandler = new BasicMouseHandler();
        this._grid.copyConfig = {
            separator: '\t',
            format: DataGrid.copyFormatGeneric,
            headers: 'all',
            warningThreshold: 1e6
        };
        layout.addWidget(this._grid);
        this._searchService = new GridSearchService(this._grid);
        this._searchService.changed.connect(this._updateRenderer, this);
        void this._context.ready.then(() => {
            this._updateGrid();
            this._revealed.resolve(undefined);
            // Throttle the rendering rate of the widget.
            this._monitor = new ActivityMonitor({
                signal: context.model.contentChanged,
                timeout: RENDER_TIMEOUT
            });
            this._monitor.activityStopped.connect(this._updateGrid, this);
        });
    }
    /**
     * The CSV widget's context.
     */
    get context() {
        return this._context;
    }
    /**
     * A promise that resolves when the csv viewer is ready to be revealed.
     */
    get revealed() {
        return this._revealed.promise;
    }
    /**
     * The delimiter for the file.
     */
    get delimiter() {
        return this._delimiter;
    }
    set delimiter(value) {
        if (value === this._delimiter) {
            return;
        }
        this._delimiter = value;
        this._updateGrid();
    }
    /**
     * The style used by the data grid.
     */
    get style() {
        return this._grid.style;
    }
    set style(value) {
        this._grid.style = value;
    }
    /**
     * The config used to create text renderer.
     */
    set rendererConfig(rendererConfig) {
        this._baseRenderer = rendererConfig;
        this._updateRenderer();
    }
    /**
     * The search service
     */
    get searchService() {
        return this._searchService;
    }
    /**
     * Dispose of the resources used by the widget.
     */
    dispose() {
        if (this._monitor) {
            this._monitor.dispose();
        }
        super.dispose();
    }
    /**
     * Go to line
     */
    goToLine(lineNumber) {
        this._grid.scrollToRow(lineNumber);
    }
    /**
     * Handle `'activate-request'` messages.
     */
    onActivateRequest(msg) {
        this.node.tabIndex = -1;
        this.node.focus();
    }
    /**
     * Create the model for the grid.
     */
    _updateGrid() {
        const data = this._context.model.toString();
        const delimiter = this._delimiter;
        const oldModel = this._grid.dataModel;
        const dataModel = (this._grid.dataModel = new DSVModel({
            data,
            delimiter
        }));
        this._grid.selectionModel = new BasicSelectionModel({ dataModel });
        if (oldModel) {
            oldModel.dispose();
        }
    }
    /**
     * Update the renderer for the grid.
     */
    _updateRenderer() {
        if (this._baseRenderer === null) {
            return;
        }
        const rendererConfig = this._baseRenderer;
        const renderer = new TextRenderer({
            textColor: rendererConfig.textColor,
            horizontalAlignment: rendererConfig.horizontalAlignment,
            backgroundColor: this._searchService.cellBackgroundColorRendererFunc(rendererConfig)
        });
        this._grid.cellRenderers.update({
            body: renderer,
            'column-header': renderer,
            'corner-header': renderer,
            'row-header': renderer
        });
    }
}
/**
 * A document widget for CSV content widgets.
 */
export class CSVDocumentWidget extends DocumentWidget {
    constructor(options) {
        let { content, context, delimiter, reveal } = options, other = __rest(options, ["content", "context", "delimiter", "reveal"]);
        content = content || Private.createContent(context);
        reveal = Promise.all([reveal, content.revealed]);
        super(Object.assign({ content, context, reveal }, other));
        if (delimiter) {
            content.delimiter = delimiter;
        }
    }
    /**
     * Set URI fragment identifier for rows
     */
    setFragment(fragment) {
        const parseFragments = fragment.split('=');
        // TODO: expand to allow columns and cells to be selected
        // reference: https://tools.ietf.org/html/rfc7111#section-3
        if (parseFragments[0] !== '#row') {
            return;
        }
        // multiple rows, separated by semi-colons can be provided, we will just
        // go to the top one
        let topRow = parseFragments[1].split(';')[0];
        // a range of rows can be provided, we will take the first value
        topRow = topRow.split('-')[0];
        // go to that row
        void this.context.ready.then(() => {
            this.content.goToLine(Number(topRow));
        });
    }
}
var Private;
(function (Private) {
    function createContent(context) {
        return new CSVViewer({ context });
    }
    Private.createContent = createContent;
})(Private || (Private = {}));
/**
 * A widget factory for CSV widgets.
 */
export class CSVViewerFactory extends ABCWidgetFactory {
    /**
     * Create a new widget given a context.
     */
    createNewWidget(context) {
        const translator = this.translator;
        return new CSVDocumentWidget({ context, translator });
    }
    /**
     * Default factory for toolbar items to be added after the widget is created.
     */
    defaultToolbarFactory(widget) {
        return [
            {
                name: 'delimiter',
                widget: new CSVDelimiter({
                    widget: widget.content,
                    translator: this.translator
                })
            }
        ];
    }
}
/**
 * A widget factory for TSV widgets.
 */
export class TSVViewerFactory extends CSVViewerFactory {
    /**
     * Create a new widget given a context.
     */
    createNewWidget(context) {
        const delimiter = '\t';
        return new CSVDocumentWidget({
            context,
            delimiter,
            translator: this.translator
        });
    }
}
//# sourceMappingURL=widget.js.map