/**
 * @packageDocumentation
 * @module running-extension
 */
import { JupyterFrontEndPlugin } from '@jupyterlab/application';
import { IRunningSessionManagers } from '@jupyterlab/running';
/**
 * The default running sessions extension.
 */
declare const plugin: JupyterFrontEndPlugin<IRunningSessionManagers>;
/**
 * Export the plugin as default.
 */
export default plugin;
