// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/**
 * @packageDocumentation
 * @module csvviewer-extension
 */
import { ILayoutRestorer } from '@jupyterlab/application';
import { createToolbarFactory, InputDialog, IThemeManager, IToolbarWidgetRegistry, WidgetTracker } from '@jupyterlab/apputils';
import { CSVDelimiter, CSVViewerFactory, TSVViewerFactory } from '@jupyterlab/csvviewer';
import { ISearchProviderRegistry } from '@jupyterlab/documentsearch';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITranslator } from '@jupyterlab/translation';
import { DataGrid } from '@lumino/datagrid';
import { CSVSearchProvider } from './searchprovider';
/**
 * The name of the factories that creates widgets.
 */
const FACTORY_CSV = 'CSVTable';
const FACTORY_TSV = 'TSVTable';
/**
 * The CSV file handler extension.
 */
const csv = {
    activate: activateCsv,
    id: '@jupyterlab/csvviewer-extension:csv',
    requires: [ITranslator],
    optional: [
        ILayoutRestorer,
        IThemeManager,
        IMainMenu,
        ISearchProviderRegistry,
        ISettingRegistry,
        IToolbarWidgetRegistry
    ],
    autoStart: true
};
/**
 * The TSV file handler extension.
 */
const tsv = {
    activate: activateTsv,
    id: '@jupyterlab/csvviewer-extension:tsv',
    requires: [ITranslator],
    optional: [
        ILayoutRestorer,
        IThemeManager,
        IMainMenu,
        ISearchProviderRegistry,
        ISettingRegistry,
        IToolbarWidgetRegistry
    ],
    autoStart: true
};
/**
 * Connect menu entries for find and go to line.
 */
function addMenuEntries(mainMenu, tracker, translator) {
    const trans = translator.load('jupyterlab');
    // Add go to line capability to the edit menu.
    mainMenu.editMenu.goToLiners.add({
        tracker,
        goToLine: (widget) => {
            return InputDialog.getNumber({
                title: trans.__('Go to Line'),
                value: 0
            }).then(value => {
                if (value.button.accept && value.value !== null) {
                    widget.content.goToLine(value.value);
                }
            });
        }
    });
}
/**
 * Activate cssviewer extension for CSV files
 */
function activateCsv(app, translator, restorer, themeManager, mainMenu, searchregistry, settingRegistry, toolbarRegistry) {
    let toolbarFactory;
    if (toolbarRegistry) {
        toolbarRegistry.registerFactory(FACTORY_CSV, 'delimiter', widget => new CSVDelimiter({
            widget: widget.content,
            translator
        }));
        if (settingRegistry) {
            toolbarFactory = createToolbarFactory(toolbarRegistry, settingRegistry, FACTORY_CSV, csv.id, translator);
        }
    }
    const factory = new CSVViewerFactory({
        name: FACTORY_CSV,
        fileTypes: ['csv'],
        defaultFor: ['csv'],
        readOnly: true,
        toolbarFactory,
        translator
    });
    const tracker = new WidgetTracker({
        namespace: 'csvviewer'
    });
    // The current styles for the data grids.
    let style = Private.LIGHT_STYLE;
    let rendererConfig = Private.LIGHT_TEXT_CONFIG;
    if (restorer) {
        // Handle state restoration.
        void restorer.restore(tracker, {
            command: 'docmanager:open',
            args: widget => ({ path: widget.context.path, factory: FACTORY_CSV }),
            name: widget => widget.context.path
        });
    }
    app.docRegistry.addWidgetFactory(factory);
    const ft = app.docRegistry.getFileType('csv');
    factory.widgetCreated.connect((sender, widget) => {
        // Track the widget.
        void tracker.add(widget);
        // Notify the widget tracker if restore data needs to update.
        widget.context.pathChanged.connect(() => {
            void tracker.save(widget);
        });
        if (ft) {
            widget.title.icon = ft.icon;
            widget.title.iconClass = ft.iconClass;
            widget.title.iconLabel = ft.iconLabel;
        }
        // Set the theme for the new widget.
        widget.content.style = style;
        widget.content.rendererConfig = rendererConfig;
    });
    // Keep the themes up-to-date.
    const updateThemes = () => {
        const isLight = themeManager && themeManager.theme
            ? themeManager.isLight(themeManager.theme)
            : true;
        style = isLight ? Private.LIGHT_STYLE : Private.DARK_STYLE;
        rendererConfig = isLight
            ? Private.LIGHT_TEXT_CONFIG
            : Private.DARK_TEXT_CONFIG;
        tracker.forEach(grid => {
            grid.content.style = style;
            grid.content.rendererConfig = rendererConfig;
        });
    };
    if (themeManager) {
        themeManager.themeChanged.connect(updateThemes);
    }
    if (mainMenu) {
        addMenuEntries(mainMenu, tracker, translator);
    }
    if (searchregistry) {
        searchregistry.register('csv', CSVSearchProvider);
    }
}
/**
 * Activate cssviewer extension for TSV files
 */
