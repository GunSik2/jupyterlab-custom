import { ArrayExt, StringExt } from '@lumino/algorithm';
import { ShortcutUIStyle, TopWhitespaceStyle } from '../componentStyle/ShortcutUIStyle';
import { ShortcutList } from './ShortcutList';
import { TopNav } from './TopNav';
import * as React from 'react';
import { ErrorObject, ShortcutObject, TakenByObject } from './ShortcutInput';
/** Normalize the query text for a fuzzy search. */
function normalizeQuery(text) {
    return text.replace(/\s+/g, '').toLowerCase();
}
/** Perform a fuzzy search on a single command item. */
function fuzzySearch(item, query) {
    // Create the source text to be searched.
    const category = item.category.toLowerCase();
    const label = item['label'].toLowerCase();
    const source = `${category} ${label}`;
    // Set up the match score and indices array.
    let score = Infinity;
    let indices = null;
    // The regex for search word boundaries
    const rgx = /\b\w/g;
    // Search the source by word boundary.
    // eslint-disable-next-line
    while (true) {
        // Find the next word boundary in the source.
        const rgxMatch = rgx.exec(source);
        // Break if there is no more source context.
        if (!rgxMatch) {
            break;
        }
        // Run the string match on the relevant substring.
        const match = StringExt.matchSumOfDeltas(source, query, rgxMatch.index);
        // Break if there is no match.
        if (!match) {
            break;
        }
        // Update the match if the score is better.
        if (match && match.score <= score) {
            score = match.score;
            indices = match.indices;
        }
    }
    // Bail if there was no match.
    if (!indices || score === Infinity) {
        return null;
    }
    // Compute the pivot index between category and label text.
    const pivot = category.length + 1;
    // Find the slice index to separate matched indices.
    const j = ArrayExt.lowerBound(indices, pivot, (a, b) => a - b);
    // Extract the matched category and label indices.
    const categoryIndices = indices.slice(0, j);
    const labelIndices = indices.slice(j);
    // Adjust the label indices for the pivot offset.
    for (let i = 0, n = labelIndices.length; i < n; ++i) {
        labelIndices[i] -= pivot;
    }
    // Handle a pure label match.
    if (categoryIndices.length === 0) {
        return {
            matchType: 0 /* Label */,
            categoryIndices: null,
            labelIndices,
            score,
            item
        };
    }
    // Handle a pure category match.
    if (labelIndices.length === 0) {
        return {
            matchType: 1 /* Category */,
            categoryIndices,
            labelIndices: null,
            score,
            item
        };
    }
    // Handle a split match.
    return {
        matchType: 2 /* Split */,
        categoryIndices,
        labelIndices,
        score,
        item
    };
}
/** Perform a fuzzy match on an array of command items. */
function matchItems(items, query) {
    // Normalize the query text to lower case with no whitespace.
    query = normalizeQuery(query);
    // Create the array to hold the scores.
    let scores = [];
    // Iterate over the items and match against the query.
    let itemList = Object.keys(items);
    for (let i = 0, n = itemList.length; i < n; ++i) {
        let item = items[itemList[i]];
        // If the query is empty, all items are matched by default.
        if (!query) {
            scores.push({
                matchType: 3 /* Default */,
                categoryIndices: null,
                labelIndices: null,
                score: 0,
                item
            });
            continue;
        }
        // Run the fuzzy search for the item and query.
        let score = fuzzySearch(item, query);
        // Ignore the item if it is not a match.
        if (!score) {
            continue;
        }
        // Add the score to the results.
        scores.push(score);
    }
    // Return the final array of scores.
    return scores;
}
/** Transform SettingRegistry's shortcut list to list of ShortcutObjects */
function getShortcutObjects(external, settings) {
    const shortcuts = settings.composite.shortcuts;
    let shortcutObjects = {};
    shortcuts.forEach((shortcut) => {
        let key = shortcut.command + '_' + shortcut.selector;
        if (Object.keys(shortcutObjects).indexOf(key) !== -1) {
            let currentCount = shortcutObjects[key].numberOfShortcuts;
            shortcutObjects[key].keys[currentCount] = shortcut.keys;
            shortcutObjects[key].numberOfShortcuts++;
        }
        else {
            let shortcutObject = new ShortcutObject();
            shortcutObject.commandName = shortcut.command;
            let label = external.getLabel(shortcut.command);
            if (!label) {
                label = shortcut.command.split(':')[1];
            }
            shortcutObject.label = label;
            shortcutObject.category = shortcut.command.split(':')[0];
            shortcutObject.keys[0] = shortcut.keys;
            shortcutObject.selector = shortcut.selector;
            // TODO needs translation
            shortcutObject.source = 'Default';
            shortcutObject.id = key;
            shortcutObject.numberOfShortcuts = 1;
            shortcutObjects[key] = shortcutObject;
        }
    });
    // find all the shortcuts that have custom settings
    const userShortcuts = settings.user.shortcuts;
    userShortcuts.forEach((userSetting) => {
        const command = userSetting.command;
        const selector = userSetting.selector;
        const keyTo = command + '_' + selector;
        if (shortcutObjects[keyTo]) {
            // TODO needs translation
            shortcutObjects[keyTo].source = 'Custom';
        }
    });
    return shortcutObjects;
}
/** Get list of all shortcut keybindings currently in use
 * An object where keys are unique keyBinding_selector and values are shortcut objects **/
