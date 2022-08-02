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
import { LabIcon } from '../icon';
import { classes } from '../utils';
/**
 * InputGroup component
 *
 * @param props Component properties
 * @returns Component
 */
export function InputGroup(props) {
    const { className, rightIcon } = props, others = __rest(props, ["className", "rightIcon"]);
    return (React.createElement("div", { className: classes('jp-InputGroup', className) },
        React.createElement("input", Object.assign({}, others)),
        rightIcon && (React.createElement("span", { className: "jp-InputGroupAction" }, typeof rightIcon === 'string' ? (React.createElement(LabIcon.resolveReact, { icon: rightIcon, elementPosition: "center", tag: "span" })) : (React.createElement(rightIcon.react, { elementPosition: "center", tag: "span" }))))));
}
//# sourceMappingURL=inputgroup.js.map