import { ILayoutRestorer, JupyterFrontEnd } from '@jupyterlab/application';
import { ICommandPalette, IPaletteItem } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITranslator } from '@jupyterlab/translation';
import { IDisposable } from '@lumino/disposable';
import { CommandPalette } from '@lumino/widgets';
/**
 * A thin wrapper around the `CommandPalette` class to conform with the
 * JupyterLab interface for the application-wide command palette.
 */
export declare class Palette implements ICommandPalette {
    /**
     * Create a palette instance.
     */
    constructor(palette: CommandPalette, translator?: ITranslator);
    /**
     * The placeholder text of the command palette's search input.
     */
    set placeholder(placeholder: string);
    get placeholder(): string;
    /**
     * Activate the command palette for user input.
     */
    activate(): void;
    /**
     * Add a command item to the command palette.
     *
     * @param options - The options for creating the command item.
     *
     * @returns A disposable that will remove the item from the palette.
     */
    addItem(options: IPaletteItem): IDisposable;
    protected translator: ITranslator;
    private _palette;
}
/**
 * A namespace for `Palette` statics.
 */
export declare namespace Palette {
    /**
     * Activate the command palette.
     */
    function activate(app: JupyterFrontEnd, translator: ITranslator, settingRegistry: ISettingRegistry | null): ICommandPalette;
    /**
     * Restore the command palette.
     */
    function restore(app: JupyterFrontEnd, restorer: ILayoutRestorer, translator: ITranslator): void;
}
