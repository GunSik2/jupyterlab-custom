"use strict";
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
const fs = __importStar(require("fs-extra"));
const child_process = __importStar(require("child_process"));
const crypto = __importStar(require("crypto"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const ps = __importStar(require("process"));
const glob_1 = __importDefault(require("glob"));
const commander_1 = require("commander");
const utils = __importStar(require("./utils"));
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const DEFAULT_OUT_DIR = path.join(os.tmpdir(), 'verdaccio');
const DEFAULT_PORT = 4873;
/**
 * Start a local npm registry.
 */
async function startLocalRegistry(out_dir, port = DEFAULT_PORT) {
    await stopLocalRegistry(out_dir);
    // make the out dir if it does not exist
    if (!fs.existsSync(out_dir)) {
        fs.mkdirSync(out_dir);
    }
    // Get current registry values
    let prev_npm = utils.run('npm config get registry', { stdio: 'pipe' }, true);
    let prev_yarn = '';
    try {
        prev_yarn = utils.run('yarn config get registry', { stdio: 'pipe' }, true);
    }
    catch (e) {
        // Do nothing
    }
    if (!prev_npm || prev_npm.indexOf('localhost') !== -1) {
        prev_npm = 'https://registry.npmjs.org/';
    }
    if (prev_yarn.indexOf('localhost') !== -1) {
        prev_yarn = '';
    }
    // write the config file
    const config = path.join(out_dir, 'verdaccio.yml');
    const config_text = `
storage: ${out_dir}/storage
auth:
  htpasswd:
    file: ${out_dir}/htpasswd
uplinks:
    npmjs:
        url: ${prev_npm}
packages:
  '@*/*':
    access: $all
    publish: $authenticated
    unpublish: $authenticated
    proxy: npmjs
  '**':
    access: $all
    publish: $authenticated
    unpublish: $authenticated
    proxy: npmjs`;
    fs.writeFileSync(config, config_text, { encoding: 'utf-8' });
    const log_file = path.join(out_dir, 'verdaccio.log');
    // Start local registry
    const args = `-c verdaccio.yml -l localhost:${port}`;
    console.log(`Starting verdaccio on port ${port} in ${out_dir}`);
    // Ensure a clean log file
    if (fs.existsSync(log_file)) {
        fs.unlinkSync(log_file);
    }
    // Assign as `any`` for compatibility with spawn `OpenMode`` options
    const out = fs.openSync(log_file, 'a');
    const err = fs.openSync(log_file, 'a');
    const options = { cwd: out_dir, detached: true, stdio: ['ignore', out, err] };
    const bin_dir = utils.run('npm bin', { stdio: 'pipe' }, true);
    const verdaccio_bin = path.join(bin_dir, 'verdaccio');
    const subproc = child_process.spawn(verdaccio_bin, args.split(' '), options);
    subproc.unref();
    // Wait for Verdaccio to boot
    let content = '';
    let delays = 0;
    while (delays < 100) {
        ps.stdout.write('.');
        if (content.indexOf('http address') !== -1) {
            break;
        }
        if (content.toLowerCase().indexOf('error') !== -1) {
            console.error(content);
            ps.exit(1);
        }
        await delay(100);
        if (fs.existsSync(log_file)) {
            content = fs.readFileSync(log_file, { encoding: 'utf-8' });
        }
        delays += 1;
    }
    if (delays === 100) {
        console.error('Timed out!');
        process.exit(1);
    }
    console.log('\nVerdaccio started');
    // Store registry values and pid in files
    const info_file = path.join(out_dir, 'info.json');
    const data = {
        prev_npm,
        prev_yarn,
        pid: subproc.pid
    };
    utils.writeJSONFile(info_file, data);
    // Set registry to local registry
    const local_registry = `http://localhost:${port}`;
    child_process.execSync(`npm config set registry "${local_registry}"`);
    try {
        child_process.execSync(`yarn config set registry "${local_registry}"`);
    }
    catch (e) {
        // yarn not available
    }
    // Log in using cli and temp credentials
    const user = 'foo';
    const pass = 'bar';
    const email = 'foo@bar.com';
    console.log('Logging in');
    const loginPs = child_process.spawn('npm', `login -r ${local_registry}`.split(' '));
    const loggedIn = new Promise((accept, reject) => {
        loginPs.stdout.on('data', (chunk) => {
            const data = Buffer.from(chunk, 'utf-8').toString().trim();
            console.log('stdout:', data);
            switch (data) {
                case 'Username:':
                    console.log('Passing username...');
                    loginPs.stdin.write(user + '\n');
                    break;
                case 'Password:':
                    console.log('Passing password...');
                    loginPs.stdin.write(pass + '\n');
                    break;
                case 'Email: (this IS public)':
                    console.log('Passing email...');
                    loginPs.stdin.write(email + '\n');
                    break;
                default:
                    reject(`Unexpected prompt: "${data}"`);
            }
            if (data.indexOf('Logged in as') !== -1) {
                loginPs.stdin.end();
                // do not accept here yet, the token may not have been written
            }
            loginPs.stderr.on('data', (chunk) => {
                const data = Buffer.from(chunk, 'utf-8').toString().trim();
                console.log('stderr:', data);
            });
        });
        loginPs.on('error', error => reject(error));
        loginPs.on('close', () => accept());
    });
    await loggedIn;
    loginPs.kill();
    console.log('Running in', out_dir);
    ps.exit(0);
}
/**
 * Stop the local npm registry running in the given directory
 */
async function stopLocalRegistry(out_dir) {
    if (!fs.existsSync(out_dir)) {
        return;
    }
    const info_file = path.join(out_dir, 'info.json');
    if (!fs.existsSync(info_file)) {
        return;
    }
    const data = utils.readJSONFile(info_file);
    // Kill the pid
    console.log(`Killing existing process ${data.pid}`);
    try {
        ps.kill(data.pid);
    }
    catch (e) {
        // No process running
    }
    // Restore the previous registry entries
    console.log('Restoring registry settings');
    if (data.prev_npm) {
        child_process.execSync(`npm set registry ${data.prev_npm}`);
    }
    else {
        child_process.execSync(`npm config rm registry`);
    }
    if (data.prev_yarn) {
        child_process.execSync(`yarn config set registry ${data.prev_yarn}`);
    }
    else {
        try {
            child_process.execSync(`yarn config delete registry`);
        }
        catch (e) {
            // yarn not available
        }
    }
}
/**
 * Fix the yarn lock links in the given directory.
 */
function fixLinks(package_dir) {
    let yarn_reg = '';
    try {
        yarn_reg = utils.run('yarn config get registry', { stdio: 'pipe' }, true);
    }
    catch (e) {
        // Do nothing
    }
    yarn_reg = yarn_reg || 'https://registry.yarnpkg.com';
    const lock_file = path.join(package_dir, 'yarn.lock');
    console.log(`Fixing links in ${lock_file}`);
    const content = fs.readFileSync(lock_file, { encoding: 'utf-8' });
    let shasum = crypto.createHash('sha256');
    let hash = shasum.update(content);
    console.log('Prior hash', hash.digest('hex'));
    const regex = /http\:\/\/localhost\:\d+/g;
    const new_content = content.replace(regex, yarn_reg);
    shasum = crypto.createHash('sha256');
    hash = shasum.update(new_content);
    console.log('After hash', hash.digest('hex'));
    fs.writeFileSync(lock_file, new_content, 'utf8');
}
/**
 * Publish the npm tar files in a given directory
 */
function publishPackages(dist_dir) {
    const paths = glob_1.default.sync(path.join(dist_dir, '*.tgz'));
    const curr = utils.getPythonVersion();
    let tag = 'latest';
    if (!/\d+\.\d+\.\d+$/.test(curr)) {
        tag = 'next';
    }
    paths.forEach(package_path => {
        const filename = path.basename(package_path);
        utils.run(`npm publish ${filename} --tag ${tag}`, {
            cwd: dist_dir,
            stdio: 'pipe'
        });
    });
}
const program = new commander_1.Command();
program
    .command('start')
    .option('--port <port>', 'Port to use for the registry')
    .option('--path <path>', 'Path to use for the registry')
    .action(async (options) => {
    utils.exitOnUuncaughtException();
    const out_dir = options.path || DEFAULT_OUT_DIR;
    await startLocalRegistry(out_dir, options.port || DEFAULT_PORT);
});
program
    .command('stop')
    .option('--path <path>', 'Path to use for the registry')
    .action(async (options) => {
    utils.exitOnUuncaughtException();
    const out_dir = options.path || DEFAULT_OUT_DIR;
    await stopLocalRegistry(out_dir);
});
program
    .command('fix-links')
    .option('--path <path>', 'Path to the directory with a yarn lock')
    .action((options) => {
    utils.exitOnUuncaughtException();
    fixLinks(options.path || process.cwd());
});
program
    .command('publish-dists')
    .option('--path <path>', 'Path to the directory with npm tar balls')
    .action((options) => {
    utils.exitOnUuncaughtException();
    publishPackages(options.path || process.cwd());
});
if (require.main === module) {
    program.parse(process.argv);
}
//# sourceMappingURL=local-repository.js.map