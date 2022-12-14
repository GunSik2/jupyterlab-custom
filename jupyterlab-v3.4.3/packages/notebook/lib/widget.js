// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { Cell, CodeCell, MarkdownCell, RawCell } from '@jupyterlab/cells';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { nullTranslator } from '@jupyterlab/translation';
import { ArrayExt, each, findIndex } from '@lumino/algorithm';
import { MimeData } from '@lumino/coreutils';
import { ElementExt } from '@lumino/domutils';
import { Drag } from '@lumino/dragdrop';
import { AttachedProperty } from '@lumino/properties';
import { Signal } from '@lumino/signaling';
import { h, VirtualDOM } from '@lumino/virtualdom';
import { PanelLayout, Widget } from '@lumino/widgets';
import { NotebookActions } from './actions';
/**
 * The data attribute added to a widget that has an active kernel.
 */
const KERNEL_USER = 'jpKernelUser';
/**
 * The data attribute added to a widget that can run code.
 */
const CODE_RUNNER = 'jpCodeRunner';
/**
 * The data attribute added to a widget that can undo.
 */
const UNDOER = 'jpUndoer';
/**
 * The class name added to notebook widgets.
 */
const NB_CLASS = 'jp-Notebook';
/**
 * The class name added to notebook widget cells.
 */
const NB_CELL_CLASS = 'jp-Notebook-cell';
/**
 * The class name added to a notebook in edit mode.
 */
const EDIT_CLASS = 'jp-mod-editMode';
/**
 * The class name added to a notebook in command mode.
 */
const COMMAND_CLASS = 'jp-mod-commandMode';
/**
 * The class name added to the active cell.
 */
const ACTIVE_CLASS = 'jp-mod-active';
/**
 * The class name added to selected cells.
 */
const SELECTED_CLASS = 'jp-mod-selected';
/**
 * The class name added to an active cell when there are other selected cells.
 */
const OTHER_SELECTED_CLASS = 'jp-mod-multiSelected';
/**
 * The class name added to unconfined images.
 */
const UNCONFINED_CLASS = 'jp-mod-unconfined';
/**
 * The class name added to a drop target.
 */
const DROP_TARGET_CLASS = 'jp-mod-dropTarget';
/**
 * The class name added to a drop source.
 */
const DROP_SOURCE_CLASS = 'jp-mod-dropSource';
/**
 * The class name added to drag images.
 */
const DRAG_IMAGE_CLASS = 'jp-dragImage';
/**
 * The class name added to singular drag images
 */
const SINGLE_DRAG_IMAGE_CLASS = 'jp-dragImage-singlePrompt';
/**
 * The class name added to the drag image cell content.
 */
const CELL_DRAG_CONTENT_CLASS = 'jp-dragImage-content';
/**
 * The class name added to the drag image cell content.
 */
const CELL_DRAG_PROMPT_CLASS = 'jp-dragImage-prompt';
/**
 * The class name added to the drag image cell content.
 */
const CELL_DRAG_MULTIPLE_BACK = 'jp-dragImage-multipleBack';
/**
 * The mimetype used for Jupyter cell data.
 */
const JUPYTER_CELL_MIME = 'application/vnd.jupyter.cells';
/**
 * The threshold in pixels to start a drag event.
 */
const DRAG_THRESHOLD = 5;
/**
 * The class attached to the heading collapser button
 */
const HEADING_COLLAPSER_CLASS = 'jp-collapseHeadingButton';
const SIDE_BY_SIDE_CLASS = 'jp-mod-sideBySide';
if (window.requestIdleCallback === undefined) {
    // On Safari, requestIdleCallback is not available, so we use replacement functions for `idleCallbacks`
    // See: https://developer.mozilla.org/en-US/docs/Web/API/Background_Tasks_API#falling_back_to_settimeout
    window.requestIdleCallback = function (handler) {
        let startTime = Date.now();
        return setTimeout(function () {
            handler({
                didTimeout: false,
                timeRemaining: function () {
                    return Math.max(0, 50.0 - (Date.now() - startTime));
                }
            });
        }, 1);
    };
    window.cancelIdleCallback = function (id) {
        clearTimeout(id);
    };
}
/**
 * A widget which renders static non-interactive notebooks.
 *
 * #### Notes
 * The widget model must be set separately and can be changed
 * at any time.  Consumers of the widget must account for a
 * `null` model, and may want to listen to the `modelChanged`
 * signal.
 */
