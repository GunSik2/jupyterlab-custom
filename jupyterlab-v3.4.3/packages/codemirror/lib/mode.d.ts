import { JSONValue } from '@lumino/coreutils';
import 'codemirror/addon/runmode/runmode';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/css/css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/jsx/jsx';
import 'codemirror/mode/julia/julia';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/meta';
import 'codemirror/mode/r/r';
import 'codemirror/mode/shell/shell';
import 'codemirror/mode/sql/sql';
import './codemirror-ipython';
import './codemirror-ipythongfm';
/**
 * The namespace for CodeMirror Mode functionality.
 */
export declare namespace Mode {
    /**
     * The interface of a codemirror modeInfo spec.
     */
    interface ISpec {
        ext?: string[];
        name?: string;
        mode: string;
        mime: string;
    }
    /**
     * The interface of a codemirror mode spec.
     */
    interface IMode {
        name: string;
        [key: string]: JSONValue;
    }
    /**
     * The interface for a codemirror spec resolver.
     */
    interface ISpecLoader {
        /**
         * A function which returns whether it was successfully loaded
         */
        (spec: ISpec): Promise<boolean>;
    }
    /**
     * Get the raw list of available modes specs.
     */
    function getModeInfo(): ISpec[];
    /**
     * Running a CodeMirror mode outside of an editor.
     */
    function run(code: string, mode: string | ISpec, el: HTMLElement): void;
    /**
     * Ensure a codemirror mode is available by name or Codemirror spec.
     *
     * @param mode - The mode to ensure.  If it is a string, uses [findBest]
     *   to get the appropriate spec.
     *
     * @returns A promise that resolves when the mode is available.
     */
    function ensure(mode: string | ISpec): Promise<ISpec | null>;
    function addSpecLoader(loader: ISpecLoader, rank: number): void;
    /**
     * Find a codemirror mode by name or CodeMirror spec.
     */
    function findBest(mode: string | ISpec): ISpec;
    /**
     * Find a codemirror mode by MIME.
     */
    function findByMIME(mime: string): ISpec;
    /**
     * Find a codemirror mode by name.
     */
    function findByName(name: string): ISpec;
    /**
     * Find a codemirror mode by filename.
     */
    function findByFileName(name: string): ISpec;
    /**
     * Find a codemirror mode by extension.
     */
    function findByExtension(ext: string | string[]): ISpec | null;
}
