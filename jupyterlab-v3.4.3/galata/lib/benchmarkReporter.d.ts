/// <reference types="node" />
import { JSONObject } from '@lumino/coreutils';
import { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';
/**
 * Benchmark namespace
 */
export declare namespace benchmark {
    /**
     * Default benchmark output results folder
     */
    const DEFAULT_FOLDER = "benchmark-results";
    /**
     * Default Playwright test attachment name for benchmark
     */
    const DEFAULT_NAME_ATTACHMENT = "galata-benchmark";
    /**
     * Default number of samples per scenario
     */
    const DEFAULT_NUMBER_SAMPLES = 20;
    /**
     * Default output file name
     */
    const DEFAULT_OUTPUT = "benchmark.json";
    /**
     * Data reference for expected results
     */
    const DEFAULT_EXPECTED_REFERENCE = "expected";
    /**
     * Data reference for actual results
     */
    const DEFAULT_REFERENCE = "actual";
    /**
     * Number of samples per scenario
     */
    const nSamples: number;
    /**
     * Playwright test attachment for benchmark
     */
    interface IAttachment {
        /**
         * name <string> Attachment name.
         */
        name: string;
        /**
         * contentType <string> Content type of this attachment to properly present in the report, for example 'application/json' or 'image/png'.
         */
        contentType: 'application/json' | 'image/png' | string;
        /**
         * path <void|string> Optional path on the filesystem to the attached file.
         */
        path?: string;
        /**
         * body <void|Buffer> Optional attachment body used instead of a file.
         */
        body?: Buffer;
    }
    /**
     * Benchmark test record
     */
    interface IRecord extends Record<string, any> {
        /**
         * Test kind
         */
        test: string;
        /**
         * Browser name
         */
        browser: string;
        /**
         * Number of samples
         */
        nSamples: number;
        /**
         * Tested file name
         */
        file: string;
        /**
         * Playwright project name
         */
        project: string;
        /**
         * Test duration in milliseconds
         */
        time: number;
    }
    /**
     * Convert a record as test attachment
     *
     * @param data Data record to attach
     * @returns The attachment
     */
    function addAttachment<IRecord>(data: IRecord): IAttachment;
    /**
     * Change between two distributions
     */
    interface IDistributionChange {
        /**
         * Mean value
         */
        mean: number;
        /**
         * Spread around the mean value
         */
        confidenceInterval: number;
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
    function distributionChange(oldMeasures: number[], newMeasures: number[], confidenceInterval?: number, minLength?: boolean): IDistributionChange;
    /**
     * Format a performance changes like `between 20.1% slower and 30.3% faster`.
     *
     * @param distribution The distribution change
     * @returns The formatted distribution change
     */
    function formatChange(distribution: IDistributionChange): string;
}
/**
 * Report record interface
 */
export interface IReportRecord extends benchmark.IRecord {
    /**
     * Test suite reference
     */
    reference: string;
}
/**
 * Test suite metadata
 */
interface IMetadata {
    /**
     * Web browsers version
     */
    browsers: {
        [name: string]: string;
    };
    /**
     * Benchmark information
     */
    benchmark: {
        BENCHMARK_OUTPUTFILE: string;
        BENCHMARK_REFERENCE: string;
    };
    /**
     * System information
     */
    systemInformation: {
        cpu: Record<string, any>;
        mem: Record<string, any>;
        osInfo: Record<string, any>;
    };
}
/**
 * Report interface
 */
interface IReport {
    /**
     * Test records
     */
    values: IReportRecord[];
    /**
     * Test metadata
     */
    metadata: IMetadata;
}
/**
 * Custom Playwright reporter for benchmark tests
 */
declare class BenchmarkReporter implements Reporter {
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
    constructor(options?: {
        outputFile?: string;
        comparison?: 'snapshot' | 'project';
        vegaLiteConfigFactory?: (allData: Array<IReportRecord>, comparison?: 'snapshot' | 'project') => JSONObject;
        textReportFactory?: (allData: Array<IReportRecord>, comparison?: 'snapshot' | 'project') => Promise<[string, string]>;
    });
    /**
     * Called once before running tests. All tests have been already discovered and put into a hierarchy of [Suite]s.
     * @param config Resolved configuration.
     * @param suite The root suite that contains all projects, files and test cases.
     */
    onBegin(config: FullConfig, suite: Suite): void;
    /**
     * Called after a test has been finished in the worker process.
     * @param test Test that has been finished.
     * @param result Result of the test run.
     */
    onTestEnd(test: TestCase, result: TestResult): void;
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
    onEnd(result: FullResult): Promise<void>;
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
    protected defaultTextReportFactory(allData: Array<IReportRecord>, comparison?: 'snapshot' | 'project'): Promise<[string, string]>;
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
    protected defaultVegaLiteConfigFactory(allData: Array<IReportRecord>, comparison?: 'snapshot' | 'project'): Record<string, any>;
    protected getMetadata(browser?: string): Promise<any>;
    protected buildReport(): Promise<IReport>;
    protected config: FullConfig;
    protected suite: Suite;
    private _comparison;
    private _outputFile;
    private _reference;
    private _report;
    private _buildVegaLiteGraph;
    private _buildTextReport;
}
export default BenchmarkReporter;
