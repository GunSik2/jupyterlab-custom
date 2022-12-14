import { JupyterFrontEnd } from '@jupyterlab/application';
import { VDomRenderer } from '@jupyterlab/apputils';
import { ServiceManager } from '@jupyterlab/services';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITranslator } from '@jupyterlab/translation';
import { Message } from '@lumino/messaging';
import * as React from 'react';
import { Action, IEntry, ListModel } from './model';
/**
 * Search bar VDOM component.
 */
export declare class SearchBar extends React.Component<SearchBar.IProperties, SearchBar.IState> {
    constructor(props: SearchBar.IProperties);
    /**
     * Render the list view using the virtual DOM.
     */
    render(): React.ReactNode;
    /**
     * Handler for search input changes.
     */
    handleChange: (e: React.FormEvent<HTMLElement>) => void;
}
/**
 * The namespace for search bar statics.
 */
export declare namespace SearchBar {
    /**
     * React properties for search bar component.
     */
    interface IProperties {
        /**
         * The placeholder string to use in the search bar input field when empty.
         */
        placeholder: string;
        disabled: boolean;
        settings: ISettingRegistry.ISettings;
    }
    /**
     * React state for search bar component.
     */
    interface IState {
        /**
         * The value of the search bar input field.
         */
        value: string;
    }
}
/**
 * The namespace for extension entry statics.
 */
export declare namespace ListEntry {
    interface IProperties {
        /**
         * The entry to visualize.
         */
        entry: IEntry;
        /**
         * The list mode to apply.
         */
        listMode: 'block' | 'allow' | 'default' | 'invalid';
        /**
         * The requested view type.
         */
        viewType: 'installed' | 'searchResult';
        /**
         * Callback to use for performing an action on the entry.
         */
        performAction: (action: Action, entry: IEntry) => void;
        /**
         * The language translator.
         */
        translator?: ITranslator;
    }
}
/**
 * List view widget for extensions
 */
export declare function ListView(props: ListView.IProperties): React.ReactElement<any>;
/**
 * The namespace for list view widget statics.
 */
export declare namespace ListView {
    interface IProperties {
        /**
         * The extension entries to display.
         */
        entries: ReadonlyArray<IEntry>;
        /**
         * The number of pages that can be viewed via pagination.
         */
        numPages: number;
        /**
         * The list mode to apply.
         */
        listMode: 'block' | 'allow' | 'default' | 'invalid';
        /**
         * The requested view type.
         */
        viewType: 'installed' | 'searchResult';
        /**
         * The language translator.
         */
        translator?: ITranslator;
        /**
         * The callback to use for changing the page
         */
        onPage: (page: number) => void;
        /**
         * Callback to use for performing an action on an entry.
         */
        performAction: (action: Action, entry: IEntry) => void;
    }
}
/**
 *
 */
export declare class CollapsibleSection extends React.Component<CollapsibleSection.IProperties, CollapsibleSection.IState> {
    constructor(props: CollapsibleSection.IProperties);
    /**
     * Render the collapsible section using the virtual DOM.
     */
    render(): React.ReactNode;
    /**
     * Handler for search input changes.
     */
    handleCollapse(): void;
    UNSAFE_componentWillReceiveProps(nextProps: CollapsibleSection.IProperties): void;
}
/**
 * The namespace for collapsible section statics.
 */
export declare namespace CollapsibleSection {
    /**
     * React properties for collapsible section component.
     */
    interface IProperties {
        /**
         * The header string for section list.
         */
        header: string;
        /**
         * Whether the view will be expanded or collapsed initially, defaults to open.
         */
        isOpen?: boolean;
        /**
         * Handle collapse event.
         */
        onCollapse?: (isOpen: boolean) => void;
        /**
         * Any additional elements to add to the header.
         */
        headerElements?: React.ReactNode;
        /**
         * If given, this will be displayed instead of the children.
         */
        errorMessage?: string | null;
        /**
         * If true, the section will be collapsed and will not respond
         * to open nor close actions.
         */
        disabled?: boolean;
        /**
         * If true, the section will be opened if not disabled.
         */
        forceOpen?: boolean;
    }
    /**
     * React state for collapsible section component.
     */
    interface IState {
        /**
         * Whether the section is expanded or collapsed.
         */
        isOpen: boolean;
    }
}
/**
 * The main view for the discovery extension.
 */
export declare class ExtensionView extends VDomRenderer<ListModel> {
    protected translator: ITranslator;
    private _trans;
    private _settings;
    private _forceOpen;
    constructor(app: JupyterFrontEnd, serviceManager: ServiceManager, settings: ISettingRegistry.ISettings, translator?: ITranslator);
    /**
     * The search input node.
     */
    get inputNode(): HTMLInputElement;
    /**
     * Render the extension view using the virtual DOM.
     */
    protected render(): React.ReactElement<any>[];
    /**
     * Callback handler for the user specifies a new search query.
     *
     * @param value The new query.
     */
    onSearch(value: string): void;
    /**
     * Callback handler for the user changes the page of the search result pagination.
     *
     * @param value The pagination page number.
     */
    onPage(value: number): void;
    /**
     * Callback handler for when the user wants to perform an action on an extension.
     *
     * @param action The action to perform.
     * @param entry The entry to perform the action on.
     */
    onAction(action: Action, entry: IEntry): Promise<void>;
    /**
     * Handle the DOM events for the extension manager search bar.
     *
     * @param event - The DOM event sent to the extension manager search bar.
     *
     * #### Notes
     * This method implements the DOM `EventListener` interface and is
     * called in response to events on the search bar's DOM node.
     * It should not be called directly by user code.
     */
    handleEvent(event: Event): void;
    /**
     * A message handler invoked on a `'before-attach'` message.
     */
    protected onBeforeAttach(msg: Message): void;
    /**
     * A message handler invoked on an `'after-detach'` message.
     */
    protected onAfterDetach(msg: Message): void;
    /**
     * A message handler invoked on an `'activate-request'` message.
     */
    protected onActivateRequest(msg: Message): void;
    /**
     * Toggle the focused modifier based on the input node focus state.
     */
    private _toggleFocused;
}
