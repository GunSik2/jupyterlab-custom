/* -----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
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
import { CodeMirrorEditor, Mode } from '@jupyterlab/codemirror';
import { URLExt } from '@jupyterlab/coreutils';
import { nullTranslator } from '@jupyterlab/translation';
import { toArray } from '@lumino/algorithm';
import escape from 'lodash.escape';
import { marked } from 'marked';
import { removeMath, replaceMath } from './latex';
/**
 * Render HTML into a host node.
 *
 * @params options - The options for rendering.
 *
 * @returns A promise which resolves when rendering is complete.
 */
export function renderHTML(options) {
    // Unpack the options.
    let { host, source, trusted, sanitizer, resolver, linkHandler, shouldTypeset, latexTypesetter, translator } = options;
    translator = translator || nullTranslator;
    const trans = translator === null || translator === void 0 ? void 0 : translator.load('jupyterlab');
    let originalSource = source;
    // Bail early if the source is empty.
    if (!source) {
        host.textContent = '';
        return Promise.resolve(undefined);
    }
    // Sanitize the source if it is not trusted. This removes all
    // `<script>` tags as well as other potentially harmful HTML.
    if (!trusted) {
        originalSource = `${source}`;
        source = sanitizer.sanitize(source);
    }
    // Set the inner HTML of the host.
    host.innerHTML = source;
    if (host.getElementsByTagName('script').length > 0) {
        // If output it trusted, eval any script tags contained in the HTML.
        // This is not done automatically by the browser when script tags are
        // created by setting `innerHTML`.
        if (trusted) {
            Private.evalInnerHTMLScriptTags(host);
        }
        else {
            const container = document.createElement('div');
            const warning = document.createElement('pre');
            warning.textContent = trans.__('This HTML output contains inline scripts. Are you sure that you want to run arbitrary Javascript within your JupyterLab session?');
            const runButton = document.createElement('button');
            runButton.textContent = trans.__('Run');
            runButton.onclick = event => {
                host.innerHTML = originalSource;
                Private.evalInnerHTMLScriptTags(host);
                if (host.firstChild) {
                    host.removeChild(host.firstChild);
                }
            };
            container.appendChild(warning);
            container.appendChild(runButton);
            host.insertBefore(container, host.firstChild);
        }
    }
    // Handle default behavior of nodes.
    Private.handleDefaults(host, resolver);
    // Patch the urls if a resolver is available.
    let promise;
    if (resolver) {
        promise = Private.handleUrls(host, resolver, linkHandler);
    }
    else {
        promise = Promise.resolve(undefined);
    }
    // Return the final rendered promise.
    return promise.then(() => {
        if (shouldTypeset && latexTypesetter) {
            latexTypesetter.typeset(host);
        }
    });
}
/**
 * Render an image into a host node.
 *
 * @params options - The options for rendering.
 *
 * @returns A promise which resolves when rendering is complete.
 */
export function renderImage(options) {
    // Unpack the options.
    const { host, mimeType, source, width, height, needsBackground, unconfined } = options;
    // Clear the content in the host.
    host.textContent = '';
    // Create the image element.
    const img = document.createElement('img');
    // Set the source of the image.
    img.src = `data:${mimeType};base64,${source}`;
    // Set the size of the image if provided.
    if (typeof height === 'number') {
        img.height = height;
    }
    if (typeof width === 'number') {
        img.width = width;
    }
    if (needsBackground === 'light') {
        img.classList.add('jp-needs-light-background');
    }
    else if (needsBackground === 'dark') {
        img.classList.add('jp-needs-dark-background');
    }
    if (unconfined === true) {
        img.classList.add('jp-mod-unconfined');
    }
    // Add the image to the host.
    host.appendChild(img);
    // Return the rendered promise.
    return Promise.resolve(undefined);
}
/**
 * Render LaTeX into a host node.
 *
 * @params options - The options for rendering.
 *
 * @returns A promise which resolves when rendering is complete.
 */
