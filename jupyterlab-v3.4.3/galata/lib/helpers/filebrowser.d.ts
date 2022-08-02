import { Page } from '@playwright/test';
import { ContentsHelper } from '../contents';
/**
 * File Browser Helpers
 */
export declare class FileBrowserHelper {
    readonly page: Page;
    readonly contents: ContentsHelper;
    constructor(page: Page, contents: ContentsHelper);
    /**
     * Create the selector for a file in the file browser
     *
     * @param fileName File name
     * @returns XPath to file in file browser
     */
    xpBuildFileSelector(fileName: string): string;
    /**
     * Create the selector for a directory in the file browser
     *
     * @param dirName Directory name
     * @returns XPath to directory in file browser
     */
    xpBuildDirectorySelector(dirName: string): string;
    /**
     * Reveal a file in the file browser.
     *
     * It will open intermediate folders if needed.
     *
     * @param filePath File path
     */
    revealFileInBrowser(filePath: string): Promise<void>;
    /**
     * Whether the file is listed in the file browser or not.
     *
     * @param fileName File name
     * @returns File status
     */
    isFileListedInBrowser(fileName: string): Promise<boolean>;
    /**
     * Get the full path of the currently opened directory
     *
     * @returns Directory full path
     */
    getCurrentDirectory(): Promise<string>;
    /**
     * Open a file
     *
     * Note: This will double click on the file;
     * an editor needs to be available for the given file type.
     *
     * @param filePath Notebook path
     * @returns Action success status
     */
    open(filePath: string): Promise<boolean>;
    /**
     * Open the Home directory.
     *
     * @returns Action success status
     */
    openHomeDirectory(): Promise<boolean>;
    /**
     * Open a given directory in the file browser
     *
     * @param dirPath Directory path
     * @returns Action success status
     */
    openDirectory(dirPath: string): Promise<boolean>;
    /**
     * Trigger a file browser refresh
     */
    refresh(): Promise<void>;
    protected _openDirectory(dirName: string): Promise<boolean>;
}
