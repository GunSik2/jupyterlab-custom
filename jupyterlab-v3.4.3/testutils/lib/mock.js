"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFileContext = exports.MockShellFuture = exports.ServiceManagerMock = exports.KernelSpecManagerMock = exports.SessionManagerMock = exports.ContentsManagerMock = exports.SessionContextMock = exports.SessionConnectionMock = exports.KernelMock = exports.cloneKernel = exports.createSimpleSessionContext = exports.emitIopubMessage = exports.updateKernelStatus = exports.NOTEBOOK_PATHS = exports.KERNEL_MODELS = exports.KERNELSPECS = exports.DEFAULT_NAME = void 0;
const docregistry_1 = require("@jupyterlab/docregistry");
const services_1 = require("@jupyterlab/services");
const algorithm_1 = require("@lumino/algorithm");
const properties_1 = require("@lumino/properties");
const coreutils_1 = require("@lumino/coreutils");
const signaling_1 = require("@lumino/signaling");
const coreutils_2 = require("@jupyterlab/coreutils");
// The default kernel name
exports.DEFAULT_NAME = 'python3';
exports.KERNELSPECS = {
    [exports.DEFAULT_NAME]: {
        argv: [
            '/Users/someuser/miniconda3/envs/jupyterlab/bin/python',
            '-m',
            'ipykernel_launcher',
            '-f',
            '{connection_file}'
        ],
        display_name: 'Python 3',
        language: 'python',
        metadata: {},
        name: exports.DEFAULT_NAME,
        resources: {}
    },
    irkernel: {
        argv: [
            '/Users/someuser/miniconda3/envs/jupyterlab/bin/python',
            '-m',
            'ipykernel_launcher',
            '-f',
            '{connection_file}'
        ],
        display_name: 'R',
        language: 'python',
        metadata: {},
        name: 'irkernel',
        resources: {}
    }
};
exports.KERNEL_MODELS = [
    {
        name: exports.DEFAULT_NAME,
        id: coreutils_1.UUID.uuid4()
    },
    {
        name: 'r',
        id: coreutils_1.UUID.uuid4()
    },
    {
        name: exports.DEFAULT_NAME,
        id: coreutils_1.UUID.uuid4()
    }
];
// Notebook Paths for certain kernel name
exports.NOTEBOOK_PATHS = {
    python3: ['Untitled.ipynb', 'Untitled1.ipynb', 'Untitled2.ipynb'],
    r: ['Visualization.ipynb', 'Analysis.ipynb', 'Conclusion.ipynb']
};
/**
 * Forceably change the status of a session context.
 * An iopub message is emitted for the change.
 *
 * @param sessionContext The session context of interest.
 * @param newStatus The new kernel status.
 */
function updateKernelStatus(sessionContext, newStatus) {
    const kernel = sessionContext.session.kernel;
    kernel.status = newStatus;
    sessionContext.statusChanged.emit(newStatus);
    const msg = services_1.KernelMessage.createMessage({
        session: kernel.clientId,
        channel: 'iopub',
        msgType: 'status',
        content: { execution_state: newStatus }
    });
    emitIopubMessage(sessionContext, msg);
}
exports.updateKernelStatus = updateKernelStatus;
/**
 * Emit an iopub message on a session context.
 *
 * @param sessionContext The session context
 * @param msg Message created with `KernelMessage.createMessage`
 */
function emitIopubMessage(context, msg) {
    const kernel = context.session.kernel;
    const msgId = Private.lastMessageProperty.get(kernel);
    msg.parent_header.session = kernel.clientId;
    msg.parent_header.msg_id = msgId;
    kernel.iopubMessage.emit(msg);
}
exports.emitIopubMessage = emitIopubMessage;
/**
 * Create a session context given a partial session model.
 *
 * @param model The session model to use.
 */
function createSimpleSessionContext(model = {}) {
    const kernel = new exports.KernelMock({ model: (model === null || model === void 0 ? void 0 : model.kernel) || {} });
    const session = new exports.SessionConnectionMock({ model }, kernel);
    return new exports.SessionContextMock({}, session);
}
exports.createSimpleSessionContext = createSimpleSessionContext;
/**
 * Clone a kernel connection.
 */
