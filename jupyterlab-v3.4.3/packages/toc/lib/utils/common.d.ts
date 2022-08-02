import { TableOfContents } from '../tokens';
/**
 * Class used to mark numbering prefix for headings in a document.
 */
export declare const NUMBERING_CLASS = "numbering-entry";
/**
 * HTML heading
 */
export interface IHTMLHeading extends TableOfContents.IHeading {
    /**
     * HTML id
     */
    id?: string | null;
}
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
export declare function isHTML(mime: string): boolean;
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
export declare function getHTMLHeadings(html: string, options?: Partial<TableOfContents.IConfig>, initialLevels?: number[]): IHTMLHeading[];
/**
 * Add an heading prefix to a HTML node.
 *
 * @param container HTML node containing the heading
 * @param selector Heading selector
 * @param prefix Title prefix to add
 * @returns The modified HTML element
 */
export declare function addPrefix(container: Element, selector: string, prefix: string): Element | null;
/**
 * Update the levels and create the numbering prefix
 *
 * @param level Current level
 * @param previousLevel Previous level
 * @param levels Levels list
 * @param options Options
 * @returns The numbering prefix
 */
export declare function getPrefix(level: number, previousLevel: number, levels: number[], options: TableOfContents.IConfig): string;
/**
 * Remove all numbering nodes from element
 * @param element Node to clear
 */
export declare function clearNumbering(element: Element): void;
