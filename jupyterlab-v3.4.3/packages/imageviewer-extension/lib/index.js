// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/**
 * @packageDocumentation
 * @module imageviewer-extension
 */
import { ILayoutRestorer } from '@jupyterlab/application';
import { ICommandPalette, WidgetTracker } from '@jupyterlab/apputils';
import { IImageTracker, ImageViewerFactory } from '@jupyterlab/imageviewer';
import { ITranslator } from '@jupyterlab/translation';
/**
 * The command IDs used by the image widget plugin.
 */
var CommandIDs;
(function (CommandIDs) {
    CommandIDs.resetImage = 'imageviewer:reset-image';
    CommandIDs.zoomIn = 'imageviewer:zoom-in';
    CommandIDs.zoomOut = 'imageviewer:zoom-out';
    CommandIDs.flipHorizontal = 'imageviewer:flip-horizontal';
    CommandIDs.flipVertical = 'imageviewer:flip-vertical';
    CommandIDs.rotateClockwise = 'imageviewer:rotate-clockwise';
    CommandIDs.rotateCounterclockwise = 'imageviewer:rotate-counterclockwise';
    CommandIDs.invertColors = 'imageviewer:invert-colors';
})(CommandIDs || (CommandIDs = {}));
/**
 * The list of file types for images.
 */
const FILE_TYPES = ['png', 'gif', 'jpeg', 'bmp', 'ico', 'tiff'];
/**
 * The name of the factory that creates image widgets.
 */
const FACTORY = 'Image';
/**
 * The name of the factory that creates image widgets.
 */
const TEXT_FACTORY = 'Image (Text)';
/**
 * The list of file types for images with optional text modes.
 */
const TEXT_FILE_TYPES = ['svg', 'xbm'];
/**
 * The test pattern for text file types in paths.
 */
const TEXT_FILE_REGEX = new RegExp(`[.](${TEXT_FILE_TYPES.join('|')})$`);
/**
 * The image file handler extension.
 */
const plugin = {
    activate,
    id: '@jupyterlab/imageviewer-extension:plugin',
    provides: IImageTracker,
    requires: [ITranslator],
    optional: [ICommandPalette, ILayoutRestorer],
    autoStart: true
};
/**
 * Export the plugin as default.
 */
export default plugin;
/**
 * Activate the image widget extension.
 */
function activate(app, translator, palette, restorer) {
    const trans = translator.load('jupyterlab');
    const namespace = 'image-widget';
    function onWidgetCreated(sender, widget) {
        var _a, _b;
        // Notify the widget tracker if restore data needs to update.
        widget.context.pathChanged.connect(() => {
            void tracker.save(widget);
        });
        void tracker.add(widget);
        const types = app.docRegistry.getFileTypesForPath(widget.context.path);
        if (types.length > 0) {
            widget.title.icon = types[0].icon;
            widget.title.iconClass = (_a = types[0].iconClass) !== null && _a !== void 0 ? _a : '';
            widget.title.iconLabel = (_b = types[0].iconLabel) !== null && _b !== void 0 ? _b : '';
        }
    }
    const factory = new ImageViewerFactory({
        name: FACTORY,
        modelName: 'base64',
        fileTypes: [...FILE_TYPES, ...TEXT_FILE_TYPES],
        defaultFor: FILE_TYPES,
        readOnly: true
    });
    const textFactory = new ImageViewerFactory({
        name: TEXT_FACTORY,
        modelName: 'text',
        fileTypes: TEXT_FILE_TYPES,
        defaultFor: TEXT_FILE_TYPES,
        readOnly: true
    });
    [factory, textFactory].forEach(factory => {
        app.docRegistry.addWidgetFactory(factory);
        factory.widgetCreated.connect(onWidgetCreated);
    });
    const tracker = new WidgetTracker({
        namespace
    });
    if (restorer) {
        // Handle state restoration.
        void restorer.restore(tracker, {
            command: 'docmanager:open',
            args: widget => ({
                path: widget.context.path,
                factory: TEXT_FILE_REGEX.test(widget.context.path)
                    ? TEXT_FACTORY
                    : FACTORY
            }),
            name: widget => widget.context.path
        });
    }
    addCommands(app, tracker, translator);
    if (palette) {
        const category = trans.__('Image Viewer');
        [
            CommandIDs.zoomIn,
            CommandIDs.zoomOut,
            CommandIDs.resetImage,
            CommandIDs.rotateClockwise,
            CommandIDs.rotateCounterclockwise,
            CommandIDs.flipHorizontal,
            CommandIDs.flipVertical,
            CommandIDs.invertColors
        ].forEach(command => {
            palette.addItem({ command, category });
        });
    }
    return tracker;
}
/**
 * Add the commands for the image widget.
 */
