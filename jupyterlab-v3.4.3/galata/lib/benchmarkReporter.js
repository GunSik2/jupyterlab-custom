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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.benchmark = void 0;
const test_1 = require("@playwright/test");
const base_1 = require("@stdlib/stats/base");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const systeminformation_1 = __importDefault(require("systeminformation"));
const vega = __importStar(require("vega"));
const vl = __importStar(require("vega-lite"));
const vs = __importStar(require("vega-statistics"));
const benchmarkVLTpl_1 = __importDefault(require("./benchmarkVLTpl"));
/**
 * Benchmark namespace
 */
var benchmark;
(function (benchmark) {
    var _a;
    /**
     * Default benchmark output results folder
     */
    benchmark.DEFAULT_FOLDER = 'benchmark-results';
    /**
     * Default Playwright test attachment name for benchmark
     */
    benchmark.DEFAULT_NAME_ATTACHMENT = 'galata-benchmark';
    /**
     * Default number of samples per scenario
     */
    benchmark.DEFAULT_NUMBER_SAMPLES = 20;
    /**
     * Default output file name
     */
    benchmark.DEFAULT_OUTPUT = 'benchmark.json';
    /**
     * Data reference for expected results
     */
    benchmark.DEFAULT_EXPECTED_REFERENCE = 'expected';
    /**
     * Data reference for actual results
     */
    benchmark.DEFAULT_REFERENCE = 'actual';
    /**
     * Number of samples per scenario
     */
    benchmark.nSamples = parseInt((_a = process.env['BENCHMARK_NUMBER_SAMPLES']) !== null && _a !== void 0 ? _a : '0', 10) ||
        benchmark.DEFAULT_NUMBER_SAMPLES;
    /**
     * Convert a record as test attachment
     *
     * @param data Data record to attach
     * @returns The attachment
     */
    function addAttachment(data) {
        return {
            name: benchmark.DEFAULT_NAME_ATTACHMENT,
            contentType: 'application/json',
            body: Buffer.from(JSON.stringify(data))
        };
    }
    benchmark.addAttachment = addAttachment;
    /**
     * Quantifies the performance changes between two measures systems. Assumes we gathered
     * n independent measurement from each, and calculated their means and variance.
     *
     * Based on the work by Tomas Kalibera and Richard Jones. See their paper
     * "Quantifying Performance Changes with Effect Size Confidence Intervals", section 6.2,
     * formula "Quantifying Performance Change".
     *
     * However, it simplifies it to only assume one level of benchmarks, not multiple levels.
     * If you do have multiple levels, simply use the mean of the lower levels as your data,
     * like they do in the paper.
     *
     * @param oldDistribution The old distribution description
     * @param newDistribution The new distribution description
     * @param n The number of samples from each system (must be equal)
     * @param confidenceInterval The confidence interval for the results.
     *  The default is a 95% confidence interval (95% of the time the true mean will be
     *  between the resulting mean +- the resulting CI)
     */
    function performanceChange(oldDistribution, newDistribution, n, confidenceInterval = 0.95) {
        const { mean: yO, variance: sO } = oldDistribution;
        const { mean: yN, variance: sN } = newDistribution;
        const dof = n - 1;
        const t = base_1.dists.t.quantile(1 - (1 - confidenceInterval) / 2, dof);
        const oldFactor = sq(yO) - (sq(t) * sO) / n;
        const newFactor = sq(yN) - (sq(t) * sN) / n;
        const meanNum = yO * yN;
        const ciNum = Math.sqrt(sq(yO * yN) - newFactor * oldFactor);
        return {
            mean: meanNum / oldFactor,
            confidenceInterval: ciNum / oldFactor
        };
    }
    /**
     * Compute the performance change based on a number of old and new measurements.
     *
     * Based on the work by Tomas Kalibera and Richard Jones. See their paper
     * "Quantifying Performance Changes with Effect Size Confidence Intervals", section 6.2,
     * formula "Quantifying Performance Change".
     *
     * However, it simplifies it to only assume one level of benchmarks, not multiple levels.
     * If you do have multiple levels, simply use the mean of the lower levels as your data,
     * like they do in the paper.
     *
     * Note: The measurements must have the same length. As fallback, you could use the minimum
     * size of the two measurement sets.
     *
     * @param oldMeasures The old measurements
     * @param newMeasures The new measurements
     * @param confidenceInterval The confidence interval for the results.
     * @param minLength Fall back to the minimum length of the two arrays
     */
    function distributionChange(oldMeasures, newMeasures, confidenceInterval = 0.95, minLength = false) {
        const n = oldMeasures.length;
        if (!minLength && n !== newMeasures.length) {
            throw new Error('Data have different length');
        }
        return performanceChange({ mean: mean(...oldMeasures), variance: variance(...oldMeasures) }, { mean: mean(...newMeasures), variance: variance(...newMeasures) }, minLength ? Math.min(n, newMeasures.length) : n, confidenceInterval);
    }
    benchmark.distributionChange = distributionChange;
    /**
     * Format a performance changes like `between 20.1% slower and 30.3% faster`.
     *
     * @param distribution The distribution change
     * @returns The formatted distribution change
     */
    function formatChange(distribution) {
        const { mean, confidenceInterval } = distribution;
        return `between ${formatPercent(mean + confidenceInterval)} and ${formatPercent(mean - confidenceInterval)}`;
    }
    benchmark.formatChange = formatChange;
    function formatPercent(percent) {
        if (percent < 1) {
            return `${((1 - percent) * 100).toFixed(1)}% faster`;
        }
        return `${((percent - 1) * 100).toFixed(1)}% slower`;
    }
    function sq(x) {
        return Math.pow(x, 2);
    }
    function mean(...x) {
        return base_1.meanpw(x.length, x, 1);
    }
    function variance(...x) {
        return base_1.variancepn(x.length, 1, x, 1);
    }
})(benchmark = exports.benchmark || (exports.benchmark = {}));
/**
 * Custom Playwright reporter for benchmark tests
 */
