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
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const utils = __importStar(require("./utils"));
// Specify the program signature.
commander_1.default
    .description('Prepare the Python package for release')
    .action(async (options) => {
    utils.exitOnUuncaughtException();
    const distDir = './dist';
    // Clean the dist directory.
    if (fs.existsSync(distDir)) {
        fs.removeSync(distDir);
    }
    // Update core mode.  This cannot be done until the JS packages are
    // released.
    utils.run('node buildutils/lib/update-core-mode.js');
    // Make the Python release.
    utils.run('python -m pip install -U twine build');
    utils.run('python -m build .');
    utils.run('twine check dist/*');
    const files = fs.readdirSync(distDir);
    const hashes = new Map();
    files.forEach(file => {
        const shasum = crypto.createHash('sha256');
        const hash = shasum.update(fs.readFileSync(path.join(distDir, file)));
        hashes.set(file, hash.digest('hex'));
    });
    const hashString = Array.from(hashes.entries())
        .map(entry => `${entry[0]}: ${entry[1]}`)
        .join('" -m "');
    // Make the commit and the tag.
    const curr = utils.getPythonVersion();
    utils.run(`git commit -am "Publish ${curr}" -m "SHA256 hashes:" -m "${hashString}"`);
    utils.run(`git tag v${curr}`);
    // Prompt the user to finalize.
    console.debug('*'.repeat(40));
    console.debug('*'.repeat(40));
    console.debug('Ready to publish!');
    console.debug('Run these command when ready:');
    console.debug('twine upload dist/*');
    console.debug('git push origin <BRANCH> --tags');
    // Emit a system beep.
    process.stdout.write('\x07');
});
commander_1.default.parse(process.argv);
//# sourceMappingURL=prepare-python-release.js.map