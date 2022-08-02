/// <reference types="jest" />
/**
 * Run a flaky test with retries.
 *
 * @param name The name of the test
 * @param fn The function of the test
 * @param retries The number of retries
 * @param wait The time to wait in milliseconds between retries
 */
export declare function flakyIt(name: string, fn: any, retries?: number, wait?: number): void;
export declare namespace flakyIt {
    var only: jest.It;
    var skip: jest.It;
    var todo: jest.It;
}
