import { Page } from '@playwright/test';
/**
 * Performance helper
 */
export declare class PerformanceHelper {
    readonly page: Page;
    constructor(page: Page);
    /**
     * Clear all measures and place a mark
     *
     * @param name Mark
     */
    startTimer(name?: string): Promise<void>;
    /**
     * Get the duration since the mark has been created
     *
     * @param startMark Mark
     * @param name Measure
     * @returns Measure value
     */
    endTimer(startMark?: string, name?: string): Promise<number>;
    /**
     * Measure the time to execute a function using web browser performance API.
     *
     * @param fn Function to measure
     * @returns The duration to execute the function
     */
    measure(fn: () => Promise<void>): Promise<number>;
}
