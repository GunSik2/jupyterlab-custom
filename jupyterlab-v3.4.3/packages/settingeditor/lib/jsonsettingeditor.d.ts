import { CodeEditor } from '@jupyterlab/codeeditor';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { IStateDB } from '@jupyterlab/statedb';
import { ITranslator } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import { JSONObject } from '@lumino/coreutils';
import { Message } from '@lumino/messaging';
import { ISignal } from '@lumino/signaling';
import { SplitPanel } from './splitpanel';
/**
 * An interface for modifying and saving application settings.
 */
export declare class JsonSettingEditor extends SplitPanel {
    /**
     * Create a new setting editor.
     */
    constructor(options: JsonSettingEditor.IOptions);
    /**
     * The state database key for the editor's state management.
     */
    readonly key: string;
    /**
     * The setting registry used by the editor.
     */
    readonly registry: ISettingRegistry;
    /**
     * The state database used to store layout.
     */
    readonly state: IStateDB;
    /**
     * Whether the raw editor revert functionality is enabled.
     */
    get canRevertRaw(): boolean;
    /**
     * Whether the raw editor save functionality is enabled.
     */
    get canSaveRaw(): boolean;
    /**
     * Emits when the commands passed in at instantiation change.
     */
    get commandsChanged(): ISignal<any, string[]>;
    /**
     * The currently loaded settings.
     */
    get settings(): ISettingRegistry.ISettings | null;
    /**
     * The inspectable raw user editor source for the currently loaded settings.
     */
    get source(): CodeEditor.IEditor;
    /**
     * Dispose of the resources held by the setting editor.
     */
    dispose(): void;
    /**
     * Revert raw editor back to original settings.
     */
    revert(): void;
    /**
     * Save the contents of the raw editor.
     */
    save(): Promise<void>;
    /**
     * Handle `'after-attach'` messages.
     */
    protected onAfterAttach(msg: Message): void;
    /**
     * Handle `'close-request'` messages.
     */
    protected onCloseRequest(msg: Message): void;
    /**
     * Get the state of the panel.
     */
    private _fetchState;
    /**
     * Handle root level layout state changes.
     */
    private _onStateChanged;
    /**
     * Set the state of the setting editor.
     */
    private _saveState;
    /**
     * Set the layout sizes.
     */
    private _setLayout;
    /**
     * Set the presets of the setting editor.
     */
    private _setState;
    protected translator: ITranslator;
    private _editor;
    private _fetching;
    private _instructions;
    private _list;
    private _saving;
    private _state;
    private _when;
}
/**
 * A namespace for `JsonSettingEditor` statics.
 */
export declare namespace JsonSettingEditor {
    /**
     * The instantiation options for a setting editor.
     */
    interface IOptions {
        /**
         * The toolbar commands and registry for the setting editor toolbar.
         */
        commands: {
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
        };
        /**
         * The editor factory used by the setting editor.
         */
        editorFactory: CodeEditor.Factory;
        /**
         * The state database key for the editor's state management.
         */
        key: string;
        /**
         * The setting registry the editor modifies.
         */
        registry: ISettingRegistry;
        /**
         * The optional MIME renderer to use for rendering debug messages.
         */
        rendermime?: IRenderMimeRegistry;
        /**
         * The state database used to store layout.
         */
        state: IStateDB;
        /**
         * The point after which the editor should restore its state.
         */
        when?: Promise<any> | Array<Promise<any>>;
        /**
         * The application language translator.
         */
        translator?: ITranslator;
    }
    /**
     * The layout state for the setting editor.
     */
    interface ILayoutState extends JSONObject {
        /**
         * The layout state for a plugin editor container.
         */
        container: IPluginLayout;
        /**
         * The relative sizes of the plugin list and plugin editor.
         */
        sizes: number[];
    }
    /**
     * The layout information that is stored and restored from the state database.
     */
    interface IPluginLayout extends JSONObject {
        /**
         * The current plugin being displayed.
         */
        plugin: string;
        sizes: number[];
    }
}