export class StaticNotebook extends Widget {
    /**
     * Construct a notebook widget.
     */
    constructor(options) {
        var _a, _b;
        super();
        this._editorConfig = StaticNotebook.defaultEditorConfig;
        this._notebookConfig = StaticNotebook.defaultNotebookConfig;
        this._mimetype = 'text/plain';
        this._model = null;
        this._modelChanged = new Signal(this);
        this._modelContentChanged = new Signal(this);
        this._fullyRendered = new Signal(this);
        this._placeholderCellRendered = new Signal(this);
        this._renderedCellsCount = 0;
        this.addClass(NB_CLASS);
        this.node.dataset[KERNEL_USER] = 'true';
        this.node.dataset[UNDOER] = 'true';
        this.node.dataset[CODE_RUNNER] = 'true';
        this.rendermime = options.rendermime;
        this.translator = (_a = options.translator) !== null && _a !== void 0 ? _a : nullTranslator;
        this.layout = new Private.NotebookPanelLayout();
        this.contentFactory =
            options.contentFactory || StaticNotebook.defaultContentFactory;
        this.editorConfig =
            options.editorConfig || StaticNotebook.defaultEditorConfig;
        this.notebookConfig =
            options.notebookConfig || StaticNotebook.defaultNotebookConfig;
        this._mimetypeService = options.mimeTypeService;
        this.renderingLayout = (_b = options.notebookConfig) === null || _b === void 0 ? void 0 : _b.renderingLayout;
        // Section for the virtual-notebook behavior.
        this._idleCallBack = null;
        this._toRenderMap = new Map();
        this._cellsArray = new Array();
        if ('IntersectionObserver' in window) {
            this._observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(o => {
                    if (o.isIntersecting) {
                        observer.unobserve(o.target);
                        const ci = this._toRenderMap.get(o.target.id);
                        if (ci) {
                            const { cell, index } = ci;
                            this._renderPlaceholderCell(cell, index);
                        }
                    }
                });
            }, {
                root: this.node,
                threshold: 1,
                rootMargin: `${this.notebookConfig.observedTopMargin} 0px ${this.notebookConfig.observedBottomMargin} 0px`
            });
        }
    }
    /**
     * A signal emitted when the notebook is fully rendered.
     */
    get fullyRendered() {
        return this._fullyRendered;
    }
    /**
     * A signal emitted when the a placeholder cell is rendered.
     */
    get placeholderCellRendered() {
        return this._placeholderCellRendered;
    }
    /**
     * A signal emitted when the model of the notebook changes.
     */
    get modelChanged() {
        return this._modelChanged;
    }
    /**
     * A signal emitted when the model content changes.
     *
     * #### Notes
     * This is a convenience signal that follows the current model.
     */
    get modelContentChanged() {
        return this._modelContentChanged;
    }
    /**
     * The model for the widget.
     */
    get model() {
        return this._model;
    }
    set model(newValue) {
        newValue = newValue || null;
        if (this._model === newValue) {
            return;
        }
        const oldValue = this._model;
        this._model = newValue;
        if (oldValue && oldValue.modelDB.isCollaborative) {
            void oldValue.modelDB.connected.then(() => {
                oldValue.modelDB.collaborators.changed.disconnect(this._onCollaboratorsChanged, this);
            });
        }
        if (newValue && newValue.modelDB.isCollaborative) {
            void newValue.modelDB.connected.then(() => {
                newValue.modelDB.collaborators.changed.connect(this._onCollaboratorsChanged, this);
            });
        }
        // Trigger private, protected, and public changes.
        this._onModelChanged(oldValue, newValue);
        this.onModelChanged(oldValue, newValue);
        this._modelChanged.emit(void 0);
    }
    /**
     * Get the mimetype for code cells.
     */
    get codeMimetype() {
        return this._mimetype;
    }
    /**
     * A read-only sequence of the widgets in the notebook.
     */
    get widgets() {
        return this.layout.widgets;
    }
    /**
     * A configuration object for cell editor settings.
     */
    get editorConfig() {
        return this._editorConfig;
    }
    set editorConfig(value) {
        this._editorConfig = value;
        this._updateEditorConfig();
    }
    /**
     * A configuration object for notebook settings.
     */
    get notebookConfig() {
        return this._notebookConfig;
    }
    set notebookConfig(value) {
        this._notebookConfig = value;
        this._updateNotebookConfig();
    }
    get renderingLayout() {
        return this._renderingLayout;
    }
    set renderingLayout(value) {
        this._renderingLayout = value;
        if (this._renderingLayout === 'side-by-side') {
            this.node.classList.add(SIDE_BY_SIDE_CLASS);
        }
        else {
            this.node.classList.remove(SIDE_BY_SIDE_CLASS);
        }
    }
    /**
     * Dispose of the resources held by the widget.
     */
    dispose() {
        // Do nothing if already disposed.
        if (this.isDisposed) {
            return;
        }
        this._model = null;
        super.dispose();
    }
    /**
     * Handle a new model.
     *
     * #### Notes
     * This method is called after the model change has been handled
     * internally and before the `modelChanged` signal is emitted.
     * The default implementation is a no-op.
     */
    onModelChanged(oldValue, newValue) {
        // No-op.
    }
    /**
     * Handle changes to the notebook model content.
     *
     * #### Notes
     * The default implementation emits the `modelContentChanged` signal.
     */
    onModelContentChanged(model, args) {
        this._modelContentChanged.emit(void 0);
    }
    /**
     * Handle changes to the notebook model metadata.
     *
     * #### Notes
     * The default implementation updates the mimetypes of the code cells
     * when the `language_info` metadata changes.
     */
    onMetadataChanged(sender, args) {
        switch (args.key) {
            case 'language_info':
                this._updateMimetype();
                break;
            default:
                break;
        }
    }
    /**
     * Handle a cell being inserted.
     *
     * The default implementation is a no-op
     */
    onCellInserted(index, cell) {
        // This is a no-op.
    }
    /**
     * Handle a cell being moved.
     *
     * The default implementation is a no-op
     */
    onCellMoved(fromIndex, toIndex) {
        // This is a no-op.
    }
    /**
     * Handle a cell being removed.
     *
     * The default implementation is a no-op
     */
    onCellRemoved(index, cell) {
        // This is a no-op.
    }
    /**
     * Handle a new model on the widget.
     */
    _onModelChanged(oldValue, newValue) {
        const layout = this.layout;
        if (oldValue) {
            oldValue.cells.changed.disconnect(this._onCellsChanged, this);
            oldValue.metadata.changed.disconnect(this.onMetadataChanged, this);
            oldValue.contentChanged.disconnect(this.onModelContentChanged, this);
            // TODO: reuse existing cell widgets if possible. Remember to initially
            // clear the history of each cell if we do this.
            while (layout.widgets.length) {
                this._removeCell(0);
            }
        }
        if (!newValue) {
            this._mimetype = 'text/plain';
            return;
        }
        this._updateMimetype();
        const cells = newValue.cells;
        if (!cells.length && newValue.isInitialized) {
            cells.push(newValue.contentFactory.createCell(this.notebookConfig.defaultCell, {}));
        }
        each(cells, (cell, i) => {
            this._insertCell(i, cell, 'set');
        });
        cells.changed.connect(this._onCellsChanged, this);
        newValue.contentChanged.connect(this.onModelContentChanged, this);
        newValue.metadata.changed.connect(this.onMetadataChanged, this);
    }
    /**
     * Handle a change cells event.
     */
    _onCellsChanged(sender, args) {
        let index = 0;
        switch (args.type) {
            case 'add':
                index = args.newIndex;
                // eslint-disable-next-line no-case-declarations
                const insertType = args.oldIndex == -1 ? 'push' : 'insert';
                each(args.newValues, value => {
                    this._insertCell(index++, value, insertType);
                });
                break;
            case 'move':
                this._moveCell(args.oldIndex, args.newIndex);
                break;
            case 'remove':
                each(args.oldValues, value => {
                    this._removeCell(args.oldIndex);
                });
                // Add default cell if there are no cells remaining.
                if (!sender.length) {
                    const model = this.model;
                    // Add the cell in a new context to avoid triggering another
                    // cell changed event during the handling of this signal.
                    requestAnimationFrame(() => {
                        if (model && !model.isDisposed && !model.cells.length) {
                            model.cells.push(model.contentFactory.createCell(this.notebookConfig.defaultCell, {}));
                        }
                    });
                }
                break;
            case 'set':
                // TODO: reuse existing widgets if possible.
                index = args.newIndex;
                each(args.newValues, value => {
                    // Note: this ordering (insert then remove)
                    // is important for getting the active cell
                    // index for the editable notebook correct.
                    this._insertCell(index, value, 'set');
                    this._removeCell(index + 1);
                    index++;
                });
                break;
            default:
                return;
        }
    }
    /**
     * Create a cell widget and insert into the notebook.
     */
    _insertCell(index, cell, insertType) {
        let widget;
        switch (cell.type) {
            case 'code':
                widget = this._createCodeCell(cell);
                widget.model.mimeType = this._mimetype;
                break;
            case 'markdown':
                widget = this._createMarkdownCell(cell);
                if (cell.value.text === '') {
                    widget.rendered = false;
                }
                break;
            default:
                widget = this._createRawCell(cell);
        }
        widget.addClass(NB_CELL_CLASS);
        const layout = this.layout;
        this._cellsArray.push(widget);
        if (this._observer &&
            insertType === 'push' &&
            this._renderedCellsCount >=
                this.notebookConfig.numberCellsToRenderDirectly &&
            cell.type !== 'markdown') {
            // We have an observer and we are have been asked to push (not to insert).
            // and we are above the number of cells to render directly, then
            // we will add a placeholder and let the intersection observer or the
            // idle browser render those placeholder cells.
            this._toRenderMap.set(widget.model.id, { index: index, cell: widget });
            const placeholder = this._createPlaceholderCell(cell, index);
            placeholder.node.id = widget.model.id;
            layout.insertWidget(index, placeholder);
            this.onCellInserted(index, placeholder);
            this._fullyRendered.emit(false);
            this._observer.observe(placeholder.node);
        }
        else {
            // We have no intersection observer, or we insert, or we are below
            // the number of cells to render directly, so we render directly.
            layout.insertWidget(index, widget);
            this.onCellInserted(index, widget);
            this._incrementRenderedCount();
        }
        this._scheduleCellRenderOnIdle();
    }
    _scheduleCellRenderOnIdle() {
        if (this._observer &&
            this.notebookConfig.renderCellOnIdle &&
            !this.isDisposed) {
            if (!this._idleCallBack) {
                const renderPlaceholderCells = this._renderPlaceholderCells.bind(this);
                this._idleCallBack = window.requestIdleCallback(renderPlaceholderCells, {
                    timeout: 3000
                });
            }
        }
    }
    _renderPlaceholderCells(deadline) {
        if (this.notebookConfig.remainingTimeBeforeRescheduling > 0) {
            const timeRemaining = deadline.timeRemaining();
            // In case this got triggered because of timeout or when there are screen updates (https://w3c.github.io/requestidlecallback/#idle-periods),
            // avoiding the render and rescheduling the place holder cell rendering.
            if (deadline.didTimeout ||
                timeRemaining < this.notebookConfig.remainingTimeBeforeRescheduling) {
                if (this._idleCallBack) {
                    window.cancelIdleCallback(this._idleCallBack);
                    this._idleCallBack = null;
                }
                this._scheduleCellRenderOnIdle();
            }
        }
        if (this._renderedCellsCount < this._cellsArray.length &&
            this._renderedCellsCount >=
                this.notebookConfig.numberCellsToRenderDirectly) {
            const ci = this._toRenderMap.entries().next();
            this._renderPlaceholderCell(ci.value[1].cell, ci.value[1].index);
        }
    }
    _renderPlaceholderCell(cell, index) {
        // We don't have cancel mechanism for scheduled requestIdleCallback(renderPlaceholderCells),
        // adding defensive check for layout in case tab is closed.
        if (!this.layout) {
            return;
        }
        const pl = this.layout;
        pl.removeWidgetAt(index);
        pl.insertWidget(index, cell);
        this._toRenderMap.delete(cell.model.id);
        this._incrementRenderedCount();
        this.onCellInserted(index, cell);
        this._placeholderCellRendered.emit(cell);
    }
    /**
     * Create a code cell widget from a code cell model.
     */
    _createCodeCell(model) {
        const rendermime = this.rendermime;
        const contentFactory = this.contentFactory;
        const editorConfig = this.editorConfig.code;
        const options = {
            editorConfig,
            model,
            rendermime,
            contentFactory,
            updateEditorOnShow: false,
            placeholder: false,
            maxNumberOutputs: this.notebookConfig.maxNumberOutputs
        };
        const cell = this.contentFactory.createCodeCell(options, this);
        cell.syncCollapse = true;
        cell.syncEditable = true;
        cell.syncScrolled = true;
        return cell;
    }
    /**
     * Create a markdown cell widget from a markdown cell model.
     */
    _createMarkdownCell(model) {
        const rendermime = this.rendermime;
        const contentFactory = this.contentFactory;
        const editorConfig = this.editorConfig.markdown;
        const options = {
            editorConfig,
            model,
            rendermime,
            contentFactory,
            updateEditorOnShow: false,
            placeholder: false,
            showEditorForReadOnlyMarkdown: this._notebookConfig
                .showEditorForReadOnlyMarkdown
        };
        const cell = this.contentFactory.createMarkdownCell(options, this);
        cell.syncCollapse = true;
        cell.syncEditable = true;
        // Connect collapsed signal for each markdown cell widget
        cell.toggleCollapsedSignal.connect((newCell, collapsed) => {
            NotebookActions.setHeadingCollapse(newCell, collapsed, this);
        });
        return cell;
    }
    /**
     * Create a placeholder cell widget from a raw cell model.
     */
    _createPlaceholderCell(model, index) {
        const contentFactory = this.contentFactory;
        const editorConfig = this.editorConfig.raw;
        const options = {
            editorConfig,
            model,
            contentFactory,
            updateEditorOnShow: false,
            placeholder: true
        };
        const cell = this.contentFactory.createRawCell(options, this);
        cell.node.innerHTML = `
      <div class="jp-Cell-Placeholder">
        <div class="jp-Cell-Placeholder-wrapper">
        </div>
      </div>`;
        cell.inputHidden = true;
        cell.syncCollapse = true;
        cell.syncEditable = true;
        return cell;
    }
    /**
     * Create a raw cell widget from a raw cell model.
     */
    _createRawCell(model) {
        const contentFactory = this.contentFactory;
        const editorConfig = this.editorConfig.raw;
        const options = {
            editorConfig,
            model,
            contentFactory,
            updateEditorOnShow: false,
            placeholder: false
        };
        const cell = this.contentFactory.createRawCell(options, this);
        cell.syncCollapse = true;
        cell.syncEditable = true;
        return cell;
    }
    /**
     * Move a cell widget.
     */
    _moveCell(fromIndex, toIndex) {
        const layout = this.layout;
        layout.insertWidget(toIndex, layout.widgets[fromIndex]);
        this.onCellMoved(fromIndex, toIndex);
    }
    /**
     * Remove a cell widget.
     */
    _removeCell(index) {
        const layout = this.layout;
        const widget = layout.widgets[index];
        widget.parent = null;
        this.onCellRemoved(index, widget);
        widget.dispose();
    }
    /**
     * Update the mimetype of the notebook.
     */
    _updateMimetype() {
        var _a;
        const info = (_a = this._model) === null || _a === void 0 ? void 0 : _a.metadata.get('language_info');
        if (!info) {
            return;
        }
        this._mimetype = this._mimetypeService.getMimeTypeByLanguage(info);
        each(this.widgets, widget => {
            if (widget.model.type === 'code') {
                widget.model.mimeType = this._mimetype;
            }
        });
    }
    /**
     * Handle an update to the collaborators.
     */
    _onCollaboratorsChanged() {
        var _a, _b, _c;
        // If there are selections corresponding to non-collaborators,
        // they are stale and should be removed.
        for (let i = 0; i < this.widgets.length; i++) {
            const cell = this.widgets[i];
            for (const key of cell.model.selections.keys()) {
                if (false === ((_c = (_b = (_a = this._model) === null || _a === void 0 ? void 0 : _a.modelDB) === null || _b === void 0 ? void 0 : _b.collaborators) === null || _c === void 0 ? void 0 : _c.has(key))) {
                    cell.model.selections.delete(key);
                }
            }
        }
    }
    /**
     * Update editor settings for notebook cells.
     */
    _updateEditorConfig() {
        for (let i = 0; i < this.widgets.length; i++) {
            const cell = this.widgets[i];
            let config = {};
            switch (cell.model.type) {
                case 'code':
                    config = this._editorConfig.code;
                    break;
                case 'markdown':
                    config = this._editorConfig.markdown;
                    break;
                default:
                    config = this._editorConfig.raw;
                    break;
            }
            cell.editor.setOptions(Object.assign({}, config));
            cell.editor.refresh();
        }
    }
    /**
     * Apply updated notebook settings.
     */
    _updateNotebookConfig() {
        // Apply scrollPastEnd setting.
        this.toggleClass('jp-mod-scrollPastEnd', this._notebookConfig.scrollPastEnd);
        // Control editor visibility for read-only Markdown cells
        const showEditorForReadOnlyMarkdown = this._notebookConfig
            .showEditorForReadOnlyMarkdown;
        // 'this._cellsArray' check is here as '_updateNotebookConfig()'
        // can be called before 'this._cellsArray' is defined
        if (showEditorForReadOnlyMarkdown !== undefined && this._cellsArray) {
            for (const cell of this._cellsArray) {
                if (cell.model.type === 'markdown') {
                    cell.showEditorForReadOnly = showEditorForReadOnlyMarkdown;
                }
            }
        }
    }
    _incrementRenderedCount() {
        if (this._toRenderMap.size === 0) {
            this._fullyRendered.emit(true);
        }
        this._renderedCellsCount++;
    }
    get remainingCellToRenderCount() {
        return this._toRenderMap.size;
    }
}
/**
 * The namespace for the `StaticNotebook` class statics.
 */
