/**
 * Create the command options from the given semantic commands list
 * and the given default values.
 *
 * @param app Jupyter Application
 * @param semanticCommands Single semantic command  or a list of commands
 * @param defaultValues Default values
 * @param trans Translation bundle
 * @returns Command options
 */
export function createSemanticCommand(app, semanticCommands, defaultValues, trans) {
    const { commands, shell } = app;
    const commandList = Array.isArray(semanticCommands)
        ? semanticCommands
        : [semanticCommands];
    return {
        label: concatenateTexts('label'),
        caption: concatenateTexts('caption'),
        isEnabled: () => {
            var _a;
            const isEnabled = reduceAttribute('isEnabled');
            return ((isEnabled.length > 0 &&
                !isEnabled.some(enabled => enabled === false)) ||
                ((_a = defaultValues.isEnabled) !== null && _a !== void 0 ? _a : false));
        },
        isToggled: () => {
            var _a;
            const isToggled = reduceAttribute('isToggled');
            return (isToggled.some(enabled => enabled === true) ||
                ((_a = defaultValues.isToggled) !== null && _a !== void 0 ? _a : false));
        },
        isVisible: () => {
            var _a;
            const isVisible = reduceAttribute('isVisible');
            return ((isVisible.length > 0 &&
                !isVisible.some(visible => visible === false)) ||
                ((_a = defaultValues.isVisible) !== null && _a !== void 0 ? _a : true));
        },
        execute: async () => {
            const widget = shell.currentWidget;
            const commandIds = commandList.map(cmd => widget !== null ? cmd.getActiveCommandId(widget) : null);
            const toExecute = commandIds.filter(commandId => commandId !== null && commands.isEnabled(commandId));
            let result = null;
            if (toExecute.length > 0) {
                for (const commandId of toExecute) {
                    result = await commands.execute(commandId);
                    if (typeof result === 'boolean' && result === false) {
                        // If a command returns a boolean, assume it is the execution success status
                        // So break if it is false.
                        break;
                    }
                }
            }
            else if (defaultValues.execute) {
                result = await commands.execute(defaultValues.execute);
            }
            return result;
        }
    };
    function reduceAttribute(attribute) {
        const widget = shell.currentWidget;
        const commandIds = commandList.map(cmd => widget !== null ? cmd.getActiveCommandId(widget) : null);
        const attributes = commandIds
            .filter(commandId => commandId !== null)
            .map(commandId => commands[attribute](commandId));
        return attributes;
    }
    function concatenateTexts(attribute) {
        return () => {
            var _a;
            const texts = reduceAttribute(attribute);
            switch (texts.length) {
                case 0:
                    return (_a = defaultValues.label) !== null && _a !== void 0 ? _a : '';
                case 1:
                    return texts[0];
                default: {
                    const hasEllipsis = texts.some(l => /???$/.test(l));
                    const main = texts
                        .slice(undefined, -1)
                        .map(l => l.replace(/???$/, ''))
                        .join(', ');
                    const end = texts.slice(-1)[0] + (hasEllipsis ? '???' : '');
                    return trans.__('%1 and %2', main, end);
                }
            }
        };
    }
}
//# sourceMappingURL=utils.js.map