export function renderLatex(options) {
    // Unpack the options.
    const { host, source, shouldTypeset, latexTypesetter } = options;
    // Set the source on the node.
    host.textContent = source;
    // Typeset the node if needed.
    if (shouldTypeset && latexTypesetter) {
        latexTypesetter.typeset(host);
    }
    // Return the rendered promise.
    return Promise.resolve(undefined);
}
/**
 * Render Markdown into a host node.
 *
 * @params options - The options for rendering.
 *
 * @returns A promise which resolves when rendering is complete.
 */
export async function renderMarkdown(options) {
    // Unpack the options.
    const { host, source } = options, others = __rest(options, ["host", "source"]);
    // Clear the content if there is no source.
    if (!source) {
        host.textContent = '';
        return;
    }
    // Separate math from normal markdown text.
    const parts = removeMath(source);
    // Convert the markdown to HTML.
    let html = await Private.renderMarked(parts['text']);
    // Replace math.
    html = replaceMath(html, parts['math']);
    // Render HTML.
    await renderHTML(Object.assign({ host, source: html }, others));
    // Apply ids to the header nodes.
    Private.headerAnchors(host);
}
/**
 * Render SVG into a host node.
 *
 * @params options - The options for rendering.
 *
 * @returns A promise which resolves when rendering is complete.
 */
