#!/usr/bin/env node

/**
 * build-zipdb.js
 * Downloads all US zip codes with lat/lng centroids and writes them to
 * /public/zipcodes.json in the format { "10001": [lat, lng], ... }
 *
 * Run: node scripts/build-zipdb.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const SOURCE_URL =
  "https://raw.githubusercontent.com/midwire/free_zipcode_data/master/all_us_zipcodes.csv";
const OUTPUT_PATH = path.join(__dirname, "..", "public", "zipcodes.json");

function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

function parseCSV(csv) {
  const lines = csv.split("\n");
  if (lines.length < 2) throw new Error("CSV has no data rows");

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());

  // Find column indices
  const zipIdx = headers.findIndex((h) =>
    ["zip", "zipcode", "zip_code", "code"].includes(h)
  );
  const latIdx = headers.findIndex((h) => ["lat", "latitude"].includes(h));
  const lngIdx = headers.findIndex((h) =>
    ["lng", "lon", "long", "longitude"].includes(h)
  );

  if (zipIdx === -1) throw new Error(`No zip column found. Headers: ${headers}`);
  if (latIdx === -1) throw new Error(`No lat column found. Headers: ${headers}`);
  if (lngIdx === -1) throw new Error(`No lng column found. Headers: ${headers}`);

  console.log(
    `Columns found — zip: ${headers[zipIdx]} (${zipIdx}), lat: ${headers[latIdx]} (${latIdx}), lng: ${headers[lngIdx]} (${lngIdx})`
  );

  const db = {};
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV split that handles quoted fields
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));

    const zip = cols[zipIdx];
    const lat = parseFloat(cols[latIdx]);
    const lng = parseFloat(cols[lngIdx]);

    if (!zip || zip.length < 5 || isNaN(lat) || isNaN(lng)) {
      skipped++;
      continue;
    }

    // Zero-pad to 5 digits
    const zipPadded = zip.toString().padStart(5, "0").slice(0, 5);

    db[zipPadded] = [parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6))];
  }

  return { db, skipped };
}

async function main() {
  console.log("Fetching zip code data from GitHub...");
  console.log(`Source: ${SOURCE_URL}`);

  let csv;
  try {
    csv = await fetchCSV(SOURCE_URL);
  } catch (err) {
    console.error("Failed to fetch CSV:", err.message);
    process.exit(1);
  }

  console.log(`Downloaded ${(csv.length / 1024).toFixed(1)} KB`);
  console.log("Parsing CSV...");

  let db, skipped;
  try {
    ({ db, skipped } = parseCSV(csv));
  } catch (err) {
    console.error("Failed to parse CSV:", err.message);
    process.exit(1);
  }

  const count = Object.keys(db).length;
  console.log(`Parsed ${count} valid zip codes (skipped ${skipped} invalid rows)`);

  const publicDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(db), "utf8");
  const sizeKB = (fs.statSync(OUTPUT_PATH).size / 1024).toFixed(1);
  console.log(`Written to ${OUTPUT_PATH} (${sizeKB} KB)`);
  console.log("Done!");
}

main();
