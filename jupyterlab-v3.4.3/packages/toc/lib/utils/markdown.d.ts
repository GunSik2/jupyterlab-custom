import { IMarkdownParser } from '@jupyterlab/rendermime';
import { TableOfContents } from '../tokens';
/**
 * Markdown heading
 */
export interface IMarkdownHeading extends TableOfContents.IHeading {
    /**
     * Heading line
     */
    line: number;
    /**
     * Raw string containing the heading
     */
    raw: string;
}
/**
 * Build the heading html id.
 *
 * @param raw Raw markdown heading
 * @param level Heading level
 */
export declare function getHeadingId(parser: IMarkdownParser, raw: string, level: number): Promise<string | null>;
/**
 * Parses the provided string and returns a list of headings.
 *
 * @param text - Input text
 * @param options - Parser configuration
 * @param initialLevels - Initial levels to use for computing the prefix
 * @returns List of headings
 */
export declare function getHeadings(text: string, options?: Partial<TableOfContents.IConfig>, initialLevels?: number[]): IMarkdownHeading[];
/**
 * Returns whether a MIME type corresponds to a Markdown flavor.
 *
 * @param mime - MIME type string
 * @returns boolean indicating whether a provided MIME type corresponds to a Markdown flavor
 *
 * @example
 * const bool = isMarkdown('text/markdown');
 * // returns true
 *
 * @example
 * const bool = isMarkdown('text/plain');
 * // returns false
 */
export declare function isMarkdown(mime: string): boolean;
