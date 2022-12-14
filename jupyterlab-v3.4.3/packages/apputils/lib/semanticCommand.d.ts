import { Widget } from '@lumino/widgets';
/**
 * Options when add a command to a semantic group.
 */
interface ISemanticCommand {
    /**
     * Command id
     */
    id: string;
    /**
     * Whether this command is enabled for a given widget
     * @param widget Widget
     */
    isEnabled?(widget: Widget): boolean;
    /**
     * Command rank in the semantic group
     *
     * #### Note
     * If multiple commands are enabled at the same time,
     * the one with the smallest rank will be executed.
     */
    rank?: number;
}
/**
 * Semantic group of commands
 */
export declare class SemanticCommand {
    /**
     * Default rank for semantic command
     */
    static readonly DEFAULT_RANK = 500;
    /**
     * Add a command to the semantic group
     *
     * @param command Command to add
     */
    add(command: ISemanticCommand): void;
    /**
     * Get the command id of the enabled command from this group
     * for the given widget.
     *
     * @param widget Widget
     * @returns Command id
     */
    getActiveCommandId(widget: Widget): string | null;
    protected _commands: Required<ISemanticCommand>[];
}
export {};
