/* -----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
import { Signal } from '@lumino/signaling';
import { SplitPanel as SPanel } from '@lumino/widgets';
/**
 * A deprecated split panel that will be removed when the phosphor split panel
 * supports a handle moved signal. See https://github.com/phosphorjs/phosphor/issues/297.
 */
export class SplitPanel extends SPanel {
    constructor() {
        super(...arguments);
        /**
         * Emits when the split handle has moved.
         */
        this.handleMoved = new Signal(this);
    }
    handleEvent(event) {
        super.handleEvent(event);
        if (event.type === 'mouseup') {
            this.handleMoved.emit(undefined);
        }
    }
}
//# sourceMappingURL=splitpanel.js.map