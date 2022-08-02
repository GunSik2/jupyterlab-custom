"use strict";
// Vega-Lite configuration
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * General Vega-Lite configuration
 */
const GENERAL_CONFIG = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Box plots of some action time.',
    title: 'Duration of common actions',
    data: {},
    config: { facet: { spacing: 80 } }
};
/**
 * Matrix of figures per test file
 *
 * @param tests Kind of test
 * @param comparison Field name to compare
 * @returns The specification
 */
function configPerFile(tests, comparison) {
    return {
        vconcat: tests.map(t => {
            return {
                title: t,
                transform: [{ filter: `datum.test === '${t}'` }],
                facet: {
                    column: { field: 'browser', type: 'nominal' }
                },
                spec: {
                    mark: { type: 'boxplot', extent: 'min-max' },
                    encoding: {
                        y: { field: comparison, type: 'nominal' },
                        x: {
                            field: 'time',
                            title: 'Time (ms)',
                            type: 'quantitative',
                            scale: { zero: false }
                        }
                    }
                }
            };
        })
    };
}
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
function generateVegaLiteSpec(tests, comparison, filenames) {
    const files = filenames !== null && filenames !== void 0 ? filenames : [];
    if (files.length === 0) {
        return Object.assign(Object.assign({}, GENERAL_CONFIG), configPerFile(tests, comparison));
    }
    else {
        return Object.assign(Object.assign({}, GENERAL_CONFIG), { hconcat: files.map(b => {
                return Object.assign({ title: b, transform: [{ filter: `datum.file === '${b}'` }] }, configPerFile(tests, comparison));
            }) });
    }
}
exports.default = generateVegaLiteSpec;
//# sourceMappingURL=benchmarkVLTpl.js.map