// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { iter, map, StringExt, toArray } from '@lumino/algorithm';
import { JSONExt } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';
/**
 * An implementation of a completer model.
 */
export class CompleterModel {
    constructor() {
        this._current = null;
        this._cursor = null;
        this._isDisposed = false;
        this._completionItems = [];
        this._options = [];
        this._original = null;
        this._query = '';
        this._subsetMatch = false;
        this._typeMap = {};
        this._orderedTypes = [];
        this._stateChanged = new Signal(this);
    }
    /**
     * A signal emitted when state of the completer menu changes.
     */
    get stateChanged() {
        return this._stateChanged;
    }
    /**
     * The original completion request details.
     */
    get original() {
        return this._original;
    }
    set original(newValue) {
        const unchanged = this._original === newValue ||
            (this._original &&
                newValue &&
                JSONExt.deepEqual(newValue, this._original));
        if (unchanged) {
            return;
        }
        this._reset();
        // Set both the current and original to the same value when original is set.
        this._current = this._original = newValue;
        this._stateChanged.emit(undefined);
    }
    /**
     * The current text change details.
     */
    get current() {
        return this._current;
    }
    set current(newValue) {
        const unchanged = this._current === newValue ||
            (this._current && newValue && JSONExt.deepEqual(newValue, this._current));
        if (unchanged) {
            return;
        }
        const original = this._original;
        // Original request must always be set before a text change. If it isn't
        // the model fails silently.
        if (!original) {
            return;
        }
        const cursor = this._cursor;
        // Cursor must always be set before a text change. This happens
        // automatically in the completer handler, but since `current` is a public
        // attribute, this defensive check is necessary.
        if (!cursor) {
            return;
        }
        const current = (this._current = newValue);
        if (!current) {
            this._stateChanged.emit(undefined);
            return;
        }
        const originalLine = original.text.split('\n')[original.line];
        const currentLine = current.text.split('\n')[current.line];
        // If the text change means that the original start point has been preceded,
        // then the completion is no longer valid and should be reset.
        if (!this._subsetMatch && currentLine.length < originalLine.length) {
            this.reset(true);
            return;
        }
        const { start, end } = cursor;
        // Clip the front of the current line.
        let query = current.text.substring(start);
        // Clip the back of the current line by calculating the end of the original.
        const ending = original.text.substring(end);
        query = query.substring(0, query.lastIndexOf(ending));
        this._query = query;
        this._stateChanged.emit(undefined);
    }
    /**
     * The cursor details that the API has used to return matching options.
     */
    get cursor() {
        return this._cursor;
    }
    set cursor(newValue) {
        // Original request must always be set before a cursor change. If it isn't
        // the model fails silently.
        if (!this.original) {
            return;
        }
        this._cursor = newValue;
    }
    /**
     * The query against which items are filtered.
     */
    get query() {
        return this._query;
    }
    set query(newValue) {
        this._query = newValue;
    }
    /**
     * A flag that is true when the model value was modified by a subset match.
     */
    get subsetMatch() {
        return this._subsetMatch;
    }
    set subsetMatch(newValue) {
        this._subsetMatch = newValue;
    }
    /**
     * Get whether the model is disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Dispose of the resources held by the model.
     */
    dispose() {
        // Do nothing if already disposed.
        if (this._isDisposed) {
            return;
        }
        this._isDisposed = true;
        Signal.clearData(this);
    }
    /**
     * The list of visible items in the completer menu.
     *
     * #### Notes
     * This is a read-only property.
     */
    completionItems() {
        let query = this._query;
        if (query) {
            return this._markup(query);
        }
        return this._completionItems;
    }
    /**
     * Set the list of visible items in the completer menu, and append any
     * new types to KNOWN_TYPES.
     */
    setCompletionItems(newValue) {
        if (JSONExt.deepEqual(newValue, this._completionItems)) {
            return;
        }
        this._completionItems = newValue;
        this._orderedTypes = Private.findOrderedCompletionItemTypes(this._completionItems);
        this._stateChanged.emit(undefined);
    }
    /**
     * The list of visible items in the completer menu.
     * @deprecated use `completionItems` instead
     *
     * #### Notes
     * This is a read-only property.
     */
    items() {
        return this._filter();
    }
    /**
     * The unfiltered list of all available options in a completer menu.
     */
    options() {
        return iter(this._options);
    }
    /**
     * The map from identifiers (a.b) to types (function, module, class, instance,
     * etc.).
     *
     * #### Notes
     * A type map is currently only provided by the latest IPython kernel using
     * the completer reply metadata field `_jupyter_types_experimental`. The
     * values are completely up to the kernel.
     *
     */
    typeMap() {
        return this._typeMap;
    }
    /**
     * An ordered list of all the known types in the typeMap.
     *
     * #### Notes
     * To visually encode the types of the completer matches, we assemble an
     * ordered list. This list begins with:
     * ```
     * ['function', 'instance', 'class', 'module', 'keyword']
     * ```
     * and then has any remaining types listed alphabetically. This will give
     * reliable visual encoding for these known types, but allow kernels to
     * provide new types.
     */
    orderedTypes() {
        return this._orderedTypes;
    }
    /**
     * Set the available options in the completer menu.
     */
    setOptions(newValue, typeMap) {
        const values = toArray(newValue || []);
        const types = typeMap || {};
        if (JSONExt.deepEqual(values, this._options) &&
            JSONExt.deepEqual(types, this._typeMap)) {
            return;
        }
        if (values.length) {
            this._options = values;
            this._typeMap = types;
            this._orderedTypes = Private.findOrderedTypes(types);
        }
        else {
            this._options = [];
            this._typeMap = {};
            this._orderedTypes = [];
        }
        this._stateChanged.emit(undefined);
    }
    /**
     * Handle a cursor change.
     */
    handleCursorChange(change) {
        // If there is no active completion, return.
        if (!this._original) {
            return;
        }
        const { column, line } = change;
        const { current, original } = this;
        if (!original) {
            return;
        }
        // If a cursor change results in a the cursor being on a different line
        // than the original request, cancel.
        if (line !== original.line) {
            this.reset(true);
            return;
        }
        // If a cursor change results in the cursor being set to a position that
        // precedes the original column, cancel.
        if (column < original.column) {
            this.reset(true);
            return;
        }
        const { cursor } = this;
        if (!cursor || !current) {
            return;
        }
        // If a cursor change results in the cursor being set to a position beyond
        // the end of the area that would be affected by completion, cancel.
        const cursorDelta = cursor.end - cursor.start;
        const originalLine = original.text.split('\n')[original.line];
        const currentLine = current.text.split('\n')[current.line];
        const inputDelta = currentLine.length - originalLine.length;
        if (column > original.column + cursorDelta + inputDelta) {
            this.reset(true);
            return;
        }
    }
    /**
     * Handle a text change.
     */
    handleTextChange(change) {
        const original = this._original;
        // If there is no active completion, return.
        if (!original) {
            return;
        }
        const { text, column, line } = change;
        const last = text.split('\n')[line][column - 1];
        // If last character entered is not whitespace or if the change column is
        // greater than or equal to the original column, update completion.
        if ((last && last.match(/\S/)) || change.column >= original.column) {
            this.current = change;
            return;
        }
        // If final character is whitespace, reset completion.
        this.reset(false);
    }
    /**
     * Create a resolved patch between the original state and a patch string.
     *
     * @param patch - The patch string to apply to the original value.
     *
     * @returns A patched text change or undefined if original value did not exist.
     */
    createPatch(patch) {
        const original = this._original;
        const cursor = this._cursor;
        const current = this._current;
        if (!original || !cursor || !current) {
            return undefined;
        }
        let { start, end } = cursor;
        // Also include any filtering/additional-typing that has occurred
        // since the completion request in the patched length.
        end = end + (current.text.length - original.text.length);
        return { start, end, value: patch };
    }
    /**
     * Reset the state of the model and emit a state change signal.
     *
     * @param hard - Reset even if a subset match is in progress.
     */
    reset(hard = false) {
        // When the completer detects a common subset prefix for all options,
        // it updates the model and sets the model source to that value, triggering
        // a reset. Unless explicitly a hard reset, this should be ignored.
        if (!hard && this._subsetMatch) {
            return;
        }
        this._reset();
        this._stateChanged.emit(undefined);
    }
    /**
     * Check if CompletionItem matches against query.
     * Highlight matching prefix by adding <mark> tags.
     */
    _markup(query) {
        const items = this._completionItems;
        let results = [];
        for (let item of items) {
            // See if label matches query string
            // With ICompletionItems, the label may include parameters, so we exclude them from the matcher.
            // e.g. Given label `foo(b, a, r)` and query `bar`,
            // don't count parameters, `b`, `a`, and `r` as matches.
            const index = item.label.indexOf('(');
            const prefix = index > -1 ? item.label.substring(0, index) : item.label;
            let match = StringExt.matchSumOfSquares(prefix, query);
            // Filter non-matching items.
            if (match) {
                // Highlight label text if there's a match
                let marked = StringExt.highlight(item.label, match.indices, Private.mark);
                results.push(Object.assign(Object.assign({}, item), { 
                    // Allow for lazily retrieved documentation (with a getter)
                    documentation: item.documentation, label: marked.join(''), 
                    // If no insertText is present, preserve original label value
                    // by setting it as the insertText.
                    insertText: item.insertText ? item.insertText : item.label, score: match.score }));
            }
        }
        results.sort(Private.scoreCmp2);
        // Delete the extra score attribute to not leak implementation details
        // to JavaScript callers.
        results.forEach(x => {
            delete x.score;
        });
        return results;
    }
    /**
     * Apply the query to the complete options list to return the matching subset.
     */
    _filter() {
        const options = this._options || [];
        const query = this._query;
        if (!query) {
            return map(options, option => ({ raw: option, text: option }));
        }
        const results = [];
        for (const option of options) {
            const match = StringExt.matchSumOfSquares(option, query);
            if (match) {
                const marked = StringExt.highlight(option, match.indices, Private.mark);
                results.push({
                    raw: option,
                    score: match.score,
                    text: marked.join('')
                });
            }
        }
        return map(results.sort(Private.scoreCmp), result => ({
            text: result.text,
            raw: result.raw
        }));
    }
    /**
     * Reset the state of the model.
     */
    _reset() {
        this._current = null;
        this._cursor = null;
        this._completionItems = [];
        this._options = [];
        this._original = null;
        this._query = '';
        this._subsetMatch = false;
        this._typeMap = {};
        this._orderedTypes = [];
    }
}
/**
 * A namespace for completer model private data.
 */
