// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { Signal } from '@lumino/signaling';
const FOREIGN_CELL_CLASS = 'jp-CodeConsole-foreignCell';
/**
 * A handler for capturing API messages from other sessions that should be
 * rendered in a given parent.
 */
export class ForeignHandler {
    /**
     * Construct a new foreign message handler.
     */
    constructor(options) {
        this._enabled = false;
        this._isDisposed = false;
        this.sessionContext = options.sessionContext;
        this.sessionContext.iopubMessage.connect(this.onIOPubMessage, this);
        this._parent = options.parent;
    }
    /**
     * Set whether the handler is able to inject foreign cells into a console.
     */
    get enabled() {
        return this._enabled;
    }
    set enabled(value) {
        this._enabled = value;
    }
    /**
     * The foreign handler's parent receiver.
     */
    get parent() {
        return this._parent;
    }
    /**
     * Test whether the handler is disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Dispose the resources held by the handler.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._isDisposed = true;
        Signal.clearData(this);
    }
    /**
     * Handler IOPub messages.
     *
     * @returns `true` if the message resulted in a new cell injection or a
     * previously injected cell being updated and `false` for all other messages.
     */
    onIOPubMessage(sender, msg) {
        var _a;
        // Only process messages if foreign cell injection is enabled.
        if (!this._enabled) {
            return false;
        }
        const kernel = (_a = this.sessionContext.session) === null || _a === void 0 ? void 0 : _a.kernel;
        if (!kernel) {
            return false;
        }
        // Check whether this message came from an external session.
        const parent = this._parent;
        const session = msg.parent_header.session;
        if (session === kernel.clientId) {
            return false;
        }
        const msgType = msg.header.msg_type;
        const parentHeader = msg.parent_header;
        const parentMsgId = parentHeader.msg_id;
        let cell;
        switch (msgType) {
            case 'execute_input': {
                const inputMsg = msg;
                cell = this._newCell(parentMsgId);
                const model = cell.model;
                model.executionCount = inputMsg.content.execution_count;
                model.value.text = inputMsg.content.code;
                model.trusted = true;
                parent.update();
                return true;
            }
            case 'execute_result':
            case 'display_data':
            case 'stream':
            case 'error': {
                cell = this._parent.getCell(parentMsgId);
                if (!cell) {
                    return false;
                }
                const output = Object.assign(Object.assign({}, msg.content), { output_type: msgType });
                cell.model.outputs.add(output);
                parent.update();
                return true;
            }
            case 'clear_output': {
                const wait = msg.content.wait;
                cell = this._parent.getCell(parentMsgId);
                if (cell) {
                    cell.model.outputs.clear(wait);
                }
                return true;
            }
            default:
                return false;
        }
    }
    /**
     * Create a new code cell for an input originated from a foreign session.
     */
    _newCell(parentMsgId) {
        const cell = this.parent.createCodeCell();
        cell.addClass(FOREIGN_CELL_CLASS);
        this._parent.addCell(cell, parentMsgId);
        return cell;
    }
}
//# sourceMappingURL=foreign.js.map