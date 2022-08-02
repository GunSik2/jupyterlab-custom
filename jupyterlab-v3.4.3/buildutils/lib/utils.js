"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.camelCase = exports.stem = exports.ensureUnixPathSep = exports.getPackageGraph = exports.run = exports.postbump = exports.prebump = exports.getJSVersion = exports.getPythonVersion = exports.checkStatus = exports.fromTemplate = exports.writeJSONFile = exports.readJSONFile = exports.writePackageData = exports.getCorePaths = exports.getLernaPaths = exports.exitOnUuncaughtException = void 0;
const path_1 = __importDefault(require("path"));
const glob_1 = __importDefault(require("glob"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const child_process_1 = __importDefault(require("child_process"));
const dependency_graph_1 = require("dependency-graph");
const sort_package_json_1 = __importDefault(require("sort-package-json"));
const coreutils_1 = require("@lumino/coreutils");
const backSlash = /\\/g;
/**
 *  Exit with an error code on uncaught error.
 */
function exitOnUuncaughtException() {
    process.on('uncaughtException', function (err) {
        console.error('Uncaught exception', err);
        process.exit(1);
    });
}
exports.exitOnUuncaughtException = exitOnUuncaughtException;
/**
 * Get all of the lerna package paths.
 */
function getLernaPaths(basePath = '.') {
    basePath = path_1.default.resolve(basePath);
    let packages;
    try {
        let baseConfig = require(path_1.default.join(basePath, 'package.json'));
        if (baseConfig.workspaces) {
            packages = baseConfig.workspaces.packages || baseConfig.workspaces;
        }
        else {
            baseConfig = require(path_1.default.join(basePath, 'lerna.json'));
            packages = baseConfig.packages;
        }
    }
    catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
            throw new Error(`No yarn workspace / lerna package list found in ${basePath}`);
        }
        throw e;
    }
    let paths = [];
    for (const config of packages) {
        paths = paths.concat(glob_1.default.sync(path_1.default.join(basePath, config)));
    }
    return paths.filter(pkgPath => {
        return fs_extra_1.default.existsSync(path_1.default.join(pkgPath, 'package.json'));
    });
}
exports.getLernaPaths = getLernaPaths;
/**
 * Get all of the core package paths.
 */
function getCorePaths() {
    const spec = path_1.default.resolve(path_1.default.join('.', 'packages', '*'));
    return glob_1.default.sync(spec);
}
exports.getCorePaths = getCorePaths;
/**
 * Write a package.json if necessary.
 *
 * @param data - The package data.
 *
 * @oaram pkgJsonPath - The path to the package.json file.
 *
 * @returns Whether the file has changed.
 */
function writePackageData(pkgJsonPath, data) {
    const text = JSON.stringify(sort_package_json_1.default(data), null, 2) + '\n';
    const orig = fs_extra_1.default.readFileSync(pkgJsonPath, 'utf8').split('\r\n').join('\n');
    if (text !== orig) {
        fs_extra_1.default.writeFileSync(pkgJsonPath, text, 'utf8');
        return true;
    }
    return false;
}
exports.writePackageData = writePackageData;
/**
 * Read a json file.
 */
function readJSONFile(filePath) {
    try {
        return JSON.parse(fs_extra_1.default.readFileSync(filePath, 'utf8'));
    }
    catch (e) {
        throw `Cannot read JSON for path ${filePath}: ${e}`;
    }
}
exports.readJSONFile = readJSONFile;
/**
 * Write a json file.
 */
function writeJSONFile(filePath, data) {
    function sortObjByKey(value) {
        // https://stackoverflow.com/a/35810961
        return typeof value === 'object'
            ? Array.isArray(value)
                ? value.map(sortObjByKey)
                : Object.keys(value)
                    .sort()
                    .reduce((o, key) => {
                    const v = value[key];
                    o[key] = sortObjByKey(v);
                    return o;
                }, {})
            : value;
    }
    const text = JSON.stringify(data, sortObjByKey(data), 2) + '\n';
    let orig = {};
    try {
        orig = readJSONFile(filePath);
    }
    catch (e) {
        // no-op
    }
    if (!coreutils_1.JSONExt.deepEqual(data, orig)) {
        fs_extra_1.default.writeFileSync(filePath, text, 'utf8');
        return true;
    }
    return false;
}
exports.writeJSONFile = writeJSONFile;
/**
 * Simple template substitution for template vars of the form {{name}}
 *
 * @param templ: the template string.
 * Ex: `This header generated by {{funcName}}`
 *
 * @param subs: an object in which the parameter keys are the template
 * variables and the parameter values are the substitutions.
 *
 * @param options: function options.
 *
 * @param options.autoindent: default = true. If true, will try to match
 * indentation level of {{var}} in substituted template.
 *
 * @param options.end: default = '\n'. Inserted at the end of
 * a template post-substitution and post-trim.
 *
 * @returns the input template with all {{vars}} substituted, then `.trim`-ed.
 */
function fromTemplate(templ, subs, options = {}) {
    // default options values
    const autoindent = options.autoindent === undefined ? true : options.autoindent;
    const end = options.end === undefined ? '\n' : options.end;
    Object.keys(subs).forEach(key => {
        const val = subs[key];
        if (autoindent) {
            // try to match the indentation level of the {{var}} in the input template.
            templ = templ.split(`{{${key}}}`).reduce((acc, cur) => {
                // Regex: 0 or more non-newline whitespaces followed by end of string
                const indentRe = acc.match(/([^\S\r\n]*).*$/);
                const indent = indentRe ? indentRe[1] : '';
                return acc + val.split('\n').join('\n' + indent) + cur;
            });
        }
        else {
            templ = templ.split(`{{${key}}}`).join(val);
        }
    });
    return templ.trim() + end;
}
exports.fromTemplate = fromTemplate;
/**
 *
 * Call a command, checking its status.
 */
