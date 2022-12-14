// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { sessionContextDialogs } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { Context } from '@jupyterlab/docregistry';
import { nullTranslator } from '@jupyterlab/translation';
import { ArrayExt, find } from '@lumino/algorithm';
import { UUID } from '@lumino/coreutils';
import { AttachedProperty } from '@lumino/properties';
import { Signal } from '@lumino/signaling';
import { SaveHandler } from './savehandler';
import { DocumentWidgetManager } from './widgetmanager';
/**
 * The document manager.
 *
 * #### Notes
 * The document manager is used to register model and widget creators,
 * and the file browser uses the document manager to create widgets. The
 * document manager maintains a context for each path and model type that is
 * open, and a list of widgets for each context. The document manager is in
 * control of the proper closing and disposal of the widgets and contexts.
 */
export class DocumentManager {
    /**
     * Construct a new document manager.
     */
    constructor(options) {
        this._activateRequested = new Signal(this);
        this._contexts = [];
        this._isDisposed = false;
        this._autosave = true;
        this._autosaveInterval = 120;
        this._lastModifiedCheckMargin = 500;
        this.translator = options.translator || nullTranslator;
        this.registry = options.registry;
        this.services = options.manager;
        this._collaborative = !!options.collaborative;
        this._dialogs = options.sessionDialogs || sessionContextDialogs;
        this._docProviderFactory = options.docProviderFactory;
        this._opener = options.opener;
        this._when = options.when || options.manager.ready;
        const widgetManager = new DocumentWidgetManager({
            registry: this.registry,
            translator: this.translator
        });
        widgetManager.activateRequested.connect(this._onActivateRequested, this);
        this._widgetManager = widgetManager;
        this._setBusy = options.setBusy;
    }
    /**
     * A signal emitted when one of the documents is activated.
     */
    get activateRequested() {
        return this._activateRequested;
    }
    /**
     * Whether to autosave documents.
     */
    get autosave() {
        return this._autosave;
    }
    set autosave(value) {
        this._autosave = value;
        // For each existing context, start/stop the autosave handler as needed.
        this._contexts.forEach(context => {
            const handler = Private.saveHandlerProperty.get(context);
            if (!handler) {
                return;
            }
            if (value === true && !handler.isActive) {
                handler.start();
            }
            else if (value === false && handler.isActive) {
                handler.stop();
            }
        });
    }
    /**
     * Determines the time interval for autosave in seconds.
     */
    get autosaveInterval() {
        return this._autosaveInterval;
    }
    set autosaveInterval(value) {
        this._autosaveInterval = value;
        // For each existing context, set the save interval as needed.
        this._contexts.forEach(context => {
            const handler = Private.saveHandlerProperty.get(context);
            if (!handler) {
                return;
            }
            handler.saveInterval = value || 120;
        });
    }
    /**
     * Defines max acceptable difference, in milliseconds, between last modified timestamps on disk and client
     */
    get lastModifiedCheckMargin() {
        return this._lastModifiedCheckMargin;
    }
    set lastModifiedCheckMargin(value) {
        this._lastModifiedCheckMargin = value;
        // For each existing context, update the margin value.
        this._contexts.forEach(context => {
            context.lastModifiedCheckMargin = value;
        });
    }
    /**
     * Get whether the document manager has been disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Dispose of the resources held by the document manager.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._isDisposed = true;
        // Clear any listeners for our signals.
        Signal.clearData(this);
        // Close all the widgets for our contexts and dispose the widget manager.
        this._contexts.forEach(context => {
            return this._widgetManager.closeWidgets(context);
        });
        this._widgetManager.dispose();
        // Clear the context list.
        this._contexts.length = 0;
    }
    /**
     * Clone a widget.
     *
     * @param widget - The source widget.
     *
     * @returns A new widget or `undefined`.
     *
     * #### Notes
     *  Uses the same widget factory and context as the source, or returns
     *  `undefined` if the source widget is not managed by this manager.
     */
    cloneWidget(widget) {
        return this._widgetManager.cloneWidget(widget);
    }
    /**
     * Close all of the open documents.
     *
     * @returns A promise resolving when the widgets are closed.
     */
    closeAll() {
        return Promise.all(this._contexts.map(context => this._widgetManager.closeWidgets(context))).then(() => undefined);
    }
    /**
     * Close the widgets associated with a given path.
     *
     * @param path - The target path.
     *
     * @returns A promise resolving when the widgets are closed.
     */
    closeFile(path) {
        const close = this._contextsForPath(path).map(c => this._widgetManager.closeWidgets(c));
        return Promise.all(close).then(x => undefined);
    }
    /**
     * Get the document context for a widget.
     *
     * @param widget - The widget of interest.
     *
     * @returns The context associated with the widget, or `undefined` if no such
     * context exists.
     */
    contextForWidget(widget) {
        return this._widgetManager.contextForWidget(widget);
    }
    /**
     * Copy a file.
     *
     * @param fromFile - The full path of the original file.
     *
     * @param toDir - The full path to the target directory.
     *
     * @returns A promise which resolves to the contents of the file.
     */
    copy(fromFile, toDir) {
        return this.services.contents.copy(fromFile, toDir);
    }
    /**
     * Create a new file and return the widget used to view it.
     *
     * @param path - The file path to create.
     *
     * @param widgetName - The name of the widget factory to use. 'default' will use the default widget.
     *
     * @param kernel - An optional kernel name/id to override the default.
     *
     * @returns The created widget, or `undefined`.
     *
     * #### Notes
     * This function will return `undefined` if a valid widget factory
     * cannot be found.
     */
    createNew(path, widgetName = 'default', kernel) {
        return this._createOrOpenDocument('create', path, widgetName, kernel);
    }
    /**
     * Delete a file.
     *
     * @param path - The full path to the file to be deleted.
     *
     * @returns A promise which resolves when the file is deleted.
     *
     * #### Notes
     * If there is a running session associated with the file and no other
     * sessions are using the kernel, the session will be shut down.
     */
    deleteFile(path) {
        return this.services.sessions
            .stopIfNeeded(path)
            .then(() => {
            return this.services.contents.delete(path);
        })
            .then(() => {
            this._contextsForPath(path).forEach(context => this._widgetManager.deleteWidgets(context));
            return Promise.resolve(void 0);
        });
    }
    /**
     * See if a widget already exists for the given path and widget name.
     *
     * @param path - The file path to use.
     *
     * @param widgetName - The name of the widget factory to use. 'default' will use the default widget.
     *
     * @returns The found widget, or `undefined`.
     *
     * #### Notes
     * This can be used to find an existing widget instead of opening
     * a new widget.
     */
    findWidget(path, widgetName = 'default') {
        const newPath = PathExt.normalize(path);
        let widgetNames = [widgetName];
        if (widgetName === 'default') {
            const factory = this.registry.defaultWidgetFactory(newPath);
            if (!factory) {
                return undefined;
            }
            widgetNames = [factory.name];
        }
        else if (widgetName === null) {
            widgetNames = this.registry
                .preferredWidgetFactories(newPath)
                .map(f => f.name);
        }
        for (const context of this._contextsForPath(newPath)) {
            for (const widgetName of widgetNames) {
                if (widgetName !== null) {
                    const widget = this._widgetManager.findWidget(context, widgetName);
                    if (widget) {
                        return widget;
                    }
                }
            }
        }
        return undefined;
    }
    /**
     * Create a new untitled file.
     *
     * @param options - The file content creation options.
     */
    newUntitled(options) {
        if (options.type === 'file') {
            options.ext = options.ext || '.txt';
        }
        return this.services.contents.newUntitled(options);
    }
    /**
     * Open a file and return the widget used to view it.
     *
     * @param path - The file path to open.
     *
     * @param widgetName - The name of the widget factory to use. 'default' will use the default widget.
     *
     * @param kernel - An optional kernel name/id to override the default.
     *
     * @returns The created widget, or `undefined`.
     *
     * #### Notes
     * This function will return `undefined` if a valid widget factory
     * cannot be found.
     */
    open(path, widgetName = 'default', kernel, options) {
        return this._createOrOpenDocument('open', path, widgetName, kernel, options);
    }
    /**
     * Open a file and return the widget used to view it.
     * Reveals an already existing editor.
     *
     * @param path - The file path to open.
     *
     * @param widgetName - The name of the widget factory to use. 'default' will use the default widget.
     *
     * @param kernel - An optional kernel name/id to override the default.
     *
     * @returns The created widget, or `undefined`.
     *
     * #### Notes
     * This function will return `undefined` if a valid widget factory
     * cannot be found.
     */
    openOrReveal(path, widgetName = 'default', kernel, options) {
        const widget = this.findWidget(path, widgetName);
        if (widget) {
            this._opener.open(widget, options || {});
            return widget;
        }
        return this.open(path, widgetName, kernel, options || {});
    }
    /**
     * Overwrite a file.
     *
     * @param oldPath - The full path to the original file.
     *
     * @param newPath - The full path to the new file.
     *
     * @returns A promise containing the new file contents model.
     */
    overwrite(oldPath, newPath) {
        // Cleanly overwrite the file by moving it, making sure the original does
        // not exist, and then renaming to the new path.
        const tempPath = `${newPath}.${UUID.uuid4()}`;
        const cb = () => this.rename(tempPath, newPath);
        return this.rename(oldPath, tempPath)
            .then(() => {
            return this.deleteFile(newPath);
        })
            .then(cb, cb);
    }
    /**
     * Rename a file or directory.
     *
     * @param oldPath - The full path to the original file.
     *
     * @param newPath - The full path to the new file.
     *
     * @returns A promise containing the new file contents model.  The promise
     * will reject if the newPath already exists.  Use [[overwrite]] to overwrite
     * a file.
     */
    rename(oldPath, newPath) {
        return this.services.contents.rename(oldPath, newPath);
    }
    /**
     * Find a context for a given path and factory name.
     */
    _findContext(path, factoryName) {
        const normalizedPath = this.services.contents.normalize(path);
        return find(this._contexts, context => {
            return (context.path === normalizedPath && context.factoryName === factoryName);
        });
    }
    /**
     * Get the contexts for a given path.
     *
     * #### Notes
     * There may be more than one context for a given path if the path is open
     * with multiple model factories (for example, a notebook can be open with a
     * notebook model factory and a text model factory).
     */
    _contextsForPath(path) {
        const normalizedPath = this.services.contents.normalize(path);
        return this._contexts.filter(context => context.path === normalizedPath);
    }
    /**
     * Create a context from a path and a model factory.
     */
    _createContext(path, factory, kernelPreference) {
        // TODO: Make it impossible to open two different contexts for the same
        // path. Or at least prompt the closing of all widgets associated with the
        // old context before opening the new context. This will make things much
        // more consistent for the users, at the cost of some confusion about what
        // models are and why sometimes they cannot open the same file in different
        // widgets that have different models.
        // Allow options to be passed when adding a sibling.
        const adopter = (widget, options) => {
            this._widgetManager.adoptWidget(context, widget);
            this._opener.open(widget, options);
        };
        const modelDBFactory = this.services.contents.getModelDBFactory(path) || undefined;
        const context = new Context({
            opener: adopter,
            manager: this.services,
            factory,
            path,
            kernelPreference,
            modelDBFactory,
            setBusy: this._setBusy,
            sessionDialogs: this._dialogs,
            collaborative: this._collaborative,
            docProviderFactory: this._docProviderFactory,
            lastModifiedCheckMargin: this._lastModifiedCheckMargin,
            translator: this.translator
        });
        const handler = new SaveHandler({
            context,
            saveInterval: this.autosaveInterval
        });
        Private.saveHandlerProperty.set(context, handler);
        void context.ready.then(() => {
            if (this.autosave) {
                handler.start();
            }
        });
        context.disposed.connect(this._onContextDisposed, this);
        this._contexts.push(context);
        return context;
    }
    /**
     * Handle a context disposal.
     */
    _onContextDisposed(context) {
        ArrayExt.removeFirstOf(this._contexts, context);
    }
    /**
     * Get the widget factory for a given widget name.
     */
    _widgetFactoryFor(path, widgetName) {
        const { registry } = this;
        if (widgetName === 'default') {
            const factory = registry.defaultWidgetFactory(path);
            if (!factory) {
                return undefined;
            }
            widgetName = factory.name;
        }
        return registry.getWidgetFactory(widgetName);
    }
    /**
     * Creates a new document, or loads one from disk, depending on the `which` argument.
     * If `which==='create'`, then it creates a new document. If `which==='open'`,
     * then it loads the document from disk.
     *
     * The two cases differ in how the document context is handled, but the creation
     * of the widget and launching of the kernel are identical.
     */
    _createOrOpenDocument(which, path, widgetName = 'default', kernel, options) {
        const widgetFactory = this._widgetFactoryFor(path, widgetName);
        if (!widgetFactory) {
            return undefined;
        }
        const modelName = widgetFactory.modelName || 'text';
        const factory = this.registry.getModelFactory(modelName);
        if (!factory) {
            return undefined;
        }
        // Handle the kernel preference.
        const preference = this.registry.getKernelPreference(path, widgetFactory.name, kernel);
        let context;
        let ready = Promise.resolve(undefined);
        // Handle the load-from-disk case
        if (which === 'open') {
            // Use an existing context if available.
            context = this._findContext(path, factory.name) || null;
            if (!context) {
                context = this._createContext(path, factory, preference);
                // Populate the model, either from disk or a
                // model backend.
                ready = this._when.then(() => context.initialize(false));
            }
        }
        else if (which === 'create') {
            context = this._createContext(path, factory, preference);
            // Immediately save the contents to disk.
            ready = this._when.then(() => context.initialize(true));
        }
        else {
            throw new Error(`Invalid argument 'which': ${which}`);
        }
        const widget = this._widgetManager.createWidget(widgetFactory, context);
        this._opener.open(widget, options || {});
        // If the initial opening of the context fails, dispose of the widget.
        ready.catch(err => {
            console.error(`Failed to initialize the context with '${factory.name}' for ${path}`, err);
            widget.close();
        });
        return widget;
    }
    /**
     * Handle an activateRequested signal from the widget manager.
     */
    _onActivateRequested(sender, args) {
        this._activateRequested.emit(args);
    }
}
/**
 * A namespace for private data.
 */
var Private;
(function (Private) {
    /**
     * An attached property for a context save handler.
     */
    Private.saveHandlerProperty = new AttachedProperty({
        name: 'saveHandler',
        create: () => undefined
    });
})(Private || (Private = {}));
//# sourceMappingURL=manager.js.map