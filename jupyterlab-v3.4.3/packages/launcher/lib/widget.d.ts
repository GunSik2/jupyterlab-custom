import { ITranslator } from '@jupyterlab/translation';
import { VDomModel, VDomRenderer } from '@jupyterlab/ui-components';
import { IIterator } from '@lumino/algorithm';
import { IDisposable } from '@lumino/disposable';
import * as React from 'react';
import { ILauncher } from './tokens';
/**
 * LauncherModel keeps track of the path to working directory and has a list of
 * LauncherItems, which the Launcher will render.
 */
export declare class LauncherModel extends VDomModel implements ILauncher.IModel {
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
export declare class Launcher extends VDomRenderer<ILauncher.IModel> {
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
