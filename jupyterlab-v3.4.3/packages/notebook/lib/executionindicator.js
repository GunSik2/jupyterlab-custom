// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { translateKernelStatuses, VDomModel, VDomRenderer } from '@jupyterlab/apputils';
import { nullTranslator } from '@jupyterlab/translation';
import React from 'react';
import { interactiveItem, ProgressCircle } from '@jupyterlab/statusbar';
import { circleIcon, offlineBoltIcon } from '@jupyterlab/ui-components';
import { KernelMessage } from '@jupyterlab/services';
/**
 * A react functional component for rendering execution indicator.
 */
export function ExecutionIndicatorComponent(props) {
    const translator = props.translator || nullTranslator;
    const kernelStatuses = translateKernelStatuses(translator);
    const trans = translator.load('jupyterlab');
    const state = props.state;
    const showOnToolBar = props.displayOption.showOnToolBar;
    const showProgress = props.displayOption.showProgress;
    const tooltipClass = showOnToolBar ? 'down' : 'up';
    const emptyDiv = React.createElement("div", null);
    if (!state) {
        return emptyDiv;
    }
    const kernelStatus = state.kernelStatus;
    const circleIconProps = {
        alignSelf: 'normal',
        height: '24px'
    };
    const time = state.totalTime;
    const scheduledCellNumber = state.scheduledCellNumber || 0;
    const remainingCellNumber = state.scheduledCell.size || 0;
    const executedCellNumber = scheduledCellNumber - remainingCellNumber;
    let percentage = (100 * executedCellNumber) / scheduledCellNumber;
    let displayClass = showProgress ? '' : 'hidden';
    if (!showProgress && percentage < 100) {
        percentage = 0;
    }
    const progressBar = (percentage) => (React.createElement(ProgressCircle, { progress: percentage, width: 16, height: 24 }));
    const titleFactory = (translatedStatus) => trans.__('Kernel status: %1', translatedStatus);
    const reactElement = (status, circle, popup) => (React.createElement("div", { className: 'jp-Notebook-ExecutionIndicator', title: showProgress ? '' : titleFactory(kernelStatuses[status]), "data-status": status },
        circle,
        React.createElement("div", { className: `jp-Notebook-ExecutionIndicator-tooltip ${tooltipClass} ${displayClass}` },
            React.createElement("span", null,
                " ",
                titleFactory(kernelStatuses[status]),
                " "),
            popup)));
    if (state.kernelStatus === 'connecting' ||
        state.kernelStatus === 'disconnected' ||
        state.kernelStatus === 'unknown') {
        return reactElement(kernelStatus, React.createElement(offlineBoltIcon.react, Object.assign({}, circleIconProps)), []);
    }
    if (state.kernelStatus === 'starting' ||
        state.kernelStatus === 'terminating' ||
        state.kernelStatus === 'restarting' ||
        state.kernelStatus === 'initializing') {
        return reactElement(kernelStatus, React.createElement(circleIcon.react, Object.assign({}, circleIconProps)), []);
    }
    if (state.executionStatus === 'busy') {
        return reactElement('busy', progressBar(percentage), [
            React.createElement("span", { key: 0 }, trans.__(`Executed ${executedCellNumber}/${scheduledCellNumber} requests`)),
            React.createElement("span", { key: 1 }, trans._n('Elapsed time: %1 second', 'Elapsed time: %1 seconds', time))
        ]);
    }
    else {
        if (time === 0) {
            return reactElement('idle', progressBar(100), []);
        }
        else {
            return reactElement('idle', progressBar(100), [
                React.createElement("span", { key: 0 }, trans._n('Executed %1 request', 'Executed %1 requests', scheduledCellNumber)),
                React.createElement("span", { key: 1 }, trans._n('Elapsed time: %1 second', 'Elapsed time: %1 seconds', time))
            ]);
        }
    }
}
/**
 * A VDomRenderer widget for displaying the execution status.
 */
export class ExecutionIndicator extends VDomRenderer {
    /**
     * Construct the kernel status widget.
     */
    constructor(translator, showProgress = true) {
        super(new ExecutionIndicator.Model());
        this.translator = translator || nullTranslator;
        this.addClass(interactiveItem);
    }
    /**
     * Render the execution status item.
     */
    render() {
        if (this.model === null || !this.model.renderFlag) {
            return React.createElement("div", null);
        }
        else {
            const nb = this.model.currentNotebook;
            if (!nb) {
                return (React.createElement(ExecutionIndicatorComponent, { displayOption: this.model.displayOption, state: undefined, translator: this.translator }));
            }
            return (React.createElement(ExecutionIndicatorComponent, { displayOption: this.model.displayOption, state: this.model.executionState(nb), translator: this.translator }));
        }
    }
}
/**
 * A namespace for ExecutionIndicator statics.
 */