function cloneKernel(kernel) {
    return kernel.clone();
}
exports.cloneKernel = cloneKernel;
/**
 * A mock kernel object.
 *
 * @param model The model of the kernel
 */
exports.KernelMock = jest.fn(options => {
    const model = Object.assign({ id: 'foo', name: exports.DEFAULT_NAME }, options.model);
    options = Object.assign(Object.assign({ clientId: coreutils_1.UUID.uuid4(), username: coreutils_1.UUID.uuid4() }, options), { model });
    let executionCount = 0;
    const spec = Private.kernelSpecForKernelName(model.name);
    const thisObject = Object.assign(Object.assign(Object.assign(Object.assign({}, jest.requireActual('@jupyterlab/services')), options), model), { status: 'idle', spec: Promise.resolve(spec), dispose: jest.fn(), clone: jest.fn(() => {
            const newKernel = Private.cloneKernel(options);
            newKernel.iopubMessage.connect((_, args) => {
                iopubMessageSignal.emit(args);
            });
            newKernel.statusChanged.connect((_, args) => {
                thisObject.status = args;
                statusChangedSignal.emit(args);
            });
            return newKernel;
        }), info: Promise.resolve(Private.getInfo(model.name)), shutdown: jest.fn(() => Promise.resolve(void 0)), requestHistory: jest.fn(() => {
            const historyReply = services_1.KernelMessage.createMessage({
                channel: 'shell',
                msgType: 'history_reply',
                session: options.clientId,
                username: options.username,
                content: {
                    history: [],
                    status: 'ok'
                }
            });
            return Promise.resolve(historyReply);
        }), restart: jest.fn(() => Promise.resolve(void 0)), requestExecute: jest.fn(options => {
            const msgId = coreutils_1.UUID.uuid4();
            executionCount++;
            Private.lastMessageProperty.set(thisObject, msgId);
            const msg = services_1.KernelMessage.createMessage({
                channel: 'iopub',
                msgType: 'execute_input',
                session: thisObject.clientId,
                username: thisObject.username,
                msgId,
                content: {
                    code: options.code,
                    execution_count: executionCount
                }
            });
            iopubMessageSignal.emit(msg);
            const reply = services_1.KernelMessage.createMessage({
                channel: 'shell',
                msgType: 'execute_reply',
                session: thisObject.clientId,
                username: thisObject.username,
                msgId,
                content: {
                    user_expressions: {},
                    execution_count: executionCount,
                    status: 'ok'
                }
            });
            return new exports.MockShellFuture(reply);
        }) }); // FIXME: fix the typing error this any cast is ignoring
    // Add signals.
    const iopubMessageSignal = new signaling_1.Signal(thisObject);
    const statusChangedSignal = new signaling_1.Signal(thisObject);
    const pendingInputSignal = new signaling_1.Signal(thisObject);
    thisObject.statusChanged = statusChangedSignal;
    thisObject.iopubMessage = iopubMessageSignal;
    thisObject.pendingInput = pendingInputSignal;
    thisObject.hasPendingInput = false;
    return thisObject;
});
/**
 * A mock session connection.
 *
 * @param options Addition session options to use
 * @param model A session model to use
 */
