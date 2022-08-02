"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NBTestUtils = void 0;
const coreutils_1 = require("@lumino/coreutils");
const codemirror_1 = require("@jupyterlab/codemirror");
const codeeditor_1 = require("@jupyterlab/codeeditor");
const apputils_1 = require("@jupyterlab/apputils");
const docregistry_1 = require("@jupyterlab/docregistry");
const notebook_1 = require("@jupyterlab/notebook");
const cells_1 = require("@jupyterlab/cells");
const rendermime_1 = require("./rendermime");
const Mock = __importStar(require("./mock"));
/**
 * The default notebook content.
 */
// tslint:disable-next-line
var NBTestUtils;
(function (NBTestUtils) {
    /**
     * The default outputs used for testing.
     */
    NBTestUtils.DEFAULT_OUTPUTS = [
        {
            name: 'stdout',
            output_type: 'stream',
            text: ['hello world\n', '0\n', '1\n', '2\n']
        },
        {
            name: 'stderr',
            output_type: 'stream',
            text: ['output to stderr\n']
        },
        {
            name: 'stderr',
            output_type: 'stream',
            text: ['output to stderr2\n']
        },
        {
            output_type: 'execute_result',
            execution_count: 1,
            data: { 'text/plain': 'foo' },
            metadata: {}
        },
        {
            output_type: 'display_data',
            data: { 'text/plain': 'hello, world' },
            metadata: {}
        },
        {
            output_type: 'error',
            ename: 'foo',
            evalue: 'bar',
            traceback: ['fizz', 'buzz']
        }
    ];
    NBTestUtils.DEFAULT_CONTENT = require('../default.json');
    NBTestUtils.DEFAULT_CONTENT_45 = require('../default-45.json');
    NBTestUtils.defaultEditorConfig = Object.assign({}, notebook_1.StaticNotebook.defaultEditorConfig);
    NBTestUtils.editorFactory = codemirror_1.editorServices.factoryService.newInlineEditor.bind(codemirror_1.editorServices.factoryService);
    NBTestUtils.mimeTypeService = codemirror_1.editorServices.mimeTypeService;
    /**
     * Get a copy of the default rendermime instance.
     */
    function defaultRenderMime() {
        return rendermime_1.defaultRenderMime();
    }
    NBTestUtils.defaultRenderMime = defaultRenderMime;
    NBTestUtils.clipboard = apputils_1.Clipboard.getInstance();
    /**
     * Create a base cell content factory.
     */
    function createBaseCellFactory() {
        return new cells_1.Cell.ContentFactory({ editorFactory: NBTestUtils.editorFactory });
    }
    NBTestUtils.createBaseCellFactory = createBaseCellFactory;
    /**
     * Create a new code cell content factory.
     */
    function createCodeCellFactory() {
        return new cells_1.Cell.ContentFactory({ editorFactory: NBTestUtils.editorFactory });
    }
    NBTestUtils.createCodeCellFactory = createCodeCellFactory;
    /**
     * Create a cell editor widget.
     */
    function createCellEditor(model) {
        return new codeeditor_1.CodeEditorWrapper({
            model: model || new cells_1.CodeCellModel({}),
            factory: NBTestUtils.editorFactory
        });
    }
    NBTestUtils.createCellEditor = createCellEditor;
    /**
     * Create a default notebook content factory.
     */
    function createNotebookFactory() {
        return new notebook_1.Notebook.ContentFactory({ editorFactory: NBTestUtils.editorFactory });
    }
    NBTestUtils.createNotebookFactory = createNotebookFactory;
    /**
     * Create a default notebook panel content factory.
     */
    function createNotebookPanelFactory() {
        return new notebook_1.NotebookPanel.ContentFactory({ editorFactory: NBTestUtils.editorFactory });
    }
    NBTestUtils.createNotebookPanelFactory = createNotebookPanelFactory;
    /**
     * Create a notebook widget.
     */
    function createNotebook() {
        return new notebook_1.Notebook({
            rendermime: defaultRenderMime(),
            contentFactory: createNotebookFactory(),
            mimeTypeService: NBTestUtils.mimeTypeService
        });
    }
    NBTestUtils.createNotebook = createNotebook;
    /**
     * Create a notebook panel widget.
     */
    function createNotebookPanel(context) {
        return new notebook_1.NotebookPanel({
            content: createNotebook(),
            context
        });
    }
    NBTestUtils.createNotebookPanel = createNotebookPanel;
    /**
     * Populate a notebook with default content.
     */
    function populateNotebook(notebook) {
        const model = new notebook_1.NotebookModel();
        model.fromJSON(NBTestUtils.DEFAULT_CONTENT);
        notebook.model = model;
    }
    NBTestUtils.populateNotebook = populateNotebook;
    function createNotebookWidgetFactory(toolbarFactory) {
        return new notebook_1.NotebookWidgetFactory({
            name: 'notebook',
            fileTypes: ['notebook'],
            rendermime: defaultRenderMime(),
            toolbarFactory,
            contentFactory: createNotebookPanelFactory(),
            mimeTypeService: NBTestUtils.mimeTypeService,
            editorConfig: NBTestUtils.defaultEditorConfig
        });
    }
    NBTestUtils.createNotebookWidgetFactory = createNotebookWidgetFactory;
    /**
     * Create a context for a file.
     */
    async function createMockContext(startKernel = false) {
        const path = coreutils_1.UUID.uuid4() + '.txt';
        const manager = new Mock.ServiceManagerMock();
        const factory = new notebook_1.NotebookModelFactory({});
        const context = new docregistry_1.Context({
            manager,
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
    NBTestUtils.createMockContext = createMockContext;
})(NBTestUtils = exports.NBTestUtils || (exports.NBTestUtils = {}));
//# sourceMappingURL=notebook-utils.js.map