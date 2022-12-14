import { ISessionContext, VDomModel, VDomRenderer } from '@jupyterlab/apputils';
import { ITranslator } from '@jupyterlab/translation';
import React from 'react';
import { Notebook } from './widget';
import { NotebookPanel } from './panel';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { Widget } from '@lumino/widgets';
/**
 * A react functional component for rendering execution indicator.
 */
export declare function ExecutionIndicatorComponent(props: ExecutionIndicatorComponent.IProps): React.ReactElement<ExecutionIndicatorComponent.IProps>;
/**
 * A namespace for ExecutionIndicatorComponent statics.
 */
declare namespace ExecutionIndicatorComponent {
    /**
     * Props for the execution status component.
     */
    interface IProps {
        /**
         * Display option for progress bar and elapsed time.
         */
        displayOption: Private.DisplayOption;
        /**
         * Execution state of selected notebook.
         */
        state?: Private.IExecutionState;
        /**
         * The application language translator.
         */
        translator?: ITranslator;
    }
}
/**
 * A VDomRenderer widget for displaying the execution status.
 */
export declare class ExecutionIndicator extends VDomRenderer<ExecutionIndicator.Model> {
    /**
     * Construct the kernel status widget.
     */
    constructor(translator?: ITranslator, showProgress?: boolean);
    /**
     * Render the execution status item.
     */
    render(): JSX.Element | null;
    private translator;
}
/**
 * A namespace for ExecutionIndicator statics.
 */
export declare namespace ExecutionIndicator {
    /**
     * A VDomModel for the execution status indicator.
     */
    class Model extends VDomModel {
        constructor();
        /**
         * Attach a notebook with session context to model in order to keep
         * track of multiple notebooks. If a session context is already
         * attached, only set current activated notebook to input.
         *
         * @param data - The  notebook and session context to be attached to model
         */
        attachNotebook(data: {
            content?: Notebook;
            context?: ISessionContext;
        } | null): void;
        /**
         * The current activated notebook in model.
         */
        get currentNotebook(): Notebook | null;
        /**
         * The display options for progress bar and elapsed time.
         */
        get displayOption(): Private.DisplayOption;
        /**
         * Set the display options for progress bar and elapsed time.
         *
         * @param options - Options to be used
         */
        set displayOption(options: Private.DisplayOption);
        /**
         * Get the execution state associated with a notebook.
         *
         * @param nb - The notebook used to identify execution
         * state.
         *
         * @return - The associated execution state.
         */
        executionState(nb: Notebook): Private.IExecutionState | undefined;
        /**
         * The function is called on kernel's idle status message.
         * It is used to keep track number of executed
         * cell or Comm custom messages and the status of kernel.
         *
         * @param  nb - The notebook which contains the executed code
         * cell.
         * @param  msg_id - The id of message.
         *
         * ### Note
         *
         * To keep track of cells executed under 1 second,
         * the execution state is marked as `needReset` 1 second after executing
         * these cells. This `Timeout` will be cleared if there is any cell
         * scheduled after that.
         */
        private _cellExecutedCallback;
        /**
         * This function is called on kernel's `execute_input` message to start
         * the elapsed time counter.
         *
         * @param  nb - The notebook which contains the scheduled execution request.
         */
        private _startTimer;
        /**
         * The function is called on kernel's `execute_request` message or Comm message, it is
         * used to keep track number of scheduled cell or Comm execution message
         * and the status of kernel.
         *
         * @param  nb - The notebook which contains the scheduled code.
         * cell
         * @param  msg_id - The id of message.
         */
        private _cellScheduledCallback;
        /**
         * Increment the executed time of input execution state
         * and emit `stateChanged` signal to re-render the indicator.
         *
         * @param  data - the state to be updated.
         */
        private _tick;
        /**
         * Reset the input execution state.
         *
         * @param  data - the state to be rested.
         */
        private _resetTime;
        get renderFlag(): boolean;
        updateRenderOption(options: {
            showOnToolBar: boolean;
            showProgress: boolean;
        }): void;
        /**
         * The option to show the indicator on status bar or toolbar.
         */
        private _displayOption;
        /**
         * Current activated notebook.
         */
        private _currentNotebook;
        /**
         * A weak map to hold execution status of multiple notebooks.
         */
        private _notebookExecutionProgress;
        /**
         * A flag to show or hide the indicator.
         */
        private _renderFlag;
    }
    function createExecutionIndicatorItem(panel: NotebookPanel, translator: ITranslator, loadSettings: Promise<ISettingRegistry.ISettings> | undefined): Widget;
    function getSettingValue(settings: ISettingRegistry.ISettings): {
        showOnToolBar: boolean;
        showProgress: boolean;
    };
}
/**
 * A namespace for module-private data.
 */
declare namespace Private {
    interface IExecutionState {
        /**
         * Execution status of kernel, this status is deducted from the
         * number of scheduled code cells.
         */
        executionStatus: string;
        /**
         * Current status of kernel.
         */
        kernelStatus: ISessionContext.KernelDisplayStatus;
        /**
         * Total execution time.
         */
        totalTime: number;
        /**
         * Id of `setInterval`, it is used to start / stop the elapsed time
         * counter.
         */
        interval: number;
        /**
         * Id of `setTimeout`, it is used to create / clear the state
         * resetting request.
         */
        timeout: number;
        /**
         * Set of messages scheduled for executing, `executionStatus` is set
         *  to `idle if the length of this set is 0 and to `busy` otherwise.
         */
        scheduledCell: Set<string>;
        /**
         * Total number of cells requested for executing, it is used to compute
         * the execution progress in progress bar.
         */
        scheduledCellNumber: number;
        /**
         * Flag to reset the execution state when a code cell is scheduled for
         * executing.
         */
        needReset: boolean;
    }
    type DisplayOption = {
        /**
         * The option to show the indicator on status bar or toolbar.
         */
        showOnToolBar: boolean;
        /**
         * The option to show the execution progress inside kernel
         * status circle.
         */
        showProgress: boolean;
    };
}
export {};
