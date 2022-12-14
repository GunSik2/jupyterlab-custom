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
const commander_1 = __importDefault(require("commander"));
const utils = __importStar(require("./utils"));
// Specify the program signature.
commander_1.default
    .description('Update the version and publish')
    .option('--dry-run', 'Dry run')
    .option('--force', 'Force the upgrade')
    .option('--skip-commit', 'Whether to skip commit changes')
    .arguments('<spec>')
    .action((spec, opts) => {
    utils.exitOnUuncaughtException();
    // Get the previous version.
    const prev = utils.getPythonVersion();
    const isFinal = /\d+\.\d+\.\d+$/.test(prev);
    // Whether to commit after bumping
    const commit = opts.skipCommit !== true;
    // for "next", determine whether to use "patch" or "build"
    if (spec == 'next') {
        spec = isFinal ? 'patch' : 'build';
    }
    // For patch, defer to `patch:release` command
    if (spec === 'patch') {
        let cmd = 'jlpm run patch:release --all';
        if (opts.force) {
            cmd += ' --force';
        }
        if (opts.skipCommit) {
            cmd += ' --skip-commit';
        }
        utils.run(cmd);
        process.exit(0);
    }
    // Make sure we have a valid version spec.
    const options = ['major', 'minor', 'release', 'build'];
    if (options.indexOf(spec) === -1) {
        throw new Error(`Version spec must be one of: ${options}`);
    }
    if (isFinal && spec === 'release') {
        throw new Error('Use "major" or "minor" to switch back to alpha release');
    }
    if (isFinal && spec === 'build') {
        throw new Error('Cannot increment a build on a final release');
    }
    // Run pre-bump script.
    utils.prebump();
    // Handle dry runs.
    if (opts.dryRun) {
        utils.run(`bumpversion --dry-run --verbose ${spec}`);
        return;
    }
    // If this is a major release during the alpha cycle, bump
    // just the Python version.
    if (prev.indexOf('a') !== -1 && spec === 'major') {
        // Bump the version.
        utils.run(`bumpversion ${spec}`);
        // Run the post-bump script.
        utils.postbump(commit);
        return;
    }
    // Determine the version spec to use for lerna.
    let lernaVersion = 'preminor';
    if (spec === 'build') {
        lernaVersion = 'prerelease';
        // a -> b
    }
    else if (spec === 'release' && prev.indexOf('a') !== -1) {
        lernaVersion = 'prerelease --preid=beta';
        // b -> rc
    }
    else if (spec === 'release' && prev.indexOf('b') !== -1) {
        lernaVersion = 'prerelease --preid=rc';
        // rc -> final
    }
    else if (spec === 'release' && prev.indexOf('rc') !== -1) {
        lernaVersion = 'patch';
    }
    if (lernaVersion === 'preminor') {
        lernaVersion += ' --preid=alpha';
    }
    let cmd = `lerna version -m \"[ci skip] New version\" --force-publish=* --no-push ${lernaVersion}`;
    if (opts.force) {
        cmd += ' --yes';
    }
    const oldVersion = utils.run('git rev-parse HEAD', {
        stdio: 'pipe',
        encoding: 'utf8'
    }, true);
    // For a preminor release, we bump 10 minor versions so that we do
    // not conflict with versions during minor releases of the top
    // level package.
    if (lernaVersion === 'preminor') {
        for (let i = 0; i < 10; i++) {
            utils.run(cmd);
        }
    }
    else {
        utils.run(cmd);
    }
    const newVersion = utils.run('git rev-parse HEAD', {
        stdio: 'pipe',
        encoding: 'utf8'
    }, true);
    if (oldVersion === newVersion) {
        // lerna didn't version anything, so we assume the user aborted
        throw new Error('Lerna aborted');
    }
    // Bump the version.
    utils.run(`bumpversion ${spec}`);
    // Run the post-bump script.
    utils.postbump(commit);
});
commander_1.default.parse(process.argv);
//# sourceMappingURL=bumpversion.js.map