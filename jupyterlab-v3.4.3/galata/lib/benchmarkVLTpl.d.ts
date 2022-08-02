/**
 * Generate the Vega-Lite specification for test
 *
 * Note: The data field is set to empty
 *
 * @param tests Kind of test
 * @param comparison Field name to compare
 * @param filenames Test file name list
 * @returns The specification
 */
declare function generateVegaLiteSpec(tests: string[], comparison: string, filenames?: string[]): Record<string, any>;
export default generateVegaLiteSpec;
