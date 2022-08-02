import { ElementHandle, Page } from '@playwright/test';
/**
 * Read a file as a base-64 string
 *
 * @param filePath Local file path
 * @returns Base 64 encoded file content
 */
export declare function base64EncodeFile(filePath: string): string;
/**
 * Get the Jupyter server base URL stored in the index.html file
 *
 * @param page Playwright page model
 * @returns Base URL
 */
export declare function getBaseUrl(page: Page): Promise<string>;
/**
 * Get the classes of an element
 *
 * @param element Element handle
 * @returns Classes list
 */
export declare function getElementClassList(element: ElementHandle): Promise<string[]>;
/**
 * List the content of a local directory
 *
 * @param dirPath Local directory path
 * @param filePaths List to populate with the directory content
 * @returns Content of the directory
 */
export declare function getFilesInDirectory(dirPath: string, filePaths?: string[]): string[];
/**
 * Get the value of an option stored in the page config object
 *
 * @param page Playwright page model
 * @param name Option name
 * @returns Option value
 */
export declare function getOption(page: Page, name: string): Promise<string>;
/**
 * Get the token stored in the page config object
 *
 * @param page Playwright page model
 * @returns Token
 */
export declare function getToken(page: Page): Promise<string>;
/**
 * Wait for a function to return true until timeout
 *
 * @param fn Condition
 * @param timeout Time out
 */
export declare function waitForCondition(fn: () => boolean | Promise<boolean>, timeout?: number): Promise<void>;
/**
 * Wait for an element to emit 'transitionend' event.
 *
 * @param page Playwright page model object
 * @param element Element or selector to watch
 */
export declare function waitForTransition(page: Page, element: ElementHandle<Element> | string): Promise<void>;
/**
 * Get the selector to look for a specific class
 *
 * @param className Class name
 * @returns Selector
 */
export declare function xpContainsClass(className: string): string;
/**
 * Get the selector to look for a specific activity tab
 *
 * @param name Activity name
 * @returns Selector
 */
export declare function xpBuildActivityTabSelector(name: string): string;
/**
 * Get the selector to look for a specific activity panel
 *
 * @param id Activity id
 * @returns Selector
 */
export declare function xpBuildActivityPanelSelector(id: string): string;
/**
 * Get the selector to look for the currently active activity tab
 *
 * @returns Selector
 */
export declare function xpBuildActiveActivityTabSelector(): string;
