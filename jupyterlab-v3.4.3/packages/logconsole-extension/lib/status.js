// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { VDomModel, VDomRenderer } from '@jupyterlab/apputils';
import { GroupItem, interactiveItem, TextItem } from '@jupyterlab/statusbar';
import { nullTranslator } from '@jupyterlab/translation';
import { listIcon } from '@jupyterlab/ui-components';
import { Signal } from '@lumino/signaling';
import React from 'react';
/**
 * A pure functional component for a Log Console status item.
 *
 * @param props - the props for the component.
 *
 * @returns a tsx component for rendering the Log Console status.
 */
function LogConsoleStatusComponent(props) {
    const translator = props.translator || nullTranslator;
    const trans = translator.load('jupyterlab');
    let title = '';
    if (props.newMessages > 0) {
        title = trans.__('%1 new messages, %2 log entries for %3', props.newMessages, props.logEntries, props.source);
    }
    else {
        title += trans.__('%1 log entries for %2', props.logEntries, props.source);
    }
    return (React.createElement(GroupItem, { spacing: 0, onClick: props.handleClick, title: title },
        React.createElement(listIcon.react, { top: '2px', stylesheet: 'statusBar' }),
        props.newMessages > 0 ? React.createElement(TextItem, { source: props.newMessages }) : React.createElement(React.Fragment, null)));
}
/**
 * A VDomRenderer widget for displaying the status of Log Console logs.
 */
export class LogConsoleStatus extends VDomRenderer {
    /**
     * Construct the log console status widget.
     *
     * @param options - The status widget initialization options.
     */
    constructor(options) {
        super(new LogConsoleStatus.Model(options.loggerRegistry));
        this.translator = options.translator || nullTranslator;
        this._handleClick = options.handleClick;
        this.addClass(interactiveItem);
        this.addClass('jp-LogConsoleStatusItem');
    }
    /**
     * Render the log console status item.
     */
    render() {
        if (this.model === null || this.model.version === 0) {
            return null;
        }
        const { flashEnabled, messages, source, version, versionDisplayed, versionNotified } = this.model;
        if (source !== null && flashEnabled && version > versionNotified) {
            this._flashHighlight();
            this.model.sourceNotified(source, version);
        }
        else if (source !== null && flashEnabled && version > versionDisplayed) {
            this._showHighlighted();
        }
        else {
            this._clearHighlight();
        }
        return (React.createElement(LogConsoleStatusComponent, { handleClick: this._handleClick, logEntries: messages, newMessages: version - versionDisplayed, source: this.model.source, translator: this.translator }));
    }
    _flashHighlight() {
        this._showHighlighted();
        // To make sure the browser triggers the animation, we remove the class,
        // wait for an animation frame, then add it back
        this.removeClass('jp-LogConsole-flash');
        requestAnimationFrame(() => {
            this.addClass('jp-LogConsole-flash');
        });
    }
    _showHighlighted() {
        this.addClass('jp-mod-selected');
    }
    _clearHighlight() {
        this.removeClass('jp-LogConsole-flash');
        this.removeClass('jp-mod-selected');
    }
}
/**
 * A namespace for Log Console log status.
 */
(function (LogConsoleStatus) {
    /**
     * A VDomModel for the LogConsoleStatus item.
     */
    class Model extends VDomModel {
        /**
         * Create a new LogConsoleStatus model.
         *
         * @param loggerRegistry - The logger registry providing the logs.
         */
        constructor(loggerRegistry) {
            super();
            /**
             * A signal emitted when the flash enablement changes.
             */
            this.flashEnabledChanged = new Signal(this);
            this._flashEnabled = true;
            this._source = null;
            /**
             * The view status of each source.
             *
             * #### Notes
             * Keys are source names, value is a list of two numbers. The first
             * represents the version of the messages that was last displayed to the
             * user, the second represents the version that we last notified the user
             * about.
             */
            this._sourceVersion = new Map();
            this._loggerRegistry = loggerRegistry;
            this._loggerRegistry.registryChanged.connect(this._handleLogRegistryChange, this);
            this._handleLogRegistryChange();
        }
        /**
         * Number of messages currently in the current source.
         */
        get messages() {
            if (this._source === null) {
                return 0;
            }
            const logger = this._loggerRegistry.getLogger(this._source);
            return logger.length;
        }
        /**
         * The number of messages ever stored by the current source.
         */
        get version() {
            if (this._source === null) {
                return 0;
            }
            const logger = this._loggerRegistry.getLogger(this._source);
            return logger.version;
        }
        /**
         * The name of the active log source
         */
        get source() {
            return this._source;
        }
        set source(name) {
            if (this._source === name) {
                return;
            }
            this._source = name;
            // refresh rendering
            this.stateChanged.emit();
        }
        /**
         * The last source version that was displayed.
         */
        get versionDisplayed() {
            var _a, _b;
            if (this._source === null) {
                return 0;
            }
            return (_b = (_a = this._sourceVersion.get(this._source)) === null || _a === void 0 ? void 0 : _a.lastDisplayed) !== null && _b !== void 0 ? _b : 0;
        }
        /**
         * The last source version we notified the user about.
         */
        get versionNotified() {
            var _a, _b;
            if (this._source === null) {
                return 0;
            }
            return (_b = (_a = this._sourceVersion.get(this._source)) === null || _a === void 0 ? void 0 : _a.lastNotified) !== null && _b !== void 0 ? _b : 0;
        }
        /**
         * Flag to toggle flashing when new logs added.
         */
        get flashEnabled() {
            return this._flashEnabled;
        }
        set flashEnabled(enabled) {
            if (this._flashEnabled === enabled) {
                return;
            }
            this._flashEnabled = enabled;
            this.flashEnabledChanged.emit();
            // refresh rendering
            this.stateChanged.emit();
        }
        /**
         * Record the last source version displayed to the user.
         *
         * @param source - The name of the log source.
         * @param version - The version of the log that was displayed.
         *
         * #### Notes
         * This will also update the last notified version so that the last
         * notified version is always at least the last displayed version.
         */
        sourceDisplayed(source, version) {
            if (source === null || version === null) {
                return;
            }
            const versions = this._sourceVersion.get(source);
            let change = false;
            if (versions.lastDisplayed < version) {
                versions.lastDisplayed = version;
                change = true;
            }
            if (versions.lastNotified < version) {
                versions.lastNotified = version;
                change = true;
            }
            if (change && source === this._source) {
                this.stateChanged.emit();
            }
        }
        /**
         * Record a source version we notified the user about.
         *
         * @param source - The name of the log source.
         * @param version - The version of the log.
         */
        sourceNotified(source, version) {
            if (source === null) {
                return;
            }
            const versions = this._sourceVersion.get(source);
            if (versions.lastNotified < version) {
                versions.lastNotified = version;
                if (source === this._source) {
                    this.stateChanged.emit();
                }
            }
        }
        _handleLogRegistryChange() {
            const loggers = this._loggerRegistry.getLoggers();
            for (const logger of loggers) {
                if (!this._sourceVersion.has(logger.source)) {
                    logger.contentChanged.connect(this._handleLogContentChange, this);
                    this._sourceVersion.set(logger.source, {
                        lastDisplayed: 0,
                        lastNotified: 0
                    });
                }
            }
        }
        _handleLogContentChange({ source }, change) {
            if (source === this._source) {
                this.stateChanged.emit();
            }
        }
    }
    LogConsoleStatus.Model = Model;
})(LogConsoleStatus || (LogConsoleStatus = {}));
//# sourceMappingURL=status.js.map