// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { TableOfContents } from '../tokens';
/**
 * Class used to mark numbering prefix for headings in a document.
 */
export const NUMBERING_CLASS = 'numbering-entry';
/**
 * Returns whether a MIME type corresponds to either HTML.
 *
 * @param mime - MIME type string
 * @returns boolean indicating whether a provided MIME type corresponds to either HTML
 *
 * @example
 * const bool = isHTML('text/html');
 * // returns true
 *
 * @example
 * const bool = isHTML('text/plain');
 * // returns false
 */
export function isHTML(mime) {
    return mime === 'text/html';
}
/**
 * Parse a HTML string for headings.
 *
 * ### Notes
 * The html string is not sanitized - use with caution
 *
 * @param html HTML string to parse
 * @param options Options
 * @param initialLevels Initial levels for prefix computation
 * @returns Extracted headings
 */
export function getHTMLHeadings(html, options, initialLevels = []) {
    var _a;
    const config = Object.assign(Object.assign({}, TableOfContents.defaultConfig), options);
    const container = document.createElement('div');
    container.innerHTML = html;
    const levels = initialLevels;
    let previousLevel = levels.length;
    const headings = new Array();
    const headers = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    for (const h of headers) {
        if (h.classList.contains('jp-toc-ignore') ||
            h.classList.contains('tocSkip')) {
            // skip this element if a special class name is included
            continue;
        }
        let level = parseInt(h.tagName[1], 10);
        if (level > 0 && level <= config.maximalDepth) {
            const prefix = getPrefix(level, previousLevel, levels, config);
            previousLevel = level;
            headings.push({
                text: (_a = h.textContent) !== null && _a !== void 0 ? _a : '',
                prefix,
                level,
                id: h === null || h === void 0 ? void 0 : h.getAttribute('id')
            });
        }
    }
    return headings;
}
/**
 * Add an heading prefix to a HTML node.
 *
 * @param container HTML node containing the heading
 * @param selector Heading selector
 * @param prefix Title prefix to add
 * @returns The modified HTML element
 */
export function addPrefix(container, selector, prefix) {
    let element = container.querySelector(selector);
    if (!element) {
        return null;
    }
    if (!element.querySelector(`span.${NUMBERING_CLASS}`)) {
        addNumbering(element, prefix);
    }
    else {
        // There are likely multiple elements with the same selector
        //  => use the first one without prefix
        const allElements = container.querySelectorAll(selector);
        for (const el of allElements) {
            if (!el.querySelector(`span.${NUMBERING_CLASS}`)) {
                element = el;
                addNumbering(el, prefix);
                break;
            }
        }
    }
    return element;
}
/**
 * Update the levels and create the numbering prefix
 *
 * @param level Current level
 * @param previousLevel Previous level
 * @param levels Levels list
 * @param options Options
 * @returns The numbering prefix
 */
export function getPrefix(level, previousLevel, levels, options) {
    const { baseNumbering, numberingH1, numberHeaders } = options;
    let prefix = '';
    if (numberHeaders) {
        const highestLevel = numberingH1 ? 1 : 2;
        if (level > previousLevel) {
            // Initialize the new levels
            for (let l = previousLevel; l < level - 1; l++) {
                levels[l] = 0;
            }
            levels[level - 1] = level === highestLevel ? baseNumbering : 1;
        }
        else {
            // Increment the current level
            levels[level - 1] += 1;
            // Drop higher levels
            if (level < previousLevel) {
                levels.splice(level);
            }
        }
        // If the header list skips some level, replace missing elements by 0
        if (numberingH1) {
            prefix = levels.map(level => level !== null && level !== void 0 ? level : 0).join('.') + '. ';
        }
        else {
            if (levels.length > 1) {
                prefix =
                    levels
                        .slice(1)
                        .map(level => level !== null && level !== void 0 ? level : 0)
                        .join('.') + '. ';
            }
        }
    }
    return prefix;
}
/**
 * Add a numbering prefix to a HTML element.
 *
 * @param el HTML element
 * @param numbering Numbering prefix to add
 */
function addNumbering(el, numbering) {
    el.insertAdjacentHTML('afterbegin', `<span class="${NUMBERING_CLASS}">${numbering}</span>`);
}
/**
 * Remove all numbering nodes from element
 * @param element Node to clear
 */
export function clearNumbering(element) {
    element.querySelectorAll(`span.${NUMBERING_CLASS}`).forEach(el => {
        el.remove();
    });
}
//# sourceMappingURL=common.js.map