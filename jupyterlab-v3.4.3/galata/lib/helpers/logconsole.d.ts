import { Page } from '@playwright/test';
/**
 * LogConsole helpers
 */
export declare class LogConsoleHelper {
    readonly page: Page;
    constructor(page: Page);
    /**
     * Get the number of log messages in the log console panel.
     *
     * @returns Number of log messages
     */
    logCount(): Promise<number>;
}
