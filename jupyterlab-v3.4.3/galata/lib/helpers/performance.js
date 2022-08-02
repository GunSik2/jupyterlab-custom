"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceHelper = void 0;
const coreutils_1 = require("@lumino/coreutils");
/**
 * Performance helper
 */
class PerformanceHelper {
    constructor(page) {
        this.page = page;
    }
    /**
     * Clear all measures and place a mark
     *
     * @param name Mark
     */
    startTimer(name = 'start') {
        return this.page.evaluate(`{
      performance.clearMeasures();
      performance.mark('${name}');
    }`);
    }
    /**
     * Get the duration since the mark has been created
     *
     * @param startMark Mark
     * @param name Measure
     * @returns Measure value
     */
    async endTimer(startMark = 'start', name = 'duration') {
        await this.page.evaluate(`performance.measure('${name}', '${startMark}')`);
        const time = await this.page.evaluate(`performance.getEntriesByName('${name}')[0].duration`);
        return time;
    }
    /**
     * Measure the time to execute a function using web browser performance API.
     *
     * @param fn Function to measure
     * @returns The duration to execute the function
     */
    async measure(fn) {
        const mark = coreutils_1.UUID.uuid4();
        await this.startTimer(mark);
        await fn();
        return this.endTimer(mark);
    }
}
exports.PerformanceHelper = PerformanceHelper;
//# sourceMappingURL=performance.js.map