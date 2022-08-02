import { ElementHandle, Page } from '@playwright/test';
/**
 * Main menu helpers
 */
export declare class MenuHelper {
    readonly page: Page;
    constructor(page: Page);
    /**
     * Close all menus
     */
    closeAll(): Promise<void>;
    /**
     * Get the handle on a menu from its label.
     *
     * @param label Menu label
     * @returns Handle to the menu or null
     */
    getMenuBarItem(label: string): Promise<ElementHandle<Element> | null>;
    /**
     * Get the handle on a menu item from its path.
     *
     * The separator used is '>'; e.g. to look for the new Notebook item 'File>New>Notebook'.
     *
     * @param path Menu item path
     * @returns Handle to the menu item
     */
    getMenuItem(path: string): Promise<ElementHandle<Element> | null>;
    /**
     * Get a menu item handle from its label.
     *
     * @param parentMenu Menu handle
     * @param label Item label
     * @returns Handle to the menu item
     */
    getMenuItemInMenu(parentMenu: ElementHandle<Element>, label: string): Promise<ElementHandle<Element> | null>;
    /**
     * Whether any menus are opened or not
     *
     * @returns Opened menus status
     */
    isAnyOpen(): Promise<boolean>;
    /**
     * Whether a menu is opened or not
     *
     * @param path Menu path
     * @returns Opened menu status
     */
    isOpen(path: string): Promise<boolean>;
    /**
     * Open a menu from its path
     *
     * @param path Menu path
     * @returns Handle to the opened menu
     */
    open(path: string): Promise<ElementHandle<Element> | null>;
    /**
     * Get the handle to the last opened menu
     *
     * @returns Handle to the opened menu
     */
    getOpenMenu(): Promise<ElementHandle<Element> | null>;
    /**
     * Click on a menu item from its path
     *
     * @param path Menu item path
     */
    clickMenuItem(path: string): Promise<void>;
}
