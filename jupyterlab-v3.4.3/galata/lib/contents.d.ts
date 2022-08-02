import { Contents } from '@jupyterlab/services';
import { Page } from '@playwright/test';
/**
 * Helper class to interact with contents server API
 *
 * Those helpers are directly requesting the Jupyter server to
 * carry contents tasks; except rename operations if the page model
 * is provided.
 */
export declare class ContentsHelper {
    readonly baseURL: string;
    readonly page?: Page | undefined;
    /**
     * Construct a new instance of ContentsHelper
     *
     * @param baseURL Server base URL
     * @param page Playwright page model object
     */
    constructor(baseURL: string, page?: Page | undefined);
    /**
     * Return the model for a path.
     *
     * @param path Path
     * @param type Path type
     * @returns Element metadata
     */
    getContentMetadata(path: string, type?: 'file' | 'directory'): Promise<Contents.IModel | null>;
    /**
     * Whether a directory exists or not
     *
     * @param dirPath Directory path
     * @returns Directory existence status
     */
    directoryExists(dirPath: string): Promise<boolean>;
    /**
     * Whether a file exists or not
     *
     * @param filePath File path
     * @returns File existence status
     */
    fileExists(filePath: string): Promise<boolean>;
    /**
     * Create a directory
     *
     * @param dirPath Directory path
     * @returns Action success status
     */
    createDirectory(dirPath: string): Promise<boolean>;
    /**
     * Upload a directory recursively in the Jupyter server
     *
     * @param sourcePath Local source path
     * @param destinationPath Server destination path
     * @returns Action success status
     */
    uploadDirectory(sourcePath: string, destinationPath?: string): Promise<boolean>;
    /**
     * Upload content as file to JupyterLab.
     *
     * Note: the destinationPath is the filepath on the server.
     *
     * @param content Content file to upload
     * @param format Content format
     * @param destinationPath Destination filepath
     * @returns Whether the action succeeded or not.
     */
    uploadContent(content: string, format: 'base64' | 'text' | 'json', destinationPath: string): Promise<boolean>;
    /**
     * Upload a file to JupyterLab.
     *
     * Note: the destinationPath is the filepath on the server.
     *
     * @param sourcePath Filepath to upload
     * @param destinationPath Destination filepath
     * @returns Whether the action succeeded or not.
     */
    uploadFile(sourcePath: string, destinationPath?: string): Promise<boolean>;
    /**
     * Delete a file
     *
     * @param filePath File path
     * @returns Action success status
     */
    deleteFile(filePath: string): Promise<boolean>;
    /**
     * Delete recursively a directory
     *
     * @param dirPath Directory path
     * @returns Action success status
     */
    deleteDirectory(dirPath: string): Promise<boolean>;
    /**
     * Rename a file
     *
     * @param oldName Old name
     * @param newName New name
     * @returns Action success status
     */
    renameFile(oldName: string, newName: string): Promise<boolean>;
    /**
     * Rename a directory
     *
     * @param oldName Old name
     * @param newName New name
     * @returns Action success status
     */
    renameDirectory(oldName: string, newName: string): Promise<boolean>;
    /**
     * Wait for a contents API response
     *
     * @param trigger Action to trigger while waiting
     */
    waitForAPIResponse(trigger?: () => Promise<void> | void): Promise<void>;
    protected _createDirectory(dirPath: string): Promise<boolean>;
    private _fetch;
}
