// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
// / <reference types="codemirror"/>
// / <reference types="codemirror/searchcursor"/>
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
import { showDialog } from '@jupyterlab/apputils';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { nullTranslator } from '@jupyterlab/translation';
import { ArrayExt } from '@lumino/algorithm';
import { JSONExt, UUID } from '@lumino/coreutils';
import { DisposableDelegate } from '@lumino/disposable';
import { Poll } from '@lumino/polling';
import { Signal } from '@lumino/signaling';
import CodeMirror from 'codemirror';
import 'codemirror/addon/comment/comment.js';
import 'codemirror/addon/display/rulers.js';
import 'codemirror/addon/edit/closebrackets.js';
import 'codemirror/addon/edit/matchbrackets.js';
import 'codemirror/addon/fold/brace-fold.js';
import 'codemirror/addon/fold/comment-fold.js';
import 'codemirror/addon/fold/foldcode.js';
import 'codemirror/addon/fold/foldgutter.js';
import 'codemirror/addon/fold/indent-fold.js';
import 'codemirror/addon/fold/markdown-fold.js';
import 'codemirror/addon/fold/xml-fold.js';
import 'codemirror/addon/mode/simple';
import 'codemirror/addon/scroll/scrollpastend.js';
import 'codemirror/addon/search/jump-to-line';
import 'codemirror/addon/search/search';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/selection/active-line';
import 'codemirror/addon/selection/mark-selection';
import 'codemirror/addon/selection/selection-pointer';
import 'codemirror/addon/edit/trailingspace.js';
import 'codemirror/keymap/emacs.js';
import 'codemirror/keymap/sublime.js';
import { CodemirrorBinding } from 'y-codemirror';
import { Mode } from './mode';
// import 'codemirror/keymap/vim.js';  lazy loading of vim mode is available in ../codemirror-extension/index.ts
/**
 * The class name added to CodeMirrorWidget instances.
 */
const EDITOR_CLASS = 'jp-CodeMirrorEditor';
/**
 * The class name added to read only cell editor widgets.
 */
const READ_ONLY_CLASS = 'jp-mod-readOnly';
/**
 * The class name for the hover box for collaborator cursors.
 */
const COLLABORATOR_CURSOR_CLASS = 'jp-CollaboratorCursor';
/**
 * The class name for the hover box for collaborator cursors.
 */
const COLLABORATOR_HOVER_CLASS = 'jp-CollaboratorCursor-hover';
/**
 * The key code for the up arrow key.
 */
const UP_ARROW = 38;
/**
 * The key code for the down arrow key.
 */
const DOWN_ARROW = 40;
/**
 * The time that a collaborator name hover persists.
 */
const HOVER_TIMEOUT = 1000;
// @todo Remove the duality of having a modeldb and a y-codemirror
// binding as it just introduces a lot of additional complexity without gaining anything.
const USE_YCODEMIRROR_BINDING = true;
/**
 * CodeMirror editor.
 */
