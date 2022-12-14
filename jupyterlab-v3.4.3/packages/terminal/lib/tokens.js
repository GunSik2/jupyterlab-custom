// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { Token } from '@lumino/coreutils';
/* tslint:disable */
/**
 * The editor tracker token.
 */
export const ITerminalTracker = new Token('@jupyterlab/terminal:ITerminalTracker');
/* tslint:enable */
/**
 * The namespace for terminals. Separated from the widget so it can be lazy
 * loaded.
 */
export var ITerminal;
(function (ITerminal) {
    /**
     * The default options used for creating terminals.
     */
    ITerminal.defaultOptions = {
        theme: 'inherit',
        fontFamily: 'Menlo, Consolas, "DejaVu Sans Mono", monospace',
        fontSize: 13,
        lineHeight: 1.0,
        scrollback: 1000,
        shutdownOnClose: false,
        closeOnExit: true,
        cursorBlink: true,
        initialCommand: '',
        screenReaderMode: false,
        pasteWithCtrlV: true,
        autoFit: true,
        macOptionIsMeta: false
    };
})(ITerminal || (ITerminal = {}));
//# sourceMappingURL=tokens.js.map