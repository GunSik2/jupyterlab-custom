// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/**
 * @packageDocumentation
 * @module pdf-extension
 */
import { PromiseDelegate } from '@lumino/coreutils';
import { DisposableDelegate } from '@lumino/disposable';
import { Widget } from '@lumino/widgets';
/**
 * The MIME type for PDF.
 */
const MIME_TYPE = 'application/pdf';
/**
 * A class for rendering a PDF document.
 */
export class RenderedPDF extends Widget {
    constructor() {
        super();
        this._base64 = '';
        this._disposable = null;
        this._ready = new PromiseDelegate();
        this.addClass('jp-PDFContainer');
        // We put the object in an iframe, which seems to have a better chance
        // of retaining its scroll position upon tab focusing, moving around etc.
        const iframe = document.createElement('iframe');
        this.node.appendChild(iframe);
        // The iframe content window is not available until the onload event.
        iframe.onload = () => {
            const body = iframe.contentWindow.document.createElement('body');
            body.style.margin = '0px';
            iframe.contentWindow.document.body = body;
            this._object = iframe.contentWindow.document.createElement('object');
            // work around for https://discussions.apple.com/thread/252247740
            // Detect if running on Desktop Safari
            if (!window.safari) {
                this._object.type = MIME_TYPE;
            }
            this._object.width = '100%';
            this._object.height = '100%';
            body.appendChild(this._object);
            this._ready.resolve(void 0);
        };
    }
    /**
     * Render PDF into this widget's node.
     */
    async renderModel(model) {
        await this._ready.promise;
        const data = model.data[MIME_TYPE];
        if (!data ||
            (data.length === this._base64.length && data === this._base64)) {
            // If there is no data, or if the string has not changed, we do not
            // need to re-parse the data and rerender. We do, however, check
            // for a fragment if the user wants to scroll the output.
            if (model.metadata.fragment && this._object.data) {
                const url = this._object.data;
                this._object.data = `${url.split('#')[0]}${model.metadata.fragment}`;
            }
            // For some opaque reason, Firefox seems to loose its scroll position
            // upon unhiding a PDF. But triggering a refresh of the URL makes it
            // find it again. No idea what the reason for this is.
            if (Private.IS_FIREFOX) {
                this._object.data = this._object.data; // eslint-disable-line
            }
            return Promise.resolve(void 0);
        }
        this._base64 = data;
        const blob = Private.b64toBlob(data, MIME_TYPE);
        // Release reference to any previous object url.
        if (this._disposable) {
            this._disposable.dispose();
        }
        let objectUrl = URL.createObjectURL(blob);
        if (model.metadata.fragment) {
            objectUrl += model.metadata.fragment;
        }
        this._object.data = objectUrl;
        // Set the disposable release the object URL.
        this._disposable = new DisposableDelegate(() => {
            try {
                URL.revokeObjectURL(objectUrl);
            }
            catch (error) {
                /* no-op */
            }
        });
        return;
    }
    /**
     * Handle a `before-hide` message.
     */
    onBeforeHide() {
        // Dispose of any URL fragment before hiding the widget
        // so that it is not remembered upon show. Only Firefox
        // seems to have a problem with this.
        if (Private.IS_FIREFOX) {
            this._object.data = this._object.data.split('#')[0];
        }
    }
    /**
     * Dispose of the resources held by the pdf widget.
     */
    dispose() {
        if (this._disposable) {
            this._disposable.dispose();
        }
        super.dispose();
    }
}
/**
 * A mime renderer factory for PDF data.
 */
export const rendererFactory = {
    safe: false,
    mimeTypes: [MIME_TYPE],
    defaultRank: 100,
    createRenderer: options => new RenderedPDF()
};
const extensions = [
    {
        id: '@jupyterlab/pdf-extension:factory',
        rendererFactory,
        dataType: 'string',
        documentWidgetFactoryOptions: {
            name: 'PDF',
            modelName: 'base64',
            primaryFileType: 'PDF',
            fileTypes: ['PDF'],
            defaultFor: ['PDF']
        }
    }
];
export default extensions;
/**
 * A namespace for PDF widget private data.
 */
var Private;
(function (Private) {
    /**
     * A flag for determining whether the user is using Firefox.
     * There are some different PDF viewer behaviors on Firefox,
     * and we try to address them with this. User agent string parsing
     * is *not* reliable, so this should be considered a best-effort test.
     */
    Private.IS_FIREFOX = /Firefox/.test(navigator.userAgent);
    /**
     * Convert a base64 encoded string to a Blob object.
     * Modified from a snippet found here:
     * https://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
     *
     * @param b64Data - The base64 encoded data.
     *
     * @param contentType - The mime type of the data.
     *
     * @param sliceSize - The size to chunk the data into for processing.
     *
     * @returns a Blob for the data.
     */
    function b64toBlob(b64Data, contentType = '', sliceSize = 512) {
        const byteCharacters = atob(b64Data);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        return new Blob(byteArrays, { type: contentType });
    }
    Private.b64toBlob = b64toBlob;
})(Private || (Private = {}));
//# sourceMappingURL=index.js.map