export function addCommands(app, tracker, translator) {
    const trans = translator.load('jupyterlab');
    const { commands, shell } = app;
    /**
     * Whether there is an active image viewer.
     */
    function isEnabled() {
        return (tracker.currentWidget !== null &&
            tracker.currentWidget === shell.currentWidget);
    }
    commands.addCommand('imageviewer:zoom-in', {
        execute: zoomIn,
        label: trans.__('Zoom In'),
        isEnabled
    });
    commands.addCommand('imageviewer:zoom-out', {
        execute: zoomOut,
        label: trans.__('Zoom Out'),
        isEnabled
    });
    commands.addCommand('imageviewer:reset-image', {
        execute: resetImage,
        label: trans.__('Reset Image'),
        isEnabled
    });
    commands.addCommand('imageviewer:rotate-clockwise', {
        execute: rotateClockwise,
        label: trans.__('Rotate Clockwise'),
        isEnabled
    });
    commands.addCommand('imageviewer:rotate-counterclockwise', {
        execute: rotateCounterclockwise,
        label: trans.__('Rotate Counterclockwise'),
        isEnabled
    });
    commands.addCommand('imageviewer:flip-horizontal', {
        execute: flipHorizontal,
        label: trans.__('Flip image horizontally'),
        isEnabled
    });
    commands.addCommand('imageviewer:flip-vertical', {
        execute: flipVertical,
        label: trans.__('Flip image vertically'),
        isEnabled
    });
    commands.addCommand('imageviewer:invert-colors', {
        execute: invertColors,
        label: trans.__('Invert Colors'),
        isEnabled
    });
    function zoomIn() {
        var _a;
        const widget = (_a = tracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
        if (widget) {
            widget.scale = widget.scale > 1 ? widget.scale + 0.5 : widget.scale * 2;
        }
    }
    function zoomOut() {
        var _a;
        const widget = (_a = tracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
        if (widget) {
            widget.scale = widget.scale > 1 ? widget.scale - 0.5 : widget.scale / 2;
        }
    }
    function resetImage() {
        var _a;
        const widget = (_a = tracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
        if (widget) {
            widget.scale = 1;
            widget.colorinversion = 0;
            widget.resetRotationFlip();
        }
    }
    function rotateClockwise() {
        var _a;
        const widget = (_a = tracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
        if (widget) {
            widget.rotateClockwise();
        }
    }
    function rotateCounterclockwise() {
        var _a;
        const widget = (_a = tracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
        if (widget) {
            widget.rotateCounterclockwise();
        }
    }
    function flipHorizontal() {
        var _a;
        const widget = (_a = tracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
        if (widget) {
            widget.flipHorizontal();
        }
    }
    function flipVertical() {
        var _a;
        const widget = (_a = tracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
        if (widget) {
            widget.flipVertical();
        }
    }
    function invertColors() {
        var _a;
        const widget = (_a = tracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
        if (widget) {
            widget.colorinversion += 1;
            widget.colorinversion %= 2;
        }
    }
}
//# sourceMappingURL=index.js.map