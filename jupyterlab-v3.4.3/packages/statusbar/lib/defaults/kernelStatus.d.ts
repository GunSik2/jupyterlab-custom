/// <reference types="react" />
import { ISessionContext, VDomModel, VDomRenderer } from '@jupyterlab/apputils';
import { ITranslator } from '@jupyterlab/translation';
/**
 * A VDomRenderer widget for displaying the status of a kernel.
 */
export declare class KernelStatus extends VDomRenderer<KernelStatus.Model> {
    /**
     * Construct the kernel status widget.
     */
    constructor(opts: KernelStatus.IOptions, translator?: ITranslator);
    /**
     * Render the kernel status item.
     */
    render(): JSX.Element | null;
    translator: ITranslator;
    private _handleClick;
}
/**
 * A namespace for KernelStatus statics.
 */
export declare namespace KernelStatus {
    /**
     * A VDomModel for the kernel status indicator.
     */
    class Model extends VDomModel {
        constructor(translator?: ITranslator);
        /**
         * The name of the kernel.
         */
        get kernelName(): string;
        /**
         * The current status of the kernel.
         */
        get status(): string | undefined;
        /**
         * A display name for the activity.
         */
        get activityName(): string;
        set activityName(val: string);
        /**
         * The current client session associated with the kernel status indicator.
         */
        get sessionContext(): ISessionContext | null;
        set sessionContext(sessionContext: ISessionContext | null);
        /**
         * React to changes to the kernel status.
         */
        private _onKernelStatusChanged;
        /**
         * React to changes in the kernel.
         */
        private _onKernelChanged;
        private _getAllState;
        private _triggerChange;
        protected translation: ITranslator;
        private _trans;
        private _activityName;
        private _kernelName;
        private _kernelStatus;
        private _sessionContext;
        private readonly _statusNames;
    }
    /**
     * Options for creating a KernelStatus object.
     */
    interface IOptions {
        /**
         * A click handler for the item. By default
         * we launch a kernel selection dialog.
         */
        onClick: () => void;
    }
}
