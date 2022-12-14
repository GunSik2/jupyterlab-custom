// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { PathExt } from '@jupyterlab/coreutils';
import { nullTranslator } from '@jupyterlab/translation';
import { fileIcon, folderIcon, imageIcon, jsonIcon, juliaIcon, markdownIcon, notebookIcon, pdfIcon, pythonIcon, rKernelIcon, spreadsheetIcon, yamlIcon } from '@jupyterlab/ui-components';
import { ArrayExt, ArrayIterator, each, empty, find, map } from '@lumino/algorithm';
import { DisposableDelegate } from '@lumino/disposable';
import { Signal } from '@lumino/signaling';
import { TextModelFactory } from './default';
/**
 * The document registry.
 */
export class DocumentRegistry {
    /**
     * Construct a new document registry.
     */
    constructor(options = {}) {
        this._modelFactories = Object.create(null);
        this._widgetFactories = Object.create(null);
        this._defaultWidgetFactory = '';
        this._defaultWidgetFactoryOverrides = Object.create(null);
        this._defaultWidgetFactories = Object.create(null);
        this._defaultRenderedWidgetFactories = Object.create(null);
        this._widgetFactoriesForFileType = Object.create(null);
        this._fileTypes = [];
        this._extenders = Object.create(null);
        this._changed = new Signal(this);
        this._isDisposed = false;
        const factory = options.textModelFactory;
        this.translator = options.translator || nullTranslator;
        if (factory && factory.name !== 'text') {
            throw new Error('Text model factory must have the name `text`');
        }
        this._modelFactories['text'] = factory || new TextModelFactory();
        const fts = options.initialFileTypes ||
            DocumentRegistry.getDefaultFileTypes(this.translator);
        fts.forEach(ft => {
            const value = Object.assign(Object.assign({}, DocumentRegistry.getFileTypeDefaults(this.translator)), ft);
            this._fileTypes.push(value);
        });
    }
    /**
     * A signal emitted when the registry has changed.
     */
    get changed() {
        return this._changed;
    }
    /**
     * Get whether the document registry has been disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Dispose of the resources held by the document registry.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._isDisposed = true;
        for (const modelName in this._modelFactories) {
            this._modelFactories[modelName].dispose();
        }
        for (const widgetName in this._widgetFactories) {
            this._widgetFactories[widgetName].dispose();
        }
        for (const widgetName in this._extenders) {
            this._extenders[widgetName].length = 0;
        }
        this._fileTypes.length = 0;
        Signal.clearData(this);
    }
    /**
     * Add a widget factory to the registry.
     *
     * @param factory - The factory instance to register.
     *
     * @returns A disposable which will unregister the factory.
     *
     * #### Notes
     * If a factory with the given `'name'` is already registered,
     * a warning will be logged, and this will be a no-op.
     * If `'*'` is given as a default extension, the factory will be registered
     * as the global default.
     * If an extension or global default is already registered, this factory
     * will override the existing default.
     * The factory cannot be named an empty string or the string `'default'`.
     */
    addWidgetFactory(factory) {
        const name = factory.name.toLowerCase();
        if (!name || name === 'default') {
            throw Error('Invalid factory name');
        }
        if (this._widgetFactories[name]) {
            console.warn(`Duplicate registered factory ${name}`);
            return new DisposableDelegate(Private.noOp);
        }
        this._widgetFactories[name] = factory;
        for (const ft of factory.defaultFor || []) {
            if (factory.fileTypes.indexOf(ft) === -1) {
                continue;
            }
            if (ft === '*') {
                this._defaultWidgetFactory = name;
            }
            else {
                this._defaultWidgetFactories[ft] = name;
            }
        }
        for (const ft of factory.defaultRendered || []) {
            if (factory.fileTypes.indexOf(ft) === -1) {
                continue;
            }
            this._defaultRenderedWidgetFactories[ft] = name;
        }
        // For convenience, store a mapping of file type name -> name
        for (const ft of factory.fileTypes) {
            if (!this._widgetFactoriesForFileType[ft]) {
                this._widgetFactoriesForFileType[ft] = [];
            }
            this._widgetFactoriesForFileType[ft].push(name);
        }
        this._changed.emit({
            type: 'widgetFactory',
            name,
            change: 'added'
        });
        return new DisposableDelegate(() => {
            delete this._widgetFactories[name];
            if (this._defaultWidgetFactory === name) {
                this._defaultWidgetFactory = '';
            }
            for (const ext of Object.keys(this._defaultWidgetFactories)) {
                if (this._defaultWidgetFactories[ext] === name) {
                    delete this._defaultWidgetFactories[ext];
                }
            }
            for (const ext of Object.keys(this._defaultRenderedWidgetFactories)) {
                if (this._defaultRenderedWidgetFactories[ext] === name) {
                    delete this._defaultRenderedWidgetFactories[ext];
                }
            }
            for (const ext of Object.keys(this._widgetFactoriesForFileType)) {
                ArrayExt.removeFirstOf(this._widgetFactoriesForFileType[ext], name);
                if (this._widgetFactoriesForFileType[ext].length === 0) {
                    delete this._widgetFactoriesForFileType[ext];
                }
            }
            for (const ext of Object.keys(this._defaultWidgetFactoryOverrides)) {
                if (this._defaultWidgetFactoryOverrides[ext] === name) {
                    delete this._defaultWidgetFactoryOverrides[ext];
                }
            }
            this._changed.emit({
                type: 'widgetFactory',
                name,
                change: 'removed'
            });
        });
    }
    /**
     * Add a model factory to the registry.
     *
     * @param factory - The factory instance.
     *
     * @returns A disposable which will unregister the factory.
     *
     * #### Notes
     * If a factory with the given `name` is already registered, or
     * the given factory is already registered, a warning will be logged
     * and this will be a no-op.
     */
    addModelFactory(factory) {
        const name = factory.name.toLowerCase();
        if (this._modelFactories[name]) {
            console.warn(`Duplicate registered factory ${name}`);
            return new DisposableDelegate(Private.noOp);
        }
        this._modelFactories[name] = factory;
        this._changed.emit({
            type: 'modelFactory',
            name,
            change: 'added'
        });
        return new DisposableDelegate(() => {
            delete this._modelFactories[name];
            this._changed.emit({
                type: 'modelFactory',
                name,
                change: 'removed'
            });
        });
    }
    /**
     * Add a widget extension to the registry.
     *
     * @param widgetName - The name of the widget factory.
     *
     * @param extension - A widget extension.
     *
     * @returns A disposable which will unregister the extension.
     *
     * #### Notes
     * If the extension is already registered for the given
     * widget name, a warning will be logged and this will be a no-op.
     */
    addWidgetExtension(widgetName, extension) {
        widgetName = widgetName.toLowerCase();
        if (!(widgetName in this._extenders)) {
            this._extenders[widgetName] = [];
        }
        const extenders = this._extenders[widgetName];
        const index = ArrayExt.firstIndexOf(extenders, extension);
        if (index !== -1) {
            console.warn(`Duplicate registered extension for ${widgetName}`);
            return new DisposableDelegate(Private.noOp);
        }
        this._extenders[widgetName].push(extension);
        this._changed.emit({
            type: 'widgetExtension',
            name: widgetName,
            change: 'added'
        });
        return new DisposableDelegate(() => {
            ArrayExt.removeFirstOf(this._extenders[widgetName], extension);
            this._changed.emit({
                type: 'widgetExtension',
                name: widgetName,
                change: 'removed'
            });
        });
    }
    /**
     * Add a file type to the document registry.
     *
     * @param fileType - The file type object to register.
     * @param factories - Optional factories to use for the file type.
     *
     * @returns A disposable which will unregister the command.
     *
     * #### Notes
     * These are used to populate the "Create New" dialog.
     *
     * If no default factory exists for the file type, the first factory will
     * be defined as default factory.
     */
    addFileType(fileType, factories) {
        const value = Object.assign(Object.assign(Object.assign({}, DocumentRegistry.getFileTypeDefaults(this.translator)), fileType), (!(fileType.icon || fileType.iconClass) && { icon: fileIcon }));
        this._fileTypes.push(value);
        // Add the filetype to the factory - filetype mapping
        //  We do not change the factory itself
        if (factories) {
            const fileTypeName = value.name.toLowerCase();
            factories
                .map(factory => factory.toLowerCase())
                .forEach(factory => {
                if (!this._widgetFactoriesForFileType[fileTypeName]) {
                    this._widgetFactoriesForFileType[fileTypeName] = [];
                }
                if (!this._widgetFactoriesForFileType[fileTypeName].includes(factory)) {
                    this._widgetFactoriesForFileType[fileTypeName].push(factory);
                }
            });
            if (!this._defaultWidgetFactories[fileTypeName]) {
                this._defaultWidgetFactories[fileTypeName] = this._widgetFactoriesForFileType[fileTypeName][0];
            }
        }
        this._changed.emit({
            type: 'fileType',
            name: value.name,
            change: 'added'
        });
        return new DisposableDelegate(() => {
            ArrayExt.removeFirstOf(this._fileTypes, value);
            if (factories) {
                const fileTypeName = value.name.toLowerCase();
                for (const name of factories.map(factory => factory.toLowerCase())) {
                    ArrayExt.removeFirstOf(this._widgetFactoriesForFileType[fileTypeName], name);
                }
                if (this._defaultWidgetFactories[fileTypeName] ===
                    factories[0].toLowerCase()) {
                    delete this._defaultWidgetFactories[fileTypeName];
                }
            }
            this._changed.emit({
                type: 'fileType',
                name: fileType.name,
                change: 'removed'
            });
        });
    }
    /**
     * Get a list of the preferred widget factories.
     *
     * @param path - The file path to filter the results.
     *
     * @returns A new array of widget factories.
     *
     * #### Notes
     * Only the widget factories whose associated model factory have
     * been registered will be returned.
     * The first item is considered the default. The returned array
     * has widget factories in the following order:
     * - path-specific default factory
     * - path-specific default rendered factory
     * - global default factory
     * - all other path-specific factories
     * - all other global factories
     */
    preferredWidgetFactories(path) {
        const factories = new Set();
        // Get the ordered matching file types.
        const fts = this.getFileTypesForPath(PathExt.basename(path));
        // Start with any user overrides for the defaults.
        fts.forEach(ft => {
            if (ft.name in this._defaultWidgetFactoryOverrides) {
                factories.add(this._defaultWidgetFactoryOverrides[ft.name]);
            }
        });
        // Next add the file type default factories.
        fts.forEach(ft => {
            if (ft.name in this._defaultWidgetFactories) {
                factories.add(this._defaultWidgetFactories[ft.name]);
            }
        });
        // Add the file type default rendered factories.
        fts.forEach(ft => {
            if (ft.name in this._defaultRenderedWidgetFactories) {
                factories.add(this._defaultRenderedWidgetFactories[ft.name]);
            }
        });
        // Add the global default factory.
        if (this._defaultWidgetFactory) {
            factories.add(this._defaultWidgetFactory);
        }
        // Add the file type factories in registration order.
        fts.forEach(ft => {
            if (ft.name in this._widgetFactoriesForFileType) {
                each(this._widgetFactoriesForFileType[ft.name], n => {
                    factories.add(n);
                });
            }
        });
        // Add the rest of the global factories, in registration order.
        if ('*' in this._widgetFactoriesForFileType) {
            each(this._widgetFactoriesForFileType['*'], n => {
                factories.add(n);
            });
        }
        // Construct the return list, checking to make sure the corresponding
        // model factories are registered.
        const factoryList = [];
        factories.forEach(name => {
            const factory = this._widgetFactories[name];
            if (!factory) {
                return;
            }
            const modelName = factory.modelName || 'text';
            if (modelName in this._modelFactories) {
                factoryList.push(factory);
            }
        });
        return factoryList;
    }
    /**
     * Get the default rendered widget factory for a path.
     *
     * @param path - The path to for which to find a widget factory.
     *
     * @returns The default rendered widget factory for the path.
     *
     * ### Notes
     * If the widget factory has registered a separate set of `defaultRendered`
     * file types and there is a match in that set, this returns that.
     * Otherwise, this returns the same widget factory as
     * [[defaultWidgetFactory]].
     */
    defaultRenderedWidgetFactory(path) {
        // Get the matching file types.
        const fts = this.getFileTypesForPath(PathExt.basename(path));
        let factory = undefined;
        // Find if a there is a default rendered factory for this type.
        for (const ft of fts) {
            if (ft.name in this._defaultRenderedWidgetFactories) {
                factory = this._widgetFactories[this._defaultRenderedWidgetFactories[ft.name]];
                break;
            }
        }
        return factory || this.defaultWidgetFactory(path);
    }
    /**
     * Get the default widget factory for a path.
     *
     * @param path - An optional file path to filter the results.
     *
     * @returns The default widget factory for an path.
     *
     * #### Notes
     * This is equivalent to the first value in [[preferredWidgetFactories]].
     */
    defaultWidgetFactory(path) {
        if (!path) {
            return this._widgetFactories[this._defaultWidgetFactory];
        }
        return this.preferredWidgetFactories(path)[0];
    }
    /**
     * Set overrides for the default widget factory for a file type.
     *
     * Normally, a widget factory informs the document registry which file types
     * it should be the default for using the `defaultFor` option in the
     * IWidgetFactoryOptions. This function can be used to override that after
     * the fact.
     *
     * @param fileType: The name of the file type.
     *
     * @param factory: The name of the factory.
     *
     * #### Notes
     * If `factory` is undefined, then any override will be unset, and the
     * default factory will revert to the original value.
     *
     * If `factory` or `fileType` are not known to the docregistry, or
     * if `factory` cannot open files of type `fileType`, this will throw
     * an error.
     */
    setDefaultWidgetFactory(fileType, factory) {
        fileType = fileType.toLowerCase();
        if (!this.getFileType(fileType)) {
            throw Error(`Cannot find file type ${fileType}`);
        }
        if (!factory) {
            if (this._defaultWidgetFactoryOverrides[fileType]) {
                delete this._defaultWidgetFactoryOverrides[fileType];
            }
            return;
        }
        if (!this.getWidgetFactory(factory)) {
            throw Error(`Cannot find widget factory ${factory}`);
        }
        factory = factory.toLowerCase();
        const factories = this._widgetFactoriesForFileType[fileType];
        if (factory !== this._defaultWidgetFactory &&
            !(factories && factories.includes(factory))) {
            throw Error(`Factory ${factory} cannot view file type ${fileType}`);
        }
        this._defaultWidgetFactoryOverrides[fileType] = factory;
    }
    /**
     * Create an iterator over the widget factories that have been registered.
     *
     * @returns A new iterator of widget factories.
     */
    widgetFactories() {
        return map(Object.keys(this._widgetFactories), name => {
            return this._widgetFactories[name];
        });
    }
    /**
     * Create an iterator over the model factories that have been registered.
     *
     * @returns A new iterator of model factories.
     */
    modelFactories() {
        return map(Object.keys(this._modelFactories), name => {
            return this._modelFactories[name];
        });
    }
    /**
     * Create an iterator over the registered extensions for a given widget.
     *
     * @param widgetName - The name of the widget factory.
     *
     * @returns A new iterator over the widget extensions.
     */
    widgetExtensions(widgetName) {
        widgetName = widgetName.toLowerCase();
        if (!(widgetName in this._extenders)) {
            return empty();
        }
        return new ArrayIterator(this._extenders[widgetName]);
    }
    /**
     * Create an iterator over the file types that have been registered.
     *
     * @returns A new iterator of file types.
     */
    fileTypes() {
        return new ArrayIterator(this._fileTypes);
    }
    /**
     * Get a widget factory by name.
     *
     * @param widgetName - The name of the widget factory.
     *
     * @returns A widget factory instance.
     */
    getWidgetFactory(widgetName) {
        return this._widgetFactories[widgetName.toLowerCase()];
    }
    /**
     * Get a model factory by name.
     *
     * @param name - The name of the model factory.
     *
     * @returns A model factory instance.
     */
    getModelFactory(name) {
        return this._modelFactories[name.toLowerCase()];
    }
    /**
     * Get a file type by name.
     */
    getFileType(name) {
        name = name.toLowerCase();
        return find(this._fileTypes, fileType => {
            return fileType.name.toLowerCase() === name;
        });
    }
    /**
     * Get a kernel preference.
     *
     * @param path - The file path.
     *
     * @param widgetName - The name of the widget factory.
     *
     * @param kernel - An optional existing kernel model.
     *
     * @returns A kernel preference.
     */
    getKernelPreference(path, widgetName, kernel) {
        widgetName = widgetName.toLowerCase();
        const widgetFactory = this._widgetFactories[widgetName];
        if (!widgetFactory) {
            return void 0;
        }
        const modelFactory = this.getModelFactory(widgetFactory.modelName || 'text');
        if (!modelFactory) {
            return void 0;
        }
        const language = modelFactory.preferredLanguage(PathExt.basename(path));
        const name = kernel && kernel.name;
        const id = kernel && kernel.id;
        return {
            id,
            name,
            language,
            shouldStart: widgetFactory.preferKernel,
            canStart: widgetFactory.canStartKernel,
            shutdownOnDispose: widgetFactory.shutdownOnClose
        };
    }
    /**
     * Get the best file type given a contents model.
     *
     * @param model - The contents model of interest.
     *
     * @returns The best matching file type.
     */
    getFileTypeForModel(model) {
        switch (model.type) {
            case 'directory':
                return (find(this._fileTypes, ft => ft.contentType === 'directory') ||
                    DocumentRegistry.getDefaultDirectoryFileType(this.translator));
            case 'notebook':
                return (find(this._fileTypes, ft => ft.contentType === 'notebook') ||
                    DocumentRegistry.getDefaultNotebookFileType(this.translator));
            default:
                // Find the best matching extension.
                if (model.name || model.path) {
                    const name = model.name || PathExt.basename(model.path);
                    const fts = this.getFileTypesForPath(name);
                    if (fts.length > 0) {
                        return fts[0];
                    }
                }
                return (this.getFileType('text') ||
                    DocumentRegistry.getDefaultTextFileType(this.translator));
        }
    }
    /**
     * Get the file types that match a file name.
     *
     * @param path - The path of the file.
     *
     * @returns An ordered list of matching file types.
     */
    getFileTypesForPath(path) {
        const fts = [];
        const name = PathExt.basename(path);
        // Look for a pattern match first.
        let ft = find(this._fileTypes, ft => {
            return !!(ft.pattern && name.match(ft.pattern) !== null);
        });
        if (ft) {
            fts.push(ft);
        }
        // Then look by extension name, starting with the longest
        let ext = Private.extname(name);
        while (ext.length > 1) {
            const ftSubset = this._fileTypes.filter(ft => 
            // In Private.extname, the extension is transformed to lower case
            ft.extensions.map(extension => extension.toLowerCase()).includes(ext));
            fts.push(...ftSubset);
            ext = '.' + ext.split('.').slice(2).join('.');
        }
        return fts;
    }
}
/**
 * The namespace for the `DocumentRegistry` class statics.
 */