exports.SessionConnectionMock = jest.fn((options, kernel) => {
    var _a, _b;
    const name = (kernel === null || kernel === void 0 ? void 0 : kernel.name) || ((_b = (_a = options.model) === null || _a === void 0 ? void 0 : _a.kernel) === null || _b === void 0 ? void 0 : _b.name) || exports.DEFAULT_NAME;
    kernel = kernel || new exports.KernelMock({ model: { name } });
    const model = Object.assign(Object.assign({ path: 'foo', type: 'notebook', name: 'foo' }, options.model), { kernel: kernel.model });
    const thisObject = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, jest.requireActual('@jupyterlab/services')), { id: coreutils_1.UUID.uuid4() }), options), { model }), model), { kernel, dispose: jest.fn(), changeKernel: jest.fn(partialModel => {
            return Private.changeKernel(kernel, partialModel);
        }), shutdown: jest.fn(() => Promise.resolve(void 0)), setPath: jest.fn(path => {
            thisObject.path = path;
            propertyChangedSignal.emit('path');
            return Promise.resolve();
        }), setName: jest.fn(name => {
            thisObject.name = name;
            propertyChangedSignal.emit('name');
            return Promise.resolve();
        }), setType: jest.fn(type => {
            thisObject.type = type;
            propertyChangedSignal.emit('type');
            return Promise.resolve();
        }) }); // FIXME: fix the typing error this any cast is ignoring
    const disposedSignal = new signaling_1.Signal(thisObject);
    const propertyChangedSignal = new signaling_1.Signal(thisObject);
    const statusChangedSignal = new signaling_1.Signal(thisObject);
    const connectionStatusChangedSignal = new signaling_1.Signal(thisObject);
    const kernelChangedSignal = new signaling_1.Signal(thisObject);
    const iopubMessageSignal = new signaling_1.Signal(thisObject);
    const unhandledMessageSignal = new signaling_1.Signal(thisObject);
    const pendingInputSignal = new signaling_1.Signal(thisObject);
    kernel.iopubMessage.connect((_, args) => {
        iopubMessageSignal.emit(args);
    }, thisObject);
    kernel.statusChanged.connect((_, args) => {
        statusChangedSignal.emit(args);
    }, thisObject);
    kernel.pendingInput.connect((_, args) => {
        pendingInputSignal.emit(args);
    }, thisObject);
    thisObject.disposed = disposedSignal;
    thisObject.connectionStatusChanged = connectionStatusChangedSignal;
    thisObject.propertyChanged = propertyChangedSignal;
    thisObject.statusChanged = statusChangedSignal;
    thisObject.kernelChanged = kernelChangedSignal;
    thisObject.iopubMessage = iopubMessageSignal;
    thisObject.unhandledMessage = unhandledMessageSignal;
    thisObject.pendingInput = pendingInputSignal;
    return thisObject;
});
/**
 * A mock session context.
 *
 * @param session The session connection object to use
 */
exports.SessionContextMock = jest.fn((options, connection) => {
    const session = connection ||
        new exports.SessionConnectionMock({
            model: {
                path: options.path || '',
                type: options.type || '',
                name: options.name || ''
            }
        }, null);
    const thisObject = Object.assign(Object.assign(Object.assign({}, jest.requireActual('@jupyterlab/apputils')), options), { path: session.path, type: session.type, name: session.name, kernel: session.kernel, session, dispose: jest.fn(), initialize: jest.fn(() => Promise.resolve()), ready: Promise.resolve(), changeKernel: jest.fn(partialModel => {
            return Private.changeKernel(session.kernel || Private.RUNNING_KERNELS[0], partialModel);
        }), shutdown: jest.fn(() => Promise.resolve()) }); // FIXME: fix the typing error this any cast is ignoring
    const disposedSignal = new signaling_1.Signal(thisObject);
    const propertyChangedSignal = new signaling_1.Signal(thisObject);
    const statusChangedSignal = new signaling_1.Signal(thisObject);
    const kernelChangedSignal = new signaling_1.Signal(thisObject);
    const iopubMessageSignal = new signaling_1.Signal(thisObject);
    session.statusChanged.connect((_, args) => {
        statusChangedSignal.emit(args);
    }, thisObject);
    session.iopubMessage.connect((_, args) => {
        iopubMessageSignal.emit(args);
    });
    session.kernelChanged.connect((_, args) => {
        kernelChangedSignal.emit(args);
    });
    session.pendingInput.connect((_, args) => {
        thisObject.pendingInput = args;
    });
    thisObject.statusChanged = statusChangedSignal;
    thisObject.kernelChanged = kernelChangedSignal;
    thisObject.iopubMessage = iopubMessageSignal;
    thisObject.propertyChanged = propertyChangedSignal;
    thisObject.disposed = disposedSignal;
    thisObject.session = session;
    thisObject.pendingInput = false;
    return thisObject;
});
/**
 * A mock contents manager.
 */
