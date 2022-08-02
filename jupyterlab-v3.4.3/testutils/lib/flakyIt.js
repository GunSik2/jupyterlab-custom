"use strict";
// Adapted from https://github.com/bluzi/jest-retries/blob/01a9713a7379edcfd2d1bccec7c0fbc66d4602da/src/retry.js
Object.defineProperty(exports, "__esModule", { value: true });
exports.flakyIt = void 0;
// We explicitly reference the jest typings since the jest.d.ts file shipped
// with jest 26 masks the @types/jest typings
/// <reference types="jest" />
const common_1 = require("./common");
/**
 * Run a test function.
 *
 * @param fn The function of the test
 */
async function runTest(fn) {
    return new Promise((resolve, reject) => {
        const result = fn((err) => (err ? reject(err) : resolve()));
        if (result && result.then) {
            result.catch(reject).then(resolve);
        }
        else {
            resolve();
        }
    });
}
/**
 * Run a flaky test with retries.
 *
 * @param name The name of the test
 * @param fn The function of the test
 * @param retries The number of retries
 * @param wait The time to wait in milliseconds between retries
 */
/* eslint-disable jest/no-export */
function flakyIt(name, fn, retries = 3, wait = 1000) {
    test(name, async () => {
        let latestError;
        for (let tries = 0; tries < retries; tries++) {
            try {
                await runTest(fn);
                return;
            }
            catch (error) {
                latestError = error;
                await common_1.sleep(wait);
            }
        }
        throw latestError;
    });
}
exports.flakyIt = flakyIt;
/* eslint-enable jest/no-export */
flakyIt.only = it.only;
flakyIt.skip = it.skip;
flakyIt.todo = it.todo;
//# sourceMappingURL=flakyIt.js.map