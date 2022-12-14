// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { OutputArea } from '@jupyterlab/outputarea';
import { nullTranslator } from '@jupyterlab/translation';
import { Signal } from '@lumino/signaling';
import { PanelLayout, StackedPanel, Widget } from '@lumino/widgets';
function toTitleCase(value) {
    return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}
/**
 * Log console output prompt implementation
 */
class LogConsoleOutputPrompt extends Widget {
    constructor() {
        super();
        this._timestampNode = document.createElement('div');
        this.node.append(this._timestampNode);
    }
    /**
     * Date & time when output is logged.
     */
    set timestamp(value) {
        this._timestamp = value;
        this._timestampNode.innerHTML = this._timestamp.toLocaleTimeString();
        this.update();
    }
    /**
     * Log level
     */
    set level(value) {
        this._level = value;
        this.node.dataset.logLevel = value;
        this.update();
    }
    update() {
        if (this._level !== undefined && this._timestamp !== undefined) {
            this.node.title = `${this._timestamp.toLocaleString()}; ${toTitleCase(this._level)} level`;
        }
    }
}
/**
 * Output Area implementation displaying log outputs
 * with prompts showing log timestamps.
 */
class LogConsoleOutputArea extends OutputArea {
    /**
     * Create an output item with a prompt and actual output
     */
    createOutputItem(model) {
        const panel = super.createOutputItem(model);
        if (panel === null) {
            // Could not render model
            return null;
        }
        // first widget in panel is prompt of type LoggerOutputPrompt
        const prompt = panel.widgets[0];
        prompt.timestamp = model.timestamp;
        prompt.level = model.level;
        return panel;
    }
    /**
     * Handle an input request from a kernel by doing nothing.
     */
    onInputRequest(msg, future) {
        return;
    }
}
/**
 * Implementation of `IContentFactory` for Output Area
 * which creates custom output prompts.
 */
class LogConsoleContentFactory extends OutputArea.ContentFactory {
    /**
     * Create the output prompt for the widget.
     */
    createOutputPrompt() {
        return new LogConsoleOutputPrompt();
    }
}
/**
 * Implements a panel which supports pinning the position to the end if it is
 * scrolled to the end.
 *
 * #### Notes
 * This is useful for log viewing components or chat components that append
 * elements at the end. We would like to automatically scroll when the user
 * has scrolled to the bottom, but not change the scrolling when the user has
 * changed the scroll position.
 */
export class ScrollingWidget extends Widget {
    constructor(_a) {
        var { content } = _a, options = __rest(_a, ["content"]);
        super(options);
        this._observer = null;
        this.addClass('jp-Scrolling');
        const layout = (this.layout = new PanelLayout());
        layout.addWidget(content);
        this._content = content;
        this._sentinel = document.createElement('div');
        this.node.appendChild(this._sentinel);
    }
    /**
     * The content widget.
     */
    get content() {
        return this._content;
    }
    onAfterAttach(msg) {
        super.onAfterAttach(msg);
        // defer so content gets a chance to attach first
        requestAnimationFrame(() => {
            this._sentinel.scrollIntoView();
            this._scrollHeight = this.node.scrollHeight;
        });
        // Set up intersection observer for the sentinel
        if (typeof IntersectionObserver !== 'undefined') {
            this._observer = new IntersectionObserver(args => {
                this._handleScroll(args);
            }, { root: this.node, threshold: 1 });
            this._observer.observe(this._sentinel);
        }
    }
    onBeforeDetach(msg) {
        if (this._observer) {
            this._observer.disconnect();
        }
    }
    onAfterShow(msg) {
        if (this._tracking) {
            this._sentinel.scrollIntoView();
        }
    }
    _handleScroll([entry]) {
        if (entry.isIntersecting) {
            this._tracking = true;
        }
        else if (this.isVisible) {
            const currentHeight = this.node.scrollHeight;
            if (currentHeight === this._scrollHeight) {
                // Likely the user scrolled manually
                this._tracking = false;
            }
            else {
                // We assume we scrolled because our size changed, so scroll to the end.
                this._sentinel.scrollIntoView();
                this._scrollHeight = currentHeight;
                this._tracking = true;
            }
        }
    }
}
/**
 * A StackedPanel implementation that creates Output Areas
 * for each log source and activates as source is switched.
 */