export class CodeMirrorEditor {
    /**
     * Construct a CodeMirror editor.
     */
    constructor(options) {
        var _a;
        /**
         * A signal emitted when either the top or bottom edge is requested.
         */
        this.edgeRequested = new Signal(this);
        this.selectionMarkers = {};
        this._keydownHandlers = new Array();
        this._changeGuard = false;
        this._uuid = '';
        this._needsRefresh = false;
        this._isDisposed = false;
        this._lastChange = null;
        const host = (this.host = options.host);
        this.translator = options.translator || nullTranslator;
        this._trans = this.translator.load('jupyterlab');
        host.classList.add(EDITOR_CLASS);
        host.classList.add('jp-Editor');
        host.addEventListener('focus', this, true);
        host.addEventListener('blur', this, true);
        host.addEventListener('scroll', this, true);
        this._uuid = options.uuid || UUID.uuid4();
        // Handle selection style.
        const style = options.selectionStyle || {};
        this._selectionStyle = Object.assign(Object.assign({}, CodeEditor.defaultSelectionStyle), style);
        const model = (this._model = options.model);
        const config = options.config || {};
        const fullConfig = (this._config = Object.assign(Object.assign({}, CodeMirrorEditor.defaultConfig), config));
        const editor = (this._editor = Private.createEditor(host, fullConfig));
        this._initializeEditorBinding();
        // every time the model is switched, we need to re-initialize the editor binding
        this.model.sharedModelSwitched.connect(this._initializeEditorBinding, this);
        const doc = editor.getDoc();
        // Handle initial values for text, mimetype, and selections.
        if (!USE_YCODEMIRROR_BINDING) {
            doc.setValue(model.value.text);
        }
        this._onMimeTypeChanged();
        this._onCursorActivity();
        this._poll = new Poll({
            factory: async () => {
                this._checkSync();
            },
            frequency: { interval: 3000, backoff: false },
            standby: () => {
                // If changed, only stand by when hidden, otherwise always stand by.
                return this._lastChange ? 'when-hidden' : true;
            }
        });
        // Connect to changes.
        if (!USE_YCODEMIRROR_BINDING) {
            model.value.changed.connect(this._onValueChanged, this);
        }
        model.mimeTypeChanged.connect(this._onMimeTypeChanged, this);
        model.selections.changed.connect(this._onSelectionsChanged, this);
        CodeMirror.on(editor, 'keydown', (editor, event) => {
            const index = ArrayExt.findFirstIndex(this._keydownHandlers, handler => {
                if (handler(this, event) === true) {
                    event.preventDefault();
                    return true;
                }
                return false;
            });
            if (index === -1) {
                this.onKeydown(event);
            }
        });
        if (USE_YCODEMIRROR_BINDING) {
            (_a = this._yeditorBinding) === null || _a === void 0 ? void 0 : _a.on('cursorActivity', () => this._onCursorActivity());
        }
        else {
            CodeMirror.on(editor, 'cursorActivity', () => this._onCursorActivity());
            CodeMirror.on(editor.getDoc(), 'beforeChange', (instance, change) => {
                this._beforeDocChanged(instance, change);
            });
        }
        CodeMirror.on(editor.getDoc(), 'change', (instance, change) => {
            // Manually refresh after setValue to make sure editor is properly sized.
            if (change.origin === 'setValue' && this.hasFocus()) {
                this.refresh();
            }
            this._lastChange = change;
        });
        // Turn off paste handling in codemirror since sometimes we want to
        // replace it with our own.
        editor.on('paste', (instance, event) => {
            var _a;
            const handlePaste = (_a = this._config['handlePaste']) !== null && _a !== void 0 ? _a : true;
            if (!handlePaste) {
                event.codemirrorIgnore = true;
            }
        });
        // Manually refresh on paste to make sure editor is properly sized.
        editor.getWrapperElement().addEventListener('paste', () => {
            if (this.hasFocus()) {
                this.refresh();
            }
        });
    }
    /**
     * Initialize the editor binding.
     */
    _initializeEditorBinding() {
        var _a;
        if (!USE_YCODEMIRROR_BINDING) {
            return;
        }
        (_a = this._yeditorBinding) === null || _a === void 0 ? void 0 : _a.destroy();
        const sharedModel = this.model.sharedModel;
        const opts = sharedModel.undoManager
            ? { yUndoManager: sharedModel.undoManager }
            : {};
        const awareness = sharedModel.awareness;
        this._yeditorBinding = new CodemirrorBinding(sharedModel.ysource, this.editor, awareness, opts);
    }
    /**
     * The uuid of this editor;
     */
    get uuid() {
        return this._uuid;
    }
    set uuid(value) {
        this._uuid = value;
    }
    /**
     * The selection style of this editor.
     */
    get selectionStyle() {
        return this._selectionStyle;
    }
    set selectionStyle(value) {
        this._selectionStyle = value;
    }
    /**
     * Get the codemirror editor wrapped by the editor.
     */
    get editor() {
        return this._editor;
    }
    /**
     * Get the codemirror doc wrapped by the widget.
     */
    get doc() {
        return this._editor.getDoc();
    }
    /**
     * Get the number of lines in the editor.
     */
    get lineCount() {
        return this.doc.lineCount();
    }
    /**
     * Returns a model for this editor.
     */
    get model() {
        return this._model;
    }
    /**
     * The height of a line in the editor in pixels.
     */
    get lineHeight() {
        return this._editor.defaultTextHeight();
    }
    /**
     * The widget of a character in the editor in pixels.
     */
    get charWidth() {
        return this._editor.defaultCharWidth();
    }
    /**
     * Tests whether the editor is disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Dispose of the resources held by the widget.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._isDisposed = true;
        this.host.removeEventListener('focus', this, true);
        this.host.removeEventListener('blur', this, true);
        this.host.removeEventListener('scroll', this, true);
        if (this._yeditorBinding) {
            this._yeditorBinding.destroy();
        }
        this._keydownHandlers.length = 0;
        this._poll.dispose();
        Signal.clearData(this);
    }
    /**
     * Get a config option for the editor.
     */
    getOption(option) {
        return this._config[option];
    }
    /**
     * Set a config option for the editor.
     */
    setOption(option, value) {
        // Don't bother setting the option if it is already the same.
        if (this._config[option] !== value) {
            this._config[option] = value;
            Private.setOption(this.editor, option, value, this._config);
        }
    }
    /**
     * Set config options for the editor.
     *
     * This method is preferred when setting several options. The
     * options are set within an operation, which only performs
     * the costly update at the end, and not after every option
     * is set.
     */
    setOptions(options) {
        const editor = this._editor;
        editor.startOperation();
        for (const key in options) {
            const k = key;
            editor.operation(() => {
                this.setOption(k, options[k]);
            });
        }
        editor.endOperation();
    }
    /**
     * Returns the content for the given line number.
     */
    getLine(line) {
        return this.doc.getLine(line);
    }
    /**
     * Find an offset for the given position.
     */
    getOffsetAt(position) {
        return this.doc.indexFromPos({
            ch: position.column,
            line: position.line
        });
    }
    /**
     * Find a position for the given offset.
     */
    getPositionAt(offset) {
        const { ch, line } = this.doc.posFromIndex(offset);
        return { line, column: ch };
    }
    /**
     * Undo one edit (if any undo events are stored).
     */
    undo() {
        this.model.sharedModel.undo();
    }
    /**
     * Redo one undone edit.
     */
    redo() {
        this.model.sharedModel.redo();
    }
    /**
     * Clear the undo history.
     */
    clearHistory() {
        var _a, _b;
        (_b = (_a = this._yeditorBinding) === null || _a === void 0 ? void 0 : _a.yUndoManager) === null || _b === void 0 ? void 0 : _b.clear();
    }
    /**
     * Brings browser focus to this editor text.
     */
    focus() {
        this._editor.focus();
    }
    /**
     * Test whether the editor has keyboard focus.
     */
    hasFocus() {
        return this._editor.getWrapperElement().contains(document.activeElement);
    }
    /**
     * Explicitly blur the editor.
     */
    blur() {
        this._editor.getInputField().blur();
    }
    /**
     * Repaint editor.
     */
    refresh() {
        this._editor.refresh();
        this._needsRefresh = false;
    }
    /**
     * Refresh the editor if it is focused;
     * otherwise postpone refreshing till focusing.
     */
    resizeToFit() {
        if (this.hasFocus()) {
            this.refresh();
        }
        else {
            this._needsRefresh = true;
        }
        this._clearHover();
    }
    // todo: docs, maybe define overlay options as a type?
    addOverlay(mode, options) {
        this._editor.addOverlay(mode, options);
    }
    removeOverlay(mode) {
        this._editor.removeOverlay(mode);
    }
    getSearchCursor(query, start, caseFold) {
        return this._editor.getDoc().getSearchCursor(query, start, caseFold);
    }
    getCursor(start) {
        return this._editor.getDoc().getCursor(start);
    }
    get state() {
        return this._editor.state;
    }
    operation(fn) {
        return this._editor.operation(fn);
    }
    firstLine() {
        return this._editor.getDoc().firstLine();
    }
    lastLine() {
        return this._editor.getDoc().lastLine();
    }
    scrollIntoView(pos, margin) {
        this._editor.scrollIntoView(pos, margin);
    }
    scrollIntoViewCentered(pos) {
        var _a, _b;
        const top = this._editor.charCoords(pos, 'local').top;
        const height = this._editor.getWrapperElement().offsetHeight;
        (_b = (_a = this.host).scrollIntoView) === null || _b === void 0 ? void 0 : _b.call(_a, {
            behavior: 'auto',
            block: 'center',
            inline: 'center'
        });
        this._editor.scrollTo(null, top - height / 2);
    }
    cursorCoords(where, mode) {
        return this._editor.cursorCoords(where, mode);
    }
    getRange(from, to, separator) {
        return this._editor.getDoc().getRange(from, to, separator);
    }
    /**
     * Add a keydown handler to the editor.
     *
     * @param handler - A keydown handler.
     *
     * @returns A disposable that can be used to remove the handler.
     */
    addKeydownHandler(handler) {
        this._keydownHandlers.push(handler);
        return new DisposableDelegate(() => {
            ArrayExt.removeAllWhere(this._keydownHandlers, val => val === handler);
        });
    }
    /**
     * Set the size of the editor in pixels.
     */
    setSize(dimension) {
        if (dimension) {
            this._editor.setSize(dimension.width, dimension.height);
        }
        else {
            this._editor.setSize(null, null);
        }
        this._needsRefresh = false;
    }
    /**
     * Reveal the given position in the editor.
     */
    revealPosition(position) {
        const cmPosition = this._toCodeMirrorPosition(position);
        this._editor.scrollIntoView(cmPosition);
    }
    /**
     * Reveal the given selection in the editor.
     */
    revealSelection(selection) {
        const range = {
            from: this._toCodeMirrorPosition(selection.start),
            to: this._toCodeMirrorPosition(selection.end)
        };
        this._editor.scrollIntoView(range);
    }
    /**
     * Get the window coordinates given a cursor position.
     */
    getCoordinateForPosition(position) {
        const pos = this._toCodeMirrorPosition(position);
        const rect = this.editor.charCoords(pos, 'page');
        return rect;
    }
    /**
     * Get the cursor position given window coordinates.
     *
     * @param coordinate - The desired coordinate.
     *
     * @returns The position of the coordinates, or null if not
     *   contained in the editor.
     */
    getPositionForCoordinate(coordinate) {
        return this._toPosition(this.editor.coordsChar(coordinate)) || null;
    }
    /**
     * Returns the primary position of the cursor, never `null`.
     */
    getCursorPosition() {
        const cursor = this.doc.getCursor();
        return this._toPosition(cursor);
    }
    /**
     * Set the primary position of the cursor.
     *
     * #### Notes
     * This will remove any secondary cursors.
     */
    setCursorPosition(position, options) {
        const cursor = this._toCodeMirrorPosition(position);
        this.doc.setCursor(cursor, undefined, options);
        // If the editor does not have focus, this cursor change
        // will get screened out in _onCursorsChanged(). Make an
        // exception for this method.
        if (!this.editor.hasFocus()) {
            this.model.selections.set(this.uuid, this.getSelections());
        }
    }
    /**
     * Returns the primary selection, never `null`.
     */
    getSelection() {
        return this.getSelections()[0];
    }
    /**
     * Set the primary selection. This will remove any secondary cursors.
     */
    setSelection(selection) {
        this.setSelections([selection]);
    }
    /**
     * Gets the selections for all the cursors, never `null` or empty.
     */
    getSelections() {
        const selections = this.doc.listSelections();
        if (selections.length > 0) {
            return selections.map(selection => this._toSelection(selection));
        }
        const cursor = this.doc.getCursor();
        const selection = this._toSelection({ anchor: cursor, head: cursor });
        return [selection];
    }
    /**
     * Sets the selections for all the cursors, should not be empty.
     * Cursors will be removed or added, as necessary.
     * Passing an empty array resets a cursor position to the start of a document.
     */
    setSelections(selections) {
        const cmSelections = this._toCodeMirrorSelections(selections);
        this.doc.setSelections(cmSelections, 0);
    }
    /**
     * Replaces the current selection with the given text.
     *
     * @param text The text to be inserted.
     */
    replaceSelection(text) {
        this.doc.replaceSelection(text);
    }
    /**
     * Get a list of tokens for the current editor text content.
     */
    getTokens() {
        let tokens = [];
        for (let i = 0; i < this.lineCount; ++i) {
            const lineTokens = this.editor.getLineTokens(i).map(t => ({
                offset: this.getOffsetAt({ column: t.start, line: i }),
                value: t.string,
                type: t.type || ''
            }));
            tokens = tokens.concat(lineTokens);
        }
        return tokens;
    }
    /**
     * Get the token at a given editor position.
     */
    getTokenForPosition(position) {
        var _a;
        const cursor = this._toCodeMirrorPosition(position);
        const token = this.editor.getTokenAt(cursor);
        return {
            offset: this.getOffsetAt({ column: token.start, line: cursor.line }),
            value: token.string,
            type: (_a = token.type) !== null && _a !== void 0 ? _a : undefined
        };
    }
    /**
     * Insert a new indented line at the current cursor position.
     */
    newIndentedLine() {
        this.execCommand('newlineAndIndent');
    }
    /**
     * Execute a codemirror command on the editor.
     *
     * @param command - The name of the command to execute.
     */
    execCommand(command) {
        this._editor.execCommand(command);
    }
    /**
     * Handle keydown events from the editor.
     */
    onKeydown(event) {
        const position = this.getCursorPosition();
        const { line, column } = position;
        if (line === 0 && column === 0 && event.keyCode === UP_ARROW) {
            if (!event.shiftKey) {
                this.edgeRequested.emit('top');
            }
            return false;
        }
        if (line === 0 && event.keyCode === UP_ARROW) {
            if (!event.shiftKey) {
                this.edgeRequested.emit('topLine');
            }
            return false;
        }
        const lastLine = this.lineCount - 1;
        const lastCh = this.getLine(lastLine).length;
        if (line === lastLine &&
            column === lastCh &&
            event.keyCode === DOWN_ARROW) {
            if (!event.shiftKey) {
                this.edgeRequested.emit('bottom');
            }
            return false;
        }
        return false;
    }
    /**
     * Converts selections to code mirror selections.
     */
    _toCodeMirrorSelections(selections) {
        if (selections.length > 0) {
            return selections.map(selection => this._toCodeMirrorSelection(selection));
        }
        const position = { line: 0, ch: 0 };
        return [{ anchor: position, head: position }];
    }
    /**
     * Handles a mime type change.
     */
    _onMimeTypeChanged() {
        const mime = this._model.mimeType;
        const editor = this._editor;
        const extraKeys = (editor.getOption('extraKeys') ||
            {});
        const isCode = mime !== 'text/plain' && mime !== 'text/x-ipythongfm';
        if (isCode) {
            extraKeys['Backspace'] = 'delSpaceToPrevTabStop';
        }
        else {
            delete extraKeys['Backspace'];
        }
        this.setOption('extraKeys', extraKeys);
        // TODO: should we provide a hook for when the mode is done being set?
        void Mode.ensure(mime).then(spec => {
            var _a;
            this.setOption('mode', (_a = spec === null || spec === void 0 ? void 0 : spec.mime) !== null && _a !== void 0 ? _a : 'null');
        });
    }
    /**
     * Handles a selections change.
     */
    _onSelectionsChanged(selections, args) {
        const uuid = args.key;
        if (uuid !== this.uuid) {
            this._cleanSelections(uuid);
            if (args.type !== 'remove' && args.newValue) {
                this._markSelections(uuid, args.newValue);
            }
        }
    }
    /**
     * Clean selections for the given uuid.
     */
    _cleanSelections(uuid) {
        const markers = this.selectionMarkers[uuid];
        if (markers) {
            markers.forEach(marker => {
                marker.clear();
            });
        }
        delete this.selectionMarkers[uuid];
    }
    /**
     * Marks selections.
     */
    _markSelections(uuid, selections) {
        const markers = [];
        // If we are marking selections corresponding to an active hover,
        // remove it.
        if (uuid === this._hoverId) {
            this._clearHover();
        }
        // If we can id the selection to a specific collaborator,
        // use that information.
        let collaborator;
        if (this._model.modelDB.collaborators) {
            collaborator = this._model.modelDB.collaborators.get(uuid);
        }
        // Style each selection for the uuid.
        selections.forEach(selection => {
            // Only render selections if the start is not equal to the end.
            // In that case, we don't need to render the cursor.
            if (!JSONExt.deepEqual(selection.start, selection.end)) {
                // Selections only appear to render correctly if the anchor
                // is before the head in the document. That is, reverse selections
                // do not appear as intended.
                const forward = selection.start.line < selection.end.line ||
                    (selection.start.line === selection.end.line &&
                        selection.start.column <= selection.end.column);
                const anchor = this._toCodeMirrorPosition(forward ? selection.start : selection.end);
                const head = this._toCodeMirrorPosition(forward ? selection.end : selection.start);
                let markerOptions;
                if (collaborator) {
                    markerOptions = this._toTextMarkerOptions(Object.assign(Object.assign({}, selection.style), { color: collaborator.color }));
                }
                else {
                    markerOptions = this._toTextMarkerOptions(selection.style);
                }
                markers.push(this.doc.markText(anchor, head, markerOptions));
            }
            else if (collaborator) {
                const caret = this._getCaret(collaborator);
                markers.push(this.doc.setBookmark(this._toCodeMirrorPosition(selection.end), {
                    widget: caret
                }));
            }
        });
        this.selectionMarkers[uuid] = markers;
    }
    /**
     * Handles a cursor activity event.
     */
    _onCursorActivity() {
        // Only add selections if the editor has focus. This avoids unwanted
        // triggering of cursor activity due to collaborator actions.
        if (this._editor.hasFocus()) {
            const selections = this.getSelections();
            this.model.selections.set(this.uuid, selections);
        }
    }
    /**
     * Converts a code mirror selection to an editor selection.
     */
    _toSelection(selection) {
        return {
            uuid: this.uuid,
            start: this._toPosition(selection.anchor),
            end: this._toPosition(selection.head),
            style: this.selectionStyle
        };
    }
    /**
     * Converts the selection style to a text marker options.
     */
    _toTextMarkerOptions(style) {
        const r = parseInt(style.color.slice(1, 3), 16);
        const g = parseInt(style.color.slice(3, 5), 16);
        const b = parseInt(style.color.slice(5, 7), 16);
        const css = `background-color: rgba( ${r}, ${g}, ${b}, 0.15)`;
        return {
            className: style.className,
            title: style.displayName,
            css
        };
    }
    /**
     * Converts an editor selection to a code mirror selection.
     */
    _toCodeMirrorSelection(selection) {
        return {
            anchor: this._toCodeMirrorPosition(selection.start),
            head: this._toCodeMirrorPosition(selection.end)
        };
    }
    /**
     * Convert a code mirror position to an editor position.
     */
    _toPosition(position) {
        return {
            line: position.line,
            column: position.ch
        };
    }
    /**
     * Convert an editor position to a code mirror position.
     */
    _toCodeMirrorPosition(position) {
        return {
            line: position.line,
            ch: position.column
        };
    }
    /**
     * Handle model value changes.
     */
    _onValueChanged(value, args) {
        if (this._changeGuard) {
            return;
        }
        this._changeGuard = true;
        const doc = this.doc;
        switch (args.type) {
            case 'insert': {
                const pos = doc.posFromIndex(args.start);
                // Replace the range, including a '+input' origin,
                // which indicates that CodeMirror may merge changes
                // for undo/redo purposes.
                doc.replaceRange(args.value, pos, pos, '+input');
                break;
            }
            case 'remove': {
                const from = doc.posFromIndex(args.start);
                const to = doc.posFromIndex(args.end);
                // Replace the range, including a '+input' origin,
                // which indicates that CodeMirror may merge changes
                // for undo/redo purposes.
                doc.replaceRange('', from, to, '+input');
                break;
            }
            case 'set':
                doc.setValue(args.value);
                break;
            default:
                break;
        }
        this._changeGuard = false;
    }
    /**
     * Handles document changes.
     */
    _beforeDocChanged(doc, change) {
        if (this._changeGuard) {
            return;
        }
        this._changeGuard = true;
        const value = this._model.value;
        const start = doc.indexFromPos(change.from);
        const end = doc.indexFromPos(change.to);
        const inserted = change.text.join('\n');
        if (end !== start) {
            value.remove(start, end);
        }
        if (inserted) {
            value.insert(start, inserted);
        }
        this._changeGuard = false;
    }
    /**
     * Handle the DOM events for the editor.
     *
     * @param event - The DOM event sent to the editor.
     *
     * #### Notes
     * This method implements the DOM `EventListener` interface and is
     * called in response to events on the editor's DOM node. It should
     * not be called directly by user code.
     */
    handleEvent(event) {
        switch (event.type) {
            case 'focus':
                this._evtFocus(event);
                break;
            case 'blur':
                this._evtBlur(event);
                break;
            case 'scroll':
                this._evtScroll();
                break;
            default:
                break;
        }
    }
    /**
     * Handle `focus` events for the editor.
     */
    _evtFocus(event) {
        if (this._needsRefresh) {
            this.refresh();
        }
        this.host.classList.add('jp-mod-focused');
        // Update the selections on editor gaining focus because
        // the onCursorActivity function filters usual cursor events
        // based on the editor's focus.
        this._onCursorActivity();
    }
    /**
     * Handle `blur` events for the editor.
     */
    _evtBlur(event) {
        this.host.classList.remove('jp-mod-focused');
    }
    /**
     * Handle `scroll` events for the editor.
     */
    _evtScroll() {
        // Remove any active hover.
        this._clearHover();
    }
    /**
     * Clear the hover for a caret, due to things like
     * scrolling, resizing, deactivation, etc, where
     * the position is no longer valid.
     */
    _clearHover() {
        if (this._caretHover) {
            window.clearTimeout(this._hoverTimeout);
            document.body.removeChild(this._caretHover);
            this._caretHover = null;
        }
    }
    /**
     * Construct a caret element representing the position
     * of a collaborator's cursor.
     */
    _getCaret(collaborator) {
        // FIXME-TRANS: Is this localizable?
        const name = collaborator ? collaborator.displayName : 'Anonymous';
        const color = collaborator
            ? collaborator.color
            : this._selectionStyle.color;
        const caret = document.createElement('span');
        caret.className = COLLABORATOR_CURSOR_CLASS;
        caret.style.borderBottomColor = color;
        caret.onmouseenter = () => {
            this._clearHover();
            this._hoverId = collaborator.sessionId;
            const rect = caret.getBoundingClientRect();
            // Construct and place the hover box.
            const hover = document.createElement('div');
            hover.className = COLLABORATOR_HOVER_CLASS;
            hover.style.left = String(rect.left) + 'px';
            hover.style.top = String(rect.bottom) + 'px';
            hover.textContent = name;
            hover.style.backgroundColor = color;
            // If the user mouses over the hover, take over the timer.
            hover.onmouseenter = () => {
                window.clearTimeout(this._hoverTimeout);
            };
            hover.onmouseleave = () => {
                this._hoverTimeout = window.setTimeout(() => {
                    this._clearHover();
                }, HOVER_TIMEOUT);
            };
            this._caretHover = hover;
            document.body.appendChild(hover);
        };
        caret.onmouseleave = () => {
            this._hoverTimeout = window.setTimeout(() => {
                this._clearHover();
            }, HOVER_TIMEOUT);
        };
        return caret;
    }
    /**
     * Check for an out of sync editor.
     */
    _checkSync() {
        const change = this._lastChange;
        if (!change) {
            return;
        }
        this._lastChange = null;
        const editor = this._editor;
        const doc = editor.getDoc();
        if (doc.getValue() === this._model.value.text) {
            return;
        }
        void showDialog({
            title: this._trans.__('Code Editor out of Sync'),
            body: this._trans.__('Please open your browser JavaScript console for bug report instructions')
        });
        console.warn('If you are able and willing to publicly share the text or code in your editor, you can help us debug the "Code Editor out of Sync" message by pasting the following to the public issue at https://github.com/jupyterlab/jupyterlab/issues/2951. Please note that the data below includes the text/code in your editor.');
        console.warn(JSON.stringify({
            model: this._model.value.text,
            view: doc.getValue(),
            selections: this.getSelections(),
            cursor: this.getCursorPosition(),
            lineSep: editor.getOption('lineSeparator'),
            mode: editor.getOption('mode'),
            change
        }));
    }
}
/**
 * The namespace for `CodeMirrorEditor` statics.
 */
