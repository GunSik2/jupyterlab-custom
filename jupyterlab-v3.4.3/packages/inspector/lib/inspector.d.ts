import { Printing } from '@jupyterlab/apputils';
import { ITranslator } from '@jupyterlab/translation';
import { Panel, Widget } from '@lumino/widgets';
import { IInspector } from './tokens';
/**
 * A panel which contains a set of inspectors.
 */
export declare class InspectorPanel extends Panel implements IInspector, Printing.IPrintable {
    /**
     * Construct an inspector.
     */
    constructor(options?: InspectorPanel.IOptions);
    /**
     * Print in iframe
     */
    [Printing.symbol](): () => Promise<void>;
    /**
     * The source of events the inspector panel listens for.
     */
    get source(): IInspector.IInspectable | null;
    set source(source: IInspector.IInspectable | null);
    /**
     * Dispose of the resources held by the widget.
     */
    dispose(): void;
    /**
     * Handle inspector update signals.
     */
    protected onInspectorUpdate(sender: any, args: IInspector.IInspectorUpdate): void;
    /**
     * Handle source disposed signals.
     */
    protected onSourceDisposed(sender: any, args: void): void;
    /**
     * Generate content widget from string
     */
    private static _generateContentWidget;
    protected translator: ITranslator;
    private _trans;
    private _content;
    private _source;
}
export declare namespace InspectorPanel {
    interface IOptions {
        initialContent?: Widget | string | undefined;
        /**
         * The application language translator.
         */
        translator?: ITranslator;
    }
}