function checkStatus(cmd) {
    const data = child_process_1.default.spawnSync(cmd, { shell: true });
    return data.status;
}
exports.checkStatus = checkStatus;
/**
 * Get the current version of JupyterLab
 */
function getPythonVersion() {
    const cmd = 'python setup.py --version';
    const lines = run(cmd, { stdio: 'pipe' }, true).split('\n');
    return lines[lines.length - 1];
}
exports.getPythonVersion = getPythonVersion;
/**
 * Get the current version of a package
 */
function getJSVersion(pkg) {
    const filePath = path_1.default.resolve(path_1.default.join('.', 'packages', pkg, 'package.json'));
    const data = readJSONFile(filePath);
    return data.version;
}
exports.getJSVersion = getJSVersion;
/**
 * Pre-bump.
 */
function prebump() {
    // Ensure bump2version is installed (active fork of bumpversion)
    run('python -m pip install bump2version');
    // Make sure we start in a clean git state.
    const status = run('git status --porcelain', {
        stdio: 'pipe',
        encoding: 'utf8'
    });
    if (status.length > 0) {
        throw new Error(`Must be in a clean git state with no untracked files.
Run "git status" to see the issues.

${status}`);
    }
}
exports.prebump = prebump;
/**
 * Post-bump.
 */
function postbump(commit = true) {
    // Get the current version.
    const curr = getPythonVersion();
    // Update the dev mode version.
    const filePath = path_1.default.resolve(path_1.default.join('.', 'dev_mode', 'package.json'));
    const data = readJSONFile(filePath);
    data.jupyterlab.version = curr;
    writeJSONFile(filePath, data);
    // Commit changes.
    if (commit) {
        run('git commit -am "[ci skip] bump version"');
    }
}
exports.postbump = postbump;
/**
 * Run a command with terminal output.
 *
 * @param cmd - The command to run.
 */
function run(cmd, options = {}, quiet) {
    options = options || {};
    options['stdio'] = options.stdio || 'inherit';
    if (!quiet) {
        console.debug('>', cmd);
    }
    const value = child_process_1.default.execSync(cmd, options);
    if (value === null) {
        return '';
    }
    return value
        .toString()
        .replace(/(\r\n|\n)$/, '')
        .trim();
}
exports.run = run;
/**
 * Get a graph that has all of the package data for the local packages and their
 * first order dependencies.
 */
function getPackageGraph() {
    // Pick up all the package versions.
    const paths = getLernaPaths();
    const locals = {};
    // These two are not part of the workspaces but should be
    // considered part of the dependency graph.
    paths.push('./jupyterlab/tests/mock_packages/extension');
    paths.push('./jupyterlab/tests/mock_packages/mimeextension');
    // Gather all of our package data.
    paths.forEach(pkgPath => {
        // Read in the package.json.
        let data;
        try {
            data = readJSONFile(path_1.default.join(pkgPath, 'package.json'));
        }
        catch (e) {
            console.error(e);
            return;
        }
        locals[data.name] = data;
    });
    // Build up a dependency graph from all our local packages and
    // their first order dependencies.
    const graph = new dependency_graph_1.DepGraph();
    Object.keys(locals).forEach(name => {
        const data = locals[name];
        graph.addNode(name, data);
        const deps = data.dependencies || {};
        Object.keys(deps).forEach(depName => {
            if (!graph.hasNode(depName)) {
                let depData;
                // get data from locals if available, otherwise from
                // third party library.
                if (depName in locals) {
                    depData = locals[depName];
                }
                else {
                    depData = requirePackage(name, depName);
                }
                graph.addNode(depName, depData);
            }
            graph.addDependency(data.name, depName);
        });
    });
    return graph;
}
exports.getPackageGraph = getPackageGraph;
/**
 * Resolve a `package.json` in the `module` starting at resolution from the `parentModule`.
 *
 * We could just use "require(`${depName}/package.json`)", however this won't work for modules
 * that are not hoisted to the top level.
 */
function requirePackage(parentModule, module) {
    const packagePath = `${module}/package.json`;
    let parentModulePath;
    // This will fail when the parent module cannot be loaded, like `@jupyterlab/test-root`
    try {
        parentModulePath = require.resolve(parentModule);
    }
    catch (_a) {
        return require(packagePath);
    }
    const requirePath = require.resolve(packagePath, {
        paths: [parentModulePath]
    });
    return require(requirePath);
}
/**
 * Ensure the given path uses '/' as path separator.
 */
function ensureUnixPathSep(source) {
    if (path_1.default.sep === '/') {
        return source;
    }
    return source.replace(backSlash, '/');
}
exports.ensureUnixPathSep = ensureUnixPathSep;
/**
 * Get the last portion of a path, without its extension (if any).
 *
 * @param pathArg - The file path.
 *
 * @returns the last part of the path, sans extension.
 */
function stem(pathArg) {
    return path_1.default.basename(pathArg).split('.').shift();
}
exports.stem = stem;
/**
 * Given a 'snake-case', 'snake_case', or 'snake case' string,
 * will return the camel case version: 'snakeCase'.
 *
 * @param str: the snake-case input string.
 *
 * @param upper: default = false. If true, the first letter of the
 * returned string will be capitalized.
 *
 * @returns the camel case version of the input string.
 */
function camelCase(str, upper = false) {
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+|-+|_+)/g, function (match, index) {
        if (+match === 0 || match[0] === '-') {
            return '';
        }
        else if (index === 0 && !upper) {
            return match.toLowerCase();
        }
        else {
            return match.toUpperCase();
        }
    });
}
exports.camelCase = camelCase;
//# sourceMappingURL=utils.js.map