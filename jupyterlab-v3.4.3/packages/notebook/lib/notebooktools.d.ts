import { Cell } from '@jupyterlab/cells';
import { CodeEditor, JSONEditor } from '@jupyterlab/codeeditor';
import * as nbformat from '@jupyterlab/nbformat';
import { ObservableJSON } from '@jupyterlab/observables';
import { ITranslator } from '@jupyterlab/translation';
import { ReadonlyPartialJSONValue } from '@lumino/coreutils';
import { ConflatableMessage, Message } from '@lumino/messaging';
import { Widget } from '@lumino/widgets';
import { NotebookPanel } from './panel';
import { INotebookTools, INotebookTracker } from './tokens';
/**
 * A widget that provides metadata tools.
 */
export declare class NotebookTools extends Widget implements INotebookTools {
    /**
     * Construct a new NotebookTools object.
     */
    constructor(options: NotebookTools.IOptions);
    /**
     * The active cell widget.
     */
    get activeCell(): Cell | null;
    /**
     * The currently selected cells.
     */
    get selectedCells(): Cell[];
    /**
     * The current notebook.
     */
    get activeNotebookPanel(): NotebookPanel | null;
    /**
     * Add a cell tool item.
     */
    addItem(options: NotebookTools.IAddOptions): void;
    /**
     * Handle a change to the notebook panel.
     */
    private _onActiveNotebookPanelChanged;
    /**
     * Handle a change to the active cell.
     */
    private _onActiveCellChanged;
    /**
     * Handle a change in the selection.
     */
    private _onSelectionChanged;
    /**
     * Handle a change in the active cell metadata.
     */
    private _onActiveNotebookPanelMetadataChanged;
    /**
     * Handle a change in the notebook model metadata.
     */
    private _onActiveCellMetadataChanged;
    private _toolChildren;
    translator: ITranslator;
    private _trans;
    private _commonTools;
    private _advancedTools;
    private _tracker;
    private _prevActiveCell;
    private _prevActiveNotebookModel;
}
/**
 * The namespace for NotebookTools class statics.
 */
