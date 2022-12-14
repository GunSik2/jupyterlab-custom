// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { MessageLoop } from '@lumino/messaging';
import { AccordionLayout, AccordionPanel, Widget } from '@lumino/widgets';
import { caretDownIcon } from '../icon';
/**
 * Accordion panel layout that adds a toolbar in widget title if present.
 */
class AccordionToolbarLayout extends AccordionLayout {
    constructor() {
        super(...arguments);
        this._toolbars = new WeakMap();
    }
    /**
     * Insert a widget into the layout at the specified index.
     *
     * @param index - The index at which to insert the widget.
     *
     * @param widget - The widget to insert into the layout.
     *
     * #### Notes
     * The index will be clamped to the bounds of the widgets.
     *
     * If the widget is already added to the layout, it will be moved.
     *
     * #### Undefined Behavior
     * An `index` which is non-integral.
     */
    insertWidget(index, widget) {
        if (widget.toolbar) {
            this._toolbars.set(widget, widget.toolbar);
            widget.toolbar.addClass('jp-AccordionPanel-toolbar');
        }
        super.insertWidget(index, widget);
    }
    /**
     * Remove the widget at a given index from the layout.
     *
     * @param index - The index of the widget to remove.
     *
     * #### Notes
     * A widget is automatically removed from the layout when its `parent`
     * is set to `null`. This method should only be invoked directly when
     * removing a widget from a layout which has yet to be installed on a
     * parent widget.
     *
     * This method does *not* modify the widget's `parent`.
     *
     * #### Undefined Behavior
     * An `index` which is non-integral.
     */
    removeWidgetAt(index) {
        const widget = this.widgets[index];
        super.removeWidgetAt(index);
        // Remove the toolbar after the widget has `removeWidgetAt` will call `detachWidget`
        if (widget && this._toolbars.has(widget)) {
            this._toolbars.delete(widget);
        }
    }
    /**
     * Attach a widget to the parent's DOM node.
     *
     * @param index - The current index of the widget in the layout.
     *
     * @param widget - The widget to attach to the parent.
     */
    attachWidget(index, widget) {
        super.attachWidget(index, widget);
        const toolbar = this._toolbars.get(widget);
        if (toolbar) {
            // Send a `'before-attach'` message if the parent is attached.
            if (this.parent.isAttached) {
                MessageLoop.sendMessage(toolbar, Widget.Msg.BeforeAttach);
            }
            // Insert the toolbar in the title node.
            this.titles[index].appendChild(toolbar.node);
            // Send an `'after-attach'` message if the parent is attached.
            if (this.parent.isAttached) {
                MessageLoop.sendMessage(toolbar, Widget.Msg.AfterAttach);
            }
        }
    }
    /**
     * Detach a widget from the parent's DOM node.
     *
     * @param index - The previous index of the widget in the layout.
     *
     * @param widget - The widget to detach from the parent.
     */
    detachWidget(index, widget) {
        const toolbar = this._toolbars.get(widget);
        if (toolbar) {
            // Send a `'before-detach'` message if the parent is attached.
            if (this.parent.isAttached) {
                MessageLoop.sendMessage(toolbar, Widget.Msg.BeforeDetach);
            }
            // Remove the toolbar in the title node.
            this.titles[index].removeChild(toolbar.node);
            // Send an `'after-detach'` message if the parent is attached.
            if (this.parent.isAttached) {
                MessageLoop.sendMessage(toolbar, Widget.Msg.AfterDetach);
            }
        }
        super.detachWidget(index, widget);
    }
    /**
     * A message handler invoked on a `'before-attach'` message.
     *
     * #### Notes
     * The default implementation of this method forwards the message
     * to all widgets. It assumes all widget nodes are attached to the
     * parent widget node.
     *
     * This may be reimplemented by subclasses as needed.
     */
    onBeforeAttach(msg) {
        this.notifyToolbars(msg);
        super.onBeforeAttach(msg);
    }
    /**
     * A message handler invoked on an `'after-attach'` message.
     *
     * #### Notes
     * The default implementation of this method forwards the message
     * to all widgets. It assumes all widget nodes are attached to the
     * parent widget node.
     *
     * This may be reimplemented by subclasses as needed.
     */
    onAfterAttach(msg) {
        super.onAfterAttach(msg);
        this.notifyToolbars(msg);
    }
    /**
     * A message handler invoked on a `'before-detach'` message.
     *
     * #### Notes
     * The default implementation of this method forwards the message
     * to all widgets. It assumes all widget nodes are attached to the
     * parent widget node.
     *
     * This may be reimplemented by subclasses as needed.
     */
    onBeforeDetach(msg) {
        this.notifyToolbars(msg);
        super.onBeforeDetach(msg);
    }
    /**
     * A message handler invoked on an `'after-detach'` message.
     *
     * #### Notes
     * The default implementation of this method forwards the message
     * to all widgets. It assumes all widget nodes are attached to the
     * parent widget node.
     *
     * This may be reimplemented by subclasses as needed.
     */
    onAfterDetach(msg) {
        super.onAfterDetach(msg);
        this.notifyToolbars(msg);
    }
    notifyToolbars(msg) {
        this.widgets.forEach(widget => {
            const toolbar = this._toolbars.get(widget);
            if (toolbar) {
                toolbar.processMessage(msg);
            }
        });
    }
}
export var AccordionToolbar;
(function (AccordionToolbar) {
    /**
     * Custom renderer for the SidePanel
     */
    class Renderer extends AccordionPanel.Renderer {
        /**
         * Render the collapse indicator for a section title.
         *
         * @param data - The data to use for rendering the section title.
         *
         * @returns A element representing the collapse indicator.
         */
        createCollapseIcon(data) {
            const iconDiv = document.createElement('div');
            caretDownIcon.element({
                container: iconDiv
            });
            return iconDiv;
        }
        /**
         * Render the element for a section title.
         *
         * @param data - The data to use for rendering the section title.
         *
         * @returns A element representing the section title.
         */
        createSectionTitle(data) {
            const handle = super.createSectionTitle(data);
            handle.classList.add('jp-AccordionPanel-title');
            return handle;
        }
    }
    AccordionToolbar.Renderer = Renderer;
    AccordionToolbar.defaultRenderer = new Renderer();
    /**
     * Create an accordion layout for accordion panel with toolbar in the title.
     *
     * @param options Panel options
     * @returns Panel layout
     *
     * #### Note
     *
     * Default titleSpace is 29 px (default var(--jp-private-toolbar-height) - but not styled)
     */
    function createLayout(options) {
        var _a;
        return (options.layout ||
            new AccordionToolbarLayout({
                renderer: options.renderer || AccordionToolbar.defaultRenderer,
                orientation: options.orientation,
                alignment: options.alignment,
                spacing: options.spacing,
                titleSpace: (_a = options.titleSpace) !== null && _a !== void 0 ? _a : 29
            }));
    }
    AccordionToolbar.createLayout = createLayout;
})(AccordionToolbar || (AccordionToolbar = {}));
//# sourceMappingURL=accordiontoolbar.js.map