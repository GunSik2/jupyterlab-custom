import { VirtualElement } from '@lumino/virtualdom';
import { DockPanel, TabBar, TabPanel, Widget } from '@lumino/widgets';
import { ITranslator } from '@jupyterlab/translation';
/**
 * a widget which displays titles as a single row or column of tabs.
 * Tweaked to use an inline svg as the close icon
 */
export declare class TabBarSvg<T> extends TabBar<T> {
    /**
     * Construct a new tab bar. Overrides the default renderer.
     *
     * @param options - The options for initializing the tab bar.
     */
    constructor(options?: TabBarSvg.IOptions<T>);
}
export declare namespace TabBarSvg {
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
        renderCloseIcon(data: TabBar.IRenderData<any>): VirtualElement;
    }
    const defaultRenderer: Renderer;
    interface IOptions<T> extends TabBar.IOptions<T> {
        /**
         * The application language translator.
         */
        translator?: ITranslator;
    }
}
/**
 * a widget which provides a flexible docking area for widgets.
 * Tweaked to use an inline svg as the close icon
 */
export declare class DockPanelSvg extends DockPanel {
    /**
     * Construct a new dock panel.
     *
     * @param options - The options for initializing the panel.
     */
    constructor(options?: DockPanelSvg.IOptions);
}
export declare namespace DockPanelSvg {
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
        createTabBar(): TabBarSvg<Widget>;
    }
    const defaultRenderer: Renderer;
    interface IOptions extends DockPanel.IOptions {
        /**
         * The application language translator.
         */
        translator?: ITranslator;
    }
}
/**
 * A widget which combines a `TabBar` and a `StackedPanel`.
 * Tweaked to use an inline svg as the close icon
 */
export declare class TabPanelSvg extends TabPanel {
    /**
     * Construct a new tab panel.
     *
     * @param options - The options for initializing the tab panel.
     */
    constructor(options?: TabPanel.IOptions);
}
