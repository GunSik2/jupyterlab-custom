import { MainAreaWidget } from '@jupyterlab/apputils';
import { CodeMirrorSearchProvider } from '@jupyterlab/codemirror';
import { ISearchProvider } from '@jupyterlab/documentsearch';
import { ITranslator } from '@jupyterlab/translation';
import { Widget } from '@lumino/widgets';
import { FileEditor } from './widget';
/**
 * Helper type
 */
export declare type FileEditorPanel = MainAreaWidget<FileEditor>;
/**
 * File editor search provider
 */
export declare class FileEditorSearchProvider extends CodeMirrorSearchProvider implements ISearchProvider {
    /**
     * Constructor
     * @param widget File editor panel
     */
    constructor(widget: FileEditorPanel);
    /**
     * Instantiate a search provider for the widget.
     *
     * #### Notes
     * The widget provided is always checked using `isApplicable` before calling
     * this factory.
     *
     * @param widget The widget to search on
     * @param translator [optional] The translator object
     *
     * @returns The search provider on the widget
     */
    static createNew(widget: FileEditorPanel, translator?: ITranslator): ISearchProvider;
    /**
     * Report whether or not this provider has the ability to search on the given object
     */
    static isApplicable(domain: Widget): domain is FileEditorPanel;
    /**
     * Get an initial query value if applicable so that it can be entered
     * into the search box as an initial query
     *
     * @returns Initial value used to populate the search box.
     */
    getInitialQuery(): string;
}
