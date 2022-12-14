// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { CommandToolbarButton, Toolbar } from '@jupyterlab/apputils';
import { CodeEditor, CodeEditorWrapper } from '@jupyterlab/codeeditor';
import { nullTranslator } from '@jupyterlab/translation';
import { Signal } from '@lumino/signaling';
import { BoxLayout, Widget } from '@lumino/widgets';
import { createInspector } from './inspector';
import { SplitPanel } from './splitpanel';
/**
 * A class name added to all raw editors.
 */
const RAW_EDITOR_CLASS = 'jp-SettingsRawEditor';
/**
 * A class name added to the user settings editor.
 */
const USER_CLASS = 'jp-SettingsRawEditor-user';
/**
 * A class name added to the user editor when there are validation errors.
 */
const ERROR_CLASS = 'jp-mod-error';
/**
 * A raw JSON settings editor.
 */
export class RawEditor extends SplitPanel {
    /**
     * Create a new plugin editor.
     */
    constructor(options) {
        super({
            orientation: 'horizontal',
            renderer: SplitPanel.defaultRenderer,
            spacing: 1
        });
        this._canRevert = false;
        this._canSave = false;
        this._commandsChanged = new Signal(this);
        this._settings = null;
        this._toolbar = new Toolbar();
        const { commands, editorFactory, registry, translator } = options;
        this.registry = registry;
        this.translator = translator || nullTranslator;
        this._commands = commands;
        // Create read-only defaults editor.
        const defaults = (this._defaults = new CodeEditorWrapper({
            model: new CodeEditor.Model(),
            factory: editorFactory
        }));
        defaults.editor.model.value.text = '';
        defaults.editor.model.mimeType = 'text/javascript';
        defaults.editor.setOption('readOnly', true);
        // Create read-write user settings editor.
        const user = (this._user = new CodeEditorWrapper({
            model: new CodeEditor.Model(),
            factory: editorFactory,
            config: { lineNumbers: true }
        }));
        user.addClass(USER_CLASS);
        user.editor.model.mimeType = 'text/javascript';
        user.editor.model.value.changed.connect(this._onTextChanged, this);
        // Create and set up an inspector.
        this._inspector = createInspector(this, options.rendermime, this.translator);
        this.addClass(RAW_EDITOR_CLASS);
        // FIXME-TRANS: onSaveError must have an optional translator?
        this._onSaveError = options.onSaveError;
        this.addWidget(Private.defaultsEditor(defaults, this.translator));
        this.addWidget(Private.userEditor(user, this._toolbar, this._inspector, this.translator));
    }
    /**
     * Whether the raw editor revert functionality is enabled.
     */
    get canRevert() {
        return this._canRevert;
    }
    /**
     * Whether the raw editor save functionality is enabled.
     */
    get canSave() {
        return this._canSave;
    }
    /**
     * Emits when the commands passed in at instantiation change.
     */
    get commandsChanged() {
        return this._commandsChanged;
    }
    /**
     * Tests whether the settings have been modified and need saving.
     */
    get isDirty() {
        var _a, _b;
        return (_b = this._user.editor.model.value.text !== ((_a = this._settings) === null || _a === void 0 ? void 0 : _a.raw)) !== null && _b !== void 0 ? _b : '';
    }
    /**
     * The plugin settings being edited.
     */
    get settings() {
        return this._settings;
    }
    set settings(settings) {
        if (!settings && !this._settings) {
            return;
        }
        const samePlugin = settings && this._settings && settings.plugin === this._settings.plugin;
        if (samePlugin) {
            return;
        }
        const defaults = this._defaults;
        const user = this._user;
        // Disconnect old settings change handler.
        if (this._settings) {
            this._settings.changed.disconnect(this._onSettingsChanged, this);
        }
        if (settings) {
            this._settings = settings;
            this._settings.changed.connect(this._onSettingsChanged, this);
            this._onSettingsChanged();
        }
        else {
            this._settings = null;
            defaults.editor.model.value.text = '';
            user.editor.model.value.text = '';
        }
        this.update();
    }
    /**
     * Get the relative sizes of the two editor panels.
     */
    get sizes() {
        return this.relativeSizes();
    }
    set sizes(sizes) {
        this.setRelativeSizes(sizes);
    }
    /**
     * The inspectable source editor for user input.
     */
    get source() {
        return this._user.editor;
    }
    /**
     * Dispose of the resources held by the raw editor.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        super.dispose();
        this._defaults.dispose();
        this._user.dispose();
    }
    /**
     * Revert the editor back to original settings.
     */
    revert() {
        var _a, _b;
        this._user.editor.model.value.text = (_b = (_a = this.settings) === null || _a === void 0 ? void 0 : _a.raw) !== null && _b !== void 0 ? _b : '';
        this._updateToolbar(false, false);
    }
    /**
     * Save the contents of the raw editor.
     */
    save() {
        if (!this.isDirty || !this._settings) {
            return Promise.resolve(undefined);
        }
        const settings = this._settings;
        const source = this._user.editor.model.value.text;
        return settings
            .save(source)
            .then(() => {
            this._updateToolbar(false, false);
        })
            .catch(reason => {
            this._updateToolbar(true, false);
            this._onSaveError(reason, this.translator);
        });
    }
    /**
     * Handle `after-attach` messages.
     */
    onAfterAttach(msg) {
        Private.populateToolbar(this._commands, this._toolbar);
        this.update();
    }
    /**
     * Handle `'update-request'` messages.
     */
    onUpdateRequest(msg) {
        const settings = this._settings;
        const defaults = this._defaults;
        const user = this._user;
        if (settings) {
            defaults.editor.refresh();
            user.editor.refresh();
        }
    }
    /**
     * Handle text changes in the underlying editor.
     */
    _onTextChanged() {
        const raw = this._user.editor.model.value.text;
        const settings = this._settings;
        this.removeClass(ERROR_CLASS);
        // If there are no settings loaded or there are no changes, bail.
        if (!settings || settings.raw === raw) {
            this._updateToolbar(false, false);
            return;
        }
        const errors = settings.validate(raw);
        if (errors) {
            this.addClass(ERROR_CLASS);
            this._updateToolbar(true, false);
            return;
        }
        this._updateToolbar(true, true);
    }
    /**
     * Handle updates to the settings.
     */
    _onSettingsChanged() {
        var _a, _b;
        const settings = this._settings;
        const defaults = this._defaults;
        const user = this._user;
        defaults.editor.model.value.text = (_a = settings === null || settings === void 0 ? void 0 : settings.annotatedDefaults()) !== null && _a !== void 0 ? _a : '';
        user.editor.model.value.text = (_b = settings === null || settings === void 0 ? void 0 : settings.raw) !== null && _b !== void 0 ? _b : '';
    }
    _updateToolbar(revert = this._canRevert, save = this._canSave) {
        const commands = this._commands;
        this._canRevert = revert;
        this._canSave = save;
        this._commandsChanged.emit([commands.revert, commands.save]);
    }
}
/**
 * A namespace for private module data.
 */
