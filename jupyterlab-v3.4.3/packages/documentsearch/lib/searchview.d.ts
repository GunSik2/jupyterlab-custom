import { ITranslator } from '@jupyterlab/translation';
import { VDomRenderer } from '@jupyterlab/ui-components';
import { ISignal } from '@lumino/signaling';
import { SearchDocumentModel } from './searchmodel';
/**
 * Search document widget
 */
export declare class SearchDocumentView extends VDomRenderer<SearchDocumentModel> {
    protected translator?: ITranslator | undefined;
    /**
     * Search document widget constructor.
     *
     * @param model Search document model
     * @param translator Application translator object
     */
    constructor(model: SearchDocumentModel, translator?: ITranslator | undefined);
    /**
     * A signal emitted when the widget is closed.
     *
     * Closing the widget detached it from the DOM but does not dispose it.
     */
    get closed(): ISignal<SearchDocumentView, void>;
    /**
     * Focus search input.
     */
    focusSearchInput(): void;
    /**
     * Set the search text
     *
     * It does not trigger a view update.
     */
    setSearchText(search: string): void;
    /**
     * Set the replace text
     *
     * It does not trigger a view update.
     */
    setReplaceText(replace: string): void;
    /**
     * Show the replacement input box.
     */
    showReplace(): void;
    protected setReplaceInputVisibility(v: boolean): void;
    render(): JSX.Element;
    private _searchInput;
    private _showReplace;
    private _closed;
}
