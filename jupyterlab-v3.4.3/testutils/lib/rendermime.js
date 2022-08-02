"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRenderMime = void 0;
const json_to_html_1 = __importDefault(require("json-to-html"));
const rendermime_1 = require("@jupyterlab/rendermime");
/**
 * Get a copy of the default rendermime instance.
 */
function defaultRenderMime() {
    return Private.rendermime.clone();
}
exports.defaultRenderMime = defaultRenderMime;
/**
 * A namespace for private data.
 */
var Private;
(function (Private) {
    class JSONRenderer extends rendermime_1.RenderedHTML {
        constructor() {
            super(...arguments);
            this.mimeType = 'text/html';
        }
        renderModel(model) {
            const source = model.data['application/json'];
            model.setData({ data: { 'text/html': json_to_html_1.default(source) } });
            return super.renderModel(model);
        }
    }
    const jsonRendererFactory = {
        mimeTypes: ['application/json'],
        safe: true,
        createRenderer(options) {
            return new JSONRenderer(options);
        }
    };
    Private.rendermime = new rendermime_1.RenderMimeRegistry({
        initialFactories: rendermime_1.standardRendererFactories
    });
    Private.rendermime.addFactory(jsonRendererFactory, 10);
})(Private || (Private = {}));
//# sourceMappingURL=rendermime.js.map