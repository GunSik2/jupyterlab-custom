// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { IEditorMimeTypeService } from '@jupyterlab/codeeditor';
import { PathExt } from '@jupyterlab/coreutils';
import { ArrayExt } from '@lumino/algorithm';
import CodeMirror from 'codemirror';
import 'codemirror/addon/runmode/runmode';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/css/css';
// Bundle other common modes
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/jsx/jsx';
import 'codemirror/mode/julia/julia';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/meta';
import 'codemirror/mode/r/r';
import 'codemirror/mode/shell/shell';
import 'codemirror/mode/sql/sql';
import './codemirror-ipython';
import './codemirror-ipythongfm';
/**
 * The namespace for CodeMirror Mode functionality.
 */
export var Mode;
(function (Mode) {
    const specLoaders = [
        {
            // Simplest, cheapest check by mode name.
            loader: async (spec) => CodeMirror.modes.hasOwnProperty(spec.mode),
            rank: 0
        },
        {
            // Fetch the mode asynchronously.
            loader: function (spec) {
                return new Promise((resolve, reject) => {
                    // An arrow function below seems to miscompile in our current webpack to
                    // invalid js.
                    require([
                        `codemirror/mode/${spec.mode}/${spec.mode}.js`
                    ], function () {
                        resolve(true);
                    });
                });
            },
            rank: 99
        }
    ];
    /**
     * Get the raw list of available modes specs.
     */
    function getModeInfo() {
        return CodeMirror.modeInfo;
    }
    Mode.getModeInfo = getModeInfo;
    /**
     * Running a CodeMirror mode outside of an editor.
     */
    function run(code, mode, el) {
        CodeMirror.runMode(code, mode, el);
    }
    Mode.run = run;
    /**
     * Ensure a codemirror mode is available by name or Codemirror spec.
     *
     * @param mode - The mode to ensure.  If it is a string, uses [findBest]
     *   to get the appropriate spec.
     *
     * @returns A promise that resolves when the mode is available.
     */
    async function ensure(mode) {
        const spec = findBest(mode);
        for (const specLoader of specLoaders) {
            if (await specLoader.loader(spec)) {
                return spec;
            }
        }
        return null;
    }
    Mode.ensure = ensure;
    function addSpecLoader(loader, rank) {
        const item = { loader, rank };
        const index = ArrayExt.upperBound(specLoaders, item, Private.itemCmp);
        ArrayExt.insert(specLoaders, index, item);
    }
    Mode.addSpecLoader = addSpecLoader;
    /**
     * Find a codemirror mode by name or CodeMirror spec.
     */
    function findBest(mode) {
        var _a;
        const modename = typeof mode === 'string' ? mode : mode.mode || mode.name;
        const mimetype = typeof mode !== 'string' ? mode.mime : modename;
        const ext = typeof mode !== 'string' ? (_a = mode.ext) !== null && _a !== void 0 ? _a : [] : [];
        return (CodeMirror.findModeByName(modename || '') ||
            CodeMirror.findModeByMIME(mimetype || '') ||
            findByExtension(ext) ||
            CodeMirror.findModeByMIME(IEditorMimeTypeService.defaultMimeType) ||
            CodeMirror.findModeByMIME('text/plain'));
    }
    Mode.findBest = findBest;
    /**
     * Find a codemirror mode by MIME.
     */
    function findByMIME(mime) {
        return CodeMirror.findModeByMIME(mime);
    }
    Mode.findByMIME = findByMIME;
    /**
     * Find a codemirror mode by name.
     */
    function findByName(name) {
        return CodeMirror.findModeByName(name);
    }
    Mode.findByName = findByName;
    /**
     * Find a codemirror mode by filename.
     */
    function findByFileName(name) {
        const basename = PathExt.basename(name);
        return CodeMirror.findModeByFileName(basename);
    }
    Mode.findByFileName = findByFileName;
    /**
     * Find a codemirror mode by extension.
     */
    function findByExtension(ext) {
        if (typeof ext === 'string') {
            return CodeMirror.findModeByExtension(ext);
        }
        for (let i = 0; i < ext.length; i++) {
            const mode = CodeMirror.findModeByExtension(ext[i]);
            if (mode) {
                return mode;
            }
        }
        return null;
    }
    Mode.findByExtension = findByExtension;
})(Mode || (Mode = {}));
var Private;
(function (Private) {
    /**
     * A less-than comparison function for the loader rank
     */
    function itemCmp(first, second) {
        return first.rank - second.rank;
    }
    Private.itemCmp = itemCmp;
})(Private || (Private = {}));
//# sourceMappingURL=mode.js.map