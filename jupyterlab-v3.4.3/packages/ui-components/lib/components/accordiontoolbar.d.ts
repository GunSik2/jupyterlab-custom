import { AccordionLayout, AccordionPanel, Title, Widget } from '@lumino/widgets';
export declare namespace AccordionToolbar {
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
        createCollapseIcon(data: Title<Widget>): HTMLElement;
        /**
         * Render the element for a section title.
         *
         * @param data - The data to use for rendering the section title.
         *
         * @returns A element representing the section title.
         */
        createSectionTitle(data: Title<Widget>): HTMLElement;
    }
    const defaultRenderer: Renderer;
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
    function createLayout(options: AccordionPanel.IOptions): AccordionLayout;
}
