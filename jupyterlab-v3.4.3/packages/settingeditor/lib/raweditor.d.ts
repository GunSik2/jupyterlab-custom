import { CodeEditor } from '@jupyterlab/codeeditor';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITranslator } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import { Message } from '@lumino/messaging';
import { ISignal } from '@lumino/signaling';
import { SplitPanel } from './splitpanel';
/**
 * A raw JSON settings editor.
 */
export declare class RawEditor extends SplitPanel {
    /**
     * Create a new plugin editor.
     */
    constructor(options: RawEditor.IOptions);
    /**
     * The setting registry used by the editor.
     */
    readonly registry: ISettingRegistry;
    /**
     * Whether the raw editor revert functionality is enabled.
     */
    get canRevert(): boolean;
    /**
     * Whether the raw editor save functionality is enabled.
     */
    get canSave(): boolean;
    /**
     * Emits when the commands passed in at instantiation change.
     */
    get commandsChanged(): ISignal<any, string[]>;
    /**
     * Tests whether the settings have been modified and need saving.
     */
    get isDirty(): boolean;
    /**
     * The plugin settings being edited.
     */
    get settings(): ISettingRegistry.ISettings | null;
    set settings(settings: ISettingRegistry.ISettings | null);
    /**
     * Get the relative sizes of the two editor panels.
     */
    get sizes(): number[];
    set sizes(sizes: number[]);
    /**
     * The inspectable source editor for user input.
     */
    get source(): CodeEditor.IEditor;
    /**
     * Dispose of the resources held by the raw editor.
     */
    dispose(): void;
    /**
     * Revert the editor back to original settings.
     */
    revert(): void;
    /**
     * Save the contents of the raw editor.
     */
    save(): Promise<void>;
    /**
     * Handle `after-attach` messages.
     */
    protected onAfterAttach(msg: Message): void;
    /**
     * Handle `'update-request'` messages.
     */
    protected onUpdateRequest(msg: Message): void;
    /**
     * Handle text changes in the underlying editor.
     */
    private _onTextChanged;
    /**
     * Handle updates to the settings.
     */
    private _onSettingsChanged;
    private _updateToolbar;
    protected translator: ITranslator;
    private _canRevert;
    private _canSave;
    private _commands;
    private _commandsChanged;
    private _defaults;
    private _inspector;
    private _onSaveError;
    private _settings;
    private _toolbar;
    private _user;
}
/**
 * A namespace for `RawEditor` statics.
 */
export declare namespace RawEditor {
    /**
     * The toolbar commands and registry for the setting editor toolbar.
     */
    interface ICommandBundle {
        /**
         * The command registry.
         */
        registry: CommandRegistry;
        /**
         * The revert command ID.
         */
        revert: string;
        /**
         * The save command ID.
         */
        save: string;
    }
    /**
     * The instantiation options for a raw editor.
     */
    interface IOptions {
        /**
         * The toolbar commands and registry for the setting editor toolbar.
         */
        commands: ICommandBundle;
        /**
         * The editor factory used by the raw editor.
         */
        editorFactory: CodeEditor.Factory;
        /**
         * A function the raw editor calls on save errors.
         */
        onSaveError: (reason: any) => void;
        /**
         * The setting registry used by the editor.
         */
        registry: ISettingRegistry;
        /**
         * The optional MIME renderer to use for rendering debug messages.
         */
        rendermime?: IRenderMimeRegistry;
        /**
         * The application language translator.
         */
        translator?: ITranslator;
    }
}