exports.ContentsManagerMock = jest.fn(() => {
    const files = new Map();
    const dummy = new services_1.ContentsManager();
    const checkpoints = new Map();
    const checkPointContent = new Map();
    const baseModel = Private.createFile({ type: 'directory' });
    files.set('', Object.assign(Object.assign({}, baseModel), { path: '', name: '' }));
    const thisObject = Object.assign(Object.assign({}, jest.requireActual('@jupyterlab/services')), { newUntitled: jest.fn(options => {
            const model = Private.createFile(options || {});
            files.set(model.path, model);
            fileChangedSignal.emit({
                type: 'new',
                oldValue: null,
                newValue: model
            });
            return Promise.resolve(model);
        }), createCheckpoint: jest.fn(path => {
            var _a;
            const lastModified = new Date().toISOString();
            const data = { id: coreutils_1.UUID.uuid4(), last_modified: lastModified };
            checkpoints.set(path, data);
            checkPointContent.set(path, (_a = files.get(path)) === null || _a === void 0 ? void 0 : _a.content);
            return Promise.resolve(data);
        }), listCheckpoints: jest.fn(path => {
            const p = checkpoints.get(path);
            if (p !== undefined) {
                return Promise.resolve([p]);
            }
            return Promise.resolve([]);
        }), deleteCheckpoint: jest.fn(path => {
            if (!checkpoints.has(path)) {
                return Private.makeResponseError(404);
            }
            checkpoints.delete(path);
            return Promise.resolve();
        }), restoreCheckpoint: jest.fn(path => {
            if (!checkpoints.has(path)) {
                return Private.makeResponseError(404);
            }
            files.get(path).content = checkPointContent.get(path);
            return Promise.resolve();
        }), getModelDBFactory: jest.fn(() => {
            return null;
        }), normalize: jest.fn(path => {
            return dummy.normalize(path);
        }), localPath: jest.fn(path => {
            return dummy.localPath(path);
        }), resolvePath: jest.fn((root, path) => {
            return dummy.resolvePath(root, path);
        }), get: jest.fn((path, options) => {
            path = Private.fixSlash(path);
            if (!files.has(path)) {
                return Private.makeResponseError(404);
            }
            const model = files.get(path);
            if (model.type === 'directory') {
                if ((options === null || options === void 0 ? void 0 : options.content) !== false) {
                    const content = [];
                    files.forEach(fileModel => {
                        if (coreutils_2.PathExt.dirname(fileModel.path) == model.path) {
                            content.push(fileModel);
                        }
                    });
                    return Promise.resolve(Object.assign(Object.assign({}, model), { content }));
                }
                return Promise.resolve(model);
            }
            if ((options === null || options === void 0 ? void 0 : options.content) != false) {
                return Promise.resolve(model);
            }
            return Promise.resolve(Object.assign(Object.assign({}, model), { content: '' }));
        }), driveName: jest.fn(path => {
            return dummy.driveName(path);
        }), rename: jest.fn((oldPath, newPath) => {
            oldPath = Private.fixSlash(oldPath);
            newPath = Private.fixSlash(newPath);
            if (!files.has(oldPath)) {
                return Private.makeResponseError(404);
            }
            const oldValue = files.get(oldPath);
            files.delete(oldPath);
            const name = coreutils_2.PathExt.basename(newPath);
            const newValue = Object.assign(Object.assign({}, oldValue), { name, path: newPath });
            files.set(newPath, newValue);
            fileChangedSignal.emit({
                type: 'rename',
                oldValue,
                newValue
            });
            return Promise.resolve(newValue);
        }), delete: jest.fn(path => {
            path = Private.fixSlash(path);
            if (!files.has(path)) {
                return Private.makeResponseError(404);
            }
            const oldValue = files.get(path);
            files.delete(path);
            fileChangedSignal.emit({
                type: 'delete',
                oldValue,
                newValue: null
            });
            return Promise.resolve(void 0);
        }), save: jest.fn((path, options) => {
            if (path == 'readonly.txt') {
                return Private.makeResponseError(403);
            }
            path = Private.fixSlash(path);
            const timeStamp = new Date().toISOString();
            if (files.has(path)) {
                files.set(path, Object.assign(Object.assign(Object.assign({}, files.get(path)), options), { last_modified: timeStamp }));
            }
            else {
                files.set(path, Object.assign(Object.assign({ path, name: coreutils_2.PathExt.basename(path), content: '', writable: true, created: timeStamp, type: 'file', format: 'text', mimetype: 'plain/text' }, options), { last_modified: timeStamp }));
            }
            fileChangedSignal.emit({
                type: 'save',
                oldValue: null,
                newValue: files.get(path)
            });
            return Promise.resolve(files.get(path));
        }), getDownloadUrl: jest.fn(path => {
            return dummy.getDownloadUrl(path);
        }), addDrive: jest.fn(drive => {
            dummy.addDrive(drive);
        }), dispose: jest.fn() });
    const fileChangedSignal = new signaling_1.Signal(thisObject);
    thisObject.fileChanged = fileChangedSignal;
    return thisObject;
});
/**
 * A mock sessions manager.
 */
