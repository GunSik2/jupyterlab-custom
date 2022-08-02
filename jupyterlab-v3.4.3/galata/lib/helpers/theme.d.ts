import { Page } from '@playwright/test';
/**
 * Theme helpers
 */
export declare class ThemeHelper {
    readonly page: Page;
    constructor(page: Page);
    /**
     * Set JupyterLab theme to Dark
     */
    setDarkTheme(): Promise<void>;
    /**
     * Set JupyterLab theme to Light
     */
    setLightTheme(): Promise<void>;
    /**
     * Get JupyterLab theme name
     *
     * @returns Theme name
     */
    getTheme(): Promise<string>;
    /**
     * Set JupyterLab theme
     *
     * @param themeName Theme name
     */
    setTheme(themeName: string): Promise<void>;
}
