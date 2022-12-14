// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { Collapse, Styling } from '@jupyterlab/apputils';
import { CodeEditor, CodeEditorWrapper, JSONEditor } from '@jupyterlab/codeeditor';
import { ObservableJSON } from '@jupyterlab/observables';
import { nullTranslator } from '@jupyterlab/translation';
import { ArrayExt, chain, each } from '@lumino/algorithm';
import { ConflatableMessage, MessageLoop } from '@lumino/messaging';
import { h, VirtualDOM } from '@lumino/virtualdom';
import { PanelLayout, Widget } from '@lumino/widgets';
class RankedPanel extends Widget {
    constructor() {
        super();
        this._items = [];
        this.layout = new PanelLayout();
        this.addClass('jp-RankedPanel');
    }
    addWidget(widget, rank) {
        const rankItem = { widget, rank };
        const index = ArrayExt.upperBound(this._items, rankItem, Private.itemCmp);
        ArrayExt.insert(this._items, index, rankItem);
        const layout = this.layout;
        layout.insertWidget(index, widget);
    }
    /**
     * Handle the removal of a child
     *
     */
    onChildRemoved(msg) {
        const index = ArrayExt.findFirstIndex(this._items, item => item.widget === msg.child);
        if (index !== -1) {
            ArrayExt.removeAt(this._items, index);
        }
    }
}
/**
 * A widget that provides metadata tools.
 */
export class NotebookTools extends Widget {
    /**
     * Construct a new NotebookTools object.
     */
    constructor(options) {
        super();
        this.addClass('jp-NotebookTools');
        this.translator = options.translator || nullTranslator;
        this._trans = this.translator.load('jupyterlab');
        this._commonTools = new RankedPanel();
        this._advancedTools = new RankedPanel();
        this._advancedTools.title.label = this._trans.__('Advanced Tools');
        const layout = (this.layout = new PanelLayout());
        layout.addWidget(this._commonTools);
        layout.addWidget(new Collapse({ widget: this._advancedTools }));
        this._tracker = options.tracker;
        this._tracker.currentChanged.connect(this._onActiveNotebookPanelChanged, this);
        this._tracker.activeCellChanged.connect(this._onActiveCellChanged, this);
        this._tracker.selectionChanged.connect(this._onSelectionChanged, this);
        this._onActiveNotebookPanelChanged();
        this._onActiveCellChanged();
        this._onSelectionChanged();
    }
    /**
     * The active cell widget.
     */
    get activeCell() {
        return this._tracker.activeCell;
    }
    /**
     * The currently selected cells.
     */
    get selectedCells() {
        const panel = this._tracker.currentWidget;
        if (!panel) {
            return [];
        }
        const notebook = panel.content;
        return notebook.widgets.filter(cell => notebook.isSelectedOrActive(cell));
    }
    /**
     * The current notebook.
     */
    get activeNotebookPanel() {
        return this._tracker.currentWidget;
    }
    /**
     * Add a cell tool item.
     */
    addItem(options) {
        var _a;
        const tool = options.tool;
        const rank = (_a = options.rank) !== null && _a !== void 0 ? _a : 100;
        let section;
        if (options.section === 'advanced') {
            section = this._advancedTools;
        }
        else {
            section = this._commonTools;
        }
        tool.addClass('jp-NotebookTools-tool');
        section.addWidget(tool, rank);
        // TODO: perhaps the necessary notebookTools functionality should be
        // consolidated into a single object, rather than a broad reference to this.
        tool.notebookTools = this;
        // Trigger the tool to update its active notebook and cell.
        MessageLoop.sendMessage(tool, NotebookTools.ActiveNotebookPanelMessage);
        MessageLoop.sendMessage(tool, NotebookTools.ActiveCellMessage);
    }
    /**
     * Handle a change to the notebook panel.
     */
    _onActiveNotebookPanelChanged() {
        if (this._prevActiveNotebookModel &&
            !this._prevActiveNotebookModel.isDisposed) {
            this._prevActiveNotebookModel.metadata.changed.disconnect(this._onActiveNotebookPanelMetadataChanged, this);
        }
        const activeNBModel = this.activeNotebookPanel && this.activeNotebookPanel.content
            ? this.activeNotebookPanel.content.model
            : null;
        this._prevActiveNotebookModel = activeNBModel;
        if (activeNBModel) {
            activeNBModel.metadata.changed.connect(this._onActiveNotebookPanelMetadataChanged, this);
        }
        each(this._toolChildren(), widget => {
            MessageLoop.sendMessage(widget, NotebookTools.ActiveNotebookPanelMessage);
        });
    }
    /**
     * Handle a change to the active cell.
     */
    _onActiveCellChanged() {
        if (this._prevActiveCell && !this._prevActiveCell.isDisposed) {
            this._prevActiveCell.metadata.changed.disconnect(this._onActiveCellMetadataChanged, this);
        }
        const activeCell = this.activeCell ? this.activeCell.model : null;
        this._prevActiveCell = activeCell;
        if (activeCell) {
            activeCell.metadata.changed.connect(this._onActiveCellMetadataChanged, this);
        }
        each(this._toolChildren(), widget => {
            MessageLoop.sendMessage(widget, NotebookTools.ActiveCellMessage);
        });
    }
    /**
     * Handle a change in the selection.
     */
    _onSelectionChanged() {
        each(this._toolChildren(), widget => {
            MessageLoop.sendMessage(widget, NotebookTools.SelectionMessage);
        });
    }
    /**
     * Handle a change in the active cell metadata.
     */
    _onActiveNotebookPanelMetadataChanged(sender, args) {
        const message = new ObservableJSON.ChangeMessage('activenotebookpanel-metadata-changed', args);
        each(this._toolChildren(), widget => {
            MessageLoop.sendMessage(widget, message);
        });
    }
    /**
     * Handle a change in the notebook model metadata.
     */
    _onActiveCellMetadataChanged(sender, args) {
        const message = new ObservableJSON.ChangeMessage('activecell-metadata-changed', args);
        each(this._toolChildren(), widget => {
            MessageLoop.sendMessage(widget, message);
        });
    }
    _toolChildren() {
        return chain(this._commonTools.children(), this._advancedTools.children());
    }
}
/**
 * The namespace for NotebookTools class statics.
 */
