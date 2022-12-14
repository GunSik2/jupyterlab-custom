// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { hpass } from '@lumino/virtualdom';
import { DockPanel, TabBar, TabPanel } from '@lumino/widgets';
import { LabIconStyle } from '../../style';
import { classes } from '../../utils';
import { addIcon, closeIcon } from '../iconimports';
import { nullTranslator } from '@jupyterlab/translation';
/**
 * a widget which displays titles as a single row or column of tabs.
 * Tweaked to use an inline svg as the close icon
 */
export class TabBarSvg extends TabBar {
    /**
     * Construct a new tab bar. Overrides the default renderer.
     *
     * @param options - The options for initializing the tab bar.
     */
    constructor(options = {}) {
        options.renderer = options.renderer || TabBarSvg.defaultRenderer;
        super(options);
        const trans = ((options && options.translator) || nullTranslator).load('jupyterlab');
        addIcon.element({
            container: this.addButtonNode,
            title: trans.__('New Launcher')
        });
    }
}
(function (TabBarSvg) {
    /**
     * A modified implementation of the TabBar Renderer.
     */
    class Renderer extends TabBar.Renderer {
        /**
         * Render the close icon element for a tab.
         *
         * @param data - The data to use for rendering the tab.
         *
         * @returns A virtual element representing the tab close icon.
         */
        renderCloseIcon(data) {
            const className = classes('jp-icon-hover lm-TabBar-tabCloseIcon', LabIconStyle.styleClass({
                elementPosition: 'center',
                height: '16px',
                width: '16px'
            }));
            return hpass('div', { className }, closeIcon);
        }
    }
    TabBarSvg.Renderer = Renderer;
    TabBarSvg.defaultRenderer = new Renderer();
})(TabBarSvg || (TabBarSvg = {}));
/**
 * a widget which provides a flexible docking area for widgets.
 * Tweaked to use an inline svg as the close icon
 */
export class DockPanelSvg extends DockPanel {
    /**
     * Construct a new dock panel.
     *
     * @param options - The options for initializing the panel.
     */
    constructor(options = {}) {
        options.renderer = options.renderer || DockPanelSvg.defaultRenderer;
        super(options);
    }
}
(function (DockPanelSvg) {
    /**
     * A modified implementation of the DockPanel Renderer.
     */
    class Renderer extends DockPanel.Renderer {
        /**
         * Create a new tab bar (with inline svg icons enabled
         * for use with a dock panel.
         *
         * @returns A new tab bar for a dock panel.
         */
        createTabBar() {
            const bar = new TabBarSvg();
            bar.addClass('lm-DockPanel-tabBar');
            return bar;
        }
    }
    DockPanelSvg.Renderer = Renderer;
    DockPanelSvg.defaultRenderer = new Renderer();
})(DockPanelSvg || (DockPanelSvg = {}));
/**
 * A widget which combines a `TabBar` and a `StackedPanel`.
 * Tweaked to use an inline svg as the close icon
 */
export class TabPanelSvg extends TabPanel {
    /**
     * Construct a new tab panel.
     *
     * @param options - The options for initializing the tab panel.
     */
    constructor(options = {}) {
        options.renderer = options.renderer || TabBarSvg.defaultRenderer;
        super(options);
    }
}
//# sourceMappingURL=tabbarsvg.js.map