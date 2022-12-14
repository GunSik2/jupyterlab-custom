import { CompletionHandler } from '../handler';
import { ICompletionContext, ICompletionProvider } from '../tokens';
export declare const CONTEXT_PROVIDER_ID = "CompletionProvider:context";
/**
 * A context connector for completion handlers.
 */
export declare class ContextCompleterProvider implements ICompletionProvider {
    /**
     * The context completion provider is applicable on all cases.
     * @param context - additional information about context of completion request
     */
    isApplicable(context: ICompletionContext): Promise<boolean>;
    /**
     * Fetch completion requests.
     *
     * @param request - The completion request text and details.
     */
    fetch(request: CompletionHandler.IRequest, context: ICompletionContext): Promise<CompletionHandler.ICompletionItemsReply>;
    readonly identifier = "CompletionProvider:context";
    readonly renderer: null;
}