class BenchmarkReporter {
    /**
     * @param options
     *   - outputFile: Name of the output file (default to env BENCHMARK_OUTPUTFILE)
     *   - comparison: Logic of test comparisons: 'snapshot' or 'project'
     *      * 'snapshot': (default) This will compare the 'actual' result with the 'expected' one
     *      * 'project': This will compare the different project
     *   - vegaLiteConfigFactory: Function to create VegaLite configuration from test records; see https://vega.github.io/vega-lite/docs/.
     *   - textReportFactory: Function to create  text report from test records, this function
     *   should return the content and extension of report file.
     */
    constructor(options = {}) {
        var _a, _b, _c, _d, _e, _f;
        this._outputFile = (_b = (_a = options.outputFile) !== null && _a !== void 0 ? _a : process.env['BENCHMARK_OUTPUTFILE']) !== null && _b !== void 0 ? _b : benchmark.DEFAULT_OUTPUT;
        this._comparison = (_c = options.comparison) !== null && _c !== void 0 ? _c : 'snapshot';
        this._reference = (_d = process.env['BENCHMARK_REFERENCE']) !== null && _d !== void 0 ? _d : benchmark.DEFAULT_REFERENCE;
        this._buildVegaLiteGraph = (_e = options.vegaLiteConfigFactory) !== null && _e !== void 0 ? _e : this.defaultVegaLiteConfigFactory;
        this._buildTextReport = (_f = options.textReportFactory) !== null && _f !== void 0 ? _f : this.defaultTextReportFactory;
    }
    /**
     * Called once before running tests. All tests have been already discovered and put into a hierarchy of [Suite]s.
     * @param config Resolved configuration.
     * @param suite The root suite that contains all projects, files and test cases.
     */
    onBegin(config, suite) {
        this.config = config;
        this.suite = suite;
        this._report = new Array();
        // Clean up output folder if it exists
        if (this._outputFile) {
            const outputDir = path_1.default.resolve(path_1.default.dirname(this._outputFile), benchmark.DEFAULT_FOLDER);
            if (fs_1.default.existsSync(outputDir)) {
                fs_1.default.rmSync(outputDir, { recursive: true, force: true });
            }
        }
    }
    /**
     * Called after a test has been finished in the worker process.
     * @param test Test that has been finished.
     * @param result Result of the test run.
     */
    onTestEnd(test, result) {
        if (result.status === 'passed') {
            this._report.push(...result.attachments
                .filter(a => a.name === benchmark.DEFAULT_NAME_ATTACHMENT)
                .map(raw => {
                var _a, _b;
                const json = JSON.parse((_b = (_a = raw.body) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : '{}');
                return Object.assign(Object.assign({}, json), { reference: this._reference });
            }));
        }
    }
    /**
     * Called after all tests has been run, or testing has been interrupted. Note that this method may return a [Promise] and
     * Playwright Test will await it.
     * @param result Result of the full test run. - `'passed'` - Everything went as expected.
     * - `'failed'` - Any test has failed.
     * - `'timedout'` - The
     *   [testConfig.globalTimeout](https://playwright.dev/docs/api/class-testconfig#test-config-global-timeout) has been
     *   reached.
     * - `'interrupted'` - Interrupted by the user.
     */
    async onEnd(result) {
        const report = await this.buildReport();
        const reportString = JSON.stringify(report, undefined, 2);
        if (this._outputFile) {
            const outputDir = path_1.default.resolve(path_1.default.dirname(this._outputFile), benchmark.DEFAULT_FOLDER);
            const baseName = path_1.default.basename(this._outputFile, '.json');
            fs_1.default.mkdirSync(outputDir, { recursive: true });
            fs_1.default.writeFileSync(path_1.default.resolve(outputDir, `${baseName}.json`), reportString, 'utf-8');
            const allData = [...report.values];
            if (this._comparison === 'snapshot') {
                // Test if expectations exists otherwise creates it depending on updateSnapshot value
                const expectationsFile = path_1.default.resolve(this.config.rootDir, `${baseName}-expected.json`);
                const hasExpectations = fs_1.default.existsSync(expectationsFile);
                let expectations;
                if (!hasExpectations || this.config.updateSnapshots === 'all') {
                    expectations = {
                        values: report.values.map(d => {
                            return Object.assign(Object.assign({}, d), { reference: benchmark.DEFAULT_EXPECTED_REFERENCE });
                        }),
                        metadata: report.metadata
                    };
                    if (this.config.updateSnapshots !== 'none') {
                        fs_1.default.writeFileSync(expectationsFile, JSON.stringify(expectations, undefined, 2), 'utf-8');
                    }
                }
                else {
                    const expected = fs_1.default.readFileSync(expectationsFile, 'utf-8');
                    expectations = JSON.parse(expected);
                }
                allData.push(...expectations.values);
            }
            // - Create report
            const [reportContentString, reportExtension] = await this._buildTextReport(allData);
            const reportFile = path_1.default.resolve(outputDir, `${baseName}.${reportExtension}`);
            fs_1.default.writeFileSync(reportFile, reportContentString, 'utf-8');
            // Generate graph file and image
            const graphConfigFile = path_1.default.resolve(outputDir, `${baseName}.vl.json`);
            const config = this._buildVegaLiteGraph(allData, this._comparison);
            fs_1.default.writeFileSync(graphConfigFile, JSON.stringify(config), 'utf-8');
            const vegaSpec = vl.compile(config).spec;
            const view = new vega.View(vega.parse(vegaSpec), {
                renderer: 'canvas'
            }).initialize();
            const canvas = (await view.toCanvas());
            const graphFile = path_1.default.resolve(outputDir, `${baseName}.png`);
            const fileStream = fs_1.default.createWriteStream(graphFile);
            // Wait for pipe operation to finish
            let resolver;
            const waitForPipe = new Promise(resolve => {
                resolver = resolve;
            });
            fileStream.once('finish', () => {
                resolver(void 0);
            });
            const stream = canvas.createPNGStream();
            stream.pipe(fileStream, {});
            await waitForPipe;
        }
        else {
            console.log(reportString);
        }
    }
    /**
     * Default text report factory of `BenchmarkReporter`, this method will
     * be used by to generate markdown report. Users can customize the builder
     * by supplying another builder to constructor's option or override this
     * method on a sub-class.
     *
     * @param allData all test records.
     * @param comparison logic of test comparisons:
     * 'snapshot' or 'project'; default 'snapshot'.
     * @return A list of two strings, the first one
     * is the content of report, the second one is the extension of report file.
     */
    async defaultTextReportFactory(allData, comparison = 'snapshot') {
        var _a;
        // Compute statistics
        // - Groupby (test, browser, reference | project, file)
        const reportExtension = 'md';
        const groups = new Map();
        allData.forEach(d => {
            var _a;
            if (!groups.has(d.test)) {
                groups.set(d.test, new Map());
            }
            const testGroup = groups.get(d.test);
            if (!testGroup.has(d.browser)) {
                testGroup.set(d.browser, new Map());
            }
            const browserGroup = testGroup.get(d.browser);
            const lastLevel = comparison === 'snapshot' ? d.reference : d.project;
            if (!browserGroup.has(lastLevel)) {
                browserGroup.set(lastLevel, new Map());
            }
            const fileGroup = browserGroup.get(lastLevel);
            if (!fileGroup.has(d.file)) {
                fileGroup.set(d.file, new Array());
            }
            (_a = fileGroup.get(d.file)) === null || _a === void 0 ? void 0 : _a.push(d.time);
        });
        // If the reference | project lists has two items, the intervals will be compared.
        if (!groups.values().next().value) {
            return ['## Benchmark report\n\nNot enough data', reportExtension];
        }
        const compare = ((_a = groups.values().next().value) === null || _a === void 0 ? void 0 : _a.values().next().value).size === 2;
        // - Create report
        const reportContent = new Array('## Benchmark report', '', 'The execution time (in milliseconds) are grouped by test file, test type and browser.', 'For each case, the following values are computed: _min_ <- [_1st quartile_ - _median_ - _3rd quartile_] -> _max_.');
        if (compare) {
            reportContent.push('', 'The mean relative comparison is computed with 95% confidence.');
        }
        reportContent.push('', '<details><summary>Results table</summary>', '');
        let header = '| Test file |';
        let nFiles = 0;
        for (const [file] of groups.values().next().value.values().next().value.values().next()
            .value) {
            header += ` ${file} |`;
            nFiles++;
        }
        reportContent.push(header);
        reportContent.push(new Array(nFiles + 2).fill('|').join(' --- '));
        const filler = new Array(nFiles).fill('|').join(' ');
        let changeReference = benchmark.DEFAULT_EXPECTED_REFERENCE;
        for (const [test, testGroup] of groups) {
            reportContent.push(`| **${test}** | ` + filler);
            for (const [browser, browserGroup] of testGroup) {
                reportContent.push(`| \`${browser}\` | ` + filler);
                const actual = new Map();
                const expected = new Map();
                for (const [reference, fileGroup] of browserGroup) {
                    let line = `| ${reference} |`;
                    for (const [filename, dataGroup] of fileGroup) {
                        const [q1, median, q3] = vs.quartiles(dataGroup);
                        if (compare) {
                            if (reference === benchmark.DEFAULT_REFERENCE ||
                                !actual.has(filename)) {
                                actual.set(filename, dataGroup);
                            }
                            else {
                                changeReference = reference;
                                expected.set(filename, dataGroup);
                            }
                        }
                        line += ` ${Math.min(...dataGroup).toFixed()} <- [${q1.toFixed()} - ${median.toFixed()} - ${q3.toFixed()}] -> ${Math.max(...dataGroup).toFixed()} |`;
                    }
                    reportContent.push(line);
                }
                if (compare) {
                    let line = `| Mean relative change |`;
                    for (const [filename, oldDistribution] of expected) {
                        const newDistribution = actual.get(filename);
                        try {
                            const delta = benchmark.distributionChange(oldDistribution, newDistribution, 0.95, true);
                            let unmatchWarning = '';
                            if (oldDistribution.length != newDistribution.length) {
                                unmatchWarning = `[:warning:](# "Reference size ${oldDistribution.length} != Actual size ${newDistribution.length}") `;
                            }
                            line += ` ${unmatchWarning}${((delta.mean - 1) * 100).toFixed(1)}% ± ${(delta.confidenceInterval * 100).toFixed(1)}% |`;
                        }
                        catch (error) {
                            console.error(`Reference has length ${oldDistribution.length} and new has ${newDistribution.length}.`);
                            line += ` ${error} |`;
                        }
                    }
                    reportContent.push(line);
                }
            }
        }
        if (compare) {
            reportContent.push('', `Changes are computed with _${changeReference}_ as reference.`);
        }
        reportContent.push('', '</details>', '');
        const reportContentString = reportContent.join('\n');
        return [reportContentString, reportExtension];
    }
    /**
     * Default Vega Lite config factory of `BenchmarkReporter`, this method will
     * be used by to generate VegaLite configuration. Users can customize
     * the builder by supplying another builder to constructor's option or
     * override this method on a sub-class.
     *
     * @param allData all test records.
     * @param comparison logic of test comparisons:
     * 'snapshot' or 'project'; default 'snapshot'.
     * @return VegaLite configuration
     */
    defaultVegaLiteConfigFactory(allData, comparison = 'snapshot') {
        const config = benchmarkVLTpl_1.default([...new Set(allData.map(d => d.test))], comparison == 'snapshot' ? 'reference' : 'project', [...new Set(allData.map(d => d.file))]);
        config.data.values = allData;
        return config;
    }
    async getMetadata(browser) {
        const cpu = await systeminformation_1.default.cpu();
        // Keep only non-variable value
        const totalMemory = (await systeminformation_1.default.mem()).total;
        // Remove some os information
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _a = await systeminformation_1.default.osInfo(), { hostname, fqdn } = _a, osInfo = __rest(_a, ["hostname", "fqdn"]);
        const browsers = ['chromium', 'firefox', 'webkit'];
        const browserVersions = {};
        for (const browser of browsers) {
            try {
                switch (browser) {
                    case 'chromium':
                        browserVersions[browser] = (await test_1.chromium.launch()).version();
                        break;
                    case 'firefox':
                        browserVersions[browser] = (await test_1.firefox.launch()).version();
                        break;
                    case 'webkit':
                        browserVersions[browser] = (await test_1.webkit.launch()).version();
                        break;
                }
            }
            catch (e) {
                // pass not installed browser
            }
        }
        return {
            browsers: browserVersions,
            benchmark: {
                BENCHMARK_OUTPUTFILE: this._outputFile,
                BENCHMARK_REFERENCE: this._reference
            },
            systemInformation: {
                cpu: cpu,
                mem: { total: totalMemory },
                osInfo: osInfo
            }
        };
    }
    async buildReport() {
        return {
            values: this._report,
            metadata: await this.getMetadata()
        };
    }
}
exports.default = BenchmarkReporter;
//# sourceMappingURL=benchmarkReporter.js.map