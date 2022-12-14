// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/**
 * @packageDocumentation
 * @module javascript-extension
 */
import { RenderedJavaScript } from '@jupyterlab/rendermime';
export const TEXT_JAVASCRIPT_MIMETYPE = 'text/javascript';
export const APPLICATION_JAVASCRIPT_MIMETYPE = 'application/javascript';
function evalInContext(code, element, document, window) {
    // eslint-disable-next-line
    return eval(code);
}
export class ExperimentalRenderedJavascript extends RenderedJavaScript {
    render(model) {
        const trans = this.translator.load('jupyterlab');
        const renderJavascript = () => {
            try {
                const data = model.data[this.mimeType];
                if (data) {
                    evalInContext(data, this.node, document, window);
                }
                return Promise.resolve();
            }
            catch (error) {
                return Promise.reject(error);
            }
        };
        if (!model.trusted) {
            // If output is not trusted or if arbitrary Javascript execution is not enabled, render an informative error message
            const pre = document.createElement('pre');
            pre.textContent = trans.__('Are you sure that you want to run arbitrary Javascript within your JupyterLab session?');
            const button = document.createElement('button');
            button.textContent = trans.__('Run');
            this.node.appendChild(pre);
            this.node.appendChild(button);
            button.onclick = event => {
                this.node.textContent = '';
                void renderJavascript();
            };
            return Promise.resolve();
        }
        return renderJavascript();
    }
}
/**
 * A mime renderer factory for text/javascript data.
 */
export const rendererFactory = {
    safe: false,
    mimeTypes: [TEXT_JAVASCRIPT_MIMETYPE, APPLICATION_JAVASCRIPT_MIMETYPE],
    createRenderer: options => new ExperimentalRenderedJavascript(options)
};
const extension = {
    id: '@jupyterlab/javascript-extension:factory',
    rendererFactory,
    rank: 0,
    dataType: 'string'
};
export default extension;
//# sourceMappingURL=index.js.map