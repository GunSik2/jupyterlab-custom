import { VDomModel, VDomRenderer } from '@jupyterlab/apputils';
import { nullTranslator } from '@jupyterlab/translation';
import { notTrustedIcon, trustedIcon } from '@jupyterlab/ui-components';
import { toArray } from '@lumino/algorithm';
import React from 'react';
/**
 * Determine the notebook trust status message.
 */
function cellTrust(props, translator) {
    translator = translator || nullTranslator;
    const trans = translator.load('jupyterlab');
    if (props.trustedCells === props.totalCells) {
        return [
            trans.__('Notebook trusted: %1 of %2 cells trusted.', props.trustedCells, props.totalCells),
            'jp-StatusItem-trusted'
        ];
    }
    else if (props.activeCellTrusted) {
        return [
            trans.__('Active cell trusted: %1 of %2 cells trusted.', props.trustedCells, props.totalCells),
            'jp-StatusItem-trusted'
        ];
    }
    else {
        return [
            trans.__('Notebook not trusted: %1 of %2 cells trusted.', props.trustedCells, props.totalCells),
            'jp-StatusItem-untrusted'
        ];
    }
}
/**
 * A pure function for a notebook trust status component.
 *
 * @param props: the props for the component.
 *
 * @returns a tsx component for notebook trust.
 */
function NotebookTrustComponent(props) {
    if (props.allCellsTrusted) {
        return React.createElement(trustedIcon.react, { top: '2px', stylesheet: 'statusBar' });
    }
    else {
        return React.createElement(notTrustedIcon.react, { top: '2px', stylesheet: 'statusBar' });
    }
}
/**
 * The NotebookTrust status item.
 */
export class NotebookTrustStatus extends VDomRenderer {
    /**
     * Construct a new status item.
     */
    constructor(translator) {
        super(new NotebookTrustStatus.Model());
        this.translator = translator || nullTranslator;
    }
    /**
     * Render the NotebookTrust status item.
     */
    render() {
        if (!this.model) {
            return null;
        }
        this.node.title = cellTrust(this.model, this.translator)[0];
        return (React.createElement("div", null,
            React.createElement(NotebookTrustComponent, { allCellsTrusted: this.model.trustedCells === this.model.totalCells, activeCellTrusted: this.model.activeCellTrusted, totalCells: this.model.totalCells, trustedCells: this.model.trustedCells })));
    }
}
/**
 * A namespace for NotebookTrust statics.
 */
(function (NotebookTrustStatus) {
    /**
     * A VDomModel for the NotebookTrust status item.
     */
    class Model extends VDomModel {
        constructor() {
            super(...arguments);
            this._trustedCells = 0;
            this._totalCells = 0;
            this._activeCellTrusted = false;
            this._notebook = null;
        }
        /**
         * The number of trusted cells in the current notebook.
         */
        get trustedCells() {
            return this._trustedCells;
        }
        /**
         * The total number of cells in the current notebook.
         */
        get totalCells() {
            return this._totalCells;
        }
        /**
         * Whether the active cell is trusted.
         */
        get activeCellTrusted() {
            return this._activeCellTrusted;
        }
        /**
         * The current notebook for the model.
         */
        get notebook() {
            return this._notebook;
        }
        set notebook(model) {
            const oldNotebook = this._notebook;
            if (oldNotebook !== null) {
                oldNotebook.activeCellChanged.disconnect(this._onActiveCellChanged, this);
                oldNotebook.modelContentChanged.disconnect(this._onModelChanged, this);
            }
            const oldState = this._getAllState();
            this._notebook = model;
            if (this._notebook === null) {
                this._trustedCells = 0;
                this._totalCells = 0;
                this._activeCellTrusted = false;
            }
            else {
                // Add listeners
                this._notebook.activeCellChanged.connect(this._onActiveCellChanged, this);
                this._notebook.modelContentChanged.connect(this._onModelChanged, this);
                // Derive values
                if (this._notebook.activeCell !== undefined) {
                    this._activeCellTrusted = this._notebook.activeCell.model.trusted;
                }
                else {
                    this._activeCellTrusted = false;
                }
                const { total, trusted } = this._deriveCellTrustState(this._notebook.model);
                this._totalCells = total;
                this._trustedCells = trusted;
            }
            this._triggerChange(oldState, this._getAllState());
        }
        /**
         * When the notebook model changes, update the trust state.
         */
        _onModelChanged(notebook) {
            const oldState = this._getAllState();
            const { total, trusted } = this._deriveCellTrustState(notebook.model);
            this._totalCells = total;
            this._trustedCells = trusted;
            this._triggerChange(oldState, this._getAllState());
        }
        /**
         * When the active cell changes, update the trust state.
         */
        _onActiveCellChanged(model, cell) {
            const oldState = this._getAllState();
            if (cell) {
                this._activeCellTrusted = cell.model.trusted;
            }
            else {
                this._activeCellTrusted = false;
            }
            this._triggerChange(oldState, this._getAllState());
        }
        /**
         * Given a notebook model, figure out how many of the cells are trusted.
         */
        _deriveCellTrustState(model) {
            if (model === null) {
                return { total: 0, trusted: 0 };
            }
            const cells = toArray(model.cells);
            const trusted = cells.reduce((accum, current) => {
                if (current.trusted) {
                    return accum + 1;
                }
                else {
                    return accum;
                }
            }, 0);
            const total = cells.length;
            return {
                total,
                trusted
            };
        }
        /**
         * Get the current state of the model.
         */
        _getAllState() {
            return [this._trustedCells, this._totalCells, this.activeCellTrusted];
        }
        /**
         * Trigger a change in the renderer.
         */
        _triggerChange(oldState, newState) {
            if (oldState[0] !== newState[0] ||
                oldState[1] !== newState[1] ||
                oldState[2] !== newState[2]) {
                this.stateChanged.emit(void 0);
            }
        }
    }
    NotebookTrustStatus.Model = Model;
})(NotebookTrustStatus || (NotebookTrustStatus = {}));
//# sourceMappingURL=truststatus.js.map