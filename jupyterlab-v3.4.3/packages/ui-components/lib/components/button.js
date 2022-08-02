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
import React from 'react';
import { classes } from '../utils';
/**
 * Button component
 *
 * @param props Component properties
 * @returns Component
 */
export function Button(props) {
    const { minimal, small, children } = props, others = __rest(props, ["minimal", "small", "children"]);
    return (React.createElement("button", Object.assign({}, others, { className: classes(props.className, minimal ? 'jp-mod-minimal' : '', small ? 'jp-mod-small' : '', 'jp-Button') }), children));
}
//# sourceMappingURL=button.js.map