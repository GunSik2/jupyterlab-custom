/**
 * @packageDocumentation
 * @module fileeditor-extension
 */
import { JupyterFrontEndPlugin } from '@jupyterlab/application';
export { Commands } from './commands';
/**
 * A plugin that provides a status item allowing the user to
 * switch tabs vs spaces and tab widths for text editors.
 */
export declare const tabSpaceStatus: JupyterFrontEndPlugin<void>;
/**
 * Export the plugins as default.
 */
declare const plugins: JupyterFrontEndPlugin<any>[];
export default plugins;
