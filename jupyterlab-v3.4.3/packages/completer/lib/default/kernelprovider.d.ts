import { IObservableString } from '@jupyterlab/observables';
import { CompletionHandler } from '../handler';
import { ICompletionContext, ICompletionProvider } from '../tokens';
import { Completer } from '../widget';
export declare const KERNEL_PROVIDER_ID = "CompletionProvider:kernel";
/**
 * A kernel connector for completion handlers.
 */
export declare class KernelCompleterProvider implements ICompletionProvider {
    /**
     * The kernel completion provider is applicable only if the kernel is available.
     * @param context - additional information about context of completion request
     */
    isApplicable(context: ICompletionContext): Promise<boolean>;
    /**
     * Fetch completion requests.
     *
     * @param request - The completion request text and details.
     */
    fetch(request: CompletionHandler.IRequest, context: ICompletionContext): Promise<CompletionHandler.ICompletionItemsReply>;
    /**
     * Kernel provider will use the inspect request to lazy-load the content
     * for document panel.
     */
    resolve(item: CompletionHandler.ICompletionItem, context: ICompletionContext, patch?: Completer.IPatch | null): Promise<CompletionHandler.ICompletionItem>;
    /**
     * Kernel provider will activate the completer in continuous mode after
     * the `.` character.
     */
    shouldShowContinuousHint(visible: boolean, changed: IObservableString.IChangedArgs): boolean;
    readonly identifier = "CompletionProvider:kernel";
    readonly renderer: null;
}