(function (StaticNotebook) {
    /**
     * Default configuration options for cell editors.
     */
    StaticNotebook.defaultEditorConfig = {
        code: Object.assign(Object.assign({}, CodeEditor.defaultConfig), { lineWrap: 'off', matchBrackets: true, autoClosingBrackets: false }),
        markdown: Object.assign(Object.assign({}, CodeEditor.defaultConfig), { lineWrap: 'on', matchBrackets: false, autoClosingBrackets: false }),
        raw: Object.assign(Object.assign({}, CodeEditor.defaultConfig), { lineWrap: 'on', matchBrackets: false, autoClosingBrackets: false })
    };
    /**
     * Default configuration options for notebooks.
     */
    StaticNotebook.defaultNotebookConfig = {
        scrollPastEnd: true,
        defaultCell: 'code',
        recordTiming: false,
        numberCellsToRenderDirectly: 99999,
        remainingTimeBeforeRescheduling: 50,
        renderCellOnIdle: true,
        observedTopMargin: '1000px',
        observedBottomMargin: '1000px',
        maxNumberOutputs: 50,
        showEditorForReadOnlyMarkdown: true,
        disableDocumentWideUndoRedo: false,
        renderingLayout: 'default',
        sideBySideLeftMarginOverride: '10px',
        sideBySideRightMarginOverride: '10px',
        sideBySideOutputRatio: 1
    };
    /**
     * The default implementation of an `IContentFactory`.
     */
    class ContentFactory extends Cell.ContentFactory {
        /**
         * Create a new code cell widget.
         *
         * #### Notes
         * If no cell content factory is passed in with the options, the one on the
         * notebook content factory is used.
         */
        createCodeCell(options, parent) {
            if (!options.contentFactory) {
                options.contentFactory = this;
            }
            return new CodeCell(options).initializeState();
        }
        /**
         * Create a new markdown cell widget.
         *
         * #### Notes
         * If no cell content factory is passed in with the options, the one on the
         * notebook content factory is used.
         */
        createMarkdownCell(options, parent) {
            if (!options.contentFactory) {
                options.contentFactory = this;
            }
            return new MarkdownCell(options).initializeState();
        }
        /**
         * Create a new raw cell widget.
         *
         * #### Notes
         * If no cell content factory is passed in with the options, the one on the
         * notebook content factory is used.
         */
        createRawCell(options, parent) {
            if (!options.contentFactory) {
                options.contentFactory = this;
            }
            return new RawCell(options).initializeState();
        }
    }
    StaticNotebook.ContentFactory = ContentFactory;
    /**
     * Default content factory for the static notebook widget.
     */
    StaticNotebook.defaultContentFactory = new ContentFactory();
})(StaticNotebook || (StaticNotebook = {}));
/**
 * A notebook widget that supports interactivity.
 */
