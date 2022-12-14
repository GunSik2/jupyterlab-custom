import * as nbformat from '@jupyterlab/nbformat';
import { IObservableList } from '@jupyterlab/observables';
import { IOutputModel } from '@jupyterlab/rendermime';
import { IDisposable } from '@lumino/disposable';
import { ISignal } from '@lumino/signaling';
/**
 * The model for an output area.
 */
export interface IOutputAreaModel extends IDisposable {
    /**
     * A signal emitted when the model state changes.
     */
    readonly stateChanged: ISignal<IOutputAreaModel, void>;
    /**
     * A signal emitted when the model changes.
     */
    readonly changed: ISignal<IOutputAreaModel, IOutputAreaModel.ChangedArgs>;
    /**
     * The length of the items in the model.
     */
    readonly length: number;
    /**
     * Whether the output area is trusted.
     */
    trusted: boolean;
    /**
     * The output content factory used by the model.
     */
    readonly contentFactory: IOutputAreaModel.IContentFactory;
    /**
     * Get an item at the specified index.
     */
    get(index: number): IOutputModel;
    /**
     * Add an output, which may be combined with previous output.
     *
     * @returns The total number of outputs.
     *
     * #### Notes
     * The output bundle is copied.
     * Contiguous stream outputs of the same `name` are combined.
     */
    add(output: nbformat.IOutput): number;
    /**
     * Set the value at the specified index.
     */
    set(index: number, output: nbformat.IOutput): void;
    /**
     * Clear all of the output.
     *
     * @param wait - Delay clearing the output until the next message is added.
     */
    clear(wait?: boolean): void;
    /**
     * Deserialize the model from JSON.
     *
     * #### Notes
     * This will clear any existing data.
     */
    fromJSON(values: nbformat.IOutput[]): void;
    /**
     * Serialize the model to JSON.
     */
    toJSON(): nbformat.IOutput[];
    /**
     * The maximum number of output items to display on top and bottom of cell output.
     */
    maxNumberOutputs?: number;
}
/**
 * The namespace for IOutputAreaModel interfaces.
 */
export declare namespace IOutputAreaModel {
    /**
     * The options used to create a output area model.
     */
    interface IOptions {
        /**
         * The initial values for the model.
         */
        values?: nbformat.IOutput[];
        /**
         * Whether the output is trusted.  The default is false.
         */
        trusted?: boolean;
        /**
         * The output content factory used by the model.
         *
         * If not given, a default factory will be used.
         */
        contentFactory?: IContentFactory;
    }
    /**
     * A type alias for changed args.
     */
    type ChangedArgs = IObservableList.IChangedArgs<IOutputModel>;
    /**
     * The interface for an output content factory.
     */
    interface IContentFactory {
        /**
         * Create an output model.
         */
        createOutputModel(options: IOutputModel.IOptions): IOutputModel;
    }
}
/**
 * The default implementation of the IOutputAreaModel.
 */
export declare class OutputAreaModel implements IOutputAreaModel {
    /**
     * Construct a new observable outputs instance.
     */
    constructor(options?: IOutputAreaModel.IOptions);
    /**
     * A signal emitted when the model state changes.
     */
    get stateChanged(): ISignal<IOutputAreaModel, void>;
    /**
     * A signal emitted when the model changes.
     */
    get changed(): ISignal<this, IOutputAreaModel.ChangedArgs>;
    /**
     * Get the length of the items in the model.
     */
    get length(): number;
    /**
     * Get whether the model is trusted.
     */
    get trusted(): boolean;
    /**
     * Set whether the model is trusted.
     *
     * #### Notes
     * Changing the value will cause all of the models to re-set.
     */
    set trusted(value: boolean);
    /**
     * The output content factory used by the model.
     */
    readonly contentFactory: IOutputAreaModel.IContentFactory;
    /**
     * Test whether the model is disposed.
     */
    get isDisposed(): boolean;
    /**
     * Dispose of the resources used by the model.
     */
    dispose(): void;
    /**
     * Get an item at the specified index.
     */
    get(index: number): IOutputModel;
    /**
     * Set the value at the specified index.
     */
    set(index: number, value: nbformat.IOutput): void;
    /**
     * Add an output, which may be combined with previous output.
     *
     * @returns The total number of outputs.
     *
     * #### Notes
     * The output bundle is copied.
     * Contiguous stream outputs of the same `name` are combined.
     */
    add(output: nbformat.IOutput): number;
    /**
     * Clear all of the output.
     *
     * @param wait Delay clearing the output until the next message is added.
     */
    clear(wait?: boolean): void;
    /**
     * Deserialize the model from JSON.
     *
     * #### Notes
     * This will clear any existing data.
     */
    fromJSON(values: nbformat.IOutput[]): void;
    /**
     * Serialize the model to JSON.
     */
    toJSON(): nbformat.IOutput[];
    /**
     * Add a copy of the item to the list.
     */
    private _add;
    /**
     * Whether a new value should be consolidated with the previous output.
     *
     * This will only be called if the minimal criteria of both being stream
     * messages of the same type.
     */
    protected shouldCombine(options: {
        value: nbformat.IOutput;
        lastModel: IOutputModel;
    }): boolean;
    /**
     * A flag that is set when we want to clear the output area
     * *after* the next addition to it.
     */
    protected clearNext: boolean;
    /**
     * An observable list containing the output models
     * for this output area.
     */
    protected list: IObservableList<IOutputModel>;
    /**
     * Create an output item and hook up its signals.
     */
    private _createItem;
    /**
     * Handle a change to the list.
     */
    private _onListChanged;
    /**
     * Handle a change to an item.
     */
    private _onGenericChange;
    private _lastStream;
    private _lastName;
    private _trusted;
    private _isDisposed;
    private _stateChanged;
    private _changed;
}
/**
 * The namespace for OutputAreaModel class statics.
 */
export declare namespace OutputAreaModel {
    /**
     * The default implementation of a `IModelOutputFactory`.
     */
    class ContentFactory implements IOutputAreaModel.IContentFactory {
        /**
         * Create an output model.
         */
        createOutputModel(options: IOutputModel.IOptions): IOutputModel;
    }
    /**
     * The default output model factory.
     */
    const defaultContentFactory: ContentFactory;
}
