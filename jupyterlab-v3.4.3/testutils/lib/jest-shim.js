// Shims originally adapted from https://github.com/nteract/nteract/blob/47f8b038ff129543e42c39395129efc433eb4e90/scripts/test-shim.js
const fetchMod = (window.fetch = require('node-fetch')); // tslint:disable-line
window.Request = fetchMod.Request;
window.Headers = fetchMod.Headers;
window.Response = fetchMod.Response;
global.Image = window.Image;
global.Range = function Range() {
    /* no-op */
};
// HACK: Polyfill that allows CodeMirror to render in a JSDOM env.
const createContextualFragment = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.children[0]; // so hokey it's not even funny
};
global.Range.prototype.createContextualFragment = (html) => createContextualFragment(html);
window.document.createRange = function createRange() {
    return {
        setEnd: () => {
            /* no-op */
        },
        setStart: () => {
            /* no-op */
        },
        getBoundingClientRect: () => ({ right: 0 }),
        getClientRects: () => [],
        createContextualFragment
    };
};
// end CodeMirror HACK
window.focus = () => {
    /* JSDom throws "Not Implemented" */
};
window.document.elementFromPoint = (left, top) => document.body;
if (!window.hasOwnProperty('getSelection')) {
    // Minimal getSelection() that supports a fake selection
    window.getSelection = function getSelection() {
        return {
            _selection: '',
            selectAllChildren: () => {
                this._selection = 'foo';
            },
            toString: () => {
                const val = this._selection;
                this._selection = '';
                return val;
            }
        };
    };
}
// Used by xterm.js
window.matchMedia = function (media) {
    return {
        matches: false,
        media,
        onchange: () => {
            /* empty */
        },
        addEventListener: () => {
            /* empty */
        },
        removeEventListener: () => {
            /* empty */
        },
        dispatchEvent: () => {
            return true;
        },
        addListener: () => {
            /* empty */
        },
        removeListener: () => {
            /* empty */
        }
    };
};
process.on('unhandledRejection', (error, promise) => {
    console.error('Unhandled promise rejection somewhere in tests');
    if (error) {
        console.error(error);
        const stack = error.stack;
        if (stack) {
            console.error(stack);
        }
    }
    promise.catch(err => console.error('promise rejected', err));
});
//# sourceMappingURL=jest-shim.js.map