export declare namespace NotebookTools {
    /**
     * A type alias for a readonly partial JSON tuples `[option, value]`.
     * `option` should be localized.
     *
     * Note: Partial here means that JSON object attributes can be `undefined`.
     */
    type ReadonlyPartialJSONOptionValueArray = [
        ReadonlyPartialJSONValue | undefined,
        ReadonlyPartialJSONValue
    ][];
    /**
     * The options used to create a NotebookTools object.
     */
    interface IOptions {
        /**
         * The notebook tracker used by the notebook tools.
         */
        tracker: INotebookTracker;
        /**
         * Language translator.
         */
        translator?: ITranslator;
    }
    /**
     * The options used to add an item to the notebook tools.
     */
    interface IAddOptions {
        /**
         * The tool to add to the notebook tools area.
         */
        tool: Tool;
        /**
         * The section to which the tool should be added.
         */
        section?: 'common' | 'advanced';
        /**
         * The rank order of the widget among its siblings.
         */
        rank?: number;
    }
    /**
     * A singleton conflatable `'activenotebookpanel-changed'` message.
     */
    const ActiveNotebookPanelMessage: ConflatableMessage;
    /**
     * A singleton conflatable `'activecell-changed'` message.
     */
    const ActiveCellMessage: ConflatableMessage;
    /**
     * A singleton conflatable `'selection-changed'` message.
     */
    const SelectionMessage: ConflatableMessage;
    /**
     * The base notebook tool, meant to be subclassed.
     */
    class Tool extends Widget implements INotebookTools.ITool {
        /**
         * The notebook tools object.
         */
        notebookTools: INotebookTools;
        dispose(): void;
        /**
         * Process a message sent to the widget.
         *
         * @param msg - The message sent to the widget.
         */
        processMessage(msg: Message): void;
        /**
         * Handle a change to the notebook panel.
         *
         * #### Notes
         * The default implementation is a no-op.
         */
        protected onActiveNotebookPanelChanged(msg: Message): void;
        /**
         * Handle a change to the active cell.
         *
         * #### Notes
         * The default implementation is a no-op.
         */
        protected onActiveCellChanged(msg: Message): void;
        /**
         * Handle a change to the selection.
         *
         * #### Notes
         * The default implementation is a no-op.
         */
        protected onSelectionChanged(msg: Message): void;
        /**
         * Handle a change to the metadata of the active cell.
         *
         * #### Notes
         * The default implementation is a no-op.
         */
        protected onActiveCellMetadataChanged(msg: ObservableJSON.ChangeMessage): void;
        /**
         * Handle a change to the metadata of the active cell.
         *
         * #### Notes
         * The default implementation is a no-op.
         */
        protected onActiveNotebookPanelMetadataChanged(msg: ObservableJSON.ChangeMessage): void;
    }
    /**
     * A cell tool displaying the active cell contents.
     */
    class ActiveCellTool extends Tool {
        /**
         * Construct a new active cell tool.
         */
        constructor();
        /**
         * Dispose of the resources used by the tool.
         */
        dispose(): void;
        /**
         * Handle a change to the active cell.
         */
        protected onActiveCellChanged(): void;
        /**
         * Handle a change to the current editor value.
         */
        private _onValueChanged;
        /**
         * Handle a change to the current editor mimetype.
         */
        private _onMimeTypeChanged;
        private _model;
        private _cellModel;
    }
    /**
     * A raw metadata editor.
     */
    class MetadataEditorTool extends Tool {
        /**
         * Construct a new raw metadata tool.
         */
        constructor(options: MetadataEditorTool.IOptions);
        /**
         * The editor used by the tool.
         */
        readonly editor: JSONEditor;
    }
    /**
     * The namespace for `MetadataEditorTool` static data.
     */
    namespace MetadataEditorTool {
        /**
         * The options used to initialize a metadata editor tool.
         */
        interface IOptions {
            /**
             * The editor factory used by the tool.
             */
            editorFactory: CodeEditor.Factory;
            /**
             * The label for the JSON editor
             */
            label?: string;
            /**
             * Initial collapse state, defaults to true.
             */
            collapsed?: boolean;
            /**
             * Language translator.
             */
            translator?: ITranslator;
        }
    }
    /**
     * A notebook metadata editor
     */
    class NotebookMetadataEditorTool extends MetadataEditorTool {
        constructor(options: MetadataEditorTool.IOptions);
        /**
         * Handle a change to the notebook.
         */
        protected onActiveNotebookPanelChanged(msg: Message): void;
        /**
         * Handle a change to the notebook metadata.
         */
        protected onActiveNotebookPanelMetadataChanged(msg: Message): void;
        private _update;
    }
    /**
     * A cell metadata editor
     */
    class CellMetadataEditorTool extends MetadataEditorTool {
        constructor(options: MetadataEditorTool.IOptions);
        /**
         * Handle a change to the active cell.
         */
        protected onActiveCellChanged(msg: Message): void;
        /**
         * Handle a change to the active cell metadata.
         */
        protected onActiveCellMetadataChanged(msg: Message): void;
        private _update;
    }
    /**
     * A cell tool that provides a selection for a given metadata key.
     */
    class KeySelector extends Tool {
        /**
         * Construct a new KeySelector.
         */
        constructor(options: KeySelector.IOptions);
        /**
         * The metadata key used by the selector.
         */
        readonly key: string;
        /**
         * The select node for the widget.
         */
        get selectNode(): HTMLSelectElement;
        /**
         * Handle the DOM events for the widget.
         *
         * @param event - The DOM event sent to the widget.
         *
         * #### Notes
         * This method implements the DOM `EventListener` interface and is
         * called in response to events on the notebook panel's node. It should
         * not be called directly by user code.
         */
        handleEvent(event: Event): void;
        /**
         * Handle `after-attach` messages for the widget.
         */
        protected onAfterAttach(msg: Message): void;
        /**
         * Handle `before-detach` messages for the widget.
         */
        protected onBeforeDetach(msg: Message): void;
        /**
         * Handle a change to the active cell.
         */
        protected onActiveCellChanged(msg: Message): void;
        /**
         * Handle a change to the metadata of the active cell.
         */
        protected onActiveCellMetadataChanged(msg: ObservableJSON.ChangeMessage): void;
        /**
         * Handle a change to the value.
         */
        protected onValueChanged(): void;
        /**
         * Get the value for the data.
         */
        private _getValue;
        /**
         * Set the value for the data.
         */
        private _setValue;
        private _changeGuard;
        private _validCellTypes;
        private _getter;
        private _setter;
        private _default;
    }
    /**
     * The namespace for `KeySelector` static data.
     */
    namespace KeySelector {
        /**
         * The options used to initialize a keyselector.
         */
        interface IOptions {
            /**
             * The metadata key of interest.
             */
            key: string;
            /**
             * The map of values to options.
             *
             * Value corresponds to the unique identifier.
             * Option corresponds to the localizable value to display.
             *
             * See: `<option value="volvo">Volvo</option>`
             *
             * #### Notes
             * If a value equals the default, choosing it may erase the key from the
             * metadata.
             */
            optionValueArray: ReadonlyPartialJSONOptionValueArray;
            /**
             * The optional title of the selector - defaults to capitalized `key`.
             */
            title: string;
            /**
             * The optional valid cell types - defaults to all valid types.
             */
            validCellTypes?: nbformat.CellType[];
            /**
             * An optional value getter for the selector.
             *
             * @param cell - The currently active cell.
             *
             * @returns The appropriate value for the selector.
             */
            getter?: (cell: Cell) => ReadonlyPartialJSONValue | undefined;
            /**
             * An optional value setter for the selector.
             *
             * @param cell - The currently active cell.
             *
             * @param value - The value of the selector.
             *
             * #### Notes
             * The setter should set the appropriate metadata value given the value of
             * the selector.
             */
            setter?: (cell: Cell, value: ReadonlyPartialJSONValue | undefined) => void;
            /**
             * Default value for default setters and getters if value is not found.
             */
            default?: ReadonlyPartialJSONValue;
        }
    }
    /**
     * Create a slideshow selector.
     */
    function createSlideShowSelector(translator?: ITranslator): KeySelector;
    /**
     * Create an nbconvert selector.
     */
    function createNBConvertSelector(optionValueArray: ReadonlyPartialJSONOptionValueArray, translator?: ITranslator): KeySelector;
}
