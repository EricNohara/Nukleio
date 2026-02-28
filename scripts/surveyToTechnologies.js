/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const csv = require("csv-parser");

// Usage: node scripts/surveyToTechnologies.js <input-file.csv> [output-file-name.json]
if (process.argv.length < 3) {
  console.error(
    "Usage: node scripts/surveyToTechnologies.js <input-file.csv> [output-file-name.json]",
  );
  process.exit(1);
}

const inputPath = process.argv[2];
const outputFileName = process.argv[3] || "technologies.json";
const outputPath = path.join(__dirname, "../data", outputFileName);

// Columns you care about (must match CSV headers exactly)
const COLUMNS = [
  "DatabaseHaveWorkedWith",
  "PlatformHaveWorkedWith",
  "WebframeHaveWorkedWith",
  "DevEnvsHaveWorkedWith",
  "SOTagsHaveWorkedWith",
  "OpSysPersonal use",
  "OfficeStackAsyncHaveWorkedWith",
  "CommPlatformHaveWorkedWith",
  "AIModelsHaveWorkedWith",
];

// Case-insensitive dedupe map: key -> display value
const items = new Map();

function isBadValue(v) {
  if (v == null) return true;
  const s = String(v).trim();
  if (!s) return true;
  const low = s.toLowerCase();
  return low === "na" || low === "n/a" || low === "null" || low === "undefined";
}

function cleanItem(s) {
  return String(s).trim().replace(/\s+/g, " ").replace(/,+$/, "");
}

function addItem(raw) {
  if (isBadValue(raw)) return;
  const cleaned = cleanItem(raw);
  if (isBadValue(cleaned)) return;

  const key = cleaned.toLowerCase();
  if (!items.has(key)) items.set(key, cleaned);
}

fs.createReadStream(inputPath)
  .pipe(csv())
  .on("data", (row) => {
    for (const col of COLUMNS) {
      const cell = row[col];
      if (isBadValue(cell)) continue;

      // Split values like "microsoft;apple;android"
      const parts = String(cell).split(";");

      for (const part of parts) {
        addItem(part);
      }
    }
  })
  .on("end", () => {
    const titles = Array.from(items.values()).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase()),
    );

    const output = { titles };

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`✅ Extracted ${titles.length} unique technologies`);
    console.log(`📁 Saved to ${outputPath}`);
  })
  .on("error", (err) => {
    console.error("Error processing CSV:", err);
    process.exit(1);
  });
