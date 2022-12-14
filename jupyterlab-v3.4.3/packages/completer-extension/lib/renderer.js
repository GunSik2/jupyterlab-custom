import React, { useState } from 'react';
const AVAILABLE_PROVIDERS = 'availableProviders';
/**
 * Custom setting renderer for provider rank.
 */
export function renderAvailableProviders(props) {
    const { schema } = props;
    const title = schema.title;
    const desc = schema.description;
    const settings = props.formContext.settings;
    const userData = settings.get(AVAILABLE_PROVIDERS).user;
    const items = Object.assign({}, schema.default);
    if (userData) {
        for (const key of Object.keys(items)) {
            if (key in userData) {
                items[key] = userData[key];
            }
            else {
                items[key] = -1;
            }
        }
    }
    const [settingValue, setValue] = useState(items);
    const onSettingChange = (key, e) => {
        const newValue = Object.assign(Object.assign({}, settingValue), { [key]: parseInt(e.target.value) });
        settings.set(AVAILABLE_PROVIDERS, newValue).catch(console.error);
        setValue(newValue);
    };
    return (
    //TODO Remove hard coded class names
    React.createElement("div", null,
        React.createElement("fieldset", null,
            React.createElement("legend", null, title),
            React.createElement("p", { className: "field-description" }, desc),
            Object.keys(items).map(key => {
                return (React.createElement("div", { key: key, className: "form-group small-field" },
                    React.createElement("div", null,
                        React.createElement("h3", null,
                            " ",
                            key),
                        React.createElement("div", { className: "inputFieldWrapper" },
                            React.createElement("input", { className: "form-control", type: "number", value: settingValue[key], onChange: e => {
                                    onSettingChange(key, e);
                                } })))));
            }))));
}
//# sourceMappingURL=renderer.js.map