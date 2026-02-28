/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const csv = require("csv-parser");

if (process.argv.length < 5) {
  console.error(
    "Usage: node scripts/csv-to-json.js <input-file.csv> <column-name> <output-file-name.json>",
  );
  process.exit(1);
}

const inputPath = process.argv[2];
const columnName = process.argv[3];
const outputFileName = process.argv[4];

// Output to /data/<filename>
const outputPath = path.join(__dirname, "../data", outputFileName);

const titlesSet = new Map(); // key: lowercase, value: original cleaned

function cleanTitle(title) {
  return title
    .trim()
    .replace(/\s+/g, " ") // collapse whitespace
    .replace(/,+$/, ""); // remove trailing commas
}

fs.createReadStream(inputPath)
  .pipe(csv())
  .on("data", (row) => {
    const rawValue = row[columnName];
    if (!rawValue) return;

    const cleaned = cleanTitle(rawValue);
    const key = cleaned.toLowerCase();

    if (!titlesSet.has(key)) {
      titlesSet.set(key, cleaned);
    }
  })
  .on("end", () => {
    const titles = Array.from(titlesSet.values()).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase()),
    );

    const output = { titles };

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`✅ Extracted ${titles.length} unique entries`);
    console.log(`📁 Saved to ${outputPath}`);
  })
  .on("error", (err) => {
    console.error("Error processing CSV:", err);
  });
