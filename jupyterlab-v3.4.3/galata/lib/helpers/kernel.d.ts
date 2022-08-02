import { Page } from '@playwright/test';
/**
 * Kernels and sessions helpers
 *
 * These helpers are using JupyterLab serviceManager in Javascript. There
 * are therefore not available if the page is not loaded.
 */
export declare class KernelHelper {
    readonly page: Page;
    constructor(page: Page);
    /**
     * Whether a sessions is running or not.
     *
     * @returns Running status
     */
    isAnyRunning(): Promise<boolean>;
    /**
     * Shutdown all sessions.
     */
    shutdownAll(): Promise<void>;
}