var Private;
(function (Private) {
    /**
     * The list of known type annotations of completer matches.
     */
    const KNOWN_TYPES = ['function', 'instance', 'class', 'module', 'keyword'];
    /**
     * The map of known type annotations of completer matches.
     */
    const KNOWN_MAP = KNOWN_TYPES.reduce((acc, type) => {
        acc[type] = null;
        return acc;
    }, {});
    /**
     * Mark a highlighted chunk of text.
     */
    function mark(value) {
        return `<mark>${value}</mark>`;
    }
    Private.mark = mark;
    /**
     * A sort comparison function for item match scores.
     *
     * #### Notes
     * This orders the items first based on score (lower is better), then
     * by locale order of the item text.
     */
    function scoreCmp(a, b) {
        const delta = a.score - b.score;
        if (delta !== 0) {
            return delta;
        }
        return a.raw.localeCompare(b.raw);
    }
    Private.scoreCmp = scoreCmp;
    /**
     * A sort comparison function for item match scores.
     *
     * #### Notes
     * This orders the items first based on score (lower is better), then
     * by locale order of the item text.
     */
    function scoreCmp2(a, b) {
        var _a, _b, _c;
        const delta = a.score - b.score;
        if (delta !== 0) {
            return delta;
        }
        return (_c = (_a = a.insertText) === null || _a === void 0 ? void 0 : _a.localeCompare((_b = b.insertText) !== null && _b !== void 0 ? _b : '')) !== null && _c !== void 0 ? _c : 0;
    }
    Private.scoreCmp2 = scoreCmp2;
    /**
     * Compute a reliably ordered list of types for ICompletionItems.
     *
     * #### Notes
     * The resulting list always begins with the known types:
     * ```
     * ['function', 'instance', 'class', 'module', 'keyword']
     * ```
     * followed by other types in alphabetical order.
     *
     */
    function findOrderedCompletionItemTypes(items) {
        const newTypeSet = new Set();
        items.forEach(item => {
            if (item.type &&
                !KNOWN_TYPES.includes(item.type) &&
                !newTypeSet.has(item.type)) {
                newTypeSet.add(item.type);
            }
        });
        const newTypes = Array.from(newTypeSet);
        newTypes.sort((a, b) => a.localeCompare(b));
        return KNOWN_TYPES.concat(newTypes);
    }
    Private.findOrderedCompletionItemTypes = findOrderedCompletionItemTypes;
    /**
     * Compute a reliably ordered list of types.
     *
     * #### Notes
     * The resulting list always begins with the known types:
     * ```
     * ['function', 'instance', 'class', 'module', 'keyword']
     * ```
     * followed by other types in alphabetical order.
     */
    function findOrderedTypes(typeMap) {
        const filtered = Object.keys(typeMap)
            .map(key => typeMap[key])
            .filter((value) => !!value && !(value in KNOWN_MAP))
            .sort((a, b) => a.localeCompare(b));
        return KNOWN_TYPES.concat(filtered);
    }
    Private.findOrderedTypes = findOrderedTypes;
})(Private || (Private = {}));
//# sourceMappingURL=model.js.map