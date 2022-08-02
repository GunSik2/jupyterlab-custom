// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { PathExt } from '@jupyterlab/coreutils';
import { Printing } from '@jupyterlab/apputils';
import { ABCWidgetFactory, DocumentWidget } from '@jupyterlab/docregistry';
import { PromiseDelegate } from '@lumino/coreutils';
import { Widget } from '@lumino/widgets';
/**
 * The class name added to a imageviewer.
 */
const IMAGE_CLASS = 'jp-ImageViewer';
/**
 * A widget for images.
 */
export class ImageViewer extends Widget {
    /**
     * Construct a new image widget.
     */
    constructor(context) {
        super();
        this._scale = 1;
        this._matrix = [1, 0, 0, 1];
        this._colorinversion = 0;
        this._ready = new PromiseDelegate();
        this.context = context;
        this.node.tabIndex = 0;
        this.addClass(IMAGE_CLASS);
        this._img = document.createElement('img');
        this.node.appendChild(this._img);
        this._onTitleChanged();
        context.pathChanged.connect(this._onTitleChanged, this);
        void context.ready.then(() => {
            if (this.isDisposed) {
                return;
            }
            const contents = context.contentsModel;
            this._mimeType = contents.mimetype;
            this._render();
            context.model.contentChanged.connect(this.update, this);
            context.fileChanged.connect(this.update, this);
            this._ready.resolve(void 0);
        });
    }
    /**
     * Print in iframe.
     */
    [Printing.symbol]() {
        return () => Printing.printWidget(this);
    }
    /**
     * A promise that resolves when the image viewer is ready.
     */
    get ready() {
        return this._ready.promise;
    }
    /**
     * The scale factor for the image.
     */
    get scale() {
        return this._scale;
    }
    set scale(value) {
        if (value === this._scale) {
            return;
        }
        this._scale = value;
        this._updateStyle();
    }
    /**
     * The color inversion of the image.
     */
    get colorinversion() {
        return this._colorinversion;
    }
    set colorinversion(value) {
        if (value === this._colorinversion) {
            return;
        }
        this._colorinversion = value;
        this._updateStyle();
    }
    /**
     * Dispose of resources held by the image viewer.
     */
    dispose() {
        if (this._img.src) {
            URL.revokeObjectURL(this._img.src || '');
        }
        super.dispose();
    }
    /**
     * Reset rotation and flip transformations.
     */
    resetRotationFlip() {
        this._matrix = [1, 0, 0, 1];
        this._updateStyle();
    }
    /**
     * Rotate the image counter-clockwise (left).
     */
    rotateCounterclockwise() {
        this._matrix = Private.prod(this._matrix, Private.rotateCounterclockwiseMatrix);
        this._updateStyle();
    }
    /**
     * Rotate the image clockwise (right).
     */
    rotateClockwise() {
        this._matrix = Private.prod(this._matrix, Private.rotateClockwiseMatrix);
        this._updateStyle();
    }
    /**
     * Flip the image horizontally.
     */
    flipHorizontal() {
        this._matrix = Private.prod(this._matrix, Private.flipHMatrix);
        this._updateStyle();
    }
    /**
     * Flip the image vertically.
     */
    flipVertical() {
        this._matrix = Private.prod(this._matrix, Private.flipVMatrix);
        this._updateStyle();
    }
    /**
     * Handle `update-request` messages for the widget.
     */
    onUpdateRequest(msg) {
        if (this.isDisposed || !this.context.isReady) {
            return;
        }
        this._render();
    }
    /**
     * Handle `'activate-request'` messages.
     */
    onActivateRequest(msg) {
        this.node.focus();
    }
    /**
     * Handle a change to the title.
     */
    _onTitleChanged() {
        this.title.label = PathExt.basename(this.context.localPath);
    }
    /**
     * Render the widget content.
     */
    _render() {
        const context = this.context;
        const cm = context.contentsModel;
        if (!cm) {
            return;
        }
        const oldurl = this._img.src || '';
        let content = context.model.toString();
        if (cm.format === 'base64') {
            this._img.src = `data:${this._mimeType};base64,${content}`;
        }
        else {
            const a = new Blob([content], { type: this._mimeType });
            this._img.src = URL.createObjectURL(a);
        }
        URL.revokeObjectURL(oldurl);
    }
    /**
     * Update the image CSS style, including the transform and filter.
     */
    _updateStyle() {
        const [a, b, c, d] = this._matrix;
        const [tX, tY] = Private.prodVec(this._matrix, [1, 1]);
        const transform = `matrix(${a}, ${b}, ${c}, ${d}, 0, 0) translate(${tX < 0 ? -100 : 0}%, ${tY < 0 ? -100 : 0}%) `;
        this._img.style.transform = `scale(${this._scale}) ${transform}`;
        this._img.style.filter = `invert(${this._colorinversion})`;
    }
}
/**
 * A widget factory for images.
 */
export class ImageViewerFactory extends ABCWidgetFactory {
    /**
     * Create a new widget given a context.
     */
    createNewWidget(context) {
        const content = new ImageViewer(context);
        const widget = new DocumentWidget({ content, context });
        return widget;
    }
}
/**
 * A namespace for image widget private data.
 */
var Private;
(function (Private) {
    /**
     * Multiply 2x2 matrices.
     */
    function prod([a11, a12, a21, a22], [b11, b12, b21, b22]) {
        return [
            a11 * b11 + a12 * b21,
            a11 * b12 + a12 * b22,
            a21 * b11 + a22 * b21,
            a21 * b12 + a22 * b22
        ];
    }
    Private.prod = prod;
    /**
     * Multiply a 2x2 matrix and a 2x1 vector.
     */
    function prodVec([a11, a12, a21, a22], [b1, b2]) {
        return [a11 * b1 + a12 * b2, a21 * b1 + a22 * b2];
    }
    Private.prodVec = prodVec;
    /**
     * Clockwise rotation transformation matrix.
     */
    Private.rotateClockwiseMatrix = [0, 1, -1, 0];
    /**
     * Counter-clockwise rotation transformation matrix.
     */
    Private.rotateCounterclockwiseMatrix = [0, -1, 1, 0];
    /**
     * Horizontal flip transformation matrix.
     */
    Private.flipHMatrix = [-1, 0, 0, 1];
    /**
     * Vertical flip transformation matrix.
     */
    Private.flipVMatrix = [1, 0, 0, -1];
})(Private || (Private = {}));
//# sourceMappingURL=widget.js.map