export function renderSVG(options) {
    // Unpack the options.
    let { host, source, trusted, unconfined } = options;
    // Clear the content if there is no source.
    if (!source) {
        host.textContent = '';
        return Promise.resolve(undefined);
    }
    // Display a message if the source is not trusted.
    if (!trusted) {
        host.textContent =
            'Cannot display an untrusted SVG. Maybe you need to run the cell?';
        return Promise.resolve(undefined);
    }
    // Add missing SVG namespace (if actually missing)
    const patt = '<svg[^>]+xmlns=[^>]+svg';
    if (source.search(patt) < 0) {
        source = source.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    // Render in img so that user can save it easily
    const img = new Image();
    img.src = `data:image/svg+xml,${encodeURIComponent(source)}`;
    host.appendChild(img);
    if (unconfined === true) {
        host.classList.add('jp-mod-unconfined');
    }
    return Promise.resolve();
}
/**
 * Replace URLs with links.
 *
 * @param content - The text content of a node.
 *
 * @returns A list of text nodes and anchor elements.
 */
function autolink(content) {
    // Taken from Visual Studio Code:
    // https://github.com/microsoft/vscode/blob/9f709d170b06e991502153f281ec3c012add2e42/src/vs/workbench/contrib/debug/browser/linkDetector.ts#L17-L18
    const controlCodes = '\\u0000-\\u0020\\u007f-\\u009f';
    const webLinkRegex = new RegExp('(?:[a-zA-Z][a-zA-Z0-9+.-]{2,}:\\/\\/|data:|www\\.)[^\\s' +
        controlCodes +
        '"]{2,}[^\\s' +
        controlCodes +
        '"\'(){}\\[\\],:;.!?]', 'ug');
    const nodes = [];
    let lastIndex = 0;
    let match;
    while (null != (match = webLinkRegex.exec(content))) {
        if (match.index !== lastIndex) {
            nodes.push(document.createTextNode(content.slice(lastIndex, match.index)));
        }
        let url = match[0];
        // Special case when the URL ends with ">" or "<"
        const lastChars = url.slice(-1);
        const endsWithGtLt = ['>', '<'].indexOf(lastChars) !== -1;
        const len = endsWithGtLt ? url.length - 1 : url.length;
        const anchor = document.createElement('a');
        url = url.slice(0, len);
        anchor.href = url.startsWith('www.') ? 'https://' + url : url;
        anchor.rel = 'noopener';
        anchor.target = '_blank';
        anchor.appendChild(document.createTextNode(url.slice(0, len)));
        nodes.push(anchor);
        lastIndex = match.index + len;
    }
    if (lastIndex !== content.length) {
        nodes.push(document.createTextNode(content.slice(lastIndex, content.length)));
    }
    return nodes;
}
/**
 * Split a shallow node (node without nested nodes inside) at a given text content position.
 *
 * @param node the shallow node to be split
 * @param at the position in textContent at which the split should occur
 */
function splitShallowNode(node, at) {
    var _a, _b;
    const pre = node.cloneNode();
    pre.textContent = (_a = node.textContent) === null || _a === void 0 ? void 0 : _a.substr(0, at);
    const post = node.cloneNode();
    post.textContent = (_b = node.textContent) === null || _b === void 0 ? void 0 : _b.substr(at);
    return {
        pre: pre,
        post: post
    };
}
/**
 * Render text into a host node.
 *
 * @params options - The options for rendering.
 *
 * @returns A promise which resolves when rendering is complete.
 */
export function renderText(options) {
    var _a, _b;
    // Unpack the options.
    const { host, sanitizer, source } = options;
    // Create the HTML content.
    const content = sanitizer.sanitize(Private.ansiSpan(source), {
        allowedTags: ['span']
    });
    // Set the sanitized content for the host node.
    const pre = document.createElement('pre');
    pre.innerHTML = content;
    const preTextContent = pre.textContent;
    if (preTextContent) {
        // Note: only text nodes and span elements should be present after sanitization in the `<pre>` element.
        const linkedNodes = autolink(preTextContent);
        let inAnchorElement = false;
        const combinedNodes = [];
        const preNodes = Array.from(pre.childNodes);
        while (preNodes.length && linkedNodes.length) {
            // Use non-null assertions to workaround TypeScript context awareness limitation
            // (if any of the arrays were empty, we would not enter the body of the loop).
            let preNode = preNodes.shift();
            let linkNode = linkedNodes.shift();
            // This should never happen because we modify the arrays in flight so they should end simultaneously,
            // but this makes the coding assistance happy and might make it easier to conceptualize.
            if (typeof preNode === 'undefined') {
                combinedNodes.push(linkNode);
                break;
            }
            if (typeof linkNode === 'undefined') {
                combinedNodes.push(preNode);
                break;
            }
            let preLen = (_a = preNode.textContent) === null || _a === void 0 ? void 0 : _a.length;
            let linkLen = (_b = linkNode.textContent) === null || _b === void 0 ? void 0 : _b.length;
            if (preLen && linkLen) {
                if (preLen > linkLen) {
                    // Split pre node and only keep the shorter part
                    let { pre: keep, post: postpone } = splitShallowNode(preNode, linkLen);
                    preNodes.unshift(postpone);
                    preNode = keep;
                }
                else if (linkLen > preLen) {
                    let { pre: keep, post: postpone } = splitShallowNode(linkNode, preLen);
                    linkedNodes.unshift(postpone);
                    linkNode = keep;
                }
            }
            const lastCombined = combinedNodes[combinedNodes.length - 1];
            // If we are already in an anchor element and the anchor element did not change,
            // we should insert the node from <pre> which is either Text node or coloured span Element
            // into the anchor content as a child
            if (inAnchorElement &&
                linkNode.href ===
                    lastCombined.href) {
                lastCombined.appendChild(preNode);
            }
            else {
                // the `linkNode` is either Text or AnchorElement;
                const isAnchor = linkNode.nodeType !== Node.TEXT_NODE;
                // if we are NOT about to start an anchor element, just add the pre Node
                if (!isAnchor) {
                    combinedNodes.push(preNode);
                    inAnchorElement = false;
                }
                else {
                    // otherwise start a new anchor; the contents of the `linkNode` and `preNode` should be the same,
                    // so we just put the neatly formatted `preNode` inside the anchor node (`linkNode`)
                    // and append that to combined nodes.
                    linkNode.textContent = '';
                    linkNode.appendChild(preNode);
                    combinedNodes.push(linkNode);
                    inAnchorElement = true;
                }
            }
        }
        // TODO: replace with `.replaceChildren()` once the target ES version allows it
        pre.innerHTML = '';
        for (const child of combinedNodes) {
            pre.appendChild(child);
        }
    }
    host.appendChild(pre);
    // Return the rendered promise.
    return Promise.resolve(undefined);
}
/**
 * The namespace for module implementation details.
 */
var Private;
(function (Private) {
    /**
     * Eval the script tags contained in a host populated by `innerHTML`.
     *
     * When script tags are created via `innerHTML`, the browser does not
     * evaluate them when they are added to the page. This function works
     * around that by creating new equivalent script nodes manually, and
     * replacing the originals.
     */
    function evalInnerHTMLScriptTags(host) {
        // Create a snapshot of the current script nodes.
        const scripts = toArray(host.getElementsByTagName('script'));
        // Loop over each script node.
        for (const script of scripts) {
            // Skip any scripts which no longer have a parent.
            if (!script.parentNode) {
                continue;
            }
            // Create a new script node which will be clone.
            const clone = document.createElement('script');
            // Copy the attributes into the clone.
            const attrs = script.attributes;
            for (let i = 0, n = attrs.length; i < n; ++i) {
                const { name, value } = attrs[i];
                clone.setAttribute(name, value);
            }
            // Copy the text content into the clone.
            clone.textContent = script.textContent;
            // Replace the old script in the parent.
            script.parentNode.replaceChild(clone, script);
        }
    }
    Private.evalInnerHTMLScriptTags = evalInnerHTMLScriptTags;
    /**
     * Render markdown for the specified content.
     *
     * @param content - The string of markdown to render.
     *
     * @return A promise which resolves with the rendered content.
     */
    function renderMarked(content) {
        initializeMarked();
        return new Promise((resolve, reject) => {
            marked(content, (err, content) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(content);
                }
            });
        });
    }
    Private.renderMarked = renderMarked;
    /**
     * Handle the default behavior of nodes.
     */
    function handleDefaults(node, resolver) {
        // Handle anchor elements.
        const anchors = node.getElementsByTagName('a');
        for (let i = 0; i < anchors.length; i++) {
            const el = anchors[i];
            // skip when processing a elements inside svg
            // which are of type SVGAnimatedString
            if (!(el instanceof HTMLAnchorElement)) {
                continue;
            }
            const path = el.href;
            const isLocal = resolver && resolver.isLocal
                ? resolver.isLocal(path)
                : URLExt.isLocal(path);
            // set target attribute if not already present
            if (!el.target) {
                el.target = isLocal ? '_self' : '_blank';
            }
            // set rel as 'noopener' for non-local anchors
            if (!isLocal) {
                el.rel = 'noopener';
            }
        }
        // Handle image elements.
        const imgs = node.getElementsByTagName('img');
        for (let i = 0; i < imgs.length; i++) {
            if (!imgs[i].alt) {
                imgs[i].alt = 'Image';
            }
        }
    }
    Private.handleDefaults = handleDefaults;
    /**
     * Resolve the relative urls in element `src` and `href` attributes.
     *
     * @param node - The head html element.
     *
     * @param resolver - A url resolver.
     *
     * @param linkHandler - An optional link handler for nodes.
     *
     * @returns a promise fulfilled when the relative urls have been resolved.
     */
    function handleUrls(node, resolver, linkHandler) {
        // Set up an array to collect promises.
        const promises = [];
        // Handle HTML Elements with src attributes.
        const nodes = node.querySelectorAll('*[src]');
        for (let i = 0; i < nodes.length; i++) {
            promises.push(handleAttr(nodes[i], 'src', resolver));
        }
        // Handle anchor elements.
        const anchors = node.getElementsByTagName('a');
        for (let i = 0; i < anchors.length; i++) {
            promises.push(handleAnchor(anchors[i], resolver, linkHandler));
        }
        // Handle link elements.
        const links = node.getElementsByTagName('link');
        for (let i = 0; i < links.length; i++) {
            promises.push(handleAttr(links[i], 'href', resolver));
        }
        // Wait on all promises.
        return Promise.all(promises).then(() => undefined);
    }
    Private.handleUrls = handleUrls;
    /**
     * Apply ids to headers.
     */
    function headerAnchors(node) {
        var _a;
        const headerNames = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        for (const headerType of headerNames) {
            const headers = node.getElementsByTagName(headerType);
            for (let i = 0; i < headers.length; i++) {
                const header = headers[i];
                header.id = ((_a = header.textContent) !== null && _a !== void 0 ? _a : '').replace(/ /g, '-');
                const anchor = document.createElement('a');
                anchor.target = '_self';
                anchor.textContent = '??';
                anchor.href = '#' + header.id;
                anchor.classList.add('jp-InternalAnchorLink');
                header.appendChild(anchor);
            }
        }
    }
    Private.headerAnchors = headerAnchors;
    /**
     * Handle a node with a `src` or `href` attribute.
     */
    async function handleAttr(node, name, resolver) {
        const source = node.getAttribute(name) || '';
        const isLocal = resolver.isLocal
            ? resolver.isLocal(source)
            : URLExt.isLocal(source);
        if (!source || !isLocal) {
            return;
        }
        try {
            const urlPath = await resolver.resolveUrl(source);
            let url = await resolver.getDownloadUrl(urlPath);
            if (URLExt.parse(url).protocol !== 'data:') {
                // Bust caching for local src attrs.
                // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Bypassing_the_cache
                url += (/\?/.test(url) ? '&' : '?') + new Date().getTime();
            }
            node.setAttribute(name, url);
        }
        catch (err) {
            // If there was an error getting the url,
            // just make it an empty link and report the error.
            node.setAttribute(name, '');
            throw err;
        }
    }
    /**
     * Handle an anchor node.
     */
    function handleAnchor(anchor, resolver, linkHandler) {
        // Get the link path without the location prepended.
        // (e.g. "./foo.md#Header 1" vs "http://localhost:8888/foo.md#Header 1")
        let href = anchor.getAttribute('href') || '';
        const isLocal = resolver.isLocal
            ? resolver.isLocal(href)
            : URLExt.isLocal(href);
        // Bail if it is not a file-like url.
        if (!href || !isLocal) {
            return Promise.resolve(undefined);
        }
        // Remove the hash until we can handle it.
        const hash = anchor.hash;
        if (hash) {
            // Handle internal link in the file.
            if (hash === href) {
                anchor.target = '_self';
                return Promise.resolve(undefined);
            }
            // For external links, remove the hash until we have hash handling.
            href = href.replace(hash, '');
        }
        // Get the appropriate file path.
        return resolver
            .resolveUrl(href)
            .then(urlPath => {
            // decode encoded url from url to api path
            const path = decodeURIComponent(urlPath);
            // Handle the click override.
            if (linkHandler) {
                linkHandler.handleLink(anchor, path, hash);
            }
            // Get the appropriate file download path.
            return resolver.getDownloadUrl(urlPath);
        })
            .then(url => {
            // Set the visible anchor.
            anchor.href = url + hash;
        })
            .catch(err => {
            // If there was an error getting the url,
            // just make it an empty link.
            anchor.href = '';
        });
    }
    let markedInitialized = false;
    /**
     * Support GitHub flavored Markdown, leave sanitizing to external library.
     */
    function initializeMarked() {
        if (markedInitialized) {
            return;
        }
        markedInitialized = true;
        marked.setOptions({
            gfm: true,
            sanitize: false,
            // breaks: true; We can't use GFM breaks as it causes problems with tables
            langPrefix: `cm-s-${CodeMirrorEditor.defaultConfig.theme} language-`,
            highlight: (code, lang, callback) => {
                const cb = (err, code) => {
                    if (callback) {
                        callback(err, code);
                    }
                    return code;
                };
                if (!lang) {
                    // no language, no highlight
                    return cb(null, code);
                }
                Mode.ensure(lang)
                    .then(spec => {
                    const el = document.createElement('div');
                    if (!spec) {
                        console.error(`No CodeMirror mode: ${lang}`);
                        return cb(null, code);
                    }
                    try {
                        Mode.run(code, spec.mime, el);
                        return cb(null, el.innerHTML);
                    }
                    catch (err) {
                        console.error(`Failed to highlight ${lang} code`, err);
                        return cb(err, code);
                    }
                })
                    .catch(err => {
                    console.error(`No CodeMirror mode: ${lang}`);
                    console.error(`Require CodeMirror mode error: ${err}`);
                    return cb(null, code);
                });
                return code;
            }
        });
    }
    const ANSI_COLORS = [
        'ansi-black',
        'ansi-red',
        'ansi-green',
        'ansi-yellow',
        'ansi-blue',
        'ansi-magenta',
        'ansi-cyan',
        'ansi-white',
        'ansi-black-intense',
        'ansi-red-intense',
        'ansi-green-intense',
        'ansi-yellow-intense',
        'ansi-blue-intense',
        'ansi-magenta-intense',
        'ansi-cyan-intense',
        'ansi-white-intense'
    ];
    /**
     * Create HTML tags for a string with given foreground, background etc. and
     * add them to the `out` array.
     */
    function pushColoredChunk(chunk, fg, bg, bold, underline, inverse, out) {
        if (chunk) {
            const classes = [];
            const styles = [];
            if (bold && typeof fg === 'number' && 0 <= fg && fg < 8) {
                fg += 8; // Bold text uses "intense" colors
            }
            if (inverse) {
                [fg, bg] = [bg, fg];
            }
            if (typeof fg === 'number') {
                classes.push(ANSI_COLORS[fg] + '-fg');
            }
            else if (fg.length) {
                styles.push(`color: rgb(${fg})`);
            }
            else if (inverse) {
                classes.push('ansi-default-inverse-fg');
            }
            if (typeof bg === 'number') {
                classes.push(ANSI_COLORS[bg] + '-bg');
            }
            else if (bg.length) {
                styles.push(`background-color: rgb(${bg})`);
            }
            else if (inverse) {
                classes.push('ansi-default-inverse-bg');
            }
            if (bold) {
                classes.push('ansi-bold');
            }
            if (underline) {
                classes.push('ansi-underline');
            }
            if (classes.length || styles.length) {
                out.push('<span');
                if (classes.length) {
                    out.push(` class="${classes.join(' ')}"`);
                }
                if (styles.length) {
                    out.push(` style="${styles.join('; ')}"`);
                }
                out.push('>');
                out.push(chunk);
                out.push('</span>');
            }
            else {
                out.push(chunk);
            }
        }
    }
    /**
     * Convert ANSI extended colors to R/G/B triple.
     */
    function getExtendedColors(numbers) {
        let r;
        let g;
        let b;
        const n = numbers.shift();
        if (n === 2 && numbers.length >= 3) {
            // 24-bit RGB
            r = numbers.shift();
            g = numbers.shift();
            b = numbers.shift();
            if ([r, g, b].some(c => c < 0 || 255 < c)) {
                throw new RangeError('Invalid range for RGB colors');
            }
        }
        else if (n === 5 && numbers.length >= 1) {
            // 256 colors
            const idx = numbers.shift();
            if (idx < 0) {
                throw new RangeError('Color index must be >= 0');
            }
            else if (idx < 16) {
                // 16 default terminal colors
                return idx;
            }
            else if (idx < 232) {
                // 6x6x6 color cube, see https://stackoverflow.com/a/27165165/500098
                r = Math.floor((idx - 16) / 36);
                r = r > 0 ? 55 + r * 40 : 0;
                g = Math.floor(((idx - 16) % 36) / 6);
                g = g > 0 ? 55 + g * 40 : 0;
                b = (idx - 16) % 6;
                b = b > 0 ? 55 + b * 40 : 0;
            }
            else if (idx < 256) {
                // grayscale, see https://stackoverflow.com/a/27165165/500098
                r = g = b = (idx - 232) * 10 + 8;
            }
            else {
                throw new RangeError('Color index must be < 256');
            }
        }
        else {
            throw new RangeError('Invalid extended color specification');
        }
        return [r, g, b];
    }
    /**
     * Transform ANSI color escape codes into HTML <span> tags with CSS
     * classes such as "ansi-green-intense-fg".
     * The actual colors used are set in the CSS file.
     * This also removes non-color escape sequences.
     * This is supposed to have the same behavior as nbconvert.filters.ansi2html()
     */
    function ansiSpan(str) {
        const ansiRe = /\x1b\[(.*?)([@-~])/g; // eslint-disable-line no-control-regex
        let fg = [];
        let bg = [];
        let bold = false;
        let underline = false;
        let inverse = false;
        let match;
        const out = [];
        const numbers = [];
        let start = 0;
        str = escape(str);
        str += '\x1b[m'; // Ensure markup for trailing text
        // tslint:disable-next-line
        while ((match = ansiRe.exec(str))) {
            if (match[2] === 'm') {
                const items = match[1].split(';');
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    if (item === '') {
                        numbers.push(0);
                    }
                    else if (item.search(/^\d+$/) !== -1) {
                        numbers.push(parseInt(item, 10));
                    }
                    else {
                        // Ignored: Invalid color specification
                        numbers.length = 0;
                        break;
                    }
                }
            }
            else {
                // Ignored: Not a color code
            }
            const chunk = str.substring(start, match.index);
            pushColoredChunk(chunk, fg, bg, bold, underline, inverse, out);
            start = ansiRe.lastIndex;
            while (numbers.length) {
                const n = numbers.shift();
                switch (n) {
                    case 0:
                        fg = bg = [];
                        bold = false;
                        underline = false;
                        inverse = false;
                        break;
                    case 1:
                    case 5:
                        bold = true;
                        break;
                    case 4:
                        underline = true;
                        break;
                    case 7:
                        inverse = true;
                        break;
                    case 21:
                    case 22:
                        bold = false;
                        break;
                    case 24:
                        underline = false;
                        break;
                    case 27:
                        inverse = false;
                        break;
                    case 30:
                    case 31:
                    case 32:
                    case 33:
                    case 34:
                    case 35:
                    case 36:
                    case 37:
                        fg = n - 30;
                        break;
                    case 38:
                        try {
                            fg = getExtendedColors(numbers);
                        }
                        catch (e) {
                            numbers.length = 0;
                        }
                        break;
                    case 39:
                        fg = [];
                        break;
                    case 40:
                    case 41:
                    case 42:
                    case 43:
                    case 44:
                    case 45:
                    case 46:
                    case 47:
                        bg = n - 40;
                        break;
                    case 48:
                        try {
                            bg = getExtendedColors(numbers);
                        }
                        catch (e) {
                            numbers.length = 0;
                        }
                        break;
                    case 49:
                        bg = [];
                        break;
                    case 90:
                    case 91:
                    case 92:
                    case 93:
                    case 94:
                    case 95:
                    case 96:
                    case 97:
                        fg = n - 90 + 8;
                        break;
                    case 100:
                    case 101:
                    case 102:
                    case 103:
                    case 104:
                    case 105:
                    case 106:
                    case 107:
                        bg = n - 100 + 8;
                        break;
                    default:
                    // Unknown codes are ignored
                }
            }
        }
        return out.join('');
    }
    Private.ansiSpan = ansiSpan;
})(Private || (Private = {}));
//# sourceMappingURL=renderers.js.map