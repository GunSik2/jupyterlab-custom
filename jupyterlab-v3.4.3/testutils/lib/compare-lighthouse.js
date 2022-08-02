"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Compares two files lighthouse outputs, listing changes between the numeric audits.
 *
 * Outputs in Markdown for easy posting in Github.
 */
const fs_extra_1 = require("fs-extra");
const firstFilePath = process.argv[2];
const secondFilePath = process.argv[3];
console.debug(`\`${firstFilePath}\` -> \`${secondFilePath}\`\n\n`);
const first = JSON.parse(fs_extra_1.readFileSync(firstFilePath).toString());
const second = JSON.parse(fs_extra_1.readFileSync(secondFilePath).toString());
for (const auditName in first.audits) {
    const firstAudit = first.audits[auditName];
    // only compare numeric audits
    if (firstAudit.scoreDisplayMode !== 'numeric') {
        continue;
    }
    const secondAudit = second.audits[auditName];
    const percentChange = ((secondAudit.numericValue - firstAudit.numericValue) /
        firstAudit.numericValue) *
        100;
    if (isNaN(percentChange)) {
        continue;
    }
    console.debug(`**${firstAudit.title}**\n* ${percentChange.toFixed(0)}% Δ\n* ${firstAudit.displayValue} -> ${secondAudit.displayValue}\n* ${firstAudit.description}\n`);
}
//# sourceMappingURL=compare-lighthouse.js.map