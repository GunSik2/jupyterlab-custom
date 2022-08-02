import { ElementHandle, Page } from '@playwright/test';
/**
 * Activity helper
 */
export declare class ActivityHelper {
    readonly page: Page;
    constructor(page: Page);
    /**
     * JupyterLab launcher selector
     */
    get launcherSelector(): string;
    /**
     * Close all widgets in the main area
     */
    closeAll(): Promise<void>;
    /**
     * Whether a tab is active or not
     *
     * @param name Activity name
     * @returns Active status
     */
    isTabActive(name: string): Promise<boolean>;
    /**
     * Get a handle on a tab
     *
     * @param name Activity name
     * @returns Handle on the tab or null if the tab is not found
     */
    getTab(name?: string): Promise<ElementHandle<Element> | null>;
    /**
     * Get a handle on a panel
     *
     * @param name Activity name
     * @returns Handle on the tab or null if the tab is not found
     */
    getPanel(name?: string): Promise<ElementHandle<Element> | null>;
    /**
     * Activate a tab is active
     *
     * @param name Activity name
     * @returns Whether the action is successful
     */
    activateTab(name: string): Promise<boolean>;
}
