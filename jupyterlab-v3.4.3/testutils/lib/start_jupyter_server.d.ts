import { JSONObject } from '@lumino/coreutils';
/**
 * A Jupyter Server that runs as a child process.
 *
 * ### Notes
 * There can only be one running server at a time, since
 * PageConfig is global.  Any classes that use `ServerConnection.ISettings`
 * such as `ServiceManager` should be instantiated after the server
 * has fully started so they pick up the right `PageConfig`.
 *
 * #### Example
 * ```typescript
 * const server = new JupyterServer();
 *
 * beforeAll(async () => {
 *   await server.start();
 * });
 *
 * afterAll(async () => {
 *  await server.shutdown();
 * });
 * ```
 *
 */
export declare class JupyterServer {
    /**
     * Start the server.
     *
     * @returns A promise that resolves with the url of the server
     *
     * @throws Error if another server is still running.
     */
    start(options?: Partial<JupyterServer.IOptions>): Promise<string>;
    /**
     * Shut down the server, waiting for it to exit gracefully.
     */
    shutdown(): Promise<void>;
}
/**
 * A namespace for JupyterServer static values.
 */
export declare namespace JupyterServer {
    /**
     * Options used to create a new JupyterServer instance.
     */
    interface IOptions {
        /**
         * Additional Page Config values.
         */
        pageConfig: {
            [name: string]: string;
        };
        /**
         * Additional traitlet config data.
         */
        configData: JSONObject;
        /**
         * Map of additional kernelspec names to kernel.json dictionaries
         */
        additionalKernelSpecs: JSONObject;
    }
}
