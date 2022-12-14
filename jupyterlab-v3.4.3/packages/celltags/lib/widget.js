import { checkIcon } from '@jupyterlab/ui-components';
import { Widget } from '@lumino/widgets';
/**
 * A widget which hosts a cell tags area.
 */
export class TagWidget extends Widget {
    /**
     * Construct a new tag widget.
     */
    constructor(name) {
        super();
        this.parent = null;
        this.applied = true;
        this.name = name;
        this.addClass('tag');
        this.buildTag();
    }
    /**
     * Create tag div with icon and attach to this.node.
     */
    buildTag() {
        const text = document.createElement('span');
        text.textContent = this.name;
        text.style.textOverflow = 'ellipsis';
        const tag = document.createElement('div');
        tag.className = 'tag-holder';
        tag.appendChild(text);
        const iconContainer = checkIcon.element({
            tag: 'span',
            elementPosition: 'center',
            height: '18px',
            width: '18px',
            marginLeft: '5px',
            marginRight: '-3px'
        });
        if (this.applied) {
            this.addClass('applied-tag');
        }
        else {
            this.addClass('unapplied-tag');
            iconContainer.style.display = 'none';
        }
        tag.appendChild(iconContainer);
        this.node.appendChild(tag);
    }
    /**
     * Handle `after-attach` messages for the widget.
     */
    onAfterAttach() {
        this.node.addEventListener('mousedown', this);
        this.node.addEventListener('mouseover', this);
        this.node.addEventListener('mouseout', this);
    }
    /**
     * Handle `before-detach` messages for the widget.
     */
    onBeforeDetach() {
        this.node.removeEventListener('mousedown', this);
        this.node.removeEventListener('mouseover', this);
        this.node.removeEventListener('mouseout', this);
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
            case 'mousedown':
                this._evtClick();
                break;
            case 'mouseover':
                this._evtMouseOver();
                break;
            case 'mouseout':
                this._evtMouseOut();
                break;
            default:
                break;
        }
    }
    /**
     * Handle `update-request` messages. Check if applied to current active cell.
     */
    onUpdateRequest() {
        var _a;
        const applied = (_a = this.parent) === null || _a === void 0 ? void 0 : _a.checkApplied(this.name);
        if (applied !== this.applied) {
            this.toggleApplied();
        }
    }
    /**
     * Update styling to reflect whether tag is applied to current active cell.
     */
    toggleApplied() {
        var _a, _b;
        if (this.applied) {
            this.removeClass('applied-tag');
            ((_a = this.node.firstChild) === null || _a === void 0 ? void 0 : _a.lastChild).style.display =
                'none';
            this.addClass('unapplied-tag');
        }
        else {
            this.removeClass('unapplied-tag');
            ((_b = this.node.firstChild) === null || _b === void 0 ? void 0 : _b.lastChild).style.display =
                'inline-block';
            this.addClass('applied-tag');
        }
        this.applied = !this.applied;
    }
    /**
     * Handle the `'click'` event for the widget.
     */
    _evtClick() {
        var _a, _b;
        if (this.applied) {
            (_a = this.parent) === null || _a === void 0 ? void 0 : _a.removeTag(this.name);
        }
        else {
            (_b = this.parent) === null || _b === void 0 ? void 0 : _b.addTag(this.name);
        }
        this.toggleApplied();
    }
    /**
     * Handle the `'mouseover'` event for the widget.
     */
    _evtMouseOver() {
        this.node.classList.add('tag-hover');
    }
    /**
     * Handle the `'mouseout'` event for the widget.
     */
    _evtMouseOut() {
        this.node.classList.remove('tag-hover');
    }
}
//# sourceMappingURL=widget.js.map