(function (ExecutionIndicator) {
    /**
     * A VDomModel for the execution status indicator.
     */
    class Model extends VDomModel {
        constructor() {
            super();
            /**
             * A weak map to hold execution status of multiple notebooks.
             */
            this._notebookExecutionProgress = new WeakMap();
            this._displayOption = { showOnToolBar: true, showProgress: true };
            this._renderFlag = true;
        }
        /**
         * Attach a notebook with session context to model in order to keep
         * track of multiple notebooks. If a session context is already
         * attached, only set current activated notebook to input.
         *
         * @param data - The  notebook and session context to be attached to model
         */
        attachNotebook(data) {
            var _a, _b, _c, _d;
            if (data && data.content && data.context) {
                const nb = data.content;
                const context = data.context;
                this._currentNotebook = nb;
                if (!this._notebookExecutionProgress.has(nb)) {
                    this._notebookExecutionProgress.set(nb, {
                        executionStatus: 'idle',
                        kernelStatus: 'idle',
                        totalTime: 0,
                        interval: 0,
                        timeout: 0,
                        scheduledCell: new Set(),
                        scheduledCellNumber: 0,
                        needReset: true
                    });
                    const state = this._notebookExecutionProgress.get(nb);
                    const contextStatusChanged = (ctx) => {
                        if (state) {
                            state.kernelStatus = ctx.kernelDisplayStatus;
                        }
                        this.stateChanged.emit(void 0);
                    };
                    context.statusChanged.connect(contextStatusChanged, this);
                    const contextConnectionStatusChanged = (ctx) => {
                        if (state) {
                            state.kernelStatus = ctx.kernelDisplayStatus;
                        }
                        this.stateChanged.emit(void 0);
                    };
                    context.connectionStatusChanged.connect(contextConnectionStatusChanged, this);
                    context.disposed.connect(ctx => {
                        ctx.connectionStatusChanged.disconnect(contextConnectionStatusChanged, this);
                        ctx.statusChanged.disconnect(contextStatusChanged, this);
                    });
                    const handleKernelMsg = (sender, msg) => {
                        const message = msg.msg;
                        const msgId = message.header.msg_id;
                        if (KernelMessage.isCommMsgMsg(message) &&
                            message.content.data['method']) {
                            // Execution request from Comm message
                            const method = message.content.data['method'];
                            if (method !== 'request_state' && method !== 'update') {
                                this._cellScheduledCallback(nb, msgId);
                                this._startTimer(nb);
                            }
                        }
                        else if (message.header.msg_type === 'execute_request') {
                            // A cell code is scheduled for executing
                            this._cellScheduledCallback(nb, msgId);
                        }
                        else if (KernelMessage.isStatusMsg(message) &&
                            message.content.execution_state === 'idle') {
                            // Idle status message case.
                            const parentId = message.parent_header
                                .msg_id;
                            this._cellExecutedCallback(nb, parentId);
                        }
                        else if (message.header.msg_type === 'execute_input') {
                            // A cell code starts executing.
                            this._startTimer(nb);
                        }
                    };
                    (_b = (_a = context.session) === null || _a === void 0 ? void 0 : _a.kernel) === null || _b === void 0 ? void 0 : _b.anyMessage.connect(handleKernelMsg);
                    (_d = (_c = context.session) === null || _c === void 0 ? void 0 : _c.kernel) === null || _d === void 0 ? void 0 : _d.disposed.connect(kernel => kernel.anyMessage.disconnect(handleKernelMsg));
                    const kernelChangedSlot = (_, kernelData) => {
                        if (state) {
                            this._resetTime(state);
                            this.stateChanged.emit(void 0);
                            if (kernelData.newValue) {
                                kernelData.newValue.anyMessage.connect(handleKernelMsg);
                            }
                        }
                    };
                    context.kernelChanged.connect(kernelChangedSlot);
                    context.disposed.connect(ctx => ctx.kernelChanged.disconnect(kernelChangedSlot));
                }
            }
        }
        /**
         * The current activated notebook in model.
         */
        get currentNotebook() {
            return this._currentNotebook;
        }
        /**
         * The display options for progress bar and elapsed time.
         */
        get displayOption() {
            return this._displayOption;
        }
        /**
         * Set the display options for progress bar and elapsed time.
         *
         * @param options - Options to be used
         */
        set displayOption(options) {
            this._displayOption = options;
        }
        /**
         * Get the execution state associated with a notebook.
         *
         * @param nb - The notebook used to identify execution
         * state.
         *
         * @return - The associated execution state.
         */
        executionState(nb) {
            return this._notebookExecutionProgress.get(nb);
        }
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
        _cellExecutedCallback(nb, msg_id) {
            const state = this._notebookExecutionProgress.get(nb);
            if (state && state.scheduledCell.has(msg_id)) {
                state.scheduledCell.delete(msg_id);
                if (state.scheduledCell.size === 0) {
                    window.setTimeout(() => {
                        state.executionStatus = 'idle';
                        clearInterval(state.interval);
                        this.stateChanged.emit(void 0);
                    }, 150);
                    state.timeout = window.setTimeout(() => {
                        state.needReset = true;
                    }, 1000);
                }
            }
        }
        /**
         * This function is called on kernel's `execute_input` message to start
         * the elapsed time counter.
         *
         * @param  nb - The notebook which contains the scheduled execution request.
         */
        _startTimer(nb) {
            const state = this._notebookExecutionProgress.get(nb);
            if (state) {
                if (state.executionStatus !== 'busy') {
                    state.executionStatus = 'busy';
                    clearTimeout(state.timeout);
                    this.stateChanged.emit(void 0);
                    state.interval = window.setInterval(() => {
                        this._tick(state);
                    }, 1000);
                }
            }
        }
        /**
         * The function is called on kernel's `execute_request` message or Comm message, it is
         * used to keep track number of scheduled cell or Comm execution message
         * and the status of kernel.
         *
         * @param  nb - The notebook which contains the scheduled code.
         * cell
         * @param  msg_id - The id of message.
         */
        _cellScheduledCallback(nb, msg_id) {
            const state = this._notebookExecutionProgress.get(nb);
            if (state && !state.scheduledCell.has(msg_id)) {
                if (state.needReset) {
                    this._resetTime(state);
                }
                state.scheduledCell.add(msg_id);
                state.scheduledCellNumber += 1;
            }
        }
        /**
         * Increment the executed time of input execution state
         * and emit `stateChanged` signal to re-render the indicator.
         *
         * @param  data - the state to be updated.
         */
        _tick(data) {
            data.totalTime += 1;
            this.stateChanged.emit(void 0);
        }
        /**
         * Reset the input execution state.
         *
         * @param  data - the state to be rested.
         */
        _resetTime(data) {
            data.totalTime = 0;
            data.scheduledCellNumber = 0;
            data.executionStatus = 'idle';
            data.scheduledCell = new Set();
            clearTimeout(data.timeout);
            clearInterval(data.interval);
            data.needReset = false;
        }
        get renderFlag() {
            return this._renderFlag;
        }
        updateRenderOption(options) {
            if (this.displayOption.showOnToolBar) {
                if (!options.showOnToolBar) {
                    this._renderFlag = false;
                }
                else {
                    this._renderFlag = true;
                }
            }
            this.displayOption.showProgress = options.showProgress;
            this.stateChanged.emit(void 0);
        }
    }
    ExecutionIndicator.Model = Model;
    function createExecutionIndicatorItem(panel, translator, loadSettings) {
        const toolbarItem = new ExecutionIndicator(translator);
        toolbarItem.model.displayOption = {
            showOnToolBar: true,
            showProgress: true
        };
        toolbarItem.model.attachNotebook({
            content: panel.content,
            context: panel.sessionContext
        });
        panel.disposed.connect(() => {
            toolbarItem.dispose();
        });
        if (loadSettings) {
            loadSettings
                .then(settings => {
                toolbarItem.model.updateRenderOption(getSettingValue(settings));
                settings.changed.connect(newSettings => {
                    toolbarItem.model.updateRenderOption(getSettingValue(newSettings));
                });
            })
                .catch((reason) => {
                console.error(reason.message);
            });
        }
        return toolbarItem;
    }
    ExecutionIndicator.createExecutionIndicatorItem = createExecutionIndicatorItem;
    function getSettingValue(settings) {
        let showOnToolBar = true;
        let showProgress = true;
        const configValues = settings.get('kernelStatus').composite;
        if (configValues) {
            showOnToolBar = !configValues.showOnStatusBar;
            showProgress = configValues.showProgress;
        }
        return { showOnToolBar, showProgress };
    }
    ExecutionIndicator.getSettingValue = getSettingValue;
})(ExecutionIndicator || (ExecutionIndicator = {}));
//# sourceMappingURL=executionindicator.js.map