exports.SessionManagerMock = jest.fn(() => {
    let sessions = [];
    const thisObject = Object.assign(Object.assign({}, jest.requireActual('@jupyterlab/services')), { ready: Promise.resolve(void 0), isReady: true, startNew: jest.fn(options => {
            const session = new exports.SessionConnectionMock({ model: options }, null);
            sessions.push(session.model);
            runningChangedSignal.emit(sessions);
            return Promise.resolve(session);
        }), connectTo: jest.fn(options => {
            return new exports.SessionConnectionMock(options, null);
        }), stopIfNeeded: jest.fn(path => {
            const length = sessions.length;
            sessions = sessions.filter(model => model.path !== path);
            if (sessions.length !== length) {
                runningChangedSignal.emit(sessions);
            }
            return Promise.resolve(void 0);
        }), refreshRunning: jest.fn(() => Promise.resolve(void 0)), running: jest.fn(() => new algorithm_1.ArrayIterator(sessions)) });
    const runningChangedSignal = new signaling_1.Signal(thisObject);
    thisObject.runningChanged = runningChangedSignal;
    return thisObject;
});
/**
 * A mock kernel specs manager
 */
exports.KernelSpecManagerMock = jest.fn(() => {
    const thisObject = Object.assign(Object.assign({}, jest.requireActual('@jupyterlab/services')), { specs: { default: exports.DEFAULT_NAME, kernelspecs: exports.KERNELSPECS }, isReady: true, ready: Promise.resolve(void 0), refreshSpecs: jest.fn(() => Promise.resolve(void 0)) });
    return thisObject;
});
/**
 * A mock service manager.
 */
exports.ServiceManagerMock = jest.fn(() => {
    const thisObject = Object.assign(Object.assign({}, jest.requireActual('@jupyterlab/services')), { ready: Promise.resolve(void 0), isReady: true, contents: new exports.ContentsManagerMock(), sessions: new exports.SessionManagerMock(), kernelspecs: new exports.KernelSpecManagerMock(), dispose: jest.fn() });
    return thisObject;
});
/**
 * A mock kernel shell future.
 */
exports.MockShellFuture = jest.fn((result) => {
    const thisObject = Object.assign(Object.assign({}, jest.requireActual('@jupyterlab/services')), { dispose: jest.fn(), done: Promise.resolve(result) });
    return thisObject;
});
/**
 * Create a context for a file.
 */
async function createFileContext(startKernel = false, manager) {
    const path = coreutils_1.UUID.uuid4() + '.txt';
    manager = manager || new exports.ServiceManagerMock();
    const factory = new docregistry_1.TextModelFactory();
    const context = new docregistry_1.Context({
        manager: manager || new exports.ServiceManagerMock(),
        factory,
        path,
        kernelPreference: {
            shouldStart: startKernel,
            canStart: startKernel,
            autoStartDefault: startKernel
        }
    });
    await context.initialize(true);
    await context.sessionContext.initialize();
    return context;
}
exports.createFileContext = createFileContext;
/**
 * A namespace for module private data.
 */
