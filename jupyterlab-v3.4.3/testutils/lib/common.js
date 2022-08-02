"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dismissDialog = exports.dangerDialog = exports.acceptDialog = exports.waitForDialog = exports.initNotebookContext = exports.createFileContextWithKernel = exports.createFileContext = exports.createSession = exports.createSessionContext = exports.sleep = exports.framePromise = exports.isFulfilled = exports.signalToPromise = exports.signalToPromises = exports.doLater = exports.expectFailure = exports.testEmission = void 0;
const simulate_event_1 = require("simulate-event");
const services_1 = require("@jupyterlab/services");
const apputils_1 = require("@jupyterlab/apputils");
const coreutils_1 = require("@lumino/coreutils");
const signaling_1 = require("@lumino/signaling");
const docregistry_1 = require("@jupyterlab/docregistry");
const notebook_1 = require("@jupyterlab/notebook");
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
async function testEmission(signal, options = {}) {
    const done = new coreutils_1.PromiseDelegate();
    const object = {};
    signal.connect((sender, args) => {
        var _a, _b, _c;
        if ((_b = (_a = options.find) === null || _a === void 0 ? void 0 : _a.call(options, sender, args)) !== null && _b !== void 0 ? _b : true) {
            try {
                signaling_1.Signal.disconnectReceiver(object);
                if (options.test) {
                    options.test(sender, args);
                }
            }
            catch (e) {
                done.reject(e);
            }
            done.resolve((_c = options.value) !== null && _c !== void 0 ? _c : undefined);
        }
    }, object);
    return done.promise;
}
exports.testEmission = testEmission;
/**
 * Expect a failure on a promise with the given message.
 */
async function expectFailure(promise, message) {
    let called = false;
    try {
        await promise;
        called = true;
    }
    catch (err) {
        if (message && err.message.indexOf(message) === -1) {
            throw Error(`Error "${message}" not in: "${err.message}"`);
        }
    }
    if (called) {
        throw Error(`Failure was not triggered, message was: ${message}`);
    }
}
exports.expectFailure = expectFailure;
/**
 * Do something in the future ensuring total ordering with respect to promises.
 */
async function doLater(cb) {
    await Promise.resolve(void 0);
    cb();
}
exports.doLater = doLater;
/**
 * Convert a signal into an array of promises.
 *
 * @param signal - The signal we are listening to.
 * @param numberValues - The number of values to store.
 *
 * @returns a Promise that resolves with an array of `(sender, args)` pairs.
 */
function signalToPromises(signal, numberValues) {
    const values = new Array(numberValues);
    const resolvers = new Array(numberValues);
    for (let i = 0; i < numberValues; i++) {
        values[i] = new Promise(resolve => {
            resolvers[i] = resolve;
        });
    }
    let current = 0;
    function slot(sender, args) {
        resolvers[current++]([sender, args]);
        if (current === numberValues) {
            cleanup();
        }
    }
    signal.connect(slot);
    function cleanup() {
        signal.disconnect(slot);
    }
    return values;
}
exports.signalToPromises = signalToPromises;
/**
 * Convert a signal into a promise for the first emitted value.
 *
 * @param signal - The signal we are listening to.
 *
 * @returns a Promise that resolves with a `(sender, args)` pair.
 */
function signalToPromise(signal) {
    return signalToPromises(signal, 1)[0];
}
exports.signalToPromise = signalToPromise;
/**
 * Test to see if a promise is fulfilled.
 *
 * @param delay - optional delay in milliseconds before checking
 * @returns true if the promise is fulfilled (either resolved or rejected), and
 * false if the promise is still pending.
 */
async function isFulfilled(p, delay = 0) {
    const x = Object.create(null);
    let race;
    if (delay > 0) {
        race = sleep(delay, x);
    }
    else {
        race = x;
    }
    const result = await Promise.race([p, race]).catch(() => false);
    return result !== x;
}
exports.isFulfilled = isFulfilled;
/**
 * Convert a requestAnimationFrame into a Promise.
 */
function framePromise() {
    const done = new coreutils_1.PromiseDelegate();
    requestAnimationFrame(() => {
        done.resolve(void 0);
    });
    return done.promise;
}
exports.framePromise = framePromise;
function sleep(milliseconds = 0, value) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(value);
        }, milliseconds);
    });
}
exports.sleep = sleep;
/**
 * Create a client session object.
 */
async function createSessionContext(options = {}) {
    var _a, _b, _c, _d, _e;
    const manager = (_a = options.sessionManager) !== null && _a !== void 0 ? _a : Private.getManager().sessions;
    const specsManager = (_b = options.specsManager) !== null && _b !== void 0 ? _b : Private.getManager().kernelspecs;
    await Promise.all([manager.ready, specsManager.ready]);
    return new apputils_1.SessionContext({
        sessionManager: manager,
        specsManager,
        path: (_c = options.path) !== null && _c !== void 0 ? _c : coreutils_1.UUID.uuid4(),
        name: options.name,
        type: options.type,
        kernelPreference: (_d = options.kernelPreference) !== null && _d !== void 0 ? _d : {
            shouldStart: true,
            canStart: true,
            name: (_e = specsManager.specs) === null || _e === void 0 ? void 0 : _e.default
        }
    });
}
exports.createSessionContext = createSessionContext;
/**
 * Create a session and return a session connection.
 */
