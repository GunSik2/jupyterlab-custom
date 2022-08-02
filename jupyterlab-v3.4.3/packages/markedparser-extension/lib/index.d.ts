/**
 * @packageDocumentation
 * @module markedparser-extension
 */
import { JupyterFrontEndPlugin } from '@jupyterlab/application';
import { IMarkdownParser } from '@jupyterlab/rendermime';
/**
 * The markdown parser plugin.
 */
declare const plugin: JupyterFrontEndPlugin<IMarkdownParser>;
/**
 * Export the plugin as default.
 */
export default plugin;