function getKeyBindingsUsed(shortcutObjects) {
    let keyBindingsUsed = {};
    Object.keys(shortcutObjects).forEach((shortcut) => {
        Object.keys(shortcutObjects[shortcut].keys).forEach((key) => {
            const takenBy = new TakenByObject(shortcutObjects[shortcut]);
            takenBy.takenByKey = key;
            keyBindingsUsed[shortcutObjects[shortcut].keys[key].join(' ') +
                '_' +
                shortcutObjects[shortcut].selector] = takenBy;
        });
    });
    return keyBindingsUsed;
}
/** Top level React component for widget */
export class ShortcutUI extends React.Component {
    constructor(props) {
        super(props);
        /** Set the current seach query */
        this.updateSearchQuery = (event) => {
            this.setState({
                searchQuery: event.target['value']
            }, () => this.setState({
                filteredShortcutList: this.searchFilterShortcuts(this.state.shortcutList)
            }, () => {
                this.sortShortcuts();
            }));
        };
        /** Reset all shortcuts to their defaults */
        this.resetShortcuts = async () => {
            const settings = await this.props.external.getAllShortCutSettings();
            for (const key of Object.keys(settings.user)) {
                await this.props.external.removeShortCut(key);
            }
            await this._refreshShortcutList();
        };
        /** Set new shortcut for command, refresh state */
        this.handleUpdate = async (shortcutObject, keys) => {
            const settings = await this.props.external.getAllShortCutSettings();
            const userShortcuts = settings.user.shortcuts;
            const newUserShortcuts = [];
            let found = false;
            for (let shortcut of userShortcuts) {
                if (shortcut['command'] === shortcutObject.commandName &&
                    shortcut['selector'] === shortcutObject.selector) {
                    newUserShortcuts.push({
                        command: shortcut['command'],
                        selector: shortcut['selector'],
                        keys: keys
                    });
                    found = true;
                }
                else {
                    newUserShortcuts.push(shortcut);
                }
            }
            if (!found) {
                newUserShortcuts.push({
                    command: shortcutObject.commandName,
                    selector: shortcutObject.selector,
                    keys: keys
                });
            }
            await settings.set('shortcuts', newUserShortcuts);
            await this._refreshShortcutList();
        };
        /** Delete shortcut for command, refresh state */
        this.deleteShortcut = async (shortcutObject, shortcutId) => {
            await this.handleUpdate(shortcutObject, ['']);
            await this._refreshShortcutList();
        };
        /** Reset a specific shortcut to its default settings */
        this.resetShortcut = async (shortcutObject) => {
            const settings = await this.props.external.getAllShortCutSettings();
            const userShortcuts = settings.user.shortcuts;
            const newUserShortcuts = [];
            for (let shortcut of userShortcuts) {
                if (shortcut['command'] !== shortcutObject.commandName ||
                    shortcut['selector'] !== shortcutObject.selector) {
                    newUserShortcuts.push(shortcut);
                }
            }
            await settings.set('shortcuts', newUserShortcuts);
            await this._refreshShortcutList();
        };
        /** Toggles showing command selectors */
        this.toggleSelectors = () => {
            this.setState({ showSelectors: !this.state.showSelectors });
        };
        /** Set the current list sort order */
        this.updateSort = (value) => {
            if (value !== this.state.currentSort) {
                this.setState({ currentSort: value }, this.sortShortcuts);
            }
        };
        /** Sort shortcut list so that an error row is right below the one currently being set */
        this.sortConflict = (newShortcut, takenBy) => {
            const shortcutList = this.state.filteredShortcutList;
            if (shortcutList.filter(shortcut => shortcut.id === 'error_row').length === 0) {
                const errorRow = new ErrorObject();
                errorRow.takenBy = takenBy;
                errorRow.id = 'error_row';
                shortcutList.splice(shortcutList.indexOf(newShortcut) + 1, 0, errorRow);
                errorRow.hasConflict = true;
                this.setState({ filteredShortcutList: shortcutList });
            }
        };
        /** Remove conflict flag from all shortcuts */
        this.clearConflicts = () => {
            /** Remove error row */
            const shortcutList = this.state.filteredShortcutList.filter(shortcut => shortcut.id !== 'error_row');
            shortcutList.forEach((shortcut) => {
                shortcut.hasConflict = false;
            });
            this.setState({ filteredShortcutList: shortcutList });
        };
        this.contextMenu = (event, commandIDs) => {
            event.persist();
            this.setState({
                contextMenu: this.props.external.createMenu()
            }, () => {
                event.preventDefault();
                for (let command of commandIDs) {
                    this.state.contextMenu.addItem({ command });
                }
                this.state.contextMenu.open(event.clientX, event.clientY);
            });
        };
        this.state = {
            shortcutList: {},
            filteredShortcutList: new Array(),
            shortcutsFetched: false,
            searchQuery: '',
            showSelectors: false,
            currentSort: 'category',
            keyBindingsUsed: {},
            contextMenu: this.props.external.createMenu()
        };
    }
    /** Fetch shortcut list on mount */
    componentDidMount() {
        void this._refreshShortcutList();
    }
    /** Fetch shortcut list from SettingRegistry  */
    async _refreshShortcutList() {
        const shortcuts = await this.props.external.getAllShortCutSettings();
        const shortcutObjects = getShortcutObjects(this.props.external, shortcuts);
        this.setState({
            shortcutList: shortcutObjects,
            filteredShortcutList: this.searchFilterShortcuts(shortcutObjects),
            shortcutsFetched: true
        }, () => {
            let keyBindingsUsed = getKeyBindingsUsed(shortcutObjects);
            this.setState({ keyBindingsUsed });
            this.sortShortcuts();
        });
    }
    /** Filter shortcut list using current search query */
    searchFilterShortcuts(shortcutObjects) {
        const filteredShortcuts = matchItems(shortcutObjects, this.state.searchQuery).map((item) => {
            return item.item;
        });
        return filteredShortcuts;
    }
    /** Sort shortcut list using current sort property  */
    sortShortcuts() {
        const shortcuts = this.state.filteredShortcutList;
        let filterCritera = this.state.currentSort;
        if (filterCritera === 'command') {
            filterCritera = 'label';
        }
        if (filterCritera !== '') {
            shortcuts.sort((a, b) => {
                const compareA = a.get(filterCritera);
                const compareB = b.get(filterCritera);
                if (compareA < compareB) {
                    return -1;
                }
                else if (compareA > compareB) {
                    return 1;
                }
                else {
                    return a['label'] < b['label'] ? -1 : a['label'] > b['label'] ? 1 : 0;
                }
            });
        }
        this.setState({ filteredShortcutList: shortcuts });
    }
    render() {
        if (!this.state.shortcutsFetched) {
            return null;
        }
        return (React.createElement("div", { className: ShortcutUIStyle, id: "jp-shortcutui" },
            React.createElement("div", { className: TopWhitespaceStyle }),
            React.createElement(TopNav, { updateSearchQuery: this.updateSearchQuery, resetShortcuts: this.resetShortcuts, toggleSelectors: this.toggleSelectors, showSelectors: this.state.showSelectors, updateSort: this.updateSort, currentSort: this.state.currentSort, width: this.props.width, external: this.props.external }),
            React.createElement(ShortcutList, { shortcuts: this.state.filteredShortcutList, resetShortcut: this.resetShortcut, handleUpdate: this.handleUpdate, deleteShortcut: this.deleteShortcut, showSelectors: this.state.showSelectors, keyBindingsUsed: this.state.keyBindingsUsed, sortConflict: this.sortConflict, clearConflicts: this.clearConflicts, height: this.props.height, errorSize: this.props.width < 775 ? 1 /* Small */ : 0 /* Regular */, contextMenu: this.contextMenu, external: this.props.external })));
    }
}
//# sourceMappingURL=ShortcutUI.js.map