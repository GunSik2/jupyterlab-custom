// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { nullTranslator } from '@jupyterlab/translation';
import { caretDownEmptyThinIcon, caretDownIcon, caretRightIcon, caretUpEmptyThinIcon, caseSensitiveIcon, classes, closeIcon, ellipsesIcon, regexIcon, VDomRenderer } from '@jupyterlab/ui-components';
import { Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import * as React from 'react';
const OVERLAY_CLASS = 'jp-DocumentSearch-overlay';
const OVERLAY_ROW_CLASS = 'jp-DocumentSearch-overlay-row';
const INPUT_CLASS = 'jp-DocumentSearch-input';
const INPUT_WRAPPER_CLASS = 'jp-DocumentSearch-input-wrapper';
const INPUT_BUTTON_CLASS_OFF = 'jp-DocumentSearch-input-button-off';
const INPUT_BUTTON_CLASS_ON = 'jp-DocumentSearch-input-button-on';
const INDEX_COUNTER_CLASS = 'jp-DocumentSearch-index-counter';
const UP_DOWN_BUTTON_WRAPPER_CLASS = 'jp-DocumentSearch-up-down-wrapper';
const UP_DOWN_BUTTON_CLASS = 'jp-DocumentSearch-up-down-button';
const ELLIPSES_BUTTON_CLASS = 'jp-DocumentSearch-ellipses-button';
const ELLIPSES_BUTTON_ENABLED_CLASS = 'jp-DocumentSearch-ellipses-button-enabled';
const REGEX_ERROR_CLASS = 'jp-DocumentSearch-regex-error';
const SEARCH_OPTIONS_CLASS = 'jp-DocumentSearch-search-options';
const SEARCH_OPTIONS_DISABLED_CLASS = 'jp-DocumentSearch-search-options-disabled';
const SEARCH_DOCUMENT_LOADING = 'jp-DocumentSearch-document-loading';
const REPLACE_ENTRY_CLASS = 'jp-DocumentSearch-replace-entry';
const REPLACE_BUTTON_CLASS = 'jp-DocumentSearch-replace-button';
const REPLACE_BUTTON_WRAPPER_CLASS = 'jp-DocumentSearch-replace-button-wrapper';
const REPLACE_WRAPPER_CLASS = 'jp-DocumentSearch-replace-wrapper-class';
const REPLACE_TOGGLE_CLASS = 'jp-DocumentSearch-replace-toggle';
const TOGGLE_WRAPPER = 'jp-DocumentSearch-toggle-wrapper';
const TOGGLE_PLACEHOLDER = 'jp-DocumentSearch-toggle-placeholder';
const BUTTON_CONTENT_CLASS = 'jp-DocumentSearch-button-content';
const BUTTON_WRAPPER_CLASS = 'jp-DocumentSearch-button-wrapper';
const SPACER_CLASS = 'jp-DocumentSearch-spacer';
function SearchEntry(props) {
    var _a;
    const trans = ((_a = props.translator) !== null && _a !== void 0 ? _a : nullTranslator).load('jupyterlab');
    const caseButtonToggleClass = classes(props.caseSensitive ? INPUT_BUTTON_CLASS_ON : INPUT_BUTTON_CLASS_OFF, BUTTON_CONTENT_CLASS);
    const regexButtonToggleClass = classes(props.useRegex ? INPUT_BUTTON_CLASS_ON : INPUT_BUTTON_CLASS_OFF, BUTTON_CONTENT_CLASS);
    const wrapperClass = INPUT_WRAPPER_CLASS;
    return (React.createElement("div", { className: wrapperClass },
        React.createElement("input", { placeholder: trans.__('Find'), className: INPUT_CLASS, value: props.searchText, onChange: e => props.onChange(e), onKeyDown: e => props.onKeydown(e), tabIndex: 0, ref: props.inputRef, title: trans.__('Find') }),
        React.createElement("button", { className: BUTTON_WRAPPER_CLASS, onClick: () => {
                props.onCaseSensitiveToggled();
            }, tabIndex: 0, title: trans.__('Match Case') },
            React.createElement(caseSensitiveIcon.react, { className: caseButtonToggleClass, tag: "span" })),
        React.createElement("button", { className: BUTTON_WRAPPER_CLASS, onClick: () => props.onRegexToggled(), tabIndex: 0, title: trans.__('Use Regular Expression') },
            React.createElement(regexIcon.react, { className: regexButtonToggleClass, tag: "span" }))));
}
function ReplaceEntry(props) {
    var _a;
    const trans = ((_a = props.translator) !== null && _a !== void 0 ? _a : nullTranslator).load('jupyterlab');
    return (React.createElement("div", { className: REPLACE_WRAPPER_CLASS },
        React.createElement("input", { placeholder: trans.__('Replace'), className: REPLACE_ENTRY_CLASS, value: props.replaceText, onKeyDown: e => props.onReplaceKeydown(e), onChange: e => props.onChange(e), tabIndex: 0, title: trans.__('Replace') }),
        React.createElement("button", { className: REPLACE_BUTTON_WRAPPER_CLASS, onClick: () => props.onReplaceCurrent(), tabIndex: 0 },
            React.createElement("span", { className: `${REPLACE_BUTTON_CLASS} ${BUTTON_CONTENT_CLASS}`, tabIndex: 0 }, trans.__('Replace'))),
        React.createElement("button", { className: REPLACE_BUTTON_WRAPPER_CLASS, tabIndex: 0, onClick: () => props.onReplaceAll() },
            React.createElement("span", { className: `${REPLACE_BUTTON_CLASS} ${BUTTON_CONTENT_CLASS}`, tabIndex: -1 }, trans.__('Replace All')))));
}
function UpDownButtons(props) {
    return (React.createElement("div", { className: UP_DOWN_BUTTON_WRAPPER_CLASS },
        React.createElement("button", { className: BUTTON_WRAPPER_CLASS, onClick: () => props.onHighlightPrevious(), tabIndex: 0, title: props.trans.__('Previous Match') },
            React.createElement(caretUpEmptyThinIcon.react, { className: classes(UP_DOWN_BUTTON_CLASS, BUTTON_CONTENT_CLASS), tag: "span" })),
        React.createElement("button", { className: BUTTON_WRAPPER_CLASS, onClick: () => props.onHighlightNext(), tabIndex: 0, title: props.trans.__('Next Match') },
            React.createElement(caretDownEmptyThinIcon.react, { className: classes(UP_DOWN_BUTTON_CLASS, BUTTON_CONTENT_CLASS), tag: "span" }))));
}
function SearchIndices(props) {
    return (React.createElement("div", { className: INDEX_COUNTER_CLASS }, props.totalMatches === 0
        ? '-/-'
        : `${props.currentIndex === null ? '-' : props.currentIndex + 1}/${props.totalMatches}`));
}
function FilterToggle(props) {
    let className = `${ELLIPSES_BUTTON_CLASS} ${BUTTON_CONTENT_CLASS}`;
    if (props.enabled) {
        className = `${className} ${ELLIPSES_BUTTON_ENABLED_CLASS}`;
    }
    return (React.createElement("button", { className: BUTTON_WRAPPER_CLASS, onClick: () => props.toggleEnabled(), tabIndex: 0, title: props.enabled
            ? props.trans.__('Hide Search Filters')
            : props.trans.__('Show Search Filters') },
        React.createElement(ellipsesIcon.react, { className: className, tag: "span", height: "20px", width: "20px" })));
}
function FilterSelection(props) {
    return (React.createElement("label", { className: props.isEnabled ? '' : SEARCH_OPTIONS_DISABLED_CLASS, title: props.description },
        props.title,
        React.createElement("input", { type: "checkbox", disabled: !props.isEnabled, checked: props.value, onChange: props.onToggle })));
}
class SearchOverlay extends React.Component {
    constructor(props) {
        super(props);
        this.translator = props.translator || nullTranslator;
        this.state = {
            filtersOpen: false
        };
    }
    _onSearchChange(event) {
        const searchText = event.target.value;
        this.props.onSearchChanged(searchText);
    }
    _onSearchKeydown(event) {
        if (event.keyCode === 13) {
            // Enter pressed
            event.preventDefault();
            event.stopPropagation();
            event.shiftKey
                ? this.props.onHighlightPrevious()
                : this.props.onHighlightNext();
        }
        else if (event.keyCode === 27) {
            // Escape pressed
            event.preventDefault();
            event.stopPropagation();
            this._onClose();
        }
    }
    _onReplaceKeydown(event) {
        if (event.keyCode === 13) {
            // Enter pressed
            event.preventDefault();
            event.stopPropagation();
            this.props.onReplaceCurrent();
        }
    }
    _onClose() {
        // Clean up and close widget.
        this.props.onClose();
    }
    _onReplaceToggled() {
        // Deactivate invalid replace filters
        const filters = Object.assign({}, this.props.filters);
        if (!this.props.replaceEntryVisible) {
            for (const key in this.props.filtersDefinition) {
                const filter = this.props.filtersDefinition[key];
                if (!filter.supportReplace) {
                    filters[key] = false;
                }
            }
        }
        this.props.onFiltersChanged(filters);
        this.props.onReplaceEntryShown(!this.props.replaceEntryVisible);
    }
    _toggleFiltersOpen() {
        this.setState(prevState => ({
            filtersOpen: !prevState.filtersOpen
        }));
    }
    render() {
        var _a;
        const trans = this.translator.load('jupyterlab');
        const showReplace = !this.props.isReadOnly && this.props.replaceEntryVisible;
        const filters = this.props.filtersDefinition;
        const hasFilters = Object.keys(filters).length > 0;
        const filterToggle = hasFilters ? (React.createElement(FilterToggle, { enabled: this.state.filtersOpen, toggleEnabled: () => this._toggleFiltersOpen(), trans: trans })) : null;
        const filter = hasFilters ? (React.createElement("div", { className: SEARCH_OPTIONS_CLASS }, Object.keys(filters).map(name => {
            var _a;
            const filter = filters[name];
            return (React.createElement(FilterSelection, { key: name, title: filter.title, description: filter.description, isEnabled: !showReplace || filter.supportReplace, onToggle: () => {
                    const newFilter = {};
                    newFilter[name] = !this.props.filters[name];
                    this.props.onFiltersChanged(newFilter);
                }, value: (_a = this.props.filters[name]) !== null && _a !== void 0 ? _a : filter.default }));
        }))) : null;
        const icon = this.props.replaceEntryVisible
            ? caretDownIcon
            : caretRightIcon;
        // TODO: Error messages from regex are not currently localizable.
        return (React.createElement(React.Fragment, null,
            React.createElement("div", { className: OVERLAY_ROW_CLASS },
                this.props.isReadOnly ? (React.createElement("div", { className: TOGGLE_PLACEHOLDER })) : (React.createElement("button", { className: TOGGLE_WRAPPER, onClick: () => this._onReplaceToggled(), tabIndex: 0, title: trans.__('Toggle Replace') },
                    React.createElement(icon.react, { className: `${REPLACE_TOGGLE_CLASS} ${BUTTON_CONTENT_CLASS}`, tag: "span", elementPosition: "center", height: "20px", width: "20px" }))),
                React.createElement(SearchEntry, { inputRef: this.props.searchInputRef, useRegex: this.props.useRegex, caseSensitive: this.props.caseSensitive, onCaseSensitiveToggled: this.props.onCaseSensitiveToggled, onRegexToggled: this.props.onRegexToggled, onKeydown: (e) => this._onSearchKeydown(e), onChange: (e) => this._onSearchChange(e), searchText: this.props.searchText, translator: this.translator }),
                React.createElement(SearchIndices, { currentIndex: this.props.currentIndex, totalMatches: (_a = this.props.totalMatches) !== null && _a !== void 0 ? _a : 0 }),
                React.createElement(UpDownButtons, { onHighlightPrevious: () => {
                        this.props.onHighlightPrevious();
                    }, onHighlightNext: () => {
                        this.props.onHighlightNext();
                    }, trans: trans }),
                showReplace ? null : filterToggle,
                React.createElement("button", { className: BUTTON_WRAPPER_CLASS, onClick: () => this._onClose(), tabIndex: 0 },
                    React.createElement(closeIcon.react, { className: "jp-icon-hover", elementPosition: "center", height: "16px", width: "16px" }))),
            React.createElement("div", { className: OVERLAY_ROW_CLASS }, showReplace ? (React.createElement(React.Fragment, null,
                React.createElement(ReplaceEntry, { onReplaceKeydown: (e) => this._onReplaceKeydown(e), onChange: (e) => this.props.onReplaceChanged(e.target.value), onReplaceCurrent: () => this.props.onReplaceCurrent(), onReplaceAll: () => this.props.onReplaceAll(), replaceText: this.props.replaceText, translator: this.translator }),
                React.createElement("div", { className: SPACER_CLASS }),
                filterToggle)) : null),
            this.state.filtersOpen ? filter : null,
            !!this.props.errorMessage && (React.createElement("div", { className: REGEX_ERROR_CLASS }, this.props.errorMessage)),
            React.createElement("div", { className: SEARCH_DOCUMENT_LOADING }, trans.__('This document is still loading. Only loaded content will appear in search results until the entire document loads.'))));
    }
}
/**
 * Search document widget
 */
export class SearchDocumentView extends VDomRenderer {
    /**
     * Search document widget constructor.
     *
     * @param model Search document model
     * @param translator Application translator object
     */
    constructor(model, translator) {
        super(model);
        this.translator = translator;
        this._showReplace = false;
        this._closed = new Signal(this);
        this.addClass(OVERLAY_CLASS);
        this._searchInput = React.createRef();
    }
    /**
     * A signal emitted when the widget is closed.
     *
     * Closing the widget detached it from the DOM but does not dispose it.
     */
    get closed() {
        return this._closed;
    }
    /**
     * Focus search input.
     */
    focusSearchInput() {
        var _a;
        (_a = this._searchInput.current) === null || _a === void 0 ? void 0 : _a.select();
    }
    /**
     * Set the search text
     *
     * It does not trigger a view update.
     */
    setSearchText(search) {
        this.model.searchExpression = search;
    }
    /**
     * Set the replace text
     *
     * It does not trigger a view update.
     */
    setReplaceText(replace) {
        this.model.replaceText = replace;
    }
    /**
     * Show the replacement input box.
     */
    showReplace() {
        this.setReplaceInputVisibility(true);
    }
    setReplaceInputVisibility(v) {
        if (this._showReplace !== v) {
            this._showReplace = v;
            this.update();
        }
    }
    render() {
        return (React.createElement(SearchOverlay, { caseSensitive: this.model.caseSensitive, currentIndex: this.model.currentIndex, isReadOnly: this.model.isReadOnly, errorMessage: this.model.parsingError, filters: this.model.filters, filtersDefinition: this.model.filtersDefinition, replaceEntryVisible: this._showReplace, replaceText: this.model.replaceText, searchText: this.model.searchExpression, searchInputRef: this._searchInput, totalMatches: this.model.totalMatches, translator: this.translator, useRegex: this.model.useRegex, onCaseSensitiveToggled: () => {
                this.model.caseSensitive = !this.model.caseSensitive;
            }, onRegexToggled: () => {
                this.model.useRegex = !this.model.useRegex;
            }, onFiltersChanged: (filters) => {
                this.model.filters = Object.assign(Object.assign({}, this.model.filters), filters);
            }, onHighlightNext: () => {
                this.model.highlightNext();
            }, onHighlightPrevious: () => {
                this.model.highlightPrevious();
            }, onSearchChanged: (q) => {
                this.model.searchExpression = q;
            }, onClose: async () => {
                Widget.detach(this);
                this._closed.emit();
                await this.model.endQuery();
            }, onReplaceEntryShown: (v) => {
                this.setReplaceInputVisibility(v);
            }, onReplaceChanged: (q) => {
                this.model.replaceText = q;
            }, onReplaceCurrent: () => {
                this.model.replaceCurrentMatch();
            }, onReplaceAll: () => {
                this.model.replaceAllMatches();
            } }));
    }
}
//# sourceMappingURL=searchview.js.map