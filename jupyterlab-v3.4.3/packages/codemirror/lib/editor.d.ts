/// <reference types="@types/codemirror/addon/search/searchcursor" />
import { CodeEditor } from '@jupyterlab/codeeditor';
import { ITranslator } from '@jupyterlab/translation';
import { IDisposable } from '@lumino/disposable';
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
import { Mode } from './mode';
/**
 * CodeMirror editor.
 */
export declare class CodeMirrorEditor implements CodeEditor.IEditor {
    /**
     * Construct a CodeMirror editor.
     */
    constructor(options: CodeMirrorEditor.IOptions);
    /**
     * Initialize the editor binding.
     */
    private _initializeEditorBinding;
    /**
     * A signal emitted when either the top or bottom edge is requested.
     */
    readonly edgeRequested: Signal<this, CodeEditor.EdgeLocation>;
    /**
     * The DOM node that hosts the editor.
     */
    readonly host: HTMLElement;
    /**
     * The uuid of this editor;
     */
    get uuid(): string;
    set uuid(value: string);
    /**
     * The selection style of this editor.
     */
    get selectionStyle(): CodeEditor.ISelectionStyle;
    set selectionStyle(value: CodeEditor.ISelectionStyle);
    /**
     * Get the codemirror editor wrapped by the editor.
     */
    get editor(): CodeMirror.Editor;
    /**
     * Get the codemirror doc wrapped by the widget.
     */
    get doc(): CodeMirror.Doc;
    /**
     * Get the number of lines in the editor.
     */
    get lineCount(): number;
    /**
     * Returns a model for this editor.
     */
    get model(): CodeEditor.IModel;
    /**
     * The height of a line in the editor in pixels.
     */
    get lineHeight(): number;
    /**
     * The widget of a character in the editor in pixels.
     */
    get charWidth(): number;
    /**
     * Tests whether the editor is disposed.
     */
    get isDisposed(): boolean;
    /**
     * Dispose of the resources held by the widget.
     */
    dispose(): void;
    /**
     * Get a config option for the editor.
     */
    getOption<K extends keyof CodeMirrorEditor.IConfig>(option: K): CodeMirrorEditor.IConfig[K];
    /**
     * Set a config option for the editor.
     */
    setOption<K extends keyof CodeMirrorEditor.IConfig>(option: K, value: CodeMirrorEditor.IConfig[K]): void;
    /**
     * Set config options for the editor.
     *
     * This method is preferred when setting several options. The
     * options are set within an operation, which only performs
     * the costly update at the end, and not after every option
     * is set.
     */
    setOptions(options: Partial<CodeMirrorEditor.IConfig>): void;
    /**
     * Returns the content for the given line number.
     */
    getLine(line: number): string | undefined;
    /**
     * Find an offset for the given position.
     */
    getOffsetAt(position: CodeEditor.IPosition): number;
    /**
     * Find a position for the given offset.
     */
    getPositionAt(offset: number): CodeEditor.IPosition;
    /**
     * Undo one edit (if any undo events are stored).
     */
    undo(): void;
    /**
     * Redo one undone edit.
     */
    redo(): void;
    /**
     * Clear the undo history.
     */
    clearHistory(): void;
    /**
     * Brings browser focus to this editor text.
     */
    focus(): void;
    /**
     * Test whether the editor has keyboard focus.
     */
    hasFocus(): boolean;
    /**
     * Explicitly blur the editor.
     */
    blur(): void;
    /**
     * Repaint editor.
     */
    refresh(): void;
    /**
     * Refresh the editor if it is focused;
     * otherwise postpone refreshing till focusing.
     */
    resizeToFit(): void;
    addOverlay(mode: string | object, options?: object): void;
    removeOverlay(mode: string | object): void;
    getSearchCursor(query: string | RegExp, start?: CodeMirror.Position, caseFold?: boolean): CodeMirror.SearchCursor;
    getCursor(start?: string): CodeMirror.Position;
    get state(): any;
    operation<T>(fn: () => T): T;
    firstLine(): number;
    lastLine(): number;
    scrollIntoView(pos: {
        from: CodeMirror.Position;
        to: CodeMirror.Position;
    }, margin: number): void;
    scrollIntoViewCentered(pos: CodeMirror.Position): void;
    cursorCoords(where: boolean, mode?: 'window' | 'page' | 'local'): {
        left: number;
        top: number;
        bottom: number;
    };
    getRange(from: CodeMirror.Position, to: CodeMirror.Position, separator?: string): string;
    /**
     * Add a keydown handler to the editor.
     *
     * @param handler - A keydown handler.
     *
     * @returns A disposable that can be used to remove the handler.
     */
    addKeydownHandler(handler: CodeEditor.KeydownHandler): IDisposable;
    /**
     * Set the size of the editor in pixels.
     */
    setSize(dimension: CodeEditor.IDimension | null): void;
    /**
     * Reveal the given position in the editor.
     */
    revealPosition(position: CodeEditor.IPosition): void;
    /**
     * Reveal the given selection in the editor.
     */
    revealSelection(selection: CodeEditor.IRange): void;
    /**
     * Get the window coordinates given a cursor position.
     */
    getCoordinateForPosition(position: CodeEditor.IPosition): CodeEditor.ICoordinate;
    /**
     * Get the cursor position given window coordinates.
     *
     * @param coordinate - The desired coordinate.
     *
     * @returns The position of the coordinates, or null if not
     *   contained in the editor.
     */
    getPositionForCoordinate(coordinate: CodeEditor.ICoordinate): CodeEditor.IPosition | null;
    /**
     * Returns the primary position of the cursor, never `null`.
     */
    getCursorPosition(): CodeEditor.IPosition;
    /**
     * Set the primary position of the cursor.
     *
     * #### Notes
     * This will remove any secondary cursors.
     */
    setCursorPosition(position: CodeEditor.IPosition, options?: {
        bias?: number;
        origin?: string;
        scroll?: boolean;
    }): void;
    /**
     * Returns the primary selection, never `null`.
     */
    getSelection(): CodeEditor.ITextSelection;
    /**
     * Set the primary selection. This will remove any secondary cursors.
     */
    setSelection(selection: CodeEditor.IRange): void;
    /**
     * Gets the selections for all the cursors, never `null` or empty.
     */
    getSelections(): CodeEditor.ITextSelection[];
    /**
     * Sets the selections for all the cursors, should not be empty.
     * Cursors will be removed or added, as necessary.
     * Passing an empty array resets a cursor position to the start of a document.
     */
    setSelections(selections: CodeEditor.IRange[]): void;
    /**
     * Replaces the current selection with the given text.
     *
     * @param text The text to be inserted.
     */
    replaceSelection(text: string): void;
    /**
     * Get a list of tokens for the current editor text content.
     */
    getTokens(): CodeEditor.IToken[];
    /**
     * Get the token at a given editor position.
     */
    getTokenForPosition(position: CodeEditor.IPosition): CodeEditor.IToken;
    /**
     * Insert a new indented line at the current cursor position.
     */
    newIndentedLine(): void;
    /**
     * Execute a codemirror command on the editor.
     *
     * @param command - The name of the command to execute.
     */
    execCommand(command: string): void;
    /**
     * Handle keydown events from the editor.
     */
    protected onKeydown(event: KeyboardEvent): boolean;
    /**
     * Converts selections to code mirror selections.
     */
    private _toCodeMirrorSelections;
    /**
     * Handles a mime type change.
     */
    private _onMimeTypeChanged;
    /**
     * Handles a selections change.
     */
    private _onSelectionsChanged;
    /**
     * Clean selections for the given uuid.
     */
    private _cleanSelections;
    /**
     * Marks selections.
     */
    private _markSelections;
    /**
     * Handles a cursor activity event.
     */
    private _onCursorActivity;
    /**
     * Converts a code mirror selection to an editor selection.
     */
    private _toSelection;
    /**
     * Converts the selection style to a text marker options.
     */
    private _toTextMarkerOptions;
    /**
     * Converts an editor selection to a code mirror selection.
     */
    private _toCodeMirrorSelection;
    /**
     * Convert a code mirror position to an editor position.
     */
    private _toPosition;
    /**
     * Convert an editor position to a code mirror position.
     */
    private _toCodeMirrorPosition;
    /**
     * Handle model value changes.
     */
    private _onValueChanged;
    /**
     * Handles document changes.
     */
    private _beforeDocChanged;
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
    handleEvent(event: Event): void;
    /**
     * Handle `focus` events for the editor.
     */
    private _evtFocus;
    /**
     * Handle `blur` events for the editor.
     */
    private _evtBlur;
    /**
     * Handle `scroll` events for the editor.
     */
    private _evtScroll;
    /**
     * Clear the hover for a caret, due to things like
     * scrolling, resizing, deactivation, etc, where
     * the position is no longer valid.
     */
    private _clearHover;
    /**
     * Construct a caret element representing the position
     * of a collaborator's cursor.
     */
    private _getCaret;
    /**
     * Check for an out of sync editor.
     */
    private _checkSync;
    protected translator: ITranslator;
    private _trans;
    private _model;
    private _editor;
    protected selectionMarkers: {
        [key: string]: CodeMirror.TextMarker[] | undefined;
    };
    private _caretHover;
    private readonly _config;
    private _hoverTimeout;
    private _hoverId;
    private _keydownHandlers;
    private _changeGuard;
    private _selectionStyle;
    private _uuid;
    private _needsRefresh;
    private _isDisposed;
    private _lastChange;
    private _poll;
    private _yeditorBinding;
}
/**
 * The namespace for `CodeMirrorEditor` statics.
 */
