import { ElementHandle, Page } from '@playwright/test';
import { MenuHelper } from './menu';
import { galata } from '../galata';
/**
 * Sidebar helpers
 */
export declare class SidebarHelper {
    readonly page: Page;
    readonly menu: MenuHelper;
    constructor(page: Page, menu: MenuHelper);
    /**
     * Whether a sidebar is opened or not
     *
     * @param side Sidebar side
     * @returns Opened status
     */
    isOpen: (side?: galata.SidebarPosition) => Promise<boolean>;
    /**
     * Whether a given tab is opened or not
     *
     * @param id Tab id
     * @returns Tab opened status
     */
    isTabOpen(id: galata.SidebarTabId): Promise<boolean>;
    /**
     * Get the position of a given tab
     *
     * @param id Tab id
     * @returns Tab position
     */
    getTabPosition: (id: galata.SidebarTabId) => Promise<galata.SidebarPosition | null>;
    /**
     * Move a given tab to left side
     *
     * @param id Tab id
     */
    moveTabToLeft(id: galata.SidebarTabId): Promise<void>;
    /**
     * Move a given tab to the right side
     *
     * @param id Tab id
     */
    moveTabToRight(id: galata.SidebarTabId): Promise<void>;
    /**
     * Set the position of a given tab
     *
     * @param id Tab id
     * @param side Sidebar side
     */
    setTabPosition(id: galata.SidebarTabId, side: galata.SidebarPosition): Promise<void>;
    /**
     * Toggle a given tab position
     *
     * @param id Tab id
     */
    toggleTabPosition(id: galata.SidebarTabId): Promise<void>;
    /**
     * Move all tabs to the left side
     */
    moveAllTabsToLeft(): Promise<void>;
    /**
     * Get the handle on a given tab
     *
     * @param id Tab id
     * @returns Tab handle
     */
    getTab(id: galata.SidebarTabId): Promise<ElementHandle<Element> | null>;
    /**
     * Open a given tab
     *
     * @param id Tab id
     */
    openTab(id: galata.SidebarTabId): Promise<void>;
    /**
     * Get the handle on a sidebar content panel
     *
     * @param side Position
     * @returns Panel handle
     */
    getContentPanel(side?: galata.SidebarPosition): Promise<ElementHandle<Element> | null>;
    /**
     * Open a given sidebar
     *
     * @param side Position
     */
    open(side?: galata.SidebarPosition): Promise<void>;
    /**
     * Close a given sidebar
     *
     * @param side Position
     */
    close(side?: galata.SidebarPosition): Promise<void>;
    /**
     * Get the selector for a given tab
     *
     * @param id Tab id
     * @returns Selector
     */
    buildTabSelector(id: galata.SidebarTabId): string;
    protected _waitForTabActivate(tab: ElementHandle<Element>, activate?: boolean): Promise<void>;
}
