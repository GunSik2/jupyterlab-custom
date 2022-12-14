/**
 * @packageDocumentation
 * @module launcher
 */
import { VDomModel, VDomRenderer } from '@jupyterlab/apputils';
import { ITranslator } from '@jupyterlab/translation';
import { IIterator } from '@lumino/algorithm';
import { CommandRegistry } from '@lumino/commands';
import { ReadonlyJSONObject, Token } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';
import { Widget } from '@lumino/widgets';
import * as React from 'react';
/**
 * The launcher token.
 */
export declare const ILauncher: Token<ILauncher>;
/**
 * The launcher interface.
 */
export interface ILauncher {
    /**
     * Add a command item to the launcher, and trigger re-render event for parent
     * widget.
     *
     * @param options - The specification options for a launcher item.
     *
     * @returns A disposable that will remove the item from Launcher, and trigger
     * re-render event for parent widget.
     *
     */
    add(options: ILauncher.IItemOptions): IDisposable;
}
/**
 * LauncherModel keeps track of the path to working directory and has a list of
 * LauncherItems, which the Launcher will render.
 */
export declare class LauncherModel extends VDomModel implements ILauncher {
    /**
     * Add a command item to the launcher, and trigger re-render event for parent
     * widget.
     *
     * @param options - The specification options for a launcher item.
     *
     * @returns A disposable that will remove the item from Launcher, and trigger
     * re-render event for parent widget.
     *
     */
    add(options: ILauncher.IItemOptions): IDisposable;
    /**
     * Return an iterator of launcher items.
     */
    items(): IIterator<ILauncher.IItemOptions>;
    protected itemsList: ILauncher.IItemOptions[];
}
/**
 * A virtual-DOM-based widget for the Launcher.
 */
export declare class Launcher extends VDomRenderer<LauncherModel> {
    /**
     * Construct a new launcher widget.
     */
    constructor(options: ILauncher.IOptions);
    /**
     * The cwd of the launcher.
     */
    get cwd(): string;
    set cwd(value: string);
    /**
     * Whether there is a pending item being launched.
     */
    get pending(): boolean;
    set pending(value: boolean);
    /**
     * Render the launcher to virtual DOM nodes.
     */
    protected render(): React.ReactElement<any> | null;
    protected translator: ITranslator;
    private _trans;
    private _commands;
    private _callback;
    private _pending;
    private _cwd;
}
/**
 * The namespace for `ILauncher` class statics.
 */
export declare namespace ILauncher {
    /**
     * The options used to create a Launcher.
     */
    interface IOptions {
        /**
         * The model of the launcher.
         */
        model: LauncherModel;
        /**
         * The cwd of the launcher.
         */
        cwd: string;
        /**
         * The command registry used by the launcher.
         */
        commands: CommandRegistry;
        /**
         * The application language translation.
         */
        translator?: ITranslator;
        /**
         * The callback used when an item is launched.
         */
        callback: (widget: Widget) => void;
    }
    /**
     * The options used to create a launcher item.
     */
    interface IItemOptions {
        /**
         * The command ID for the launcher item.
         *
         * #### Notes
         * If the command's `execute` method returns a `Widget` or
         * a promise that resolves with a `Widget`, then that widget will
         * replace the launcher in the same location of the application
         * shell. If the `execute` method does something else
         * (i.e., create a modal dialog), then the launcher will not be
         * disposed.
         */
        command: string;
        /**
         * The arguments given to the command for
         * creating the launcher item.
         *
         * ### Notes
         * The launcher will also add the current working
         * directory of the filebrowser in the `cwd` field
         * of the args, which a command may use to create
         * the activity with respect to the right directory.
         */
        args?: ReadonlyJSONObject;
        /**
         * The category for the launcher item.
         *
         * The default value is an empty string.
         */
        category?: string;
        /**
         * The rank for the launcher item.
         *
         * The rank is used when ordering launcher items for display. After grouping
         * into categories, items are sorted in the following order:
         *   1. Rank (lower is better)
         *   3. Display Name (locale order)
         *
         * The default rank is `Infinity`.
         */
        rank?: number;
        /**
         * For items that have a kernel associated with them, the URL of the kernel
         * icon.
         *
         * This is not a CSS class, but the URL that points to the icon in the kernel
         * spec.
         */
        kernelIconUrl?: string;
        /**
         * Metadata about the item.  This can be used by the launcher to
         * affect how the item is displayed.
         */
        metadata?: ReadonlyJSONObject;
    }
}
