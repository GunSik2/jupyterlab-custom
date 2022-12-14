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
const glob = __importStar(require("glob"));
const utils_1 = require("./utils");
utils_1.exitOnUuncaughtException();
// Get all of the packages.
const basePath = path.resolve('.');
const baseConfig = utils_1.readJSONFile(path.join(basePath, 'package.json'));
const packageConfig = baseConfig.workspaces.packages;
const skipSource = process.argv.indexOf('packages') === -1;
const skipExamples = process.argv.indexOf('examples') === -1;
// Handle the packages
for (let i = 0; i < packageConfig.length; i++) {
    if (skipSource && packageConfig[i] === 'packages/*') {
        continue;
    }
    if (skipExamples && packageConfig[i] === 'examples/*') {
        continue;
    }
    const files = glob.sync(path.join(basePath, packageConfig[i]));
    for (let j = 0; j < files.length; j++) {
        try {
            handlePackage(files[j]);
        }
        catch (e) {
            console.error(e);
        }
    }
}
/**
 * Handle an individual package on the path - update the dependency.
 */
function handlePackage(packagePath) {
    // Read in the package.json.
    const packageJSONPath = path.join(packagePath, 'package.json');
    let data;
    try {
        data = require(packageJSONPath);
    }
    catch (e) {
        console.debug('skipping', packagePath);
        return;
    }
    if (!data.scripts || !data.scripts.clean) {
        return;
    }
    const targets = data.scripts.clean.split('&&');
    for (let i = 0; i < targets.length; i++) {
        let target = targets[i].replace('rimraf', '').trim();
        target = path.join(packagePath, target);
        if (fs.existsSync(target)) {
            fs.removeSync(target);
        }
    }
}
//# sourceMappingURL=clean-packages.js.map