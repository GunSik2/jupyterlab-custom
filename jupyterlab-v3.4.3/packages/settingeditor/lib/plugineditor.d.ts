import { CodeEditor } from '@jupyterlab/codeeditor';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITranslator } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import { Message } from '@lumino/messaging';
import { ISignal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import { RawEditor } from './raweditor';
import { JsonSettingEditor } from './jsonsettingeditor';
/**
 * An individual plugin settings editor.
 */
export declare class PluginEditor extends Widget {
    /**
     * Create a new plugin editor.
     *
     * @param options - The plugin editor instantiation options.
     */
    constructor(options: PluginEditor.IOptions);
    /**
     * The plugin editor's raw editor.
     */
    readonly raw: RawEditor;
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
     * The plugin editor layout state.
     */
    get state(): JsonSettingEditor.IPluginLayout;
    set state(state: JsonSettingEditor.IPluginLayout);
    /**
     * A signal that emits when editor layout state changes and needs to be saved.
     */
    get stateChanged(): ISignal<this, void>;
    /**
     * If the editor is in a dirty state, confirm that the user wants to leave.
     */
    confirm(): Promise<void>;
    /**
     * Dispose of the resources held by the plugin editor.
     */
    dispose(): void;
    /**
     * Handle `after-attach` messages.
     */
    protected onAfterAttach(msg: Message): void;
    /**
     * Handle `'update-request'` messages.
     */
    protected onUpdateRequest(msg: Message): void;
    /**
     * Handle layout state changes that need to be saved.
     */
    private _onStateChanged;
    protected translator: ITranslator;
    private _trans;
    private _rawEditor;
    private _settings;
    private _stateChanged;
}
/**
 * A namespace for `PluginEditor` statics.
 */
export declare namespace PluginEditor {
    /**
     * The instantiation options for a plugin editor.
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
         * The editor factory used by the plugin editor.
         */
        editorFactory: CodeEditor.Factory;
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
