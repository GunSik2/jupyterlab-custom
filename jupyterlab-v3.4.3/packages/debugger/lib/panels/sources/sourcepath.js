// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { UseSignal } from '@jupyterlab/ui-components';
import React from 'react';
/**
 * A React component to display the path to a source.
 *
 * @param {object} props The component props.
 * @param props.model The model for the sources.
 */
export const SourcePathComponent = ({ model }) => {
    return (React.createElement(UseSignal, { signal: model.currentSourceChanged, initialSender: model }, (model) => {
        var _a, _b;
        return (React.createElement("span", { onClick: () => model === null || model === void 0 ? void 0 : model.open() }, (_b = (_a = model === null || model === void 0 ? void 0 : model.currentSource) === null || _a === void 0 ? void 0 : _a.path) !== null && _b !== void 0 ? _b : ''));
    }));
};
//# sourceMappingURL=sourcepath.js.map