import { VDomModel, VDomRenderer } from '@jupyterlab/apputils';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { ITranslator } from '@jupyterlab/translation';
import { Menu } from '@lumino/widgets';
import React from 'react';
/**
 * A namespace for TabSpaceComponent statics.
 */
declare namespace TabSpaceComponent {
    /**
     * The props for TabSpaceComponent.
     */
    interface IProps {
        /**
         * The number of spaces to insert on tab.
         */
        tabSpace: number;
        /**
         * Whether to use spaces or tabs.
         */
        isSpaces: boolean;
        /**
         * The application language translator.
         */
        translator?: ITranslator;
        /**
         * A click handler for the TabSpace component. By default
         * opens a menu allowing the user to select tabs vs spaces.
         */
        handleClick: () => void;
    }
}
/**
 * A pure functional component for rendering the TabSpace status.
 */
declare function TabSpaceComponent(props: TabSpaceComponent.IProps): React.ReactElement<TabSpaceComponent.IProps>;
/**
 * A VDomRenderer for a tabs vs. spaces status item.
 */
export declare class TabSpaceStatus extends VDomRenderer<TabSpaceStatus.Model> {
    /**
     * Create a new tab/space status item.
     */
    constructor(options: TabSpaceStatus.IOptions);
    /**
     * Render the TabSpace status item.
     */
    render(): React.ReactElement<TabSpaceComponent.IProps> | null;
    /**
     * Handle a click on the status item.
     */
    private _handleClick;
    private _menuClosed;
    protected translator: ITranslator;
    private _menu;
    private _popup;
}
/**
 * A namespace for TabSpace statics.
 */
export declare namespace TabSpaceStatus {
    /**
     * A VDomModel for the TabSpace status item.
     */
    class Model extends VDomModel {
        /**
         * The editor config from the settings system.
         */
        get config(): CodeEditor.IConfig | null;
        set config(val: CodeEditor.IConfig | null);
        private _triggerChange;
        private _config;
    }
    /**
     * Options for creating a TabSpace status item.
     */
    interface IOptions {
        /**
         * A menu to open when clicking on the status item. This should allow
         * the user to make a different selection about tabs/spaces.
         */
        menu: Menu;
        /**
         * Language translator.
         */
        translator?: ITranslator;
    }
}
export {};
