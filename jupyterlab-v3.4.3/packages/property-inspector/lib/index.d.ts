/**
 * @packageDocumentation
 * @module property-inspector
 */
import { ILabShell } from '@jupyterlab/application';
import { ITranslator } from '@jupyterlab/translation';
import { Widget } from '@lumino/widgets';
import { IPropertyInspector, IPropertyInspectorProvider } from './token';
export { IPropertyInspector, IPropertyInspectorProvider };
/**
 * The implementation of the PropertyInspector.
 */
declare abstract class PropertyInspectorProvider extends Widget implements IPropertyInspectorProvider {
    /**
     * Construct a new Property Inspector.
     */
    constructor();
    /**
     * Register a widget in the property inspector provider.
     *
     * @param widget The owner widget to register.
     */
    register(widget: Widget): IPropertyInspector;
    /**
     * The current widget being tracked by the inspector.
     */
    protected get currentWidget(): Widget | null;
    /**
     * Refresh the content for the current widget.
     */
    protected refresh(): void;
    /**
     * Show the provider panel.
     */
    protected abstract showPanel(): void;
    /**
     * Set the content of the provider.
     */
    protected abstract setContent(content: Widget | null): void;
    /**
     * Handle the disposal of a widget.
     */
    private _onWidgetDisposed;
    /**
     * Handle inspector actions.
     */
    private _onInspectorAction;
    /**
     * Handle a change to the current widget in the tracker.
     */
    private _onCurrentChanged;
    private _tracker;
    private _inspectors;
}
/**
 * A class that adds a property inspector provider to the
 * JupyterLab sidebar.
 */
export declare class SideBarPropertyInspectorProvider extends PropertyInspectorProvider {
    /**
     * Construct a new Side Bar Property Inspector.
     */
    constructor(labshell: ILabShell, placeholder?: Widget, translator?: ITranslator);
    /**
     * Set the content of the sidebar panel.
     */
    protected setContent(content: Widget | null): void;
    /**
     * Show the sidebar panel.
     */
    showPanel(): void;
    /**
     * Handle the case when the current widget is not in our tracker.
     */
    private _onShellCurrentChanged;
    protected translator: ITranslator;
    private _trans;
    private _labshell;
    private _placeholder;
}