export class Notebook extends StaticNotebook {
    /**
     * Construct a notebook widget.
     */
    constructor(options) {
        super(Private.processNotebookOptions(options));
        this._activeCellIndex = -1;
        this._activeCell = null;
        this._mode = 'command';
        this._drag = null;
        this._fragment = '';
        this._dragData = null;
        this._mouseMode = null;
        this._activeCellChanged = new Signal(this);
        this._stateChanged = new Signal(this);
        this._selectionChanged = new Signal(this);
        this._checkCacheOnNextResize = false;
        this._lastClipboardInteraction = null;
        this.node.tabIndex = 0; // Allow the widget to take focus.
        // Allow the node to scroll while dragging items.
        this.node.setAttribute('data-lm-dragscroll', 'true');
    }
    /**
     * A signal emitted when the active cell changes.
     *
     * #### Notes
     * This can be due to the active index changing or the
     * cell at the active index changing.
     */
    get activeCellChanged() {
        return this._activeCellChanged;
    }
    /**
     * A signal emitted when the state of the notebook changes.
     */
    get stateChanged() {
        return this._stateChanged;
    }
    /**
     * A signal emitted when the selection state of the notebook changes.
     */
    get selectionChanged() {
        return this._selectionChanged;
    }
    /**
     * The interactivity mode of the notebook.
     */
    get mode() {
        return this._mode;
    }
    set mode(newValue) {
        const activeCell = this.activeCell;
        if (!activeCell) {
            newValue = 'command';
        }
        if (newValue === this._mode) {
            this._ensureFocus();
            return;
        }
        // Post an update request.
        this.update();
        const oldValue = this._mode;
        this._mode = newValue;
        if (newValue === 'edit') {
            // Edit mode deselects all cells.
            each(this.widgets, widget => {
                this.deselect(widget);
            });
            //  Edit mode unrenders an active markdown widget.
            if (activeCell instanceof MarkdownCell) {
                activeCell.rendered = false;
            }
            activeCell.inputHidden = false;
        }
        else {
            // Focus on the notebook document, which blurs the active cell.
            this.node.focus();
        }
        this._stateChanged.emit({ name: 'mode', oldValue, newValue });
        this._ensureFocus();
    }
    /**
     * The active cell index of the notebook.
     *
     * #### Notes
     * The index will be clamped to the bounds of the notebook cells.
     */
    get activeCellIndex() {
        if (!this.model) {
            return -1;
        }
        return this.model.cells.length ? this._activeCellIndex : -1;
    }
    set activeCellIndex(newValue) {
        const oldValue = this._activeCellIndex;
        if (!this.model || !this.model.cells.length) {
            newValue = -1;
        }
        else {
            newValue = Math.max(newValue, 0);
            newValue = Math.min(newValue, this.model.cells.length - 1);
        }
        this._activeCellIndex = newValue;
        const cell = this.widgets[newValue];
        if (cell !== this._activeCell) {
            // Post an update request.
            this.update();
            this._activeCell = cell;
            this._activeCellChanged.emit(cell);
        }
        if (this.mode === 'edit' && cell instanceof MarkdownCell) {
            cell.rendered = false;
        }
        this._ensureFocus();
        if (newValue === oldValue) {
            return;
        }
        this._trimSelections();
        this._stateChanged.emit({ name: 'activeCellIndex', oldValue, newValue });
    }
    /**
     * Get the active cell widget.
     *
     * #### Notes
     * This is a cell or `null` if there is no active cell.
     */
    get activeCell() {
        return this._activeCell;
    }
    get lastClipboardInteraction() {
        return this._lastClipboardInteraction;
    }
    set lastClipboardInteraction(newValue) {
        this._lastClipboardInteraction = newValue;
    }
    /**
     * Dispose of the resources held by the widget.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._activeCell = null;
        super.dispose();
    }
    /**
     * Select a cell widget.
     *
     * #### Notes
     * It is a no-op if the value does not change.
     * It will emit the `selectionChanged` signal.
     */
    select(widget) {
        if (Private.selectedProperty.get(widget)) {
            return;
        }
        Private.selectedProperty.set(widget, true);
        this._selectionChanged.emit(void 0);
        this.update();
    }
    /**
     * Deselect a cell widget.
     *
     * #### Notes
     * It is a no-op if the value does not change.
     * It will emit the `selectionChanged` signal.
     */
    deselect(widget) {
        if (!Private.selectedProperty.get(widget)) {
            return;
        }
        Private.selectedProperty.set(widget, false);
        this._selectionChanged.emit(void 0);
        this.update();
    }
    /**
     * Whether a cell is selected.
     */
    isSelected(widget) {
        return Private.selectedProperty.get(widget);
    }
    /**
     * Whether a cell is selected or is the active cell.
     */
    isSelectedOrActive(widget) {
        if (widget === this._activeCell) {
            return true;
        }
        return Private.selectedProperty.get(widget);
    }
    /**
     * Deselect all of the cells.
     */
    deselectAll() {
        let changed = false;
        each(this.widgets, widget => {
            if (Private.selectedProperty.get(widget)) {
                changed = true;
            }
            Private.selectedProperty.set(widget, false);
        });
        if (changed) {
            this._selectionChanged.emit(void 0);
        }
        // Make sure we have a valid active cell.
        this.activeCellIndex = this.activeCellIndex; // eslint-disable-line
        this.update();
    }
    /**
     * Move the head of an existing contiguous selection to extend the selection.
     *
     * @param index - The new head of the existing selection.
     *
     * #### Notes
     * If there is no existing selection, the active cell is considered an
     * existing one-cell selection.
     *
     * If the new selection is a single cell, that cell becomes the active cell
     * and all cells are deselected.
     *
     * There is no change if there are no cells (i.e., activeCellIndex is -1).
     */
    extendContiguousSelectionTo(index) {
        let { head, anchor } = this.getContiguousSelection();
        let i;
        // Handle the case of no current selection.
        if (anchor === null || head === null) {
            if (index === this.activeCellIndex) {
                // Already collapsed selection, nothing more to do.
                return;
            }
            // We will start a new selection below.
            head = this.activeCellIndex;
            anchor = this.activeCellIndex;
        }
        // Move the active cell. We do this before the collapsing shortcut below.
        this.activeCellIndex = index;
        // Make sure the index is valid, according to the rules for setting and clipping the
        // active cell index. This may change the index.
        index = this.activeCellIndex;
        // Collapse the selection if it is only the active cell.
        if (index === anchor) {
            this.deselectAll();
            return;
        }
        let selectionChanged = false;
        if (head < index) {
            if (head < anchor) {
                Private.selectedProperty.set(this.widgets[head], false);
                selectionChanged = true;
            }
            // Toggle everything strictly between head and index except anchor.
            for (i = head + 1; i < index; i++) {
                if (i !== anchor) {
                    Private.selectedProperty.set(this.widgets[i], !Private.selectedProperty.get(this.widgets[i]));
                    selectionChanged = true;
                }
            }
        }
        else if (index < head) {
            if (anchor < head) {
                Private.selectedProperty.set(this.widgets[head], false);
                selectionChanged = true;
            }
            // Toggle everything strictly between index and head except anchor.
            for (i = index + 1; i < head; i++) {
                if (i !== anchor) {
                    Private.selectedProperty.set(this.widgets[i], !Private.selectedProperty.get(this.widgets[i]));
                    selectionChanged = true;
                }
            }
        }
        // Anchor and index should *always* be selected.
        if (!Private.selectedProperty.get(this.widgets[anchor])) {
            selectionChanged = true;
        }
        Private.selectedProperty.set(this.widgets[anchor], true);
        if (!Private.selectedProperty.get(this.widgets[index])) {
            selectionChanged = true;
        }
        Private.selectedProperty.set(this.widgets[index], true);
        if (selectionChanged) {
            this._selectionChanged.emit(void 0);
        }
    }
    /**
     * Get the head and anchor of a contiguous cell selection.
     *
     * The head of a contiguous selection is always the active cell.
     *
     * If there are no cells selected, `{head: null, anchor: null}` is returned.
     *
     * Throws an error if the currently selected cells do not form a contiguous
     * selection.
     */
    getContiguousSelection() {
        const cells = this.widgets;
        const first = ArrayExt.findFirstIndex(cells, c => this.isSelected(c));
        // Return early if no cells are selected.
        if (first === -1) {
            return { head: null, anchor: null };
        }
        const last = ArrayExt.findLastIndex(cells, c => this.isSelected(c), -1, first);
        // Check that the selection is contiguous.
        for (let i = first; i <= last; i++) {
            if (!this.isSelected(cells[i])) {
                throw new Error('Selection not contiguous');
            }
        }
        // Check that the active cell is one of the endpoints of the selection.
        const activeIndex = this.activeCellIndex;
        if (first !== activeIndex && last !== activeIndex) {
            throw new Error('Active cell not at endpoint of selection');
        }
        // Determine the head and anchor of the selection.
        if (first === activeIndex) {
            return { head: first, anchor: last };
        }
        else {
            return { head: last, anchor: first };
        }
    }
    /**
     * Scroll so that the given position is centered.
     *
     * @param position - The vertical position in the notebook widget.
     *
     * @param threshold - An optional threshold for the scroll (0-50, defaults to
     * 25).
     *
     * #### Notes
     * If the position is within the threshold percentage of the widget height,
     * measured from the center of the widget, the scroll position will not be
     * changed. A threshold of 0 means we will always scroll so the position is
     * centered, and a threshold of 50 means scrolling only happens if position is
     * outside the current window.
     */
    scrollToPosition(position, threshold = 25) {
        const node = this.node;
        const ar = node.getBoundingClientRect();
        const delta = position - ar.top - ar.height / 2;
        if (Math.abs(delta) > (ar.height * threshold) / 100) {
            node.scrollTop += delta;
        }
    }
    /**
     * Scroll so that the given cell is in view. Selects and activates cell.
     *
     * @param cell - A cell in the notebook widget.
     *
     */
    scrollToCell(cell) {
        // use Phosphor to scroll
        ElementExt.scrollIntoViewIfNeeded(this.node, cell.node);
        // change selection and active cell:
        this.deselectAll();
        this.select(cell);
        cell.activate();
    }
    /**
     * Set URI fragment identifier.
     */
    setFragment(fragment) {
        // Wait all cells are rendered then set fragment and update.
        void Promise.all(this.widgets.map(widget => widget.ready)).then(() => {
            this._fragment = fragment;
            this.update();
        });
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
        if (!this.model) {
            return;
        }
        switch (event.type) {
            case 'contextmenu':
                if (event.eventPhase === Event.CAPTURING_PHASE) {
                    this._evtContextMenuCapture(event);
                }
                break;
            case 'mousedown':
                if (event.eventPhase === Event.CAPTURING_PHASE) {
                    this._evtMouseDownCapture(event);
                }
                else {
                    this._evtMouseDown(event);
                }
                break;
            case 'mouseup':
                if (event.currentTarget === document) {
                    this._evtDocumentMouseup(event);
                }
                break;
            case 'mousemove':
                if (event.currentTarget === document) {
                    this._evtDocumentMousemove(event);
                }
                break;
            case 'keydown':
                this._ensureFocus(true);
                break;
            case 'dblclick':
                this._evtDblClick(event);
                break;
            case 'focusin':
                this._evtFocusIn(event);
                break;
            case 'focusout':
                this._evtFocusOut(event);
                break;
            case 'lm-dragenter':
                this._evtDragEnter(event);
                break;
            case 'lm-dragleave':
                this._evtDragLeave(event);
                break;
            case 'lm-dragover':
                this._evtDragOver(event);
                break;
            case 'lm-drop':
                this._evtDrop(event);
                break;
            default:
                break;
        }
    }
    /**
     * Handle `after-attach` messages for the widget.
     */
    onAfterAttach(msg) {
        super.onAfterAttach(msg);
        const node = this.node;
        node.addEventListener('contextmenu', this, true);
        node.addEventListener('mousedown', this, true);
        node.addEventListener('mousedown', this);
        node.addEventListener('keydown', this);
        node.addEventListener('dblclick', this);
        node.addEventListener('focusin', this);
        node.addEventListener('focusout', this);
        // Capture drag events for the notebook widget
        // in order to preempt the drag/drop handlers in the
        // code editor widgets, which can take text data.
        node.addEventListener('lm-dragenter', this, true);
        node.addEventListener('lm-dragleave', this, true);
        node.addEventListener('lm-dragover', this, true);
        node.addEventListener('lm-drop', this, true);
    }
    /**
     * Handle `before-detach` messages for the widget.
     */
    onBeforeDetach(msg) {
        const node = this.node;
        node.removeEventListener('contextmenu', this, true);
        node.removeEventListener('mousedown', this, true);
        node.removeEventListener('mousedown', this);
        node.removeEventListener('keydown', this);
        node.removeEventListener('dblclick', this);
        node.removeEventListener('focusin', this);
        node.removeEventListener('focusout', this);
        node.removeEventListener('lm-dragenter', this, true);
        node.removeEventListener('lm-dragleave', this, true);
        node.removeEventListener('lm-dragover', this, true);
        node.removeEventListener('lm-drop', this, true);
        document.removeEventListener('mousemove', this, true);
        document.removeEventListener('mouseup', this, true);
    }
    /**
     * A message handler invoked on an `'after-show'` message.
     */
    onAfterShow(msg) {
        this._checkCacheOnNextResize = true;
    }
    /**
     * A message handler invoked on a `'resize'` message.
     */
    onResize(msg) {
        if (!this._checkCacheOnNextResize) {
            return super.onResize(msg);
        }
        this._checkCacheOnNextResize = false;
        const cache = this._cellLayoutStateCache;
        const width = parseInt(this.node.style.width, 10);
        if (cache) {
            if (width === cache.width) {
                // Cache identical, do nothing
                return;
            }
        }
        // Update cache
        this._cellLayoutStateCache = { width };
        // Fallback:
        for (const w of this.widgets) {
            if (w instanceof Cell) {
                w.editorWidget.update();
            }
        }
    }
    /**
     * A message handler invoked on an `'before-hide'` message.
     */
    onBeforeHide(msg) {
        // Update cache
        const width = parseInt(this.node.style.width, 10);
        this._cellLayoutStateCache = { width };
    }
    /**
     * Handle `'activate-request'` messages.
     */
    onActivateRequest(msg) {
        this._ensureFocus(true);
    }
    /**
     * Handle `update-request` messages sent to the widget.
     */
    onUpdateRequest(msg) {
        const activeCell = this.activeCell;
        // Set the appropriate classes on the cells.
        if (this.mode === 'edit') {
            this.addClass(EDIT_CLASS);
            this.removeClass(COMMAND_CLASS);
        }
        else {
            this.addClass(COMMAND_CLASS);
            this.removeClass(EDIT_CLASS);
        }
        if (activeCell) {
            activeCell.addClass(ACTIVE_CLASS);
        }
        let count = 0;
        each(this.widgets, widget => {
            if (widget !== activeCell) {
                widget.removeClass(ACTIVE_CLASS);
            }
            widget.removeClass(OTHER_SELECTED_CLASS);
            if (this.isSelectedOrActive(widget)) {
                widget.addClass(SELECTED_CLASS);
                count++;
            }
            else {
                widget.removeClass(SELECTED_CLASS);
            }
        });
        if (count > 1) {
            activeCell === null || activeCell === void 0 ? void 0 : activeCell.addClass(OTHER_SELECTED_CLASS);
        }
        if (this._fragment) {
            let el;
            try {
                el = this.node.querySelector(this._fragment.startsWith('#')
                    ? `#${CSS.escape(this._fragment.slice(1))}`
                    : this._fragment);
            }
            catch (error) {
                console.warn('Unable to set URI fragment identifier', error);
            }
            if (el) {
                el.scrollIntoView();
            }
            this._fragment = '';
        }
    }
    /**
     * Handle a cell being inserted.
     */
    onCellInserted(index, cell) {
        if (this.model && this.model.modelDB.isCollaborative) {
            const modelDB = this.model.modelDB;
            void modelDB.connected.then(() => {
                if (!cell.isDisposed) {
                    // Setup the selection style for collaborators.
                    const localCollaborator = modelDB.collaborators.localCollaborator;
                    cell.editor.uuid = localCollaborator.sessionId;
                    cell.editor.selectionStyle = Object.assign(Object.assign({}, CodeEditor.defaultSelectionStyle), { color: localCollaborator.color });
                }
            });
        }
        cell.editor.edgeRequested.connect(this._onEdgeRequest, this);
        // If the insertion happened above, increment the active cell
        // index, otherwise it stays the same.
        this.activeCellIndex =
            index <= this.activeCellIndex
                ? this.activeCellIndex + 1
                : this.activeCellIndex;
    }
    /**
     * Handle a cell being moved.
     */
    onCellMoved(fromIndex, toIndex) {
        const i = this.activeCellIndex;
        if (fromIndex === i) {
            this.activeCellIndex = toIndex;
        }
        else if (fromIndex < i && i <= toIndex) {
            this.activeCellIndex--;
        }
        else if (toIndex <= i && i < fromIndex) {
            this.activeCellIndex++;
        }
    }
    /**
     * Handle a cell being removed.
     */
    onCellRemoved(index, cell) {
        // If the removal happened above, decrement the active
        // cell index, otherwise it stays the same.
        this.activeCellIndex =
            index <= this.activeCellIndex
                ? this.activeCellIndex - 1
                : this.activeCellIndex;
        if (this.isSelected(cell)) {
            this._selectionChanged.emit(void 0);
        }
    }
    /**
     * Handle a new model.
     */
    onModelChanged(oldValue, newValue) {
        super.onModelChanged(oldValue, newValue);
        // Try to set the active cell index to 0.
        // It will be set to `-1` if there is no new model or the model is empty.
        this.activeCellIndex = 0;
    }
    /**
     * Handle edge request signals from cells.
     */
    _onEdgeRequest(editor, location) {
        const prev = this.activeCellIndex;
        if (location === 'top') {
            this.activeCellIndex--;
            // Move the cursor to the first position on the last line.
            if (this.activeCellIndex < prev) {
                const editor = this.activeCell.editor;
                const lastLine = editor.lineCount - 1;
                editor.setCursorPosition({ line: lastLine, column: 0 });
            }
        }
        else if (location === 'bottom') {
            this.activeCellIndex++;
            // Move the cursor to the first character.
            if (this.activeCellIndex > prev) {
                const editor = this.activeCell.editor;
                editor.setCursorPosition({ line: 0, column: 0 });
            }
        }
        this.mode = 'edit';
    }
    /**
     * Ensure that the notebook has proper focus.
     */
    _ensureFocus(force = false) {
        const activeCell = this.activeCell;
        if (this.mode === 'edit' && activeCell) {
            if (!activeCell.editor.hasFocus()) {
                activeCell.editor.focus();
            }
        }
        if ((force && !this.node.contains(document.activeElement)) ||
            // Focus notebook if active cell changes but does not have focus.
            (activeCell && !activeCell.node.contains(document.activeElement))) {
            this.node.focus();
        }
    }
    /**
     * Find the cell index containing the target html element.
     *
     * #### Notes
     * Returns -1 if the cell is not found.
     */
    _findCell(node) {
        // Trace up the DOM hierarchy to find the root cell node.
        // Then find the corresponding child and select it.
        let n = node;
        while (n && n !== this.node) {
            if (n.classList.contains(NB_CELL_CLASS)) {
                const i = ArrayExt.findFirstIndex(this.widgets, widget => widget.node === n);
                if (i !== -1) {
                    return i;
                }
                break;
            }
            n = n.parentElement;
        }
        return -1;
    }
    /**
     * Find the target of html mouse event and cell index containing this target.
     *
     * #### Notes
     * Returned index is -1 if the cell is not found.
     */
    _findEventTargetAndCell(event) {
        let target = event.target;
        let index = this._findCell(target);
        if (index === -1) {
            // `event.target` sometimes gives an orphaned node in Firefox 57, which
            // can have `null` anywhere in its parent line. If we fail to find a cell
            // using `event.target`, try again using a target reconstructed from the
            // position of the click event.
            target = document.elementFromPoint(event.clientX, event.clientY);
            index = this._findCell(target);
        }
        return [target, index];
    }
    /**
     * Handle `contextmenu` event.
     */
    _evtContextMenuCapture(event) {
        // Allow the event to propagate un-modified if the user
        // is holding the shift-key (and probably requesting
        // the native context menu).
        if (event.shiftKey) {
            return;
        }
        const [target, index] = this._findEventTargetAndCell(event);
        const widget = this.widgets[index];
        if (widget && widget.editorWidget.node.contains(target)) {
            // Prevent CodeMirror from focusing the editor.
            // TODO: find an editor-agnostic solution.
            event.preventDefault();
        }
    }
    /**
     * Handle `mousedown` event in the capture phase for the widget.
     */
    _evtMouseDownCapture(event) {
        const { button, shiftKey } = event;
        const [target, index] = this._findEventTargetAndCell(event);
        const widget = this.widgets[index];
        // On OS X, the context menu may be triggered with ctrl-left-click. In
        // Firefox, ctrl-left-click gives an event with button 2, but in Chrome,
        // ctrl-left-click gives an event with button 0 with the ctrl modifier.
        if (button === 2 &&
            !shiftKey &&
            widget &&
            widget.editorWidget.node.contains(target)) {
            this.mode = 'command';
            // Prevent CodeMirror from focusing the editor.
            // TODO: find an editor-agnostic solution.
            event.preventDefault();
        }
    }
    /**
     * Handle `mousedown` events for the widget.
     */
    _evtMouseDown(event) {
        var _a;
        const { button, shiftKey } = event;
        // We only handle main or secondary button actions.
        if (!(button === 0 || button === 2)) {
            return;
        }
        // Shift right-click gives the browser default behavior.
        if (shiftKey && button === 2) {
            return;
        }
        const [target, index] = this._findEventTargetAndCell(event);
        const widget = this.widgets[index];
        let targetArea;
        if (widget) {
            if (widget.editorWidget.node.contains(target)) {
                targetArea = 'input';
            }
            else if (widget.promptNode.contains(target)) {
                targetArea = 'prompt';
            }
            else {
                targetArea = 'cell';
            }
        }
        else {
            targetArea = 'notebook';
        }
        // Make sure we go to command mode if the click isn't in the cell editor If
        // we do click in the cell editor, the editor handles the focus event to
        // switch to edit mode.
        if (targetArea !== 'input') {
            this.mode = 'command';
        }
        if (targetArea === 'notebook') {
            this.deselectAll();
        }
        else if (targetArea === 'prompt' || targetArea === 'cell') {
            // We don't want to prevent the default selection behavior
            // if there is currently text selected in an output.
            const hasSelection = ((_a = window.getSelection()) !== null && _a !== void 0 ? _a : '').toString() !== '';
            if (button === 0 && shiftKey && !hasSelection) {
                // Prevent browser selecting text in prompt or output
                event.preventDefault();
                // Shift-click - extend selection
                try {
                    this.extendContiguousSelectionTo(index);
                }
                catch (e) {
                    console.error(e);
                    this.deselectAll();
                    return;
                }
                // Enter selecting mode
                this._mouseMode = 'select';
                document.addEventListener('mouseup', this, true);
                document.addEventListener('mousemove', this, true);
            }
            else if (button === 0 && !shiftKey) {
                // Prepare to start a drag if we are on the drag region.
                if (targetArea === 'prompt') {
                    // Prepare for a drag start
                    this._dragData = {
                        pressX: event.clientX,
                        pressY: event.clientY,
                        index: index
                    };
                    // Enter possible drag mode
                    this._mouseMode = 'couldDrag';
                    document.addEventListener('mouseup', this, true);
                    document.addEventListener('mousemove', this, true);
                    event.preventDefault();
                }
                if (!this.isSelectedOrActive(widget)) {
                    this.deselectAll();
                    this.activeCellIndex = index;
                }
            }
            else if (button === 2) {
                if (!this.isSelectedOrActive(widget)) {
                    this.deselectAll();
                    this.activeCellIndex = index;
                }
                event.preventDefault();
            }
        }
        else if (targetArea === 'input') {
            if (button === 2 && !this.isSelectedOrActive(widget)) {
                this.deselectAll();
                this.activeCellIndex = index;
            }
        }
        // If we didn't set focus above, make sure we get focus now.
        this._ensureFocus(true);
    }
    /**
     * Handle the `'mouseup'` event on the document.
     */
    _evtDocumentMouseup(event) {
        event.preventDefault();
        event.stopPropagation();
        // Remove the event listeners we put on the document
        document.removeEventListener('mousemove', this, true);
        document.removeEventListener('mouseup', this, true);
        if (this._mouseMode === 'couldDrag') {
            // We didn't end up dragging if we are here, so treat it as a click event.
            const [, index] = this._findEventTargetAndCell(event);
            this.deselectAll();
            this.activeCellIndex = index;
        }
        this._mouseMode = null;
    }
    /**
     * Handle the `'mousemove'` event for the widget.
     */
    _evtDocumentMousemove(event) {
        event.preventDefault();
        event.stopPropagation();
        // If in select mode, update the selection
        switch (this._mouseMode) {
            case 'select': {
                const target = event.target;
                const index = this._findCell(target);
                if (index !== -1) {
                    this.extendContiguousSelectionTo(index);
                }
                break;
            }
            case 'couldDrag': {
                // Check for a drag initialization.
                const data = this._dragData;
                const dx = Math.abs(event.clientX - data.pressX);
                const dy = Math.abs(event.clientY - data.pressY);
                if (dx >= DRAG_THRESHOLD || dy >= DRAG_THRESHOLD) {
                    this._mouseMode = null;
                    this._startDrag(data.index, event.clientX, event.clientY);
                }
                break;
            }
            default:
                break;
        }
    }
    /**
     * Handle the `'lm-dragenter'` event for the widget.
     */
    _evtDragEnter(event) {
        if (!event.mimeData.hasData(JUPYTER_CELL_MIME)) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const target = event.target;
        const index = this._findCell(target);
        if (index === -1) {
            return;
        }
        const widget = this.layout.widgets[index];
        widget.node.classList.add(DROP_TARGET_CLASS);
    }
    /**
     * Handle the `'lm-dragleave'` event for the widget.
     */
    _evtDragLeave(event) {
        if (!event.mimeData.hasData(JUPYTER_CELL_MIME)) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const elements = this.node.getElementsByClassName(DROP_TARGET_CLASS);
        if (elements.length) {
            elements[0].classList.remove(DROP_TARGET_CLASS);
        }
    }
    /**
     * Handle the `'lm-dragover'` event for the widget.
     */
    _evtDragOver(event) {
        if (!event.mimeData.hasData(JUPYTER_CELL_MIME)) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        event.dropAction = event.proposedAction;
        const elements = this.node.getElementsByClassName(DROP_TARGET_CLASS);
        if (elements.length) {
            elements[0].classList.remove(DROP_TARGET_CLASS);
        }
        const target = event.target;
        const index = this._findCell(target);
        if (index === -1) {
            return;
        }
        const widget = this.layout.widgets[index];
        widget.node.classList.add(DROP_TARGET_CLASS);
    }
    /**
     * Handle the `'lm-drop'` event for the widget.
     */
    _evtDrop(event) {
        if (!event.mimeData.hasData(JUPYTER_CELL_MIME)) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (event.proposedAction === 'none') {
            event.dropAction = 'none';
            return;
        }
        let target = event.target;
        while (target && target.parentElement) {
            if (target.classList.contains(DROP_TARGET_CLASS)) {
                target.classList.remove(DROP_TARGET_CLASS);
                break;
            }
            target = target.parentElement;
        }
        // Model presence should be checked before calling event handlers
        const model = this.model;
        const source = event.source;
        if (source === this) {
            // Handle the case where we are moving cells within
            // the same notebook.
            event.dropAction = 'move';
            const toMove = event.mimeData.getData('internal:cells');
            // For collapsed markdown headings with hidden "child" cells, move all
            // child cells as well as the markdown heading.
            const cell = toMove[toMove.length - 1];
            if (cell instanceof MarkdownCell && cell.headingCollapsed) {
                const nextParent = NotebookActions.findNextParentHeading(cell, source);
                if (nextParent > 0) {
                    const index = findIndex(source.widgets, (possibleCell) => {
                        return cell.model.id === possibleCell.model.id;
                    });
                    toMove.push(...source.widgets.slice(index + 1, nextParent));
                }
            }
            // Compute the to/from indices for the move.
            let fromIndex = ArrayExt.firstIndexOf(this.widgets, toMove[0]);
            let toIndex = this._findCell(target);
            // This check is needed for consistency with the view.
            if (toIndex !== -1 && toIndex > fromIndex) {
                toIndex -= 1;
            }
            else if (toIndex === -1) {
                // If the drop is within the notebook but not on any cell,
                // most often this means it is past the cell areas, so
                // set it to move the cells to the end of the notebook.
                toIndex = this.widgets.length - 1;
            }
            // Don't move if we are within the block of selected cells.
            if (toIndex >= fromIndex && toIndex < fromIndex + toMove.length) {
                return;
            }
            // Move the cells one by one
            model.cells.beginCompoundOperation();
            if (fromIndex < toIndex) {
                each(toMove, cellWidget => {
                    model.cells.move(fromIndex, toIndex);
                });
            }
            else if (fromIndex > toIndex) {
                each(toMove, cellWidget => {
                    model.cells.move(fromIndex++, toIndex++);
                });
            }
            model.cells.endCompoundOperation();
        }
        else {
            // Handle the case where we are copying cells between
            // notebooks.
            event.dropAction = 'copy';
            // Find the target cell and insert the copied cells.
            let index = this._findCell(target);
            if (index === -1) {
                index = this.widgets.length;
            }
            const start = index;
            const values = event.mimeData.getData(JUPYTER_CELL_MIME);
            const factory = model.contentFactory;
            // Insert the copies of the original cells.
            model.cells.beginCompoundOperation();
            each(values, (cell) => {
                let value;
                switch (cell.cell_type) {
                    case 'code':
                        value = factory.createCodeCell({ cell });
                        break;
                    case 'markdown':
                        value = factory.createMarkdownCell({ cell });
                        break;
                    default:
                        value = factory.createRawCell({ cell });
                        break;
                }
                model.cells.insert(index++, value);
            });
            model.cells.endCompoundOperation();
            // Select the inserted cells.
            this.deselectAll();
            this.activeCellIndex = start;
            this.extendContiguousSelectionTo(index - 1);
        }
    }
    /**
     * Start a drag event.
     */
    _startDrag(index, clientX, clientY) {
        var _a;
        const cells = this.model.cells;
        const selected = [];
        const toMove = [];
        each(this.widgets, (widget, i) => {
            const cell = cells.get(i);
            if (this.isSelectedOrActive(widget)) {
                widget.addClass(DROP_SOURCE_CLASS);
                selected.push(cell.toJSON());
                toMove.push(widget);
            }
        });
        const activeCell = this.activeCell;
        let dragImage = null;
        let countString;
        if ((activeCell === null || activeCell === void 0 ? void 0 : activeCell.model.type) === 'code') {
            const executionCount = activeCell.model
                .executionCount;
            countString = ' ';
            if (executionCount) {
                countString = executionCount.toString();
            }
        }
        else {
            countString = '';
        }
        // Create the drag image.
        dragImage = Private.createDragImage(selected.length, countString, (_a = activeCell === null || activeCell === void 0 ? void 0 : activeCell.model.value.text.split('\n')[0].slice(0, 26)) !== null && _a !== void 0 ? _a : '');
        // Set up the drag event.
        this._drag = new Drag({
            mimeData: new MimeData(),
            dragImage,
            supportedActions: 'copy-move',
            proposedAction: 'copy',
            source: this
        });
        this._drag.mimeData.setData(JUPYTER_CELL_MIME, selected);
        // Add mimeData for the fully reified cell widgets, for the
        // case where the target is in the same notebook and we
        // can just move the cells.
        this._drag.mimeData.setData('internal:cells', toMove);
        // Add mimeData for the text content of the selected cells,
        // allowing for drag/drop into plain text fields.
        const textContent = toMove.map(cell => cell.model.value.text).join('\n');
        this._drag.mimeData.setData('text/plain', textContent);
        // Remove mousemove and mouseup listeners and start the drag.
        document.removeEventListener('mousemove', this, true);
        document.removeEventListener('mouseup', this, true);
        this._mouseMode = null;
        void this._drag.start(clientX, clientY).then(action => {
            if (this.isDisposed) {
                return;
            }
            this._drag = null;
            each(toMove, widget => {
                widget.removeClass(DROP_SOURCE_CLASS);
            });
        });
    }
    /**
     * Handle `focus` events for the widget.
     */
    _evtFocusIn(event) {
        const target = event.target;
        const index = this._findCell(target);
        if (index !== -1) {
            const widget = this.widgets[index];
            // If the editor itself does not have focus, ensure command mode.
            if (!widget.editorWidget.node.contains(target)) {
                this.mode = 'command';
            }
            this.activeCellIndex = index;
            // If the editor has focus, ensure edit mode.
            const node = widget.editorWidget.node;
            if (node.contains(target)) {
                this.mode = 'edit';
            }
            this.activeCellIndex = index;
        }
        else {
            // No cell has focus, ensure command mode.
            this.mode = 'command';
        }
    }
    /**
     * Handle `focusout` events for the notebook.
     */
    _evtFocusOut(event) {
        const relatedTarget = event.relatedTarget;
        // Bail if the window is losing focus, to preserve edit mode. This test
        // assumes that we explicitly focus things rather than calling blur()
        if (!relatedTarget) {
            return;
        }
        // Bail if the item gaining focus is another cell,
        // and we should not be entering command mode.
        const index = this._findCell(relatedTarget);
        if (index !== -1) {
            const widget = this.widgets[index];
            if (widget.editorWidget.node.contains(relatedTarget)) {
                return;
            }
        }
        // Otherwise enter command mode if not already.
        if (this.mode !== 'command') {
            this.mode = 'command';
            // Switching to command mode currently focuses the notebook element, so
            // refocus the relatedTarget so the focus actually switches as intended.
            if (relatedTarget) {
                relatedTarget.focus();
            }
        }
    }
    /**
     * Handle `dblclick` events for the widget.
     */
    _evtDblClick(event) {
        const model = this.model;
        if (!model) {
            return;
        }
        this.deselectAll();
        const [target, index] = this._findEventTargetAndCell(event);
        if (event.target.classList.contains(HEADING_COLLAPSER_CLASS)) {
            return;
        }
        if (index === -1) {
            return;
        }
        this.activeCellIndex = index;
        if (model.cells.get(index).type === 'markdown') {
            const widget = this.widgets[index];
            widget.rendered = false;
        }
        else if (target.localName === 'img') {
            target.classList.toggle(UNCONFINED_CLASS);
        }
    }
    /**
     * Remove selections from inactive cells to avoid
     * spurious cursors.
     */
    _trimSelections() {
        for (let i = 0; i < this.widgets.length; i++) {
            if (i !== this._activeCellIndex) {
                const cell = this.widgets[i];
                cell.model.selections.delete(cell.editor.uuid);
            }
        }
    }
}
/**
 * The namespace for the `Notebook` class statics.
 */
