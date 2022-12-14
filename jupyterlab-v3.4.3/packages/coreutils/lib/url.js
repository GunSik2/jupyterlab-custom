"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.URLExt = void 0;
const path_1 = require("path");
const url_parse_1 = __importDefault(require("url-parse"));
/**
 * The namespace for URL-related functions.
 */
var URLExt;
(function (URLExt) {
    /**
     * Parse a url into a URL object.
     *
     * @param urlString - The URL string to parse.
     *
     * @returns A URL object.
     */
    function parse(url) {
        if (typeof document !== 'undefined' && document) {
            const a = document.createElement('a');
            a.href = url;
            return a;
        }
        return url_parse_1.default(url);
    }
    URLExt.parse = parse;
    /**
     * Parse URL and retrieve hostname
     *
     * @param url - The URL string to parse
     *
     * @return a hostname string value
     */
    function getHostName(url) {
        return url_parse_1.default(url).hostname;
    }
    URLExt.getHostName = getHostName;
    function normalize(url) {
        return url && parse(url).toString();
    }
    URLExt.normalize = normalize;
    /**
     * Join a sequence of url components and normalizes as in node `path.join`.
     *
     * @param parts - The url components.
     *
     * @returns the joined url.
     */
    function join(...parts) {
        const u = url_parse_1.default(parts[0], {});
        const prefix = `${u.protocol}${u.slashes ? '//' : ''}${u.auth}${u.auth ? '@' : ''}${u.host}`;
        // If there was a prefix, then the first path must start at the root.
        const path = path_1.posix.join(`${!!prefix && u.pathname[0] !== '/' ? '/' : ''}${u.pathname}`, ...parts.slice(1));
        return `${prefix}${path === '.' ? '' : path}`;
    }
    URLExt.join = join;
    /**
     * Encode the components of a multi-segment url.
     *
     * @param url - The url to encode.
     *
     * @returns the encoded url.
     *
     * #### Notes
     * Preserves the `'/'` separators.
     * Should not include the base url, since all parts are escaped.
     */
    function encodeParts(url) {
        return join(...url.split('/').map(encodeURIComponent));
    }
    URLExt.encodeParts = encodeParts;
    /**
     * Return a serialized object string suitable for a query.
     *
     * @param object - The source object.
     *
     * @returns an encoded url query.
     *
     * #### Notes
     * Modified version of [stackoverflow](http://stackoverflow.com/a/30707423).
     */
    function objectToQueryString(value) {
        const keys = Object.keys(value).filter(key => key.length > 0);
        if (!keys.length) {
            return '';
        }
        return ('?' +
            keys
                .map(key => {
                const content = encodeURIComponent(String(value[key]));
                return key + (content ? '=' + content : '');
            })
                .join('&'));
    }
    URLExt.objectToQueryString = objectToQueryString;
    /**
     * Return a parsed object that represents the values in a query string.
     */
    function queryStringToObject(value) {
        return value
            .replace(/^\?/, '')
            .split('&')
            .reduce((acc, val) => {
            const [key, value] = val.split('=');
            if (key.length > 0) {
                acc[key] = decodeURIComponent(value || '');
            }
            return acc;
        }, {});
    }
    URLExt.queryStringToObject = queryStringToObject;
    /**
     * Test whether the url is a local url.
     *
     * #### Notes
     * This function returns `false` for any fully qualified url, including
     * `data:`, `file:`, and `//` protocol URLs.
     */
    function isLocal(url) {
        const { protocol } = parse(url);
        return ((!protocol || url.toLowerCase().indexOf(protocol) !== 0) &&
            url.indexOf('/') !== 0);
    }
    URLExt.isLocal = isLocal;
})(URLExt = exports.URLExt || (exports.URLExt = {}));
//# sourceMappingURL=url.js.map