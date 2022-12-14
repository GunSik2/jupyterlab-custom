import { Panel } from '@lumino/widgets';
import { Toolbar } from './toolbar';
/**
 * A base class for panel widget with toolbar.
 */
export class PanelWithToolbar extends Panel {
    constructor(options = {}) {
        super(options);
        this._toolbar = new Toolbar();
    }
    /**
     * Widget toolbar
     */
    get toolbar() {
        return this._toolbar;
    }
}
//# sourceMappingURL=panelwithtoolbar.js.map