var Private;
(function (Private) {
    function flattenArray(arr) {
        const result = [];
        arr.forEach(innerArr => {
            innerArr.forEach(elem => {
                result.push(elem);
            });
        });
        return result;
    }
    Private.flattenArray = flattenArray;
    function createFile(options) {
        options = options || {};
        let name = coreutils_1.UUID.uuid4();
        switch (options.type) {
            case 'directory':
                name = `Untitled Folder_${name}`;
                break;
            case 'notebook':
                name = `Untitled_${name}.ipynb`;
                break;
            default:
                name = `untitled_${name}${options.ext || '.txt'}`;
        }
        const path = coreutils_2.PathExt.join(options.path || '', name);
        let content = '';
        if (options.type === 'notebook') {
            content = JSON.stringify({});
        }
        const timeStamp = new Date().toISOString();
        return {
            path,
            content,
            name,
            last_modified: timeStamp,
            writable: true,
            created: timeStamp,
            type: options.type || 'file',
            format: 'text',
            mimetype: 'plain/text'
        };
    }
    Private.createFile = createFile;
    function fixSlash(path) {
        if (path.endsWith('/')) {
            path = path.slice(0, path.length - 1);
        }
        return path;
    }
    Private.fixSlash = fixSlash;
    function makeResponseError(status) {
        const resp = new Response(void 0, { status });
        return Promise.reject(new services_1.ServerConnection.ResponseError(resp));
    }
    Private.makeResponseError = makeResponseError;
    function cloneKernel(options) {
        return new exports.KernelMock(Object.assign(Object.assign({}, options), { clientId: coreutils_1.UUID.uuid4() }));
    }
    Private.cloneKernel = cloneKernel;
    // Get the kernel spec for kernel name
    function kernelSpecForKernelName(name) {
        return exports.KERNELSPECS[name];
    }
    Private.kernelSpecForKernelName = kernelSpecForKernelName;
    // Get the kernel info for kernel name
    function getInfo(name) {
        return {
            protocol_version: '1',
            implementation: 'foo',
            implementation_version: '1',
            language_info: {
                version: '1',
                name
            },
            banner: 'hello, world!',
            help_links: [],
            status: 'ok'
        };
    }
    Private.getInfo = getInfo;
    function changeKernel(kernel, partialModel) {
        if (partialModel.id) {
            const kernelIdx = exports.KERNEL_MODELS.findIndex(model => {
                return model.id === partialModel.id;
            });
            if (kernelIdx !== -1) {
                kernel.model = Private.RUNNING_KERNELS[kernelIdx].model;
                kernel.id = partialModel.id;
                return Promise.resolve(Private.RUNNING_KERNELS[kernelIdx]);
            }
            else {
                throw new Error(`Unable to change kernel to one with id: ${partialModel.id}`);
            }
        }
        else if (partialModel.name) {
            const kernelIdx = exports.KERNEL_MODELS.findIndex(model => {
                return model.name === partialModel.name;
            });
            if (kernelIdx !== -1) {
                kernel.model = Private.RUNNING_KERNELS[kernelIdx].model;
                kernel.id = partialModel.id;
                return Promise.resolve(Private.RUNNING_KERNELS[kernelIdx]);
            }
            else {
                throw new Error(`Unable to change kernel to one with name: ${partialModel.name}`);
            }
        }
        else {
            throw new Error(`Unable to change kernel`);
        }
    }
    Private.changeKernel = changeKernel;
    // This list of running kernels simply mirrors the KERNEL_MODELS and KERNELSPECS lists
    Private.RUNNING_KERNELS = exports.KERNEL_MODELS.map((model, _) => {
        return new exports.KernelMock({ model });
    });
    Private.lastMessageProperty = new properties_1.AttachedProperty({
        name: 'lastMessageId',
        create: () => ''
    });
})(Private || (Private = {}));
//# sourceMappingURL=mock.js.map