// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
export const CONTEXT_PROVIDER_ID = 'CompletionProvider:context';
/**
 * A context connector for completion handlers.
 */
export class ContextCompleterProvider {
    constructor() {
        this.identifier = CONTEXT_PROVIDER_ID;
        this.renderer = null;
    }
    /**
     * The context completion provider is applicable on all cases.
     * @param context - additional information about context of completion request
     */
    async isApplicable(context) {
        return true;
    }
    /**
     * Fetch completion requests.
     *
     * @param request - The completion request text and details.
     */
    fetch(request, context) {
        const editor = context.editor;
        if (!editor) {
            return Promise.reject('No editor');
        }
        return new Promise(resolve => {
            resolve(Private.contextHint(editor));
        });
    }
}
/**
 * A namespace for Private functionality.
 */
var Private;
(function (Private) {
    /**
     * Get a list of completion hints from a tokenization
     * of the editor.
     */
    function contextHint(editor) {
        // Find the token at the cursor
        const cursor = editor.getCursorPosition();
        const token = editor.getTokenForPosition(cursor);
        // Get the list of matching tokens.
        const tokenList = getCompletionTokens(token, editor);
        // Only choose the ones that have a non-empty type
        // field, which are likely to be of interest.
        const completionList = tokenList.filter(t => t.type).map(t => t.value);
        // Remove duplicate completions from the list
        const matches = new Set(completionList);
        const items = new Array();
        matches.forEach(label => items.push({ label }));
        return {
            start: token.offset,
            end: token.offset + token.value.length,
            items
        };
    }
    Private.contextHint = contextHint;
    /**
     * Get a list of tokens that match the completion request,
     * but are not identical to the completion request.
     */
    function getCompletionTokens(token, editor) {
        const candidates = editor.getTokens();
        // Only get the tokens that have a common start, but
        // are not identical.
        return candidates.filter(t => t.value.indexOf(token.value) === 0 && t.value !== token.value);
    }
})(Private || (Private = {}));
//# sourceMappingURL=contextprovider.js.map