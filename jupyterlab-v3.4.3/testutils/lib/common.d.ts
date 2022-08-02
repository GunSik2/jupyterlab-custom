import { ServiceManager, Session } from '@jupyterlab/services';
import { SessionContext } from '@jupyterlab/apputils';
import { ISignal } from '@lumino/signaling';
import { Context, DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel } from '@jupyterlab/notebook';
/**
 * Test a single emission from a signal.
 *
 * @param signal - The signal we are listening to.
 * @param find - An optional function to determine which emission to test,
 * defaulting to the first emission.
 * @param test - An optional function which contains the tests for the emission, and should throw an error if the tests fail.
 * @param value - An optional value that the promise resolves to if the test is
 * successful.
 *
 * @returns a promise that rejects if the function throws an error (e.g., if an
 * expect test doesn't pass), and resolves otherwise.
 *
 * #### Notes
 * The first emission for which the find function returns true will be tested in
 * the test function. If the find function is not given, the first signal
 * emission will be tested.
 *
 * You can test to see if any signal comes which matches a criteria by just
 * giving a find function. You can test the very first signal by just giving a
 * test function. And you can test the first signal matching the find criteria
 * by giving both.
 *
 * The reason this function is asynchronous is so that the thing causing the
 * signal emission (such as a websocket message) can be asynchronous.
 */
export declare function testEmission<T, U, V>(signal: ISignal<T, U>, options?: {
    find?: (a: T, b: U) => boolean;
    test?: (a: T, b: U) => void;
    value?: V;
}): Promise<V | undefined>;
/**
 * Expect a failure on a promise with the given message.
 */
export declare function expectFailure(promise: Promise<any>, message?: string): Promise<void>;
/**
 * Do something in the future ensuring total ordering with respect to promises.
 */
export declare function doLater(cb: () => void): Promise<void>;
/**
 * Convert a signal into an array of promises.
 *
 * @param signal - The signal we are listening to.
 * @param numberValues - The number of values to store.
 *
 * @returns a Promise that resolves with an array of `(sender, args)` pairs.
 */
export declare function signalToPromises<T, U>(signal: ISignal<T, U>, numberValues: number): Promise<[T, U]>[];
/**
 * Convert a signal into a promise for the first emitted value.
 *
 * @param signal - The signal we are listening to.
 *
 * @returns a Promise that resolves with a `(sender, args)` pair.
 */
export declare function signalToPromise<T, U>(signal: ISignal<T, U>): Promise<[T, U]>;
/**
 * Test to see if a promise is fulfilled.
 *
 * @param delay - optional delay in milliseconds before checking
 * @returns true if the promise is fulfilled (either resolved or rejected), and
 * false if the promise is still pending.
 */
export declare function isFulfilled<T>(p: PromiseLike<T>, delay?: number): Promise<boolean>;
/**
 * Convert a requestAnimationFrame into a Promise.
 */
export declare function framePromise(): Promise<void>;
/**
 * Return a promise that resolves in the given milliseconds with the given value.
 */
export declare function sleep(milliseconds?: number): Promise<void>;
export declare function sleep<T>(milliseconds: number, value: T): Promise<T>;
/**
 * Create a client session object.
 */
export declare function createSessionContext(options?: Partial<SessionContext.IOptions>): Promise<SessionContext>;
/**
 * Create a session and return a session connection.
 */
export declare function createSession(options: Session.ISessionOptions): Promise<Session.ISessionConnection>;
/**
 * Create a context for a file.
 */
export declare function createFileContext(path?: string, manager?: ServiceManager.IManager): Context<DocumentRegistry.IModel>;
export declare function createFileContextWithKernel(path?: string, manager?: ServiceManager.IManager): Promise<Context<DocumentRegistry.ICodeModel>>;
/**
 * Create and initialize context for a notebook.
 */
export declare function initNotebookContext(options?: {
    path?: string;
    manager?: ServiceManager.IManager;
    startKernel?: boolean;
}): Promise<Context<INotebookModel>>;
/**
 * Wait for a dialog to be attached to an element.
 */
export declare function waitForDialog(host?: HTMLElement, timeout?: number): Promise<void>;
/**
 * Accept a dialog after it is attached by accepting the default button.
 */
export declare function acceptDialog(host?: HTMLElement, timeout?: number): Promise<void>;
/**
 * Click on the warning button in a dialog after it is attached
 */
export declare function dangerDialog(host?: HTMLElement, timeout?: number): Promise<void>;
/**
 * Dismiss a dialog after it is attached.
 *
 * #### Notes
 * This promise will always resolve successfully.
 */
export declare function dismissDialog(host?: HTMLElement, timeout?: number): Promise<void>;
