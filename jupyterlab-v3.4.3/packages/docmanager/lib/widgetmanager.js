// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { Time } from '@jupyterlab/coreutils';
import { nullTranslator } from '@jupyterlab/translation';
import { ArrayExt, each, filter, find, map, toArray } from '@lumino/algorithm';
import { DisposableSet } from '@lumino/disposable';
import { MessageLoop } from '@lumino/messaging';
import { AttachedProperty } from '@lumino/properties';
import { Signal } from '@lumino/signaling';
/**
 * The class name added to document widgets.
 */
const DOCUMENT_CLASS = 'jp-Document';
/**
 * A class that maintains the lifecycle of file-backed widgets.
 */
export class DocumentWidgetManager {
    /**
     * Construct a new document widget manager.
     */
    constructor(options) {
        this._activateRequested = new Signal(this);
        this._isDisposed = false;
        this._registry = options.registry;
        this.translator = options.translator || nullTranslator;
    }
    /**
     * A signal emitted when one of the documents is activated.
     */
    get activateRequested() {
        return this._activateRequested;
    }
    /**
     * Test whether the document widget manager is disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Dispose of the resources used by the widget manager.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._isDisposed = true;
        Signal.disconnectReceiver(this);
    }
    /**
     * Create a widget for a document and handle its lifecycle.
     *
     * @param factory - The widget factory.
     *
     * @param context - The document context object.
     *
     * @returns A widget created by the factory.
     *
     * @throws If the factory is not registered.
     */
    createWidget(factory, context) {
        const widget = factory.createNew(context);
        this._initializeWidget(widget, factory, context);
        return widget;
    }
    /**
     * When a new widget is created, we need to hook it up
     * with some signals, update the widget extensions (for
     * this kind of widget) in the docregistry, among
     * other things.
     */
    _initializeWidget(widget, factory, context) {
        Private.factoryProperty.set(widget, factory);
        // Handle widget extensions.
        const disposables = new DisposableSet();
        each(this._registry.widgetExtensions(factory.name), extender => {
            const disposable = extender.createNew(widget, context);
            if (disposable) {
                disposables.add(disposable);
            }
        });
        Private.disposablesProperty.set(widget, disposables);
        widget.disposed.connect(this._onWidgetDisposed, this);
        this.adoptWidget(context, widget);
        context.fileChanged.connect(this._onFileChanged, this);
        context.pathChanged.connect(this._onPathChanged, this);
        void context.ready.then(() => {
            void this.setCaption(widget);
        });
    }
    /**
     * Install the message hook for the widget and add to list
     * of known widgets.
     *
     * @param context - The document context object.
     *
     * @param widget - The widget to adopt.
     */
    adoptWidget(context, widget) {
        const widgets = Private.widgetsProperty.get(context);
        widgets.push(widget);
        MessageLoop.installMessageHook(widget, this);
        widget.addClass(DOCUMENT_CLASS);
        widget.title.closable = true;
        widget.disposed.connect(this._widgetDisposed, this);
        Private.contextProperty.set(widget, context);
    }
    /**
     * See if a widget already exists for the given context and widget name.
     *
     * @param context - The document context object.
     *
     * @returns The found widget, or `undefined`.
     *
     * #### Notes
     * This can be used to use an existing widget instead of opening
     * a new widget.
     */
    findWidget(context, widgetName) {
        const widgets = Private.widgetsProperty.get(context);
        if (!widgets) {
            return undefined;
        }
        return find(widgets, widget => {
            const factory = Private.factoryProperty.get(widget);
            if (!factory) {
                return false;
            }
            return factory.name === widgetName;
        });
    }
    /**
     * Get the document context for a widget.
     *
     * @param widget - The widget of interest.
     *
     * @returns The context associated with the widget, or `undefined`.
     */
    contextForWidget(widget) {
        return Private.contextProperty.get(widget);
    }
    /**
     * Clone a widget.
     *
     * @param widget - The source widget.
     *
     * @returns A new widget or `undefined`.
     *
     * #### Notes
     *  Uses the same widget factory and context as the source, or throws
     *  if the source widget is not managed by this manager.
     */
    cloneWidget(widget) {
        const context = Private.contextProperty.get(widget);
        if (!context) {
            return undefined;
        }
        const factory = Private.factoryProperty.get(widget);
        if (!factory) {
            return undefined;
        }
        const newWidget = factory.createNew(context, widget);
        this._initializeWidget(newWidget, factory, context);
        return newWidget;
    }
    /**
     * Close the widgets associated with a given context.
     *
     * @param context - The document context object.
     */
    closeWidgets(context) {
        const widgets = Private.widgetsProperty.get(context);
        return Promise.all(toArray(map(widgets, widget => this.onClose(widget)))).then(() => undefined);
    }
    /**
     * Dispose of the widgets associated with a given context
     * regardless of the widget's dirty state.
     *
     * @param context - The document context object.
     */
    deleteWidgets(context) {
        const widgets = Private.widgetsProperty.get(context);
        return Promise.all(toArray(map(widgets, widget => this.onDelete(widget)))).then(() => undefined);
    }
    /**
     * Filter a message sent to a message handler.
     *
     * @param handler - The target handler of the message.
     *
     * @param msg - The message dispatched to the handler.
     *
     * @returns `false` if the message should be filtered, of `true`
     *   if the message should be dispatched to the handler as normal.
     */
    messageHook(handler, msg) {
        switch (msg.type) {
            case 'close-request':
                void this.onClose(handler);
                return false;
            case 'activate-request': {
                const context = this.contextForWidget(handler);
                if (context) {
                    this._activateRequested.emit(context.path);
                }
                break;
            }
            default:
                break;
        }
        return true;
    }
    /**
     * Set the caption for widget title.
     *
     * @param widget - The target widget.
     */
    async setCaption(widget) {
        const trans = this.translator.load('jupyterlab');
        const context = Private.contextProperty.get(widget);
        if (!context) {
            return;
        }
        const model = context.contentsModel;
        if (!model) {
            widget.title.caption = '';
            return;
        }
        return context
            .listCheckpoints()
            .then((checkpoints) => {
            if (widget.isDisposed) {
                return;
            }
            const last = checkpoints[checkpoints.length - 1];
            const checkpoint = last ? Time.format(last.last_modified) : 'None';
            let caption = trans.__('Name: %1\nPath: %2\n', model.name, model.path);
            if (context.model.readOnly) {
                caption += trans.__('Read-only');
            }
            else {
                caption +=
                    trans.__('Last Saved: %1\n', Time.format(model.last_modified)) +
                        trans.__('Last Checkpoint: %1', checkpoint);
            }
            widget.title.caption = caption;
        });
    }
    /**
     * Handle `'close-request'` messages.
     *
     * @param widget - The target widget.
     *
     * @returns A promise that resolves with whether the widget was closed.
     */
    async onClose(widget) {
        var _a;
        // Handle dirty state.
        const [shouldClose, ignoreSave] = await this._maybeClose(widget, this.translator);
        if (widget.isDisposed) {
            return true;
        }
        if (shouldClose) {
            if (!ignoreSave) {
                const context = Private.contextProperty.get(widget);
                if (!context) {
                    return true;
                }
                if ((_a = context.contentsModel) === null || _a === void 0 ? void 0 : _a.writable) {
                    await context.save();
                }
                else {
                    await context.saveAs();
                }
            }
            if (widget.isDisposed) {
                return true;
            }
            widget.dispose();
        }
        return shouldClose;
    }
    /**
     * Dispose of widget regardless of widget's dirty state.
     *
     * @param widget - The target widget.
     */
    onDelete(widget) {
        widget.dispose();
        return Promise.resolve(void 0);
    }
    /**
     * Ask the user whether to close an unsaved file.
     */
    _maybeClose(widget, translator) {
        var _a;
        translator = translator || nullTranslator;
        const trans = translator.load('jupyterlab');
        // Bail if the model is not dirty or other widgets are using the model.)
        const context = Private.contextProperty.get(widget);
        if (!context) {
            return Promise.resolve([true, true]);
        }
        let widgets = Private.widgetsProperty.get(context);
        if (!widgets) {
            return Promise.resolve([true, true]);
        }
        // Filter by whether the factories are read only.
        widgets = toArray(filter(widgets, widget => {
            const factory = Private.factoryProperty.get(widget);
            if (!factory) {
                return false;
            }
            return factory.readOnly === false;
        }));
        const factory = Private.factoryProperty.get(widget);
        if (!factory) {
            return Promise.resolve([true, true]);
        }
        const model = context.model;
        if (!model.dirty || widgets.length > 1 || factory.readOnly) {
            return Promise.resolve([true, true]);
        }
        const fileName = widget.title.label;
        const saveLabel = ((_a = context.contentsModel) === null || _a === void 0 ? void 0 : _a.writable) ? trans.__('Save')
            : trans.__('Save as');
        return showDialog({
            title: trans.__('Save your work'),
            body: trans.__('Save changes in "%1" before closing?', fileName),
            buttons: [
                Dialog.cancelButton({ label: trans.__('Cancel') }),
                Dialog.warnButton({ label: trans.__('Discard') }),
                Dialog.okButton({ label: saveLabel })
            ]
        }).then(result => {
            return [result.button.accept, result.button.displayType === 'warn'];
        });
    }
    /**
     * Handle the disposal of a widget.
     */
    _widgetDisposed(widget) {
        const context = Private.contextProperty.get(widget);
        if (!context) {
            return;
        }
        const widgets = Private.widgetsProperty.get(context);
        if (!widgets) {
            return;
        }
        // Remove the widget.
        ArrayExt.removeFirstOf(widgets, widget);
        // Dispose of the context if this is the last widget using it.
        if (!widgets.length) {
            context.dispose();
        }
    }
    /**
     * Handle the disposal of a widget.
     */
    _onWidgetDisposed(widget) {
        const disposables = Private.disposablesProperty.get(widget);
        disposables.dispose();
    }
    /**
     * Handle a file changed signal for a context.
     */
    _onFileChanged(context) {
        const widgets = Private.widgetsProperty.get(context);
        each(widgets, widget => {
            void this.setCaption(widget);
        });
    }
    /**
     * Handle a path changed signal for a context.
     */
    _onPathChanged(context) {
        const widgets = Private.widgetsProperty.get(context);
        each(widgets, widget => {
            void this.setCaption(widget);
        });
    }
}
/**
 * A private namespace for DocumentManager data.
 */
var Private;
(function (Private) {
    /**
     * A private attached property for a widget context.
     */
    Private.contextProperty = new AttachedProperty({
        name: 'context',
        create: () => undefined
    });
    /**
     * A private attached property for a widget factory.
     */
    Private.factoryProperty = new AttachedProperty({
        name: 'factory',
        create: () => undefined
    });
    /**
     * A private attached property for the widgets associated with a context.
     */
    Private.widgetsProperty = new AttachedProperty({
        name: 'widgets',
        create: () => []
    });
    /**
     * A private attached property for a widget's disposables.
     */
    Private.disposablesProperty = new AttachedProperty({
        name: 'disposables',
        create: () => new DisposableSet()
    });
})(Private || (Private = {}));
//# sourceMappingURL=widgetmanager.js.map