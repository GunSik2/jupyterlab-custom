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
    .description('Create a patch release')
    .option('--force', 'Force the upgrade')
    .option('--all', 'Patch all JS packages instead of the changed ones')
    .option('--skip-commit', 'Whether to skip commit changes')
    .action((options) => {
    utils.exitOnUuncaughtException();
    // Make sure we can patch release.
    const pyVersion = utils.getPythonVersion();
    if (pyVersion.includes('a') ||
        pyVersion.includes('b') ||
        pyVersion.includes('rc')) {
        throw new Error('Can only make a patch release from a final version');
    }
    // Run pre-bump actions.
    utils.prebump();
    // Version the changed
    let cmd = `lerna version patch -m \"[ci skip] New version\" --no-push`;
    if (options.all) {
        cmd += ' --force-publish=*';
    }
    if (options.force) {
        cmd += ' --yes';
    }
    const oldVersion = utils.run('git rev-parse HEAD', {
        stdio: 'pipe',
        encoding: 'utf8'
    }, true);
    utils.run(cmd);
    const newVersion = utils.run('git rev-parse HEAD', {
        stdio: 'pipe',
        encoding: 'utf8'
    }, true);
    if (oldVersion === newVersion) {
        console.debug('aborting');
        // lerna didn't version anything, so we assume the user aborted
        throw new Error('Lerna aborted');
    }
    // Patch the python version
    utils.run('bumpversion patch'); // switches to alpha
    utils.run('bumpversion release --allow-dirty'); // switches to beta
    utils.run('bumpversion release --allow-dirty'); // switches to rc.
    utils.run('bumpversion release --allow-dirty'); // switches to final.
    // Run post-bump actions.
    const commit = options.skipCommit !== true;
    utils.postbump(commit);
});
commander_1.default.parse(process.argv);
//# sourceMappingURL=patch-release.js.map