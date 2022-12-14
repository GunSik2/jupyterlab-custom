// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { translateKernelStatuses, VDomModel, VDomRenderer } from '@jupyterlab/apputils';
import { nullTranslator } from '@jupyterlab/translation';
import { JSONExt } from '@lumino/coreutils';
import React from 'react';
import { interactiveItem, TextItem } from '..';
/**
 * A pure functional component for rendering kernel status.
 */
function KernelStatusComponent(props) {
    const translator = props.translator || nullTranslator;
    const trans = translator.load('jupyterlab');
    let statusText = '';
    if (props.status) {
        statusText = ` | ${props.status}`;
    }
    return (React.createElement(TextItem, { onClick: props.handleClick, source: `${props.kernelName}${statusText}`, title: trans.__('Change kernel for %1', props.activityName) }));
}
/**
 * A VDomRenderer widget for displaying the status of a kernel.
 */
export class KernelStatus extends VDomRenderer {
    /**
     * Construct the kernel status widget.
     */
    constructor(opts, translator) {
        super(new KernelStatus.Model(translator));
        this.translator = translator || nullTranslator;
        this._handleClick = opts.onClick;
        this.addClass(interactiveItem);
    }
    /**
     * Render the kernel status item.
     */
    render() {
        if (this.model === null) {
            return null;
        }
        else {
            return (React.createElement(KernelStatusComponent, { status: this.model.status, kernelName: this.model.kernelName, activityName: this.model.activityName, handleClick: this._handleClick, translator: this.translator }));
        }
    }
}
/**
 * A namespace for KernelStatus statics.
 */
(function (KernelStatus) {
    /**
     * A VDomModel for the kernel status indicator.
     */
    class Model extends VDomModel {
        constructor(translator) {
            super();
            /**
             * React to changes to the kernel status.
             */
            this._onKernelStatusChanged = () => {
                var _a;
                this._kernelStatus = (_a = this._sessionContext) === null || _a === void 0 ? void 0 : _a.kernelDisplayStatus;
                this.stateChanged.emit(void 0);
            };
            /**
             * React to changes in the kernel.
             */
            this._onKernelChanged = (_sessionContext, change) => {
                var _a;
                const oldState = this._getAllState();
                // sync setting of status and display name
                this._kernelStatus = (_a = this._sessionContext) === null || _a === void 0 ? void 0 : _a.kernelDisplayStatus;
                this._kernelName = _sessionContext.kernelDisplayName;
                this._triggerChange(oldState, this._getAllState());
            };
            this._activityName = 'activity'; // FIXME-TRANS:?
            this._kernelStatus = '';
            this._sessionContext = null;
            translator = translator || nullTranslator;
            this._trans = translator.load('jupyterlab');
            this._kernelName = this._trans.__('No Kernel!');
            this._statusNames = translateKernelStatuses(translator);
        }
        /**
         * The name of the kernel.
         */
        get kernelName() {
            return this._kernelName;
        }
        /**
         * The current status of the kernel.
         */
        get status() {
            return this._kernelStatus
                ? this._statusNames[this._kernelStatus]
                : undefined;
        }
        /**
         * A display name for the activity.
         */
        get activityName() {
            return this._activityName;
        }
        set activityName(val) {
            const oldVal = this._activityName;
            if (oldVal === val) {
                return;
            }
            this._activityName = val;
            this.stateChanged.emit(void 0);
        }
        /**
         * The current client session associated with the kernel status indicator.
         */
        get sessionContext() {
            return this._sessionContext;
        }
        set sessionContext(sessionContext) {
            var _a, _b, _c;
            (_a = this._sessionContext) === null || _a === void 0 ? void 0 : _a.statusChanged.disconnect(this._onKernelStatusChanged);
            (_b = this._sessionContext) === null || _b === void 0 ? void 0 : _b.kernelChanged.disconnect(this._onKernelChanged);
            const oldState = this._getAllState();
            this._sessionContext = sessionContext;
            this._kernelStatus = sessionContext === null || sessionContext === void 0 ? void 0 : sessionContext.kernelDisplayStatus;
            this._kernelName = (_c = sessionContext === null || sessionContext === void 0 ? void 0 : sessionContext.kernelDisplayName) !== null && _c !== void 0 ? _c : this._trans.__('No Kernel');
            sessionContext === null || sessionContext === void 0 ? void 0 : sessionContext.statusChanged.connect(this._onKernelStatusChanged, this);
            sessionContext === null || sessionContext === void 0 ? void 0 : sessionContext.connectionStatusChanged.connect(this._onKernelStatusChanged, this);
            sessionContext === null || sessionContext === void 0 ? void 0 : sessionContext.kernelChanged.connect(this._onKernelChanged, this);
            this._triggerChange(oldState, this._getAllState());
        }
        _getAllState() {
            return [this._kernelName, this._kernelStatus, this._activityName];
        }
        _triggerChange(oldState, newState) {
            if (JSONExt.deepEqual(oldState, newState)) {
                this.stateChanged.emit(void 0);
            }
        }
    }
    KernelStatus.Model = Model;
})(KernelStatus || (KernelStatus = {}));
//# sourceMappingURL=kernelStatus.js.map