(function (Notebook) {
    /**
     * The default implementation of a notebook content factory..
     *
     * #### Notes
     * Override methods on this class to customize the default notebook factory
     * methods that create notebook content.
     */
    class ContentFactory extends StaticNotebook.ContentFactory {
    }
    Notebook.ContentFactory = ContentFactory;
    Notebook.defaultContentFactory = new ContentFactory();
})(Notebook || (Notebook = {}));
/**
 * A namespace for private data.
 */
var Private;
(function (Private) {
    /**
     * An attached property for the selected state of a cell.
     */
    Private.selectedProperty = new AttachedProperty({
        name: 'selected',
        create: () => false
    });
    /**
     * A custom panel layout for the notebook.
     */
    class NotebookPanelLayout extends PanelLayout {
        /**
         * A message handler invoked on an `'update-request'` message.
         *
         * #### Notes
         * This is a reimplementation of the base class method,
         * and is a no-op.
         */
        onUpdateRequest(msg) {
            // This is a no-op.
        }
    }
    Private.NotebookPanelLayout = NotebookPanelLayout;
    /**
     * Create a cell drag image.
     */
    function createDragImage(count, promptNumber, cellContent) {
        if (count > 1) {
            if (promptNumber !== '') {
                return VirtualDOM.realize(h.div(h.div({ className: DRAG_IMAGE_CLASS }, h.span({ className: CELL_DRAG_PROMPT_CLASS }, '[' + promptNumber + ']:'), h.span({ className: CELL_DRAG_CONTENT_CLASS }, cellContent)), h.div({ className: CELL_DRAG_MULTIPLE_BACK }, '')));
            }
            else {
                return VirtualDOM.realize(h.div(h.div({ className: DRAG_IMAGE_CLASS }, h.span({ className: CELL_DRAG_PROMPT_CLASS }), h.span({ className: CELL_DRAG_CONTENT_CLASS }, cellContent)), h.div({ className: CELL_DRAG_MULTIPLE_BACK }, '')));
            }
        }
        else {
            if (promptNumber !== '') {
                return VirtualDOM.realize(h.div(h.div({ className: `${DRAG_IMAGE_CLASS} ${SINGLE_DRAG_IMAGE_CLASS}` }, h.span({ className: CELL_DRAG_PROMPT_CLASS }, '[' + promptNumber + ']:'), h.span({ className: CELL_DRAG_CONTENT_CLASS }, cellContent))));
            }
            else {
                return VirtualDOM.realize(h.div(h.div({ className: `${DRAG_IMAGE_CLASS} ${SINGLE_DRAG_IMAGE_CLASS}` }, h.span({ className: CELL_DRAG_PROMPT_CLASS }), h.span({ className: CELL_DRAG_CONTENT_CLASS }, cellContent))));
            }
        }
    }
    Private.createDragImage = createDragImage;
    /**
     * Process the `IOptions` passed to the notebook widget.
     *
     * #### Notes
     * This defaults the content factory to that in the `Notebook` namespace.
     */
    function processNotebookOptions(options) {
        if (options.contentFactory) {
            return options;
        }
        else {
            return {
                rendermime: options.rendermime,
                languagePreference: options.languagePreference,
                contentFactory: Notebook.defaultContentFactory,
                mimeTypeService: options.mimeTypeService
            };
        }
    }
    Private.processNotebookOptions = processNotebookOptions;
})(Private || (Private = {}));
//# sourceMappingURL=widget.js.map