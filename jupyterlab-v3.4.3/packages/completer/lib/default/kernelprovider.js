// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { Text } from '@jupyterlab/coreutils';
export const KERNEL_PROVIDER_ID = 'CompletionProvider:kernel';
/**
 * A kernel connector for completion handlers.
 */
export class KernelCompleterProvider {
    constructor() {
        this.identifier = KERNEL_PROVIDER_ID;
        this.renderer = null;
    }
    /**
     * The kernel completion provider is applicable only if the kernel is available.
     * @param context - additional information about context of completion request
     */
    async isApplicable(context) {
        var _a;
        const hasKernel = (_a = context.session) === null || _a === void 0 ? void 0 : _a.kernel;
        if (!hasKernel) {
            return false;
        }
        return true;
    }
    /**
     * Fetch completion requests.
     *
     * @param request - The completion request text and details.
     */
    async fetch(request, context) {
        var _a;
        const kernel = (_a = context.session) === null || _a === void 0 ? void 0 : _a.kernel;
        if (!kernel) {
            throw new Error('No kernel for completion request.');
        }
        const contents = {
            code: request.text,
            cursor_pos: request.offset
        };
        const msg = await kernel.requestComplete(contents);
        const response = msg.content;
        if (response.status !== 'ok') {
            throw new Error('Completion fetch failed to return successfully.');
        }
        const items = new Array();
        const metadata = response.metadata
            ._jupyter_types_experimental;
        response.matches.forEach((label, index) => {
            if (metadata[index]) {
                items.push({
                    label,
                    type: metadata[index].type,
                    insertText: metadata[index].text
                });
            }
            else {
                items.push({ label });
            }
        });
        return {
            start: response.cursor_start,
            end: response.cursor_end,
            items
        };
    }
    /**
     * Kernel provider will use the inspect request to lazy-load the content
     * for document panel.
     */
    async resolve(item, context, patch) {
        const { editor, session } = context;
        if (session && editor) {
            let code = editor.model.value.text;
            const position = editor.getCursorPosition();
            let offset = Text.jsIndexToCharIndex(editor.getOffsetAt(position), code);
            const kernel = session.kernel;
            if (!code || !kernel) {
                return Promise.resolve(item);
            }
            if (patch) {
                const { start, value } = patch;
                code = code.substring(0, start) + value;
                offset = offset + value.length;
            }
            const contents = {
                code,
                cursor_pos: offset,
                detail_level: 0
            };
            const msg = await kernel.requestInspect(contents);
            const value = msg.content;
            if (value.status !== 'ok' || !value.found) {
                return item;
            }
            item.documentation = value.data['text/plain'];
            return item;
        }
        return item;
    }
    /**
     * Kernel provider will activate the completer in continuous mode after
     * the `.` character.
     */
    shouldShowContinuousHint(visible, changed) {
        if (changed.type === 'remove') {
            return false;
        }
        if (changed.value === '.') {
            return true;
        }
        return !visible && changed.value.trim().length > 0;
    }
}
//# sourceMappingURL=kernelprovider.js.map