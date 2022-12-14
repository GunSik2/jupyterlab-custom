import { VDomRenderer } from '@jupyterlab/ui-components';
import { TableOfContents } from './tokens';
/**
 * Table of contents widget.
 */
export declare class TableOfContentsWidget extends VDomRenderer<TableOfContents.IModel<TableOfContents.IHeading> | null> {
    /**
     * Constructor
     *
     * @param options Widget options
     */
    constructor(options?: TableOfContents.IOptions);
    /**
     * Render the content of this widget using the virtual DOM.
     *
     * This method will be called anytime the widget needs to be rendered, which
     * includes layout triggered rendering.
     */
    render(): JSX.Element | null;
}
