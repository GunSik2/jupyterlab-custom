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
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const utils = __importStar(require("./utils"));
// Run integrity to update the dev_mode package.json
utils.run('jlpm integrity');
// Get the dev mode package.json file.
const data = utils.readJSONFile('./dev_mode/package.json');
// Update the values that need to change and write to staging.
data['jupyterlab']['buildDir'] = './build';
data['jupyterlab']['outputDir'] = '..';
data['jupyterlab']['staticDir'] = '../static';
data['jupyterlab']['linkedPackages'] = {};
const staging = './jupyterlab/staging';
// Ensure a clean staging directory.
const keep = ['yarn.js', '.yarnrc'];
fs.readdirSync(staging).forEach(name => {
    if (keep.indexOf(name) === -1) {
        fs.removeSync(path.join(staging, name));
    }
});
fs.ensureDirSync(staging);
fs.ensureFileSync(path.join(staging, 'package.json'));
utils.writePackageData(path.join(staging, 'package.json'), data);
// Update our staging files.
const notice = '// This file is auto-generated from the corresponding file in /dev_mode\n';
[
    'index.js',
    'bootstrap.js',
    'publicpath.js',
    'webpack.config.js',
    'webpack.prod.config.js',
    'webpack.prod.minimize.config.js',
    'webpack.prod.release.config.js',
    'templates'
].forEach(name => {
    const dest = path.join('.', 'jupyterlab', 'staging', name);
    fs.copySync(path.join('.', 'dev_mode', name), dest);
    if (path.extname(name) === '.js') {
        const oldContent = fs.readFileSync(dest);
        const newContent = notice + oldContent;
        fs.writeFileSync(dest, newContent);
    }
});
// Copy the root yarn.lock, then update and deduplicate to prune it.
fs.copySync(path.join('.', 'yarn.lock'), path.join('.', 'jupyterlab', 'staging', 'yarn.lock'));
utils.run('jlpm', { cwd: staging });
try {
    utils.run('jlpm yarn-deduplicate -s fewer --fail', { cwd: staging });
}
catch (_a) {
    // re-run install if we deduped packages!
    utils.run('jlpm', { cwd: staging });
}
// Build the core assets.
utils.run('jlpm run build:prod:release', { cwd: staging });
// Run integrity
utils.run('jlpm integrity');
//# sourceMappingURL=update-core-mode.js.map