export class LogConsolePanel extends StackedPanel {
    /**
     * Construct a LogConsolePanel instance.
     *
     * @param loggerRegistry - The logger registry that provides
     * logs to be displayed.
     */
    constructor(loggerRegistry, translator) {
        super();
        this._outputAreas = new Map();
        this._source = null;
        this._sourceChanged = new Signal(this);
        this._sourceDisplayed = new Signal(this);
        this._loggersWatched = new Set();
        this.translator = translator || nullTranslator;
        this._trans = this.translator.load('jupyterlab');
        this._loggerRegistry = loggerRegistry;
        this.addClass('jp-LogConsolePanel');
        loggerRegistry.registryChanged.connect((sender, args) => {
            this._bindLoggerSignals();
        }, this);
        this._bindLoggerSignals();
        this._placeholder = new Widget();
        this._placeholder.addClass('jp-LogConsoleListPlaceholder');
        this.addWidget(this._placeholder);
    }
    /**
     * The logger registry providing the logs.
     */
    get loggerRegistry() {
        return this._loggerRegistry;
    }
    /**
     * The current logger.
     */
    get logger() {
        if (this.source === null) {
            return null;
        }
        return this.loggerRegistry.getLogger(this.source);
    }
    /**
     * The log source displayed
     */
    get source() {
        return this._source;
    }
    set source(name) {
        if (name === this._source) {
            return;
        }
        const oldValue = this._source;
        const newValue = (this._source = name);
        this._showOutputFromSource(newValue);
        this._handlePlaceholder();
        this._sourceChanged.emit({ oldValue, newValue, name: 'source' });
    }
    /**
     * The source version displayed.
     */
    get sourceVersion() {
        const source = this.source;
        return source !== null
            ? this._loggerRegistry.getLogger(source).version
            : null;
    }
    /**
     * Signal for source changes
     */
    get sourceChanged() {
        return this._sourceChanged;
    }
    /**
     * Signal for source changes
     */
    get sourceDisplayed() {
        return this._sourceDisplayed;
    }
    onAfterAttach(msg) {
        super.onAfterAttach(msg);
        this._updateOutputAreas();
        this._showOutputFromSource(this._source);
        this._handlePlaceholder();
    }
    onAfterShow(msg) {
        super.onAfterShow(msg);
        if (this.source !== null) {
            this._sourceDisplayed.emit({
                source: this.source,
                version: this.sourceVersion
            });
        }
    }
    _bindLoggerSignals() {
        const loggers = this._loggerRegistry.getLoggers();
        for (const logger of loggers) {
            if (this._loggersWatched.has(logger.source)) {
                continue;
            }
            logger.contentChanged.connect((sender, args) => {
                this._updateOutputAreas();
                this._handlePlaceholder();
            }, this);
            logger.stateChanged.connect((sender, change) => {
                if (change.name !== 'rendermime') {
                    return;
                }
                const viewId = `source:${sender.source}`;
                const outputArea = this._outputAreas.get(viewId);
                if (outputArea) {
                    if (change.newValue) {
                        // cast away readonly
                        outputArea.rendermime = change.newValue;
                    }
                    else {
                        outputArea.dispose();
                    }
                }
            }, this);
            this._loggersWatched.add(logger.source);
        }
    }
    _showOutputFromSource(source) {
        // If the source is null, pick a unique name so all output areas hide.
        const viewId = source === null ? 'null source' : `source:${source}`;
        this._outputAreas.forEach((outputArea, name) => {
            var _a, _b;
            // Show/hide the output area parents, the scrolling windows.
            if (outputArea.id === viewId) {
                (_a = outputArea.parent) === null || _a === void 0 ? void 0 : _a.show();
                if (outputArea.isVisible) {
                    this._sourceDisplayed.emit({
                        source: this.source,
                        version: this.sourceVersion
                    });
                }
            }
            else {
                (_b = outputArea.parent) === null || _b === void 0 ? void 0 : _b.hide();
            }
        });
        const title = source === null
            ? this._trans.__('Log Console')
            : this._trans.__('Log: %1', source);
        this.title.label = title;
        this.title.caption = title;
    }
    _handlePlaceholder() {
        if (this.source === null) {
            this._placeholder.node.textContent = this._trans.__('No source selected.');
            this._placeholder.show();
        }
        else if (this._loggerRegistry.getLogger(this.source).length === 0) {
            this._placeholder.node.textContent = this._trans.__('No log messages.');
            this._placeholder.show();
        }
        else {
            this._placeholder.hide();
            this._placeholder.node.textContent = '';
        }
    }
    _updateOutputAreas() {
        const loggerIds = new Set();
        const loggers = this._loggerRegistry.getLoggers();
        for (const logger of loggers) {
            const source = logger.source;
            const viewId = `source:${source}`;
            loggerIds.add(viewId);
            // add view for logger if not exist
            if (!this._outputAreas.has(viewId)) {
                const outputArea = new LogConsoleOutputArea({
                    rendermime: logger.rendermime,
                    contentFactory: new LogConsoleContentFactory(),
                    model: logger.outputAreaModel
                });
                outputArea.id = viewId;
                // Attach the output area so it is visible, so the accounting
                // functions below record the outputs actually displayed.
                const w = new ScrollingWidget({
                    content: outputArea
                });
                this.addWidget(w);
                this._outputAreas.set(viewId, outputArea);
                // This is where the source object is associated with the output area.
                // We capture the source from this environment in the closure.
                const outputUpdate = (sender) => {
                    // If the current log console panel source is the source associated
                    // with this output area, and the output area is visible, then emit
                    // the logConsolePanel source displayed signal.
                    if (this.source === source && sender.isVisible) {
                        // We assume that the output area has been updated to the current
                        // version of the source.
                        this._sourceDisplayed.emit({
                            source: this.source,
                            version: this.sourceVersion
                        });
                    }
                };
                // Notify messages were displayed any time the output area is updated
                // and update for any outputs rendered on construction.
                outputArea.outputLengthChanged.connect(outputUpdate, this);
                // Since the output area was attached above, we can rely on its
                // visibility to account for the messages displayed.
                outputUpdate(outputArea);
            }
        }
        // remove output areas that do not have corresponding loggers anymore
        const viewIds = this._outputAreas.keys();
        for (const viewId of viewIds) {
            if (!loggerIds.has(viewId)) {
                const outputArea = this._outputAreas.get(viewId);
                outputArea === null || outputArea === void 0 ? void 0 : outputArea.dispose();
                this._outputAreas.delete(viewId);
            }
        }
    }
}
//# sourceMappingURL=widget.js.map