export declare namespace CodeMirrorEditor {
    /**
     * The options used to initialize a code mirror editor.
     */
    interface IOptions extends CodeEditor.IOptions {
        /**
         * The configuration options for the editor.
         */
        config?: Partial<IConfig>;
    }
    /**
     * The configuration options for a codemirror editor.
     */
    interface IConfig extends CodeEditor.IConfig {
        /**
         * The mode to use.
         */
        mode?: string | Mode.IMode;
        /**
         * The theme to style the editor with.
         * You must make sure the CSS file defining the corresponding
         * .cm-s-[name] styles is loaded.
         */
        theme?: string;
        /**
         * Whether to use the context-sensitive indentation that the mode provides
         * (or just indent the same as the line before).
         */
        smartIndent?: boolean;
        /**
         * Configures whether the editor should re-indent the current line when a
         * character is typed that might change its proper indentation
         * (only works if the mode supports indentation).
         */
        electricChars?: boolean;
        /**
         * Configures the keymap to use. The default is "default", which is the
         * only keymap defined in codemirror.js itself.
         * Extra keymaps are found in the CodeMirror keymap directory.
         */
        keyMap?: string;
        /**
         * Can be used to specify extra keybindings for the editor, alongside the
         * ones defined by keyMap. Should be either null, or a valid keymap value.
         */
        extraKeys?: CodeMirror.KeyMap | null;
        /**
         * Can be used to add extra gutters (beyond or instead of the line number
         * gutter).
         * Should be an array of CSS class names, each of which defines a width
         * (and optionally a background),
         * and which will be used to draw the background of the gutters.
         * May include the CodeMirror-linenumbers class, in order to explicitly
         * set the position of the line number gutter
         * (it will default to be to the right of all other gutters).
         * These class names are the keys passed to setGutterMarker.
         */
        gutters?: string[];
        /**
         * Determines whether the gutter scrolls along with the content
         * horizontally (false)
         * or whether it stays fixed during horizontal scrolling (true,
         * the default).
         */
        fixedGutter?: boolean;
        /**
         * Whether the folding gutter should be drawn
         */
        foldGutter?: boolean;
        /**
         * Whether the cursor should be drawn when a selection is active.
         */
        showCursorWhenSelecting?: boolean;
        /**
         * When fixedGutter is on, and there is a horizontal scrollbar, by default
         * the gutter will be visible to the left of this scrollbar. If this
         * option is set to true, it will be covered by an element with class
         * CodeMirror-gutter-filler.
         */
        coverGutterNextToScrollbar?: boolean;
        /**
         * Controls whether drag-and-drop is enabled.
         */
        dragDrop?: boolean;
        /**
         * Explicitly set the line separator for the editor.
         * By default (value null), the document will be split on CRLFs as well as
         * lone CRs and LFs, and a single LF will be used as line separator in all
         * output (such as getValue). When a specific string is given, lines will
         * only be split on that string, and output will, by default, use that
         * same separator.
         */
        lineSeparator?: string | null;
        /**
         * Chooses a scrollbar implementation. The default is "native", showing
         * native scrollbars. The core library also provides the "null" style,
         * which completely hides the scrollbars. Addons can implement additional
         * scrollbar models.
         */
        scrollbarStyle?: string;
        /**
         * When enabled, which is the default, doing copy or cut when there is no
         * selection will copy or cut the whole lines that have cursors on them.
         */
        lineWiseCopyCut?: boolean;
        /**
         * Whether to scroll past the end of the buffer.
         */
        scrollPastEnd?: boolean;
        /**
         * Whether to give the wrapper of the line that contains the cursor the class
         * CodeMirror-activeline, adds a background with the class
         * CodeMirror-activeline-background, and adds the class
         * CodeMirror-activeline-gutter to the line's gutter space is enabled.
         */
        styleActiveLine: boolean | CodeMirror.StyleActiveLine;
        /**
         * Whether to causes the selected text to be marked with the CSS class
         * CodeMirror-selectedtext. Useful to change the colour of the selection
         * (in addition to the background).
         */
        styleSelectedText: boolean;
        /**
         * Defines the mouse cursor appearance when hovering over the selection.
         * It can be set to a string, like "pointer", or to true,
         * in which case the "default" (arrow) cursor will be used.
         */
        selectionPointer: boolean | string;
    }
    /**
     * The default configuration options for an editor.
     */
    const defaultConfig: Required<IConfig>;
    /**
     * Add a command to CodeMirror.
     *
     * @param name - The name of the command to add.
     *
     * @param command - The command function.
     */
    function addCommand(name: string, command: (cm: CodeMirror.Editor) => void): void;
}