function activateTsv(app, translator, restorer, themeManager, mainMenu, searchregistry, settingRegistry, toolbarRegistry) {
    let toolbarFactory;
    if (toolbarRegistry) {
        toolbarRegistry.registerFactory(FACTORY_TSV, 'delimiter', widget => new CSVDelimiter({
            widget: widget.content,
            translator
        }));
        if (settingRegistry) {
            toolbarFactory = createToolbarFactory(toolbarRegistry, settingRegistry, FACTORY_TSV, tsv.id, translator);
        }
    }
    const factory = new TSVViewerFactory({
        name: FACTORY_TSV,
        fileTypes: ['tsv'],
        defaultFor: ['tsv'],
        readOnly: true,
        toolbarFactory,
        translator
    });
    const tracker = new WidgetTracker({
        namespace: 'tsvviewer'
    });
    // The current styles for the data grids.
    let style = Private.LIGHT_STYLE;
    let rendererConfig = Private.LIGHT_TEXT_CONFIG;
    if (restorer) {
        // Handle state restoration.
        void restorer.restore(tracker, {
            command: 'docmanager:open',
            args: widget => ({ path: widget.context.path, factory: FACTORY_TSV }),
            name: widget => widget.context.path
        });
    }
    app.docRegistry.addWidgetFactory(factory);
    const ft = app.docRegistry.getFileType('tsv');
    factory.widgetCreated.connect((sender, widget) => {
        // Track the widget.
        void tracker.add(widget);
        // Notify the widget tracker if restore data needs to update.
        widget.context.pathChanged.connect(() => {
            void tracker.save(widget);
        });
        if (ft) {
            widget.title.icon = ft.icon;
            widget.title.iconClass = ft.iconClass;
            widget.title.iconLabel = ft.iconLabel;
        }
        // Set the theme for the new widget.
        widget.content.style = style;
        widget.content.rendererConfig = rendererConfig;
    });
    // Keep the themes up-to-date.
    const updateThemes = () => {
        const isLight = themeManager && themeManager.theme
            ? themeManager.isLight(themeManager.theme)
            : true;
        style = isLight ? Private.LIGHT_STYLE : Private.DARK_STYLE;
        rendererConfig = isLight
            ? Private.LIGHT_TEXT_CONFIG
            : Private.DARK_TEXT_CONFIG;
        tracker.forEach(grid => {
            grid.content.style = style;
            grid.content.rendererConfig = rendererConfig;
        });
    };
    if (themeManager) {
        themeManager.themeChanged.connect(updateThemes);
    }
    if (mainMenu) {
        addMenuEntries(mainMenu, tracker, translator);
    }
    if (searchregistry) {
        searchregistry.register('tsv', CSVSearchProvider);
    }
}
/**
 * Export the plugins as default.
 */
const plugins = [csv, tsv];
export default plugins;
/**
 * A namespace for private data.
 */
var Private;
(function (Private) {
    /**
     * The light theme for the data grid.
     */
    Private.LIGHT_STYLE = Object.assign(Object.assign({}, DataGrid.defaultStyle), { voidColor: '#F3F3F3', backgroundColor: 'white', headerBackgroundColor: '#EEEEEE', gridLineColor: 'rgba(20, 20, 20, 0.15)', headerGridLineColor: 'rgba(20, 20, 20, 0.25)', rowBackgroundColor: i => (i % 2 === 0 ? '#F5F5F5' : 'white') });
    /**
     * The dark theme for the data grid.
     */
    Private.DARK_STYLE = Object.assign(Object.assign({}, DataGrid.defaultStyle), { voidColor: 'black', backgroundColor: '#111111', headerBackgroundColor: '#424242', gridLineColor: 'rgba(235, 235, 235, 0.15)', headerGridLineColor: 'rgba(235, 235, 235, 0.25)', rowBackgroundColor: i => (i % 2 === 0 ? '#212121' : '#111111') });
    /**
     * The light config for the data grid renderer.
     */
    Private.LIGHT_TEXT_CONFIG = {
        textColor: '#111111',
        matchBackgroundColor: '#FFFFE0',
        currentMatchBackgroundColor: '#FFFF00',
        horizontalAlignment: 'right'
    };
    /**
     * The dark config for the data grid renderer.
     */
    Private.DARK_TEXT_CONFIG = {
        textColor: '#F5F5F5',
        matchBackgroundColor: '#838423',
        currentMatchBackgroundColor: '#A3807A',
        horizontalAlignment: 'right'
    };
})(Private || (Private = {}));
//# sourceMappingURL=index.js.map