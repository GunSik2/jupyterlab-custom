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
exports.Build = void 0;
const mini_css_extract_plugin_1 = __importDefault(require("mini-css-extract-plugin"));
const fs = __importStar(require("fs-extra"));
const glob = __importStar(require("glob"));
const path = __importStar(require("path"));
const buildutils_1 = require("@jupyterlab/buildutils");
/**
 *  A namespace for JupyterLab build utilities.
 */
var Build;
(function (Build) {
    /**
     * Ensures that the assets of plugin packages are populated for a build.
     *
     * @ Returns An array of lab extension config data.
     */
    function ensureAssets(options) {
        var _a;
        const { output, schemaOutput = output, themeOutput = output, packageNames } = options;
        const themeConfig = [];
        const packagePaths = ((_a = options.packagePaths) === null || _a === void 0 ? void 0 : _a.slice()) || [];
        let cssImports = [];
        packageNames.forEach(name => {
            packagePaths.push(path.dirname(require.resolve(path.join(name, 'package.json'))));
        });
        packagePaths.forEach(packagePath => {
            const packageDataPath = require.resolve(path.join(packagePath, 'package.json'));
            const packageDir = path.dirname(packageDataPath);
            const data = buildutils_1.readJSONFile(packageDataPath);
            const name = data.name;
            const extension = normalizeExtension(data);
            const { schemaDir, themePath } = extension;
            // We prefer the styleModule key if it exists, falling back to
            // the normal style key.
            if (typeof data.styleModule === 'string') {
                cssImports.push(`${name}/${data.styleModule}`);
            }
            else if (typeof data.style === 'string') {
                cssImports.push(`${name}/${data.style}`);
            }
            // Handle schemas.
            if (schemaDir) {
                const schemas = glob.sync(path.join(path.join(packageDir, schemaDir), '*'));
                const destination = path.join(schemaOutput, 'schemas', name);
                // Remove the existing directory if necessary.
                if (fs.existsSync(destination)) {
                    try {
                        const oldPackagePath = path.join(destination, 'package.json.orig');
                        const oldPackageData = buildutils_1.readJSONFile(oldPackagePath);
                        if (oldPackageData.version === data.version) {
                            fs.removeSync(destination);
                        }
                    }
                    catch (e) {
                        fs.removeSync(destination);
                    }
                }
                // Make sure the schema directory exists.
                fs.mkdirpSync(destination);
                // Copy schemas.
                schemas.forEach(schema => {
                    const file = path.basename(schema);
                    fs.copySync(schema, path.join(destination, file));
                });
                // Write the package.json file for future comparison.
                fs.copySync(path.join(packageDir, 'package.json'), path.join(destination, 'package.json.orig'));
            }
            if (!themePath) {
                return;
            }
            themeConfig.push({
                mode: 'production',
                entry: {
                    index: path.join(packageDir, themePath)
                },
                output: {
                    path: path.resolve(path.join(themeOutput, 'themes', name)),
                    // we won't use these JS files, only the extracted CSS
                    filename: '[name].js',
                    hashFunction: 'sha256'
                },
                module: {
                    rules: [
                        {
                            test: /\.css$/,
                            use: [mini_css_extract_plugin_1.default.loader, 'css-loader']
                        },
                        {
                            test: /\.svg/,
                            use: [{ loader: 'svg-url-loader', options: { encoding: 'none' } }]
                        },
                        {
                            test: /\.(cur|png|jpg|gif|ttf|woff|woff2|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                            use: [{ loader: 'url-loader', options: { limit: 10000 } }]
                        }
                    ]
                },
                plugins: [
                    new mini_css_extract_plugin_1.default({
                        // Options similar to the same options in webpackOptions.output
                        // both options are optional
                        filename: '[name].css',
                        chunkFilename: '[id].css'
                    })
                ]
            });
        });
        cssImports.sort((a, b) => a.localeCompare(b));
        const styleContents = `/* This is a generated file of CSS imports */
/* It was generated by @jupyterlab/builder in Build.ensureAssets() */

${cssImports.map(x => `import '${x}';`).join('\n')}
`;
        const stylePath = path.join(output, 'style.js');
        // Make sure the output dir exists before writing to it.
        if (!fs.existsSync(output)) {
            fs.mkdirSync(output);
        }
        fs.writeFileSync(stylePath, styleContents, {
            encoding: 'utf8'
        });
        return themeConfig;
    }
    Build.ensureAssets = ensureAssets;
    /**
     * Returns JupyterLab extension metadata from a module.
     */
    function normalizeExtension(module) {
        let { jupyterlab, main, name } = module;
        main = main || 'index.js';
        if (!jupyterlab) {
            throw new Error(`Module ${name} does not contain JupyterLab metadata.`);
        }
        let { extension, mimeExtension, schemaDir, themePath } = jupyterlab;
        extension = extension === true ? main : extension;
        mimeExtension = mimeExtension === true ? main : mimeExtension;
        if (extension && mimeExtension && extension === mimeExtension) {
            const message = 'extension and mimeExtension cannot be the same export.';
            throw new Error(message);
        }
        return { extension, mimeExtension, schemaDir, themePath };
    }
    Build.normalizeExtension = normalizeExtension;
})(Build = exports.Build || (exports.Build = {}));
//# sourceMappingURL=build.js.map