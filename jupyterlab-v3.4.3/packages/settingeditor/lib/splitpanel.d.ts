import { ISignal } from '@lumino/signaling';
import { SplitPanel as SPanel } from '@lumino/widgets';
/**
 * A deprecated split panel that will be removed when the phosphor split panel
 * supports a handle moved signal. See https://github.com/phosphorjs/phosphor/issues/297.
 */
export declare class SplitPanel extends SPanel {
    /**
     * Emits when the split handle has moved.
     */
    readonly handleMoved: ISignal<any, void>;
    handleEvent(event: Event): void;
}
