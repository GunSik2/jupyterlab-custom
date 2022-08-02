"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentsHelper = void 0;
const coreutils_1 = require("@jupyterlab/coreutils");
const node_fetch_1 = __importDefault(require("node-fetch"));
const path = __importStar(require("path"));
const tokens_1 = require("./inpage/tokens");
const Utils = __importStar(require("./utils"));
/**
 * Helper class to interact with contents server API
 *
 * Those helpers are directly requesting the Jupyter server to
 * carry contents tasks; except rename operations if the page model
 * is provided.
 */
class ContentsHelper {
    /**
     * Construct a new instance of ContentsHelper
     *
     * @param baseURL Server base URL
     * @param page Playwright page model object
     */
    constructor(baseURL, page) {
        this.baseURL = baseURL;
        this.page = page;
    }
    /**
     * Return the model for a path.
     *
     * @param path Path
     * @param type Path type
     * @returns Element metadata
     */
    async getContentMetadata(path, type = 'file') {
        const baseUrl = this.page ? await Utils.getBaseUrl(this.page) : '/';
        const token = this.page ? await Utils.getToken(this.page) : '';
        const apiUrl = `${this.baseURL}${baseUrl}api/contents`;
        const data = {
            type,
            // Get the content only for directory
            content: type === 'directory' ? 1 : 0
        };
        const request = {
            method: 'GET'
        };
        if (token) {
            request.headers = { Authorization: `Token ${token}` };
        }
        let response = null;
        try {
            response = await node_fetch_1.default(`${apiUrl}/${path}` + coreutils_1.URLExt.objectToQueryString(data), request);
        }
        catch (error) {
            console.error(`Fail to get content metadata for ${path}`, error);
        }
        const succeeded = (response === null || response === void 0 ? void 0 : response.status) === 200;
        if (succeeded) {
            return response.json();
        }
        return null;
    }
    /**
     * Whether a directory exists or not
     *
     * @param dirPath Directory path
     * @returns Directory existence status
     */
    async directoryExists(dirPath) {
        const content = await this.getContentMetadata(dirPath, 'directory');
        return (content === null || content === void 0 ? void 0 : content.type) === 'directory';
    }
    /**
     * Whether a file exists or not
     *
     * @param filePath File path
     * @returns File existence status
     */
    async fileExists(filePath) {
        const content = await this.getContentMetadata(filePath);
        return (content === null || content === void 0 ? void 0 : content.type) === 'notebook' || (content === null || content === void 0 ? void 0 : content.type) === 'file';
    }
    /**
     * Create a directory
     *
     * @param dirPath Directory path
     * @returns Action success status
     */
    async createDirectory(dirPath) {
        const directories = dirPath.split('/');
        let path = '';
        for (const directory of directories) {
            if (directory.trim() === '') {
                continue;
            }
            if (path !== '') {
                path += '/';
            }
            path += directory;
            await this._createDirectory(path);
        }
        return true;
    }
    /**
     * Upload a directory recursively in the Jupyter server
     *
     * @param sourcePath Local source path
     * @param destinationPath Server destination path
     * @returns Action success status
     */
    async uploadDirectory(sourcePath, destinationPath) {
        const pos = sourcePath.lastIndexOf('/');
        const sourceDirName = sourcePath.substring(pos + 1);
        destinationPath = destinationPath !== null && destinationPath !== void 0 ? destinationPath : sourceDirName;
        const files = Utils.getFilesInDirectory(sourcePath);
        for (const file of files) {
            const relativePath = file.substring(sourcePath.length + 1);
            await this.uploadFile(file, `${destinationPath}/${relativePath}`);
        }
        return true;
    }
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
    async uploadContent(content, format, destinationPath) {
        const pos = destinationPath.lastIndexOf('/');
        if (pos !== -1) {
            const destDir = destinationPath === null || destinationPath === void 0 ? void 0 : destinationPath.substring(0, pos);
            if (destDir && !(await this.directoryExists(destDir))) {
                await this.createDirectory(destDir);
            }
        }
        const data = JSON.stringify({
            content,
            format,
            type: 'file'
        });
        let response = null;
        try {
            response = await this._fetch(destinationPath, {
                method: 'PUT',
                body: data
            });
        }
        catch (error) {
            console.error(`Failed to upload content to server ${destinationPath}`, error);
        }
        const succeeded = (response === null || response === void 0 ? void 0 : response.status) === 201;
        if (succeeded) {
            return await this.fileExists(destinationPath);
        }
        return false;
    }
    /**
     * Upload a file to JupyterLab.
     *
     * Note: the destinationPath is the filepath on the server.
     *
     * @param sourcePath Filepath to upload
     * @param destinationPath Destination filepath
     * @returns Whether the action succeeded or not.
     */
    async uploadFile(sourcePath, destinationPath) {
        return this.uploadContent(Utils.base64EncodeFile(sourcePath), 'base64', destinationPath !== null && destinationPath !== void 0 ? destinationPath : path.basename(sourcePath));
    }
    /**
     * Delete a file
     *
     * @param filePath File path
     * @returns Action success status
     */
    async deleteFile(filePath) {
        const fileName = filePath;
        let response = null;
        try {
            response = await this._fetch(fileName, {
                method: 'DELETE'
            });
        }
        catch (error) {
            console.error(`Failed to delete file ${filePath}`, error);
        }
        const succeeded = (response === null || response === void 0 ? void 0 : response.status) === 204;
        if (succeeded) {
            return !(await this.fileExists(fileName));
        }
        return false;
    }
    /**
     * Delete recursively a directory
     *
     * @param dirPath Directory path
     * @returns Action success status
     */
    async deleteDirectory(dirPath) {
        const dirContent = await this.getContentMetadata(dirPath, 'directory');
        if (!(dirContent && dirContent.type === 'directory')) {
            return false;
        }
        let anyFailed = false;
        // delete directory contents first
        for (const item of dirContent.content) {
            if (item.type === 'directory') {
                if (!(await this.deleteDirectory(item.path))) {
                    anyFailed = true;
                }
            }
            else {
                if (!(await this.deleteFile(item.path))) {
                    anyFailed = true;
                }
            }
        }
        if (!(await this.deleteFile(dirPath))) {
            anyFailed = true;
        }
        return !anyFailed;
    }
    /**
     * Rename a file
     *
     * @param oldName Old name
     * @param newName New name
     * @returns Action success status
     */
    async renameFile(oldName, newName) {
        if (this.page) {
            // Rename through REST API does not propagate to opened widgets
            // => Use galata in-page if page is available
            return await this.page.evaluate(async ({ pluginId, oldName, newName }) => {
                const docManager = (await window.galataip.getPlugin(pluginId));
                const result = await docManager.rename(oldName, newName);
                return result !== null;
            }, {
                pluginId: tokens_1.PLUGIN_ID_DOC_MANAGER,
                oldName: oldName,
                newName: newName
            });
        }
        let response = null;
        try {
            response = await this._fetch(oldName, {
                method: 'PATCH',
                body: JSON.stringify({ path: newName })
            });
        }
        catch (error) {
            console.error(`Failed to rename file ${oldName} to ${newName}`, error);
        }
        const succeeded = (response === null || response === void 0 ? void 0 : response.status) === 200;
        if (succeeded) {
            return await this.fileExists(newName);
        }
        return false;
    }
    /**
     * Rename a directory
     *
     * @param oldName Old name
     * @param newName New name
     * @returns Action success status
     */
    async renameDirectory(oldName, newName) {
        return await this.renameFile(oldName, newName);
    }
    /**
     * Wait for a contents API response
     *
     * @param trigger Action to trigger while waiting
     */
    async waitForAPIResponse(trigger) {
        if (!this.page) {
            return Promise.reject('No page available.');
        }
        await Promise.all([
            this.page.waitForResponse(response => response.url().includes('api/contents')),
            Promise.resolve(trigger === null || trigger === void 0 ? void 0 : trigger.call(this))
        ]);
    }
    async _createDirectory(dirPath) {
        const body = JSON.stringify({
            format: 'json',
            type: 'directory'
        });
        let response = null;
        try {
            response = await this._fetch(dirPath, {
                method: 'PUT',
                body
            });
        }
        catch (error) {
            console.error(`Failed to create directory ${dirPath}`, error);
        }
        return (response === null || response === void 0 ? void 0 : response.status) === 201;
    }
    async _fetch(path, request = { method: 'GET' }) {
        const baseUrl = this.page ? await Utils.getBaseUrl(this.page) : '/';
        const token = this.page ? await Utils.getToken(this.page) : '';
        const url = coreutils_1.URLExt.join(this.baseURL, baseUrl, 'api/contents', path);
        if (token) {
            request.headers = { Authorization: `Token ${token}` };
        }
        let response = null;
        response = await node_fetch_1.default(url, request);
        return response;
    }
}
exports.ContentsHelper = ContentsHelper;
//# sourceMappingURL=contents.js.map