var Private;
(function (Private) {
    /**
     * Returns the wrapped setting defaults editor.
     */
    function defaultsEditor(editor, translator) {
        translator = translator || nullTranslator;
        const trans = translator.load('jupyterlab');
        const widget = new Widget();
        const layout = (widget.layout = new BoxLayout({ spacing: 0 }));
        const banner = new Widget();
        const bar = new Toolbar();
        const defaultTitle = trans.__('System Defaults');
        banner.node.innerText = defaultTitle;
        bar.insertItem(0, 'banner', banner);
        layout.addWidget(bar);
        layout.addWidget(editor);
        return widget;
    }
    Private.defaultsEditor = defaultsEditor;
    /**
     * Populate the raw editor toolbar.
     */
    function populateToolbar(commands, toolbar) {
        const { registry, revert, save } = commands;
        toolbar.addItem('spacer', Toolbar.createSpacerItem());
        // Note the button order. The rationale here is that no matter what state
        // the toolbar is in, the relative location of the revert button in the
        // toolbar remains the same.
        [revert, save].forEach(name => {
            const item = new CommandToolbarButton({ commands: registry, id: name });
            toolbar.addItem(name, item);
        });
    }
    Private.populateToolbar = populateToolbar;
    /**
     * Returns the wrapped user overrides editor.
     */
    function userEditor(editor, toolbar, inspector, translator) {
        translator = translator || nullTranslator;
        const trans = translator.load('jupyterlab');
        const userTitle = trans.__('User Preferences');
        const widget = new Widget();
        const layout = (widget.layout = new BoxLayout({ spacing: 0 }));
        const banner = new Widget();
        banner.node.innerText = userTitle;
        toolbar.insertItem(0, 'banner', banner);
        layout.addWidget(toolbar);
        layout.addWidget(editor);
        layout.addWidget(inspector);
        return widget;
    }
    Private.userEditor = userEditor;
})(Private || (Private = {}));
//# sourceMappingURL=raweditor.js.map