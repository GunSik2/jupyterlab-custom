// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { DataConnector } from '@jupyterlab/statedb';
/**
 * A context connector for completion handlers.
 */
export class ContextConnector extends DataConnector {
    /**
     * Create a new context connector for completion requests.
     *
     * @param options - The instantiation options for the context connector.
     */
    constructor(options) {
        super();
        this._editor = options.editor;
    }
    /**
     * Fetch completion requests.
     *
     * @param request - The completion request text and details.
     */
    fetch(request) {
        if (!this._editor) {
            return Promise.reject('No editor');
        }
        return new Promise(resolve => {
            resolve(Private.contextHint(this._editor));
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
        const matches = Array.from(new Set(completionList));
        return {
            start: token.offset,
            end: token.offset + token.value.length,
            matches,
            metadata: {}
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
//# sourceMappingURL=contextconnector.js.map