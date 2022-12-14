// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { Styling } from '@jupyterlab/apputils';
import { nullTranslator } from '@jupyterlab/translation';
import { each } from '@lumino/algorithm';
import { Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
/**
 * The class name added to a csv toolbar widget.
 */
const CSV_DELIMITER_CLASS = 'jp-CSVDelimiter';
const CSV_DELIMITER_LABEL_CLASS = 'jp-CSVDelimiter-label';
/**
 * The class name added to a csv toolbar's dropdown element.
 */
const CSV_DELIMITER_DROPDOWN_CLASS = 'jp-CSVDelimiter-dropdown';
/**
 * A widget for selecting a delimiter.
 */
export class CSVDelimiter extends Widget {
    /**
     * Construct a new csv table widget.
     */
    constructor(options) {
        super({
            node: Private.createNode(options.widget.delimiter, options.translator)
        });
        this._delimiterChanged = new Signal(this);
        this._widget = options.widget;
        this.addClass(CSV_DELIMITER_CLASS);
    }
    /**
     * A signal emitted when the delimiter selection has changed.
     *
     * @deprecated since v3.2
     * This is dead code now.
     */
    get delimiterChanged() {
        return this._delimiterChanged;
    }
    /**
     * The delimiter dropdown menu.
     */
    get selectNode() {
        return this.node.getElementsByTagName('select')[0];
    }
    /**
     * Handle the DOM events for the widget.
     *
     * @param event - The DOM event sent to the widget.
     *
     * #### Notes
     * This method implements the DOM `EventListener` interface and is
     * called in response to events on the dock panel's node. It should
     * not be called directly by user code.
     */
    handleEvent(event) {
        switch (event.type) {
            case 'change':
                this._delimiterChanged.emit(this.selectNode.value);
                this._widget.delimiter = this.selectNode.value;
                break;
            default:
                break;
        }
    }
    /**
     * Handle `after-attach` messages for the widget.
     */
    onAfterAttach(msg) {
        this.selectNode.addEventListener('change', this);
    }
    /**
     * Handle `before-detach` messages for the widget.
     */
    onBeforeDetach(msg) {
        this.selectNode.removeEventListener('change', this);
    }
}
/**
 * A namespace for private toolbar methods.
 */
var Private;
(function (Private) {
    /**
     * Create the node for the delimiter switcher.
     */
    function createNode(selected, translator) {
        translator = translator || nullTranslator;
        const trans = translator === null || translator === void 0 ? void 0 : translator.load('jupyterlab');
        // The supported parsing delimiters and labels.
        const delimiters = [
            [',', ','],
            [';', ';'],
            ['\t', trans.__('tab')],
            ['|', trans.__('pipe')],
            ['#', trans.__('hash')]
        ];
        const div = document.createElement('div');
        const label = document.createElement('span');
        const select = document.createElement('select');
        label.textContent = trans.__('Delimiter: ');
        label.className = CSV_DELIMITER_LABEL_CLASS;
        each(delimiters, ([delimiter, label]) => {
            const option = document.createElement('option');
            option.value = delimiter;
            option.textContent = label;
            if (delimiter === selected) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        div.appendChild(label);
        const node = Styling.wrapSelect(select);
        node.classList.add(CSV_DELIMITER_DROPDOWN_CLASS);
        div.appendChild(node);
        return div;
    }
    Private.createNode = createNode;
})(Private || (Private = {}));
//# sourceMappingURL=toolbar.js.map