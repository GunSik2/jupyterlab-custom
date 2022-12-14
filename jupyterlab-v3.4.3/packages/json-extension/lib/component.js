// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { nullTranslator } from '@jupyterlab/translation';
import { InputGroup } from '@jupyterlab/ui-components';
import { JSONExt } from '@lumino/coreutils';
import * as React from 'react';
import Highlight from 'react-highlighter';
import JSONTree from 'react-json-tree';
/**
 * A component that renders JSON data as a collapsible tree.
 */
export class Component extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { filter: '', value: '' };
        this.timer = 0;
        this.handleChange = (event) => {
            const { value } = event.target;
            this.setState({ value });
            window.clearTimeout(this.timer);
            this.timer = window.setTimeout(() => {
                this.setState({ filter: value });
            }, 300);
        };
    }
    render() {
        const translator = this.props.translator || nullTranslator;
        const trans = translator.load('jupyterlab');
        const { data, metadata } = this.props;
        const root = metadata && metadata.root ? metadata.root : 'root';
        const keyPaths = this.state.filter
            ? filterPaths(data, this.state.filter, [root])
            : [root];
        return (React.createElement("div", { className: "container" },
            React.createElement(InputGroup, { className: "filter", type: "text", placeholder: trans.__('Filter…'), onChange: this.handleChange, value: this.state.value, rightIcon: "ui-components:search" }),
            React.createElement(JSONTree, { data: data, collectionLimit: 100, theme: {
                    extend: theme,
                    valueLabel: 'cm-variable',
                    valueText: 'cm-string',
                    nestedNodeItemString: 'cm-comment'
                }, invertTheme: false, keyPath: [root], getItemString: (type, data, itemType, itemString) => Array.isArray(data) ? (
                // Always display array type and the number of items i.e. "[] 2 items".
                React.createElement("span", null,
                    itemType,
                    " ",
                    itemString)) : Object.keys(data).length === 0 ? (
                // Only display object type when it's empty i.e. "{}".
                React.createElement("span", null, itemType)) : (null // Upstream typings don't accept null, but it should be ok
                ), labelRenderer: ([label, type]) => {
                    // let className = 'cm-variable';
                    // if (type === 'root') {
                    //   className = 'cm-variable-2';
                    // }
                    // if (type === 'array') {
                    //   className = 'cm-variable-2';
                    // }
                    // if (type === 'Object') {
                    //   className = 'cm-variable-3';
                    // }
                    return (React.createElement("span", { className: "cm-keyword" },
                        React.createElement(Highlight, { search: this.state.filter, matchStyle: { backgroundColor: 'yellow' } }, `${label}: `)));
                }, valueRenderer: raw => {
                    let className = 'cm-string';
                    if (typeof raw === 'number') {
                        className = 'cm-number';
                    }
                    if (raw === 'true' || raw === 'false') {
                        className = 'cm-keyword';
                    }
                    return (React.createElement("span", { className: className },
                        React.createElement(Highlight, { search: this.state.filter, matchStyle: { backgroundColor: 'yellow' } }, `${raw}`)));
                }, shouldExpandNode: (keyPath, data, level) => metadata && metadata.expanded
                    ? true
                    : keyPaths.join(',').includes(keyPath.join(',')) })));
    }
}
// Provide an invalid theme object (this is on purpose!) to invalidate the
// react-json-tree's inline styles that override CodeMirror CSS classes
const theme = {
    scheme: 'jupyter',
    base00: 'invalid',
    base01: 'invalid',
    base02: 'invalid',
    base03: 'invalid',
    base04: 'invalid',
    base05: 'invalid',
    base06: 'invalid',
    base07: 'invalid',
    base08: 'invalid',
    base09: 'invalid',
    base0A: 'invalid',
    base0B: 'invalid',
    base0C: 'invalid',
    base0D: 'invalid',
    base0E: 'invalid',
    base0F: 'invalid',
    author: 'invalid'
};
function objectIncludes(data, query) {
    return JSON.stringify(data).includes(query);
}
function filterPaths(data, query, parent = ['root']) {
    if (JSONExt.isArray(data)) {
        return data.reduce((result, item, index) => {
            if (item && typeof item === 'object' && objectIncludes(item, query)) {
                return [
                    ...result,
                    [index, ...parent].join(','),
                    ...filterPaths(item, query, [index, ...parent])
                ];
            }
            return result;
        }, []);
    }
    if (JSONExt.isObject(data)) {
        return Object.keys(data).reduce((result, key) => {
            const item = data[key];
            if (item &&
                typeof item === 'object' &&
                (key.includes(query) || objectIncludes(item, query))) {
                return [
                    ...result,
                    [key, ...parent].join(','),
                    ...filterPaths(item, query, [key, ...parent])
                ];
            }
            return result;
        }, []);
    }
    return [];
}
//# sourceMappingURL=component.js.map