(function (NotebookTools) {
    /**
     * A singleton conflatable `'activenotebookpanel-changed'` message.
     */
    NotebookTools.ActiveNotebookPanelMessage = new ConflatableMessage('activenotebookpanel-changed');
    /**
     * A singleton conflatable `'activecell-changed'` message.
     */
    NotebookTools.ActiveCellMessage = new ConflatableMessage('activecell-changed');
    /**
     * A singleton conflatable `'selection-changed'` message.
     */
    NotebookTools.SelectionMessage = new ConflatableMessage('selection-changed');
    /**
     * The base notebook tool, meant to be subclassed.
     */
    class Tool extends Widget {
        dispose() {
            super.dispose();
            if (this.notebookTools) {
                this.notebookTools = null;
            }
        }
        /**
         * Process a message sent to the widget.
         *
         * @param msg - The message sent to the widget.
         */
        processMessage(msg) {
            super.processMessage(msg);
            switch (msg.type) {
                case 'activenotebookpanel-changed':
                    this.onActiveNotebookPanelChanged(msg);
                    break;
                case 'activecell-changed':
                    this.onActiveCellChanged(msg);
                    break;
                case 'selection-changed':
                    this.onSelectionChanged(msg);
                    break;
                case 'activecell-metadata-changed':
                    this.onActiveCellMetadataChanged(msg);
                    break;
                case 'activenotebookpanel-metadata-changed':
                    this.onActiveNotebookPanelMetadataChanged(msg);
                    break;
                default:
                    break;
            }
        }
        /**
         * Handle a change to the notebook panel.
         *
         * #### Notes
         * The default implementation is a no-op.
         */
        onActiveNotebookPanelChanged(msg) {
            /* no-op */
        }
        /**
         * Handle a change to the active cell.
         *
         * #### Notes
         * The default implementation is a no-op.
         */
        onActiveCellChanged(msg) {
            /* no-op */
        }
        /**
         * Handle a change to the selection.
         *
         * #### Notes
         * The default implementation is a no-op.
         */
        onSelectionChanged(msg) {
            /* no-op */
        }
        /**
         * Handle a change to the metadata of the active cell.
         *
         * #### Notes
         * The default implementation is a no-op.
         */
        onActiveCellMetadataChanged(msg) {
            /* no-op */
        }
        /**
         * Handle a change to the metadata of the active cell.
         *
         * #### Notes
         * The default implementation is a no-op.
         */
        onActiveNotebookPanelMetadataChanged(msg) {
            /* no-op */
        }
    }
    NotebookTools.Tool = Tool;
    /**
     * A cell tool displaying the active cell contents.
     */
    class ActiveCellTool extends Tool {
        /**
         * Construct a new active cell tool.
         */
        constructor() {
            super();
            this._model = new CodeEditor.Model();
            this.addClass('jp-ActiveCellTool');
            this.addClass('jp-InputArea');
            this.layout = new PanelLayout();
        }
        /**
         * Dispose of the resources used by the tool.
         */
        dispose() {
            if (this._model === null) {
                return;
            }
            this._model.dispose();
            this._model = null;
            super.dispose();
        }
        /**
         * Handle a change to the active cell.
         */
        onActiveCellChanged() {
            const activeCell = this.notebookTools.activeCell;
            const layout = this.layout;
            const count = layout.widgets.length;
            for (let i = 0; i < count; i++) {
                layout.widgets[0].dispose();
            }
            if (this._cellModel && !this._cellModel.isDisposed) {
                this._cellModel.value.changed.disconnect(this._onValueChanged, this);
                this._cellModel.mimeTypeChanged.disconnect(this._onMimeTypeChanged, this);
            }
            if (!activeCell) {
                const cell = new Widget();
                cell.addClass('jp-InputArea-editor');
                cell.addClass('jp-InputArea-editor');
                layout.addWidget(cell);
                this._cellModel = null;
                return;
            }
            const promptNode = activeCell.promptNode
                ? activeCell.promptNode.cloneNode(true)
                : undefined;
            const prompt = new Widget({ node: promptNode });
            const factory = activeCell.contentFactory.editorFactory;
            const cellModel = (this._cellModel = activeCell.model);
            cellModel.value.changed.connect(this._onValueChanged, this);
            cellModel.mimeTypeChanged.connect(this._onMimeTypeChanged, this);
            this._model.value.text = cellModel.value.text.split('\n')[0];
            this._model.mimeType = cellModel.mimeType;
            const model = this._model;
            const editorWidget = new CodeEditorWrapper({ model, factory });
            editorWidget.addClass('jp-InputArea-editor');
            editorWidget.addClass('jp-InputArea-editor');
            editorWidget.editor.setOption('readOnly', true);
            layout.addWidget(prompt);
            layout.addWidget(editorWidget);
        }
        /**
         * Handle a change to the current editor value.
         */
        _onValueChanged() {
            this._model.value.text = this._cellModel.value.text.split('\n')[0];
        }
        /**
         * Handle a change to the current editor mimetype.
         */
        _onMimeTypeChanged() {
            this._model.mimeType = this._cellModel.mimeType;
        }
    }
    NotebookTools.ActiveCellTool = ActiveCellTool;
    /**
     * A raw metadata editor.
     */
    class MetadataEditorTool extends Tool {
        /**
         * Construct a new raw metadata tool.
         */
        constructor(options) {
            super();
            const { editorFactory } = options;
            this.addClass('jp-MetadataEditorTool');
            const layout = (this.layout = new PanelLayout());
            this.editor = new JSONEditor({
                editorFactory
            });
            this.editor.title.label = options.label || 'Edit Metadata';
            const titleNode = new Widget({ node: document.createElement('label') });
            titleNode.node.textContent = options.label || 'Edit Metadata';
            layout.addWidget(titleNode);
            layout.addWidget(this.editor);
        }
    }
    NotebookTools.MetadataEditorTool = MetadataEditorTool;
    /**
     * A notebook metadata editor
     */
    class NotebookMetadataEditorTool extends MetadataEditorTool {
        constructor(options) {
            const translator = options.translator || nullTranslator;
            const trans = translator.load('jupyterlab');
            options.label = options.label || trans.__('Notebook Metadata');
            super(options);
        }
        /**
         * Handle a change to the notebook.
         */
        onActiveNotebookPanelChanged(msg) {
            this._update();
        }
        /**
         * Handle a change to the notebook metadata.
         */
        onActiveNotebookPanelMetadataChanged(msg) {
            this._update();
        }
        _update() {
            var _a, _b;
            const nb = this.notebookTools.activeNotebookPanel &&
                this.notebookTools.activeNotebookPanel.content;
            this.editor.source = (_b = (_a = nb === null || nb === void 0 ? void 0 : nb.model) === null || _a === void 0 ? void 0 : _a.metadata) !== null && _b !== void 0 ? _b : null;
        }
    }
    NotebookTools.NotebookMetadataEditorTool = NotebookMetadataEditorTool;
    /**
     * A cell metadata editor
     */
    class CellMetadataEditorTool extends MetadataEditorTool {
        constructor(options) {
            const translator = options.translator || nullTranslator;
            const trans = translator.load('jupyterlab');
            options.label = options.label || trans.__('Cell Metadata');
            super(options);
        }
        /**
         * Handle a change to the active cell.
         */
        onActiveCellChanged(msg) {
            this._update();
        }
        /**
         * Handle a change to the active cell metadata.
         */
        onActiveCellMetadataChanged(msg) {
            this._update();
        }
        _update() {
            const cell = this.notebookTools.activeCell;
            this.editor.source = cell ? cell.model.metadata : null;
        }
    }
    NotebookTools.CellMetadataEditorTool = CellMetadataEditorTool;
    /**
     * A cell tool that provides a selection for a given metadata key.
     */
    class KeySelector extends Tool {
        /**
         * Construct a new KeySelector.
         */
        constructor(options) {
            // TODO: use react
            super({ node: Private.createSelectorNode(options) });
            /**
             * Get the value for the data.
             */
            this._getValue = (cell) => {
                let value = cell.model.metadata.get(this.key);
                if (value === undefined) {
                    value = this._default;
                }
                return value;
            };
            /**
             * Set the value for the data.
             */
            this._setValue = (cell, value) => {
                if (value === this._default) {
                    cell.model.metadata.delete(this.key);
                }
                else {
                    cell.model.metadata.set(this.key, value);
                }
            };
            this._changeGuard = false;
            this.addClass('jp-KeySelector');
            this.key = options.key;
            this._default = options.default;
            this._validCellTypes = options.validCellTypes || [];
            this._getter = options.getter || this._getValue;
            this._setter = options.setter || this._setValue;
        }
        /**
         * The select node for the widget.
         */
        get selectNode() {
            return this.node.getElementsByTagName('select')[0];
        }
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
        handleEvent(event) {
            switch (event.type) {
                case 'change':
                    this.onValueChanged();
                    break;
                default:
                    break;
            }
        }
        /**
         * Handle `after-attach` messages for the widget.
         */
        onAfterAttach(msg) {
            const node = this.selectNode;
            node.addEventListener('change', this);
        }
        /**
         * Handle `before-detach` messages for the widget.
         */
        onBeforeDetach(msg) {
            const node = this.selectNode;
            node.removeEventListener('change', this);
        }
        /**
         * Handle a change to the active cell.
         */
        onActiveCellChanged(msg) {
            const select = this.selectNode;
            const activeCell = this.notebookTools.activeCell;
            if (!activeCell) {
                select.disabled = true;
                select.value = '';
                return;
            }
            const cellType = activeCell.model.type;
            if (this._validCellTypes.length &&
                this._validCellTypes.indexOf(cellType) === -1) {
                select.value = '';
                select.disabled = true;
                return;
            }
            select.disabled = false;
            this._changeGuard = true;
            const getter = this._getter;
            select.value = JSON.stringify(getter(activeCell));
            this._changeGuard = false;
        }
        /**
         * Handle a change to the metadata of the active cell.
         */
        onActiveCellMetadataChanged(msg) {
            if (this._changeGuard) {
                return;
            }
            const select = this.selectNode;
            const cell = this.notebookTools.activeCell;
            if (msg.args.key === this.key && cell) {
                this._changeGuard = true;
                const getter = this._getter;
                select.value = JSON.stringify(getter(cell));
                this._changeGuard = false;
            }
        }
        /**
         * Handle a change to the value.
         */
        onValueChanged() {
            const activeCell = this.notebookTools.activeCell;
            if (!activeCell || this._changeGuard) {
                return;
            }
            this._changeGuard = true;
            const select = this.selectNode;
            const setter = this._setter;
            setter(activeCell, JSON.parse(select.value));
            this._changeGuard = false;
        }
    }
    NotebookTools.KeySelector = KeySelector;
    /**
     * Create a slideshow selector.
     */
    function createSlideShowSelector(translator) {
        translator = translator || nullTranslator;
        const trans = translator.load('jupyterlab');
        trans.__('');
        const options = {
            key: 'slideshow',
            title: trans.__('Slide Type'),
            optionValueArray: [
                ['-', null],
                [trans.__('Slide'), 'slide'],
                [trans.__('Sub-Slide'), 'subslide'],
                [trans.__('Fragment'), 'fragment'],
                [trans.__('Skip'), 'skip'],
                [trans.__('Notes'), 'notes']
            ],
            getter: cell => {
                const value = cell.model.metadata.get('slideshow');
                return value && value['slide_type'];
            },
            setter: (cell, value) => {
                let data = cell.model.metadata.get('slideshow') || Object.create(null);
                if (value === null) {
                    // Make a shallow copy so we aren't modifying the original metadata.
                    data = Object.assign({}, data);
                    delete data.slide_type;
                }
                else {
                    data = Object.assign(Object.assign({}, data), { slide_type: value });
                }
                if (Object.keys(data).length > 0) {
                    cell.model.metadata.set('slideshow', data);
                }
                else {
                    cell.model.metadata.delete('slideshow');
                }
            }
        };
        return new KeySelector(options);
    }
    NotebookTools.createSlideShowSelector = createSlideShowSelector;
    /**
     * Create an nbconvert selector.
     */
    function createNBConvertSelector(optionValueArray, translator) {
        translator = translator || nullTranslator;
        const trans = translator.load('jupyterlab');
        return new KeySelector({
            key: 'raw_mimetype',
            title: trans.__('Raw NBConvert Format'),
            optionValueArray: optionValueArray,
            validCellTypes: ['raw']
        });
    }
    NotebookTools.createNBConvertSelector = createNBConvertSelector;
})(NotebookTools || (NotebookTools = {}));
/**
 * A namespace for private data.
 */
var Private;
(function (Private) {
    /**
     * A comparator function for widget rank items.
     */
    function itemCmp(first, second) {
        return first.rank - second.rank;
    }
    Private.itemCmp = itemCmp;
    /**
     * Create the node for a KeySelector.
     */
    function createSelectorNode(options) {
        const name = options.key;
        const title = options.title || name[0].toLocaleUpperCase() + name.slice(1);
        const optionNodes = [];
        let value;
        let option;
        each(options.optionValueArray, item => {
            option = item[0];
            value = JSON.stringify(item[1]);
            optionNodes.push(h.option({ value }, option));
        });
        const node = VirtualDOM.realize(h.div({}, h.label(title, h.select({}, optionNodes))));
        Styling.styleNode(node);
        return node;
    }
    Private.createSelectorNode = createSelectorNode;
})(Private || (Private = {}));
//# sourceMappingURL=notebooktools.js.map