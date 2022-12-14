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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const webpack = __importStar(require("webpack"));
const crypto_1 = __importDefault(require("crypto"));
// Workaround for loaders using "md4" by default, which is not supported in FIPS-compliant OpenSSL
const cryptoOrigCreateHash = crypto_1.default.createHash;
crypto_1.default.createHash = (algorithm) => cryptoOrigCreateHash(algorithm == 'md4' ? 'sha256' : algorithm);
const rules = [
    { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    { test: /\.txt$/, use: 'raw-loader' },
    { test: /\.md$/, use: 'raw-loader' },
    { test: /\.(jpg|png|gif)$/, use: 'file-loader' },
    { test: /\.js.map$/, use: 'file-loader' },
    {
        test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
        use: 'url-loader?limit=10000&mimetype=application/font-woff'
    },
    {
        test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
        use: 'url-loader?limit=10000&mimetype=application/font-woff'
    },
    {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        use: 'url-loader?limit=10000&mimetype=application/octet-stream'
    },
    { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, use: 'file-loader' },
    {
        // In .css files, svg is loaded as a data URI.
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        issuer: /\.css$/,
        use: {
            loader: 'svg-url-loader',
            options: { encoding: 'none', limit: 10000 }
        }
    },
    {
        // In .ts and .tsx files (both of which compile to .js), svg files
        // must be loaded as a raw string instead of data URIs.
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        issuer: /\.js$/,
        use: {
            loader: 'raw-loader'
        }
    },
    {
        test: /\.m?js$/,
        type: 'javascript/auto'
    },
    {
        test: /\.m?js/,
        resolve: {
            fullySpecified: false
        }
    },
    {
        test: /\.c?js/,
        resolve: {
            fullySpecified: false
        }
    }
];
// Map Phosphor files to Lumino files.
const stylePath = path.join(path.dirname(require.resolve('@lumino/widgets/package.json')), 'style');
let phosphorAlias = {};
try {
    phosphorAlias = {
        '@phosphor/algorithm$': require.resolve('@lumino/algorithm'),
        '@phosphor/application$': require.resolve('@lumino/application'),
        '@phosphor/commands$': require.resolve('@lumino/commands'),
        '@phosphor/coreutils$': require.resolve('@lumino/coreutils'),
        '@phosphor/disposable$': require.resolve('@lumino/disposable'),
        '@phosphor/domutils$': require.resolve('@lumino/domutils'),
        '@phosphor/dragdrop$': require.resolve('@lumino/dragdrop'),
        '@phosphor/dragdrop/style': stylePath,
        '@phosphor/messaging$': require.resolve('@lumino/messaging'),
        '@phosphor/properties$': require.resolve('@lumino/properties'),
        '@phosphor/signaling': require.resolve('@lumino/signaling'),
        '@phosphor/widgets/style': stylePath,
        '@phosphor/virtualdom$': require.resolve('@lumino/virtualdom'),
        '@phosphor/widgets$': require.resolve('@lumino/widgets')
    };
}
catch (e) {
    // no Phosphor shims required
}
const watch = process.argv.includes('--watch');
module.exports = {
    bail: !watch,
    module: { rules },
    resolve: {
        alias: phosphorAlias,
        fallback: {
            url: false,
            buffer: false,
            crypto: false,
            // See https://github.com/webpack/webpack/blob/3471c776059ac2d26593ea39f9c47c1874253dbb/lib/ModuleNotFoundError.js#L13-L42
            path: require.resolve('path-browserify'),
            process: require.resolve('process/browser')
        }
    },
    watchOptions: {
        poll: 500,
        aggregateTimeout: 1000
    },
    output: {
        hashFunction: 'sha256'
    },
    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser'
        })
    ]
};
//# sourceMappingURL=webpack.config.base.js.map