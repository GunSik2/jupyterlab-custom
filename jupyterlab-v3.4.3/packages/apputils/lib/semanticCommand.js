/**
 * Semantic group of commands
 */
export class SemanticCommand {
    constructor() {
        this._commands = new Array();
    }
    /**
     * Add a command to the semantic group
     *
     * @param command Command to add
     */
    add(command) {
        if (this._commands.map(c => c.id).includes(command.id)) {
            throw Error(`Command ${command.id} is already defined.`);
        }
        this._commands.push(Object.assign({ isEnabled: () => true, rank: SemanticCommand.DEFAULT_RANK }, command));
    }
    /**
     * Get the command id of the enabled command from this group
     * for the given widget.
     *
     * @param widget Widget
     * @returns Command id
     */
    getActiveCommandId(widget) {
        var _a;
        const commands = this._commands
            .filter(c => c.isEnabled(widget))
            .sort((a, b) => {
            const rankDelta = a.rank - b.rank;
            return rankDelta || (a.id < b.id ? -1 : 1);
        });
        const command = (_a = commands[0]) !== null && _a !== void 0 ? _a : { id: null };
        return command.id;
    }
}
/**
 * Default rank for semantic command
 */
SemanticCommand.DEFAULT_RANK = 500;
//# sourceMappingURL=semanticCommand.js.map