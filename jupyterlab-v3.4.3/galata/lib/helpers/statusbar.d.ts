import { Page } from '@playwright/test';
import { MenuHelper } from './menu';
/**
 * Status Bar helpers
 */
export declare class StatusBarHelper {
    readonly page: Page;
    readonly menu: MenuHelper;
    constructor(page: Page, menu: MenuHelper);
    /**
     * Whether the status bar is visible or not
     *
     * @returns Visibility status
     */
    isVisible(): Promise<boolean>;
    /**
     * Show the status bar
     */
    show(): Promise<void>;
    /**
     * Hide the status bar
     */
    hide(): Promise<void>;
}