(function (DocumentRegistry) {
    /**
     * The defaults used for a file type.
     *
     * @param translator - The application language translator.
     *
     * @returns The default file type.
     */
    function getFileTypeDefaults(translator) {
        translator = translator || nullTranslator;
        const trans = translator === null || translator === void 0 ? void 0 : translator.load('jupyterlab');
        return {
            name: 'default',
            displayName: trans.__('default'),
            extensions: [],
            mimeTypes: [],
            contentType: 'file',
            fileFormat: 'text'
        };
    }
    DocumentRegistry.getFileTypeDefaults = getFileTypeDefaults;
    /**
     * The default text file type used by the document registry.
     *
     * @param translator - The application language translator.
     *
     * @returns The default text file type.
     */
    function getDefaultTextFileType(translator) {
        translator = translator || nullTranslator;
        const trans = translator === null || translator === void 0 ? void 0 : translator.load('jupyterlab');
        const fileTypeDefaults = getFileTypeDefaults(translator);
        return Object.assign(Object.assign({}, fileTypeDefaults), { name: 'text', displayName: trans.__('Text'), mimeTypes: ['text/plain'], extensions: ['.txt'], icon: fileIcon });
    }
    DocumentRegistry.getDefaultTextFileType = getDefaultTextFileType;
    /**
     * The default notebook file type used by the document registry.
     *
     * @param translator - The application language translator.
     *
     * @returns The default notebook file type.
     */
    function getDefaultNotebookFileType(translator) {
        translator = translator || nullTranslator;
        const trans = translator === null || translator === void 0 ? void 0 : translator.load('jupyterlab');
        return Object.assign(Object.assign({}, getFileTypeDefaults(translator)), { name: 'notebook', displayName: trans.__('Notebook'), mimeTypes: ['application/x-ipynb+json'], extensions: ['.ipynb'], contentType: 'notebook', fileFormat: 'json', icon: notebookIcon });
    }
    DocumentRegistry.getDefaultNotebookFileType = getDefaultNotebookFileType;
    /**
     * The default directory file type used by the document registry.
     *
     * @param translator - The application language translator.
     *
     * @returns The default directory file type.
     */
    function getDefaultDirectoryFileType(translator) {
        translator = translator || nullTranslator;
        const trans = translator === null || translator === void 0 ? void 0 : translator.load('jupyterlab');
        return Object.assign(Object.assign({}, getFileTypeDefaults(translator)), { name: 'directory', displayName: trans.__('Directory'), extensions: [], mimeTypes: ['text/directory'], contentType: 'directory', icon: folderIcon });
    }
    DocumentRegistry.getDefaultDirectoryFileType = getDefaultDirectoryFileType;
    /**
     * The default file types used by the document registry.
     *
     * @param translator - The application language translator.
     *
     * @returns The default directory file types.
     */
    function getDefaultFileTypes(translator) {
        translator = translator || nullTranslator;
        const trans = translator === null || translator === void 0 ? void 0 : translator.load('jupyterlab');
        return [
            getDefaultTextFileType(translator),
            getDefaultNotebookFileType(translator),
            getDefaultDirectoryFileType(translator),
            {
                name: 'markdown',
                displayName: trans.__('Markdown File'),
                extensions: ['.md'],
                mimeTypes: ['text/markdown'],
                icon: markdownIcon
            },
            {
                name: 'PDF',
                displayName: trans.__('PDF File'),
                extensions: ['.pdf'],
                mimeTypes: ['application/pdf'],
                icon: pdfIcon
            },
            {
                name: 'python',
                displayName: trans.__('Python File'),
                extensions: ['.py'],
                mimeTypes: ['text/x-python'],
                icon: pythonIcon
            },
            {
                name: 'json',
                displayName: trans.__('JSON File'),
                extensions: ['.json'],
                mimeTypes: ['application/json'],
                icon: jsonIcon
            },
            {
                name: 'julia',
                displayName: trans.__('Julia File'),
                extensions: ['.jl'],
                mimeTypes: ['text/x-julia'],
                icon: juliaIcon
            },
            {
                name: 'csv',
                displayName: trans.__('CSV File'),
                extensions: ['.csv'],
                mimeTypes: ['text/csv'],
                icon: spreadsheetIcon
            },
            {
                name: 'tsv',
                displayName: trans.__('TSV File'),
                extensions: ['.tsv'],
                mimeTypes: ['text/csv'],
                icon: spreadsheetIcon
            },
            {
                name: 'r',
                displayName: trans.__('R File'),
                mimeTypes: ['text/x-rsrc'],
                extensions: ['.R'],
                icon: rKernelIcon
            },
            {
                name: 'yaml',
                displayName: trans.__('YAML File'),
                mimeTypes: ['text/x-yaml', 'text/yaml'],
                extensions: ['.yaml', '.yml'],
                icon: yamlIcon
            },
            {
                name: 'svg',
                displayName: trans.__('Image'),
                mimeTypes: ['image/svg+xml'],
                extensions: ['.svg'],
                icon: imageIcon,
                fileFormat: 'base64'
            },
            {
                name: 'tiff',
                displayName: trans.__('Image'),
                mimeTypes: ['image/tiff'],
                extensions: ['.tif', '.tiff'],
                icon: imageIcon,
                fileFormat: 'base64'
            },
            {
                name: 'jpeg',
                displayName: trans.__('Image'),
                mimeTypes: ['image/jpeg'],
                extensions: ['.jpg', '.jpeg'],
                icon: imageIcon,
                fileFormat: 'base64'
            },
            {
                name: 'gif',
                displayName: trans.__('Image'),
                mimeTypes: ['image/gif'],
                extensions: ['.gif'],
                icon: imageIcon,
                fileFormat: 'base64'
            },
            {
                name: 'png',
                displayName: trans.__('Image'),
                mimeTypes: ['image/png'],
                extensions: ['.png'],
                icon: imageIcon,
                fileFormat: 'base64'
            },
            {
                name: 'bmp',
                displayName: trans.__('Image'),
                mimeTypes: ['image/bmp'],
                extensions: ['.bmp'],
                icon: imageIcon,
                fileFormat: 'base64'
            }
        ];
    }
    DocumentRegistry.getDefaultFileTypes = getDefaultFileTypes;
})(DocumentRegistry || (DocumentRegistry = {}));
/**
 * A private namespace for DocumentRegistry data.
 */
var Private;
(function (Private) {
    /**
     * Get the extension name of a path.
     *
     * @param file - string.
     *
     * #### Notes
     * Dotted filenames (e.g. `".table.json"` are allowed).
     */
    function extname(path) {
        const parts = PathExt.basename(path).split('.');
        parts.shift();
        const ext = '.' + parts.join('.');
        return ext.toLowerCase();
    }
    Private.extname = extname;
    /**
     * A no-op function.
     */
    function noOp() {
        /* no-op */
    }
    Private.noOp = noOp;
})(Private || (Private = {}));
//# sourceMappingURL=registry.js.map