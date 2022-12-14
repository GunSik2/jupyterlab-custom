"use strict";
/* -----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeps = void 0;
const commander_1 = __importDefault(require("commander"));
const semver_1 = __importDefault(require("semver"));
const path_1 = __importDefault(require("path"));
const utils = __importStar(require("./utils"));
/**
 * Get the packages that depend on a given package, recursively.
 */
function getDeps(pkgName, lut) {
    const deps = new Set();
    for (const name in lut) {
        if ('@jupyterlab/' + pkgName in lut[name]) {
            const otherName = name.replace('@jupyterlab/', '');
            deps.add(otherName);
            const otherDeps = getDeps(otherName, lut);
            otherDeps.forEach(dep => {
                deps.add(dep);
            });
        }
    }
    return deps;
}
exports.getDeps = getDeps;
// Specify the program signature.
commander_1.default
    .description('Bump the major version of JS package(s)')
    .arguments('<package> [others...]')
    .option('--force', 'Force the upgrade')
    .option('--dry-run', 'Show what would be executed')
    .action((pkg, others, options) => {
    utils.exitOnUuncaughtException();
    others.push(pkg);
    const toBump = new Set();
    const ignoreBump = new Set();
    const maybeBump = (pkg) => {
        if (pkg in toBump || pkg in ignoreBump) {
            return;
        }
        const version = utils.getJSVersion(pkg);
        if (semver_1.default.minor(version) === 0 && semver_1.default.prerelease(version)) {
            console.warn(`${pkg} has already been bumped`);
            ignoreBump.add(pkg);
        }
        else {
            toBump.add(pkg);
        }
    };
    others.forEach(pkg => {
        maybeBump(pkg);
    });
    // Create a lut of dependencies
    const lut = {};
    utils.getCorePaths().forEach(corePath => {
        const pkgDataPath = path_1.default.join(corePath, 'package.json');
        const data = utils.readJSONFile(pkgDataPath);
        lut[data.name] = data.dependencies || {};
    });
    // Look for dependencies of bumped packages
    Array.from(toBump).forEach(val => {
        const deps = getDeps(val, lut);
        deps.forEach(dep => {
            maybeBump(dep);
        });
    });
    if (!toBump.size) {
        console.warn('No packages found to bump!');
        return;
    }
    const pyVersion = utils.getPythonVersion();
    let preId = '';
    if (pyVersion.includes('a')) {
        preId = 'alpha';
    }
    else if (pyVersion.includes('rc')) {
        preId = 'rc';
    }
    else {
        throw new Error('Cannot bump JS packages until we switch to prerelease mode');
    }
    const pkgs = Array.from(toBump).join(',');
    let cmd = `lerna version premajor --preid=${preId} --force-publish=${pkgs} --no-push`;
    if (options.force) {
        cmd += ' --yes';
    }
    if (options.dryRun) {
        console.debug('Would run:');
        console.debug(cmd);
        return;
    }
    utils.run(cmd);
});
commander_1.default.parse(process.argv);
//# sourceMappingURL=bump-js-major.js.map