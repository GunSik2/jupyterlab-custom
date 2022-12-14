// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { nullTranslator } from '@jupyterlab/translation';
import { MessageLoop } from '@lumino/messaging';
import { BoxLayout, BoxPanel, Widget } from '@lumino/widgets';
import { DOMUtils } from './domutils';
import { Printing } from './printing';
import { Spinner } from './spinner';
import { ReactiveToolbar } from './toolbar';
/**
 * A flag to indicate that event handlers are caught in the capture phase.
 */
const USE_CAPTURE = true;
/**
 * A widget meant to be contained in the JupyterLab main area.
 *
 * #### Notes
 * Mirrors all of the `title` attributes of the content.
 * This widget is `closable` by default.
 * This widget is automatically disposed when closed.
 * This widget ensures its own focus when activated.
 */
export class MainAreaWidget extends Widget {
    /**
     * Construct a new main area widget.
     *
     * @param options - The options for initializing the widget.
     */
    constructor(options) {
        super(options);
        this._changeGuard = false;
        this._spinner = new Spinner();
        this._isRevealed = false;
        this._evtMouseDown = () => {
            if (!this.node.contains(document.activeElement)) {
                this._focusContent();
            }
        };
        this.addClass('jp-MainAreaWidget');
        // Set contain=strict to avoid many forced layout rendering while adding cells.
        // Don't forget to remove the CSS class when your remove the spinner to allow
        // the content to be rendered.
        // @see https://github.com/jupyterlab/jupyterlab/issues/9381
        this.addClass('jp-MainAreaWidget-ContainStrict');
        this.id = DOMUtils.createDomID();
        const trans = (options.translator || nullTranslator).load('jupyterlab');
        const content = (this._content = options.content);
        content.node.setAttribute('role', 'region');
        content.node.setAttribute('aria-label', trans.__('notebook content'));
        const toolbar = (this._toolbar = options.toolbar || new ReactiveToolbar());
        toolbar.node.setAttribute('role', 'navigation');
        toolbar.node.setAttribute('aria-label', trans.__('notebook actions'));
        const contentHeader = (this._contentHeader =
            options.contentHeader ||
                new BoxPanel({
                    direction: 'top-to-bottom',
                    spacing: 0
                }));
        const layout = (this.layout = new BoxLayout({ spacing: 0 }));
        layout.direction = 'top-to-bottom';
        BoxLayout.setStretch(toolbar, 0);
        BoxLayout.setStretch(contentHeader, 0);
        BoxLayout.setStretch(content, 1);
        layout.addWidget(toolbar);
        layout.addWidget(contentHeader);
        layout.addWidget(content);
        if (!content.id) {
            content.id = DOMUtils.createDomID();
        }
        content.node.tabIndex = 0;
        this._updateTitle();
        content.title.changed.connect(this._updateTitle, this);
        this.title.closable = true;
        this.title.changed.connect(this._updateContentTitle, this);
        if (options.reveal) {
            this.node.appendChild(this._spinner.node);
            this._revealed = options.reveal
                .then(() => {
                if (content.isDisposed) {
                    this.dispose();
                    return;
                }
                content.disposed.connect(() => this.dispose());
                const active = document.activeElement === this._spinner.node;
                this._disposeSpinner();
                this._isRevealed = true;
                if (active) {
                    this._focusContent();
                }
            })
                .catch(e => {
                // Show a revealed promise error.
                const error = new Widget();
                error.addClass('jp-MainAreaWidget-error');
                // Show the error to the user.
                const pre = document.createElement('pre');
                pre.textContent = String(e);
                error.node.appendChild(pre);
                BoxLayout.setStretch(error, 1);
                this._disposeSpinner();
                content.dispose();
                this._content = null;
                toolbar.dispose();
                this._toolbar = null;
                layout.addWidget(error);
                this._isRevealed = true;
                throw error;
            });
        }
        else {
            // Handle no reveal promise.
            this._spinner.dispose();
            this.removeClass('jp-MainAreaWidget-ContainStrict');
            content.disposed.connect(() => this.dispose());
            this._isRevealed = true;
            this._revealed = Promise.resolve(undefined);
        }
    }
    /**
     * Print method. Deferred to content.
     */
    [Printing.symbol]() {
        if (!this._content) {
            return null;
        }
        return Printing.getPrintFunction(this._content);
    }
    /**
     * The content hosted by the widget.
     */
    get content() {
        return this._content;
    }
    /**
     * The toolbar hosted by the widget.
     */
    get toolbar() {
        return this._toolbar;
    }
    /**
     * A panel for widgets that sit between the toolbar and the content.
     * Imagine a formatting toolbar, notification headers, etc.
     */
    get contentHeader() {
        return this._contentHeader;
    }
    /**
     * Whether the content widget or an error is revealed.
     */
    get isRevealed() {
        return this._isRevealed;
    }
    /**
     * A promise that resolves when the widget is revealed.
     */
    get revealed() {
        return this._revealed;
    }
    /**
     * Handle `'activate-request'` messages.
     */
    onActivateRequest(msg) {
        if (this._isRevealed) {
            this._focusContent();
        }
        else {
            this._spinner.node.focus();
        }
    }
    /**
     * Handle `after-attach` messages for the widget.
     */
    onAfterAttach(msg) {
        super.onAfterAttach(msg);
        // Focus content in capture phase to ensure relevant commands operate on the
        // current main area widget.
        // Add the event listener directly instead of using `handleEvent` in order
        // to save sub-classes from needing to reason about calling it as well.
        this.node.addEventListener('mousedown', this._evtMouseDown, USE_CAPTURE);
    }
    /**
     * Handle `before-detach` messages for the widget.
     */
    onBeforeDetach(msg) {
        this.node.removeEventListener('mousedown', this._evtMouseDown, USE_CAPTURE);
        super.onBeforeDetach(msg);
    }
    /**
     * Handle `'close-request'` messages.
     */
    onCloseRequest(msg) {
        this.dispose();
    }
    /**
     * Handle `'update-request'` messages by forwarding them to the content.
     */
    onUpdateRequest(msg) {
        if (this._content) {
            MessageLoop.sendMessage(this._content, msg);
        }
    }
    _disposeSpinner() {
        this.node.removeChild(this._spinner.node);
        this._spinner.dispose();
        this.removeClass('jp-MainAreaWidget-ContainStrict');
    }
    /**
     * Update the title based on the attributes of the child widget.
     */
    _updateTitle() {
        if (this._changeGuard || !this.content) {
            return;
        }
        this._changeGuard = true;
        const content = this.content;
        this.title.label = content.title.label;
        this.title.mnemonic = content.title.mnemonic;
        this.title.icon = content.title.icon;
        this.title.iconClass = content.title.iconClass;
        this.title.iconLabel = content.title.iconLabel;
        this.title.caption = content.title.caption;
        this.title.className = content.title.className;
        this.title.dataset = content.title.dataset;
        this._changeGuard = false;
    }
    /**
     * Update the content title based on attributes of the main widget.
     */
    _updateContentTitle() {
        if (this._changeGuard || !this.content) {
            return;
        }
        this._changeGuard = true;
        const content = this.content;
        content.title.label = this.title.label;
        content.title.mnemonic = this.title.mnemonic;
        content.title.icon = this.title.icon;
        content.title.iconClass = this.title.iconClass;
        content.title.iconLabel = this.title.iconLabel;
        content.title.caption = this.title.caption;
        content.title.className = this.title.className;
        content.title.dataset = this.title.dataset;
        this._changeGuard = false;
    }
    /**
     * Give focus to the content.
     */
    _focusContent() {
        if (!this.content) {
            return;
        }
        // Focus the content node if we aren't already focused on it or a
        // descendent.
        if (!this.content.node.contains(document.activeElement)) {
            this.content.node.focus();
        }
        // Activate the content asynchronously (which may change the focus).
        this.content.activate();
    }
}
//# sourceMappingURL=mainareawidget.js.map