(function (CodeMirrorEditor) {
    /**
     * The default configuration options for an editor.
     */
    CodeMirrorEditor.defaultConfig = Object.assign(Object.assign({}, CodeEditor.defaultConfig), { mode: 'null', theme: 'jupyter', smartIndent: true, electricChars: true, keyMap: 'default', extraKeys: null, gutters: [], fixedGutter: true, showCursorWhenSelecting: false, coverGutterNextToScrollbar: false, dragDrop: true, lineSeparator: null, scrollbarStyle: 'native', lineWiseCopyCut: true, scrollPastEnd: false, styleActiveLine: false, styleSelectedText: true, selectionPointer: false, rulers: [], foldGutter: false, handlePaste: true });
    /**
     * Add a command to CodeMirror.
     *
     * @param name - The name of the command to add.
     *
     * @param command - The command function.
     */
    function addCommand(name, command) {
        CodeMirror.commands[name] = command;
    }
    CodeMirrorEditor.addCommand = addCommand;
})(CodeMirrorEditor || (CodeMirrorEditor = {}));
/**
 * The namespace for module private data.
 */
var Private;
(function (Private) {
    function createEditor(host, config) {
        const { autoClosingBrackets, fontFamily, fontSize, insertSpaces, lineHeight, lineWrap, wordWrapColumn, tabSize, readOnly } = config, otherOptions = __rest(config, ["autoClosingBrackets", "fontFamily", "fontSize", "insertSpaces", "lineHeight", "lineWrap", "wordWrapColumn", "tabSize", "readOnly"]);
        const bareConfig = Object.assign({ autoCloseBrackets: autoClosingBrackets ? {} : false, indentUnit: tabSize, indentWithTabs: !insertSpaces, lineWrapping: lineWrap === 'off' ? false : true, readOnly }, otherOptions);
        return CodeMirror(el => {
            if (fontFamily) {
                el.style.fontFamily = fontFamily;
            }
            if (fontSize) {
                el.style.fontSize = fontSize + 'px';
            }
            if (lineHeight) {
                el.style.lineHeight = lineHeight.toString();
            }
            if (readOnly) {
                el.classList.add(READ_ONLY_CLASS);
            }
            if (lineWrap === 'wordWrapColumn') {
                const lines = el.querySelector('.CodeMirror-lines');
                lines.style.width = `${wordWrapColumn}ch`;
            }
            if (lineWrap === 'bounded') {
                const lines = el.querySelector('.CodeMirror-lines');
                lines.style.maxWidth = `${wordWrapColumn}ch`;
            }
            host.appendChild(el);
        }, bareConfig);
    }
    Private.createEditor = createEditor;
    /**
     * Indent or insert a tab as appropriate.
     */
    function indentMoreOrinsertTab(cm) {
        const doc = cm.getDoc();
        const from = doc.getCursor('from');
        const to = doc.getCursor('to');
        const sel = !posEq(from, to);
        if (sel) {
            CodeMirror.commands['indentMore'](cm);
            return;
        }
        // Check for start of line.
        const line = doc.getLine(from.line);
        const before = line.slice(0, from.ch);
        if (/^\s*$/.test(before)) {
            CodeMirror.commands['indentMore'](cm);
        }
        else {
            if (cm.getOption('indentWithTabs')) {
                CodeMirror.commands['insertTab'](cm);
            }
            else {
                CodeMirror.commands['insertSoftTab'](cm);
            }
        }
    }
    Private.indentMoreOrinsertTab = indentMoreOrinsertTab;
    /**
     * Delete spaces to the previous tab stop in a codemirror editor.
     */
    function delSpaceToPrevTabStop(cm) {
        var _a;
        const doc = cm.getDoc();
        // default tabsize is 2, according to codemirror docs: https://codemirror.net/doc/manual.html#config
        const tabSize = (_a = cm.getOption('indentUnit')) !== null && _a !== void 0 ? _a : 2;
        const ranges = doc.listSelections(); // handle multicursor
        for (let i = ranges.length - 1; i >= 0; i--) {
            // iterate reverse so any deletions don't overlap
            const head = ranges[i].head;
            const anchor = ranges[i].anchor;
            const isSelection = !posEq(head, anchor);
            if (isSelection) {
                doc.replaceRange('', anchor, head);
            }
            else {
                const line = doc.getLine(head.line).substring(0, head.ch);
                if (line.match(/^\ +$/) !== null) {
                    // delete tabs
                    const prevTabStop = (Math.ceil(head.ch / tabSize) - 1) * tabSize;
                    const from = CodeMirror.Pos(head.line, prevTabStop);
                    doc.replaceRange('', from, head);
                }
                else {
                    // delete non-tabs
                    const from = cm.findPosH(head, -1, 'char', false);
                    doc.replaceRange('', from, head);
                }
            }
        }
    }
    Private.delSpaceToPrevTabStop = delSpaceToPrevTabStop;
    /**
     * Test whether two CodeMirror positions are equal.
     */
    function posEq(a, b) {
        return a.line === b.line && a.ch === b.ch;
    }
    Private.posEq = posEq;
    /**
     * Get the list of active gutters
     *
     * @param config Editor configuration
     */
    function getActiveGutters(config) {
        // The order of the classes will be the gutters order
        const classToSwitch = {
            'CodeMirror-linenumbers': 'lineNumbers',
            'CodeMirror-foldgutter': 'codeFolding'
        };
        return Object.keys(classToSwitch).filter(gutter => config[classToSwitch[gutter]]);
    }
    /**
     * Set a config option for the editor.
     */
    function setOption(editor, option, value, config) {
        const el = editor.getWrapperElement();
        switch (option) {
            case 'cursorBlinkRate':
                editor.setOption(option, value);
                break;
            case 'lineWrap': {
                const lineWrapping = value === 'off' ? false : true;
                const lines = el.querySelector('.CodeMirror-lines');
                const maxWidth = value === 'bounded' ? `${config.wordWrapColumn}ch` : null;
                const width = value === 'wordWrapColumn' ? `${config.wordWrapColumn}ch` : null;
                lines.style.setProperty('max-width', maxWidth);
                lines.style.setProperty('width', width);
                editor.setOption('lineWrapping', lineWrapping);
                break;
            }
            case 'wordWrapColumn': {
                const { lineWrap } = config;
                if (lineWrap === 'wordWrapColumn' || lineWrap === 'bounded') {
                    const lines = el.querySelector('.CodeMirror-lines');
                    const prop = lineWrap === 'wordWrapColumn' ? 'width' : 'maxWidth';
                    lines.style[prop] = `${value}ch`;
                }
                break;
            }
            case 'tabSize':
                editor.setOption('indentUnit', value);
                break;
            case 'insertSpaces':
                editor.setOption('indentWithTabs', !value);
                break;
            case 'autoClosingBrackets':
                editor.setOption('autoCloseBrackets', value);
                break;
            case 'rulers': {
                const rulers = value;
                editor.setOption('rulers', rulers.map(column => {
                    return {
                        column,
                        className: 'jp-CodeMirror-ruler'
                    };
                }));
                break;
            }
            case 'readOnly':
                el.classList.toggle(READ_ONLY_CLASS, value);
                editor.setOption(option, value);
                break;
            case 'fontFamily':
                el.style.fontFamily = value;
                break;
            case 'fontSize':
                el.style.setProperty('font-size', value ? value + 'px' : null);
                break;
            case 'lineHeight':
                el.style.lineHeight = (value ? value.toString() : null);
                break;
            case 'gutters':
                editor.setOption(option, getActiveGutters(config));
                break;
            case 'lineNumbers':
                editor.setOption(option, value);
                editor.setOption('gutters', getActiveGutters(config));
                break;
            case 'codeFolding':
                editor.setOption('foldGutter', value);
                editor.setOption('gutters', getActiveGutters(config));
                break;
            case 'showTrailingSpace':
                editor.setOption(option, value);
                break;
            default:
                editor.setOption(option, value);
                break;
        }
    }
    Private.setOption = setOption;
})(Private || (Private = {}));
/**
 * Add a CodeMirror command to delete until previous non blanking space
 * character or first multiple of tabsize tabstop.
 */
CodeMirrorEditor.addCommand('delSpaceToPrevTabStop', Private.delSpaceToPrevTabStop);
/**
 * Add a CodeMirror command to indent or insert a tab as appropriate.
 */
CodeMirrorEditor.addCommand('indentMoreOrinsertTab', Private.indentMoreOrinsertTab);
//# sourceMappingURL=editor.js.map