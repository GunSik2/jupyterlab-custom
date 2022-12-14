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
import { nullTranslator } from '@jupyterlab/translation';
import { Platform } from '@lumino/domutils';
import { MessageLoop } from '@lumino/messaging';
import { Widget } from '@lumino/widgets';
import { Terminal as Xterm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { ITerminal } from '.';
/**
 * The class name added to a terminal widget.
 */
const TERMINAL_CLASS = 'jp-Terminal';
/**
 * The class name added to a terminal body.
 */
const TERMINAL_BODY_CLASS = 'jp-Terminal-body';
/**
 * A widget which manages a terminal session.
 */
export class Terminal extends Widget {
    /**
     * Construct a new terminal widget.
     *
     * @param session - The terminal session object.
     *
     * @param options - The terminal configuration options.
     *
     * @param translator - The language translator.
     */
    constructor(session, options = {}, translator) {
        super();
        this._needsResize = true;
        this._termOpened = false;
        this._offsetWidth = -1;
        this._offsetHeight = -1;
        translator = translator || nullTranslator;
        this._trans = translator.load('jupyterlab');
        this.session = session;
        // Initialize settings.
        this._options = Object.assign(Object.assign({}, ITerminal.defaultOptions), options);
        const _a = this._options, { theme } = _a, other = __rest(_a, ["theme"]);
        const xtermOptions = Object.assign({ theme: Private.getXTermTheme(theme) }, other);
        this.addClass(TERMINAL_CLASS);
        this._setThemeAttribute(theme);
        // Create the xterm.
        this._term = new Xterm(xtermOptions);
        this._fitAddon = new FitAddon();
        this._term.loadAddon(this._fitAddon);
        this._initializeTerm();
        this.id = `jp-Terminal-${Private.id++}`;
        this.title.label = this._trans.__('Terminal');
        session.messageReceived.connect(this._onMessage, this);
        session.disposed.connect(() => {
            if (this.getOption('closeOnExit')) {
                this.dispose();
            }
        }, this);
        if (session.connectionStatus === 'connected') {
            this._initialConnection();
        }
        else {
            session.connectionStatusChanged.connect(this._initialConnection, this);
        }
    }
    _setThemeAttribute(theme) {
        if (this.isDisposed) {
            return;
        }
        this.node.setAttribute('data-term-theme', theme ? theme.toLowerCase() : 'inherit');
    }
    _initialConnection() {
        if (this.isDisposed) {
            return;
        }
        if (this.session.connectionStatus !== 'connected') {
            return;
        }
        this.title.label = this._trans.__('Terminal %1', this.session.name);
        this._setSessionSize();
        if (this._options.initialCommand) {
            this.session.send({
                type: 'stdin',
                content: [this._options.initialCommand + '\r']
            });
        }
        // Only run this initial connection logic once.
        this.session.connectionStatusChanged.disconnect(this._initialConnection, this);
    }
    /**
     * Get a config option for the terminal.
     */
    getOption(option) {
        return this._options[option];
    }
    /**
     * Set a config option for the terminal.
     */
    setOption(option, value) {
        if (option !== 'theme' &&
            (this._options[option] === value || option === 'initialCommand')) {
            return;
        }
        this._options[option] = value;
        switch (option) {
            case 'shutdownOnClose': // Do not transmit to XTerm
            case 'closeOnExit': // Do not transmit to XTerm
                break;
            case 'theme':
                this._term.setOption('theme', Private.getXTermTheme(value));
                this._setThemeAttribute(value);
                break;
            default:
                this._term.setOption(option, value);
                break;
        }
        this._needsResize = true;
        this.update();
    }
    /**
     * Dispose of the resources held by the terminal widget.
     */
    dispose() {
        if (!this.session.isDisposed) {
            if (this.getOption('shutdownOnClose')) {
                this.session.shutdown().catch(reason => {
                    console.error(`Terminal not shut down: ${reason}`);
                });
            }
        }
        this._term.dispose();
        super.dispose();
    }
    /**
     * Refresh the terminal session.
     *
     * #### Notes
     * Failure to reconnect to the session should be caught appropriately
     */
    async refresh() {
        if (!this.isDisposed) {
            await this.session.reconnect();
            this._term.clear();
        }
    }
    /**
     * Process a message sent to the widget.
     *
     * @param msg - The message sent to the widget.
     *
     * #### Notes
     * Subclasses may reimplement this method as needed.
     */
    processMessage(msg) {
        super.processMessage(msg);
        switch (msg.type) {
            case 'fit-request':
                this.onFitRequest(msg);
                break;
            default:
                break;
        }
    }
    /**
     * Set the size of the terminal when attached if dirty.
     */
    onAfterAttach(msg) {
        this.update();
    }
    /**
     * Set the size of the terminal when shown if dirty.
     */
    onAfterShow(msg) {
        this.update();
    }
    /**
     * On resize, use the computed row and column sizes to resize the terminal.
     */
    onResize(msg) {
        this._offsetWidth = msg.width;
        this._offsetHeight = msg.height;
        this._needsResize = true;
        this.update();
    }
    /**
     * A message handler invoked on an `'update-request'` message.
     */
    onUpdateRequest(msg) {
        var _a;
        if (!this.isVisible || !this.isAttached) {
            return;
        }
        // Open the terminal if necessary.
        if (!this._termOpened) {
            this._term.open(this.node);
            (_a = this._term.element) === null || _a === void 0 ? void 0 : _a.classList.add(TERMINAL_BODY_CLASS);
            this._termOpened = true;
        }
        if (this._needsResize) {
            this._resizeTerminal();
        }
    }
    /**
     * A message handler invoked on an `'fit-request'` message.
     */
    onFitRequest(msg) {
        const resize = Widget.ResizeMessage.UnknownSize;
        MessageLoop.sendMessage(this, resize);
    }
    /**
     * Handle `'activate-request'` messages.
     */
    onActivateRequest(msg) {
        this._term.focus();
    }
    /**
     * Initialize the terminal object.
     */
    _initializeTerm() {
        const term = this._term;
        term.onData((data) => {
            if (this.isDisposed) {
                return;
            }
            this.session.send({
                type: 'stdin',
                content: [data]
            });
        });
        term.onTitleChange((title) => {
            this.title.label = title;
        });
        // Do not add any Ctrl+C/Ctrl+V handling on macOS,
        // where Cmd+C/Cmd+V works as intended.
        if (Platform.IS_MAC) {
            return;
        }
        term.attachCustomKeyEventHandler(event => {
            if (event.ctrlKey && event.key === 'c' && term.hasSelection()) {
                // Return so that the usual OS copy happens
                // instead of interrupt signal.
                return false;
            }
            if (event.ctrlKey && event.key === 'v' && this._options.pasteWithCtrlV) {
                // Return so that the usual paste happens.
                return false;
            }
            return true;
        });
    }
    /**
     * Handle a message from the terminal session.
     */
    _onMessage(sender, msg) {
        switch (msg.type) {
            case 'stdout':
                if (msg.content) {
                    this._term.write(msg.content[0]);
                }
                break;
            case 'disconnect':
                this._term.write('\r\n\r\n[Finished??? Term Session]\r\n');
                break;
            default:
                break;
        }
    }
    /**
     * Resize the terminal based on computed geometry.
     */
    _resizeTerminal() {
        if (this._options.autoFit) {
            this._fitAddon.fit();
        }
        if (this._offsetWidth === -1) {
            this._offsetWidth = this.node.offsetWidth;
        }
        if (this._offsetHeight === -1) {
            this._offsetHeight = this.node.offsetHeight;
        }
        this._setSessionSize();
        this._needsResize = false;
    }
    /**
     * Set the size of the terminal in the session.
     */
    _setSessionSize() {
        const content = [
            this._term.rows,
            this._term.cols,
            this._offsetHeight,
            this._offsetWidth
        ];
        if (!this.isDisposed) {
            this.session.send({ type: 'set_size', content });
        }
    }
}
/**
 * A namespace for private data.
 */
var Private;
(function (Private) {
    /**
     * An incrementing counter for ids.
     */
    Private.id = 0;
    /**
     * The light terminal theme.
     */
    Private.lightTheme = {
        foreground: '#000',
        background: '#fff',
        cursor: '#616161',
        cursorAccent: '#F5F5F5',
        selection: 'rgba(97, 97, 97, 0.3)' // md-grey-700
    };
    /**
     * The dark terminal theme.
     */
    Private.darkTheme = {
        foreground: '#fff',
        background: '#000',
        cursor: '#fff',
        cursorAccent: '#000',
        selection: 'rgba(255, 255, 255, 0.3)'
    };
    /**
     * The current theme.
     */
    Private.inheritTheme = () => ({
        foreground: getComputedStyle(document.body)
            .getPropertyValue('--jp-ui-font-color0')
            .trim(),
        background: getComputedStyle(document.body)
            .getPropertyValue('--jp-layout-color0')
            .trim(),
        cursor: getComputedStyle(document.body)
            .getPropertyValue('--jp-ui-font-color1')
            .trim(),
        cursorAccent: getComputedStyle(document.body)
            .getPropertyValue('--jp-ui-inverse-font-color0')
            .trim(),
        selection: getComputedStyle(document.body)
            .getPropertyValue('--jp-ui-font-color3')
            .trim()
    });
    function getXTermTheme(theme) {
        switch (theme) {
            case 'light':
                return Private.lightTheme;
            case 'dark':
                return Private.darkTheme;
            case 'inherit':
            default:
                return Private.inheritTheme();
        }
    }
    Private.getXTermTheme = getXTermTheme;
})(Private || (Private = {}));
//# sourceMappingURL=widget.js.map