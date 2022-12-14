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
const glob = __importStar(require("glob"));
const path = __importStar(require("path"));
const utils = __importStar(require("./utils"));
utils.exitOnUuncaughtException();
utils.run('npm run build:packages');
utils.getLernaPaths().forEach(pkgPath => {
    const pkgData = utils.readJSONFile(path.join(pkgPath, 'package.json'));
    const name = pkgData.name;
    // Skip private packages.
    if (!pkgData.public) {
        return;
    }
    console.debug(`Checking ${name}...`);
    // Make sure each glob resolves to at least one file.
    pkgData.files.forEach((fGlob) => {
        const result = glob.sync(fGlob);
        if (result.length === 0) {
            throw new Error(`${name} has missing file(s) "${fGlob}"`);
        }
    });
    // Make sure there is a main and that it exists.
    const main = pkgData.main;
    if (!main) {
        throw new Error(`No "main" entry for ${name}`);
    }
    const mainPath = path.join(pkgPath, main);
    if (!fs.existsSync(mainPath)) {
        throw new Error(`"main" entry "${main}" not found for ${name}`);
    }
});
//# sourceMappingURL=prepublish-check.js.map