import { Session, TerminalAPI } from '@jupyterlab/services';
import { Page, PlaywrightTestArgs, PlaywrightTestOptions, PlaywrightWorkerArgs, PlaywrightWorkerOptions, TestType } from '@playwright/test';
import { IJupyterLabPage, IJupyterLabPageFixture } from './jupyterlabpage';
/**
 * Galata test arguments
 */
export interface IGalataTestArgs extends PlaywrightTestArgs {
    /**
     * JupyterLab test page.
     *
     * It brings the following feature on top of Playwright Page object:
     * - Goto to JupyterLab URL and wait for the application to be ready
     * - Helpers for JupyterLab
     * - Settings mock-up
     * - State mock-up
     * - Track sessions and terminals opened during a test to close them at the end
     *
     * Note: If autoGoto is true, the filebrowser will be set inside tmpPath.
     * Nothing is preventing you to navigate to some other folders.
     * So you must avoid creating files outside that directory to avoid
     * coupling effects between tests.
     *
     */
    page: IJupyterLabPageFixture;
}
/**
 * Galata test configuration
 */
export declare type GalataOptions = {
    /**
     * Application URL path fragment.
     *
     * Default: /lab
     */
    appPath: string;
    /**
     * Whether to go to JupyterLab page within the fixture or not.
     *
     * Default: true
     */
    autoGoto: boolean;
    /**
     * Galata can keep the uploaded and created files in ``tmpPath`` on
     * the server root for debugging purpose. By default the files are
     * always deleted
     *
     * - 'off' - ``tmpPath`` is deleted after each tests
     * - 'on' - ``tmpPath`` is never deleted
     * - 'only-on-failure' - ``tmpPath`` is deleted except if a test failed or timed out.
     */
    serverFiles: 'on' | 'off' | 'only-on-failure';
    /**
     * Mock JupyterLab state in-memory or not.
     *
     * Possible values are:
     * - true (default): JupyterLab state will be mocked on a per test basis
     * - false: JupyterLab state won't be mocked (Be careful it will write state in local files)
     * - Record<string, unknown>: Initial JupyterLab data state - Mapping (state key, value).
     *
     * By default the state is stored in-memory.
     */
    mockState: boolean | Record<string, unknown>;
    /**
     * Mock JupyterLab settings in-memory or not.
     *
     * Possible values are:
     * - true: JupyterLab settings will be mocked on a per test basis
     * - false: JupyterLab settings won't be mocked (Be careful it will read & write settings local files)
     * - Record<string, unknown>: Mapping {pluginId: settings} that will be default user settings
     *
     * The default value is `galata.DEFAULT_SETTINGS`
     *
     * By default the settings are stored in-memory. However the
     * they are still initialized with the hard drive values.
     */
    mockSettings: boolean | Record<string, unknown>;
    /**
     * Sessions created during the test.
     *
     * Possible values are:
     * - null: The sessions API won't be mocked
     * - Map<string, Session.IModel>: The sessions created during a test.
     *
     * By default the sessions created during a test will be tracked and disposed at the end.
     */
    sessions: Map<string, Session.IModel> | null;
    /**
     * Terminals created during the test.
     *
     * Possible values are:
     * - null: The Terminals API won't be mocked
     * - Map<string, TerminalsAPI.IModel>: The Terminals created during a test.
     *
     * By default the Terminals created during a test will be tracked and disposed at the end.
     */
    terminals: Map<string, TerminalAPI.IModel> | null;
    /**
     * Unique test temporary path created on the server.
     *
     * Note: if you override this string, you will need to take care of creating the
     * folder and cleaning it.
     */
    tmpPath: string;
    /**
     * Wait for the application page to be ready
     *
     * @param page Playwright Page model
     * @param helpers JupyterLab helpers
     */
    waitForApplication: (page: Page, helpers: IJupyterLabPage) => Promise<void>;
};
/**
 * JupyterLab customized test.
 */
export declare const test: TestType<IGalataTestArgs & GalataOptions & PlaywrightTestOptions, PlaywrightWorkerArgs & PlaywrightWorkerOptions>;