async function createSession(options) {
    const manager = Private.getManager().sessions;
    await manager.ready;
    return manager.startNew(options);
}
exports.createSession = createSession;
/**
 * Create a context for a file.
 */
function createFileContext(path = coreutils_1.UUID.uuid4() + '.txt', manager = Private.getManager()) {
    const factory = Private.textFactory;
    return new docregistry_1.Context({ manager, factory, path });
}
exports.createFileContext = createFileContext;
async function createFileContextWithKernel(path = coreutils_1.UUID.uuid4() + '.txt', manager = Private.getManager()) {
    var _a;
    const factory = Private.textFactory;
    const specsManager = manager.kernelspecs;
    await specsManager.ready;
    return new docregistry_1.Context({
        manager,
        factory,
        path,
        kernelPreference: {
            shouldStart: true,
            canStart: true,
            name: (_a = specsManager.specs) === null || _a === void 0 ? void 0 : _a.default
        }
    });
}
exports.createFileContextWithKernel = createFileContextWithKernel;
/**
 * Create and initialize context for a notebook.
 */
async function initNotebookContext(options = {}) {
    var _a, _b, _c;
    const factory = Private.notebookFactory;
    const manager = options.manager || Private.getManager();
    const path = options.path || coreutils_1.UUID.uuid4() + '.ipynb';
    console.debug('Initializing notebook context for', path, 'kernel:', options.startKernel);
    const startKernel = options.startKernel === undefined ? false : options.startKernel;
    await manager.ready;
    const context = new docregistry_1.Context({
        manager,
        factory,
        path,
        kernelPreference: {
            shouldStart: startKernel,
            canStart: startKernel,
            shutdownOnDispose: true,
            name: (_a = manager.kernelspecs.specs) === null || _a === void 0 ? void 0 : _a.default
        }
    });
    await context.initialize(true);
    if (startKernel) {
        await context.sessionContext.initialize();
        await ((_c = (_b = context.sessionContext.session) === null || _b === void 0 ? void 0 : _b.kernel) === null || _c === void 0 ? void 0 : _c.info);
    }
    return context;
}
exports.initNotebookContext = initNotebookContext;
/**
 * Wait for a dialog to be attached to an element.
 */
async function waitForDialog(host = document.body, timeout = 250) {
    const interval = 25;
    const limit = Math.floor(timeout / interval);
    for (let counter = 0; counter < limit; counter++) {
        if (host.getElementsByClassName('jp-Dialog')[0]) {
            return;
        }
        await sleep(interval);
    }
    throw new Error('Dialog not found');
}
exports.waitForDialog = waitForDialog;
/**
 * Accept a dialog after it is attached by accepting the default button.
 */
async function acceptDialog(host = document.body, timeout = 250) {
    await waitForDialog(host, timeout);
    const node = host.getElementsByClassName('jp-Dialog')[0];
    if (node) {
        simulate_event_1.simulate(node, 'keydown', { keyCode: 13 });
    }
}
exports.acceptDialog = acceptDialog;
/**
 * Click on the warning button in a dialog after it is attached
 */
async function dangerDialog(host = document.body, timeout = 250) {
    await waitForDialog(host, timeout);
    const node = host.getElementsByClassName('jp-mod-warn')[0];
    if (node) {
        simulate_event_1.simulate(node, 'click', { button: 1 });
    }
}
exports.dangerDialog = dangerDialog;
/**
 * Dismiss a dialog after it is attached.
 *
 * #### Notes
 * This promise will always resolve successfully.
 */
async function dismissDialog(host = document.body, timeout = 250) {
    try {
        await waitForDialog(host, timeout);
    }
    catch (error) {
        return; // Ignore calls to dismiss the dialog if there is no dialog.
    }
    const node = host.getElementsByClassName('jp-Dialog')[0];
    if (node) {
        simulate_event_1.simulate(node, 'keydown', { keyCode: 27 });
    }
}
exports.dismissDialog = dismissDialog;
/**
 * A namespace for private data.
 */
var Private;
(function (Private) {
    let manager;
    Private.textFactory = new docregistry_1.TextModelFactory();
    Private.notebookFactory = new notebook_1.NotebookModelFactory({
        disableDocumentWideUndoRedo: false
    });
    /**
     * Get or create the service manager singleton.
     */
    function getManager() {
        if (!manager) {
            manager = new services_1.ServiceManager({ standby: 'never' });
        }
        return manager;
    }
    Private.getManager = getManager;
})(Private || (Private = {}));
//# sourceMappingURL=common.js.map