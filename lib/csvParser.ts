import Papa from "papaparse";

const KNOWN_ZIP_HEADERS = ["zip", "zipcode", "zip_code", "postal_code", "postal"];
const ZIP5_RE = /^\d{5}(-\d{4})?$/;
const DIGIT5_RE = /^\d{5}/;

export interface ParseResult {
  zips: string[];
  detectedColumn: string;
  totalRows: number;
  skippedRows: number;
}

/** Strip ZIP+4 suffix and pad to 5 digits */
function normalizeZip(raw: string): string | null {
  const s = raw.trim();
  const match = s.match(/^(\d{5})(-\d{4})?$/);
  if (match) return match[1];
  // handle zero-padded short zips like "01234"
  const shortMatch = s.match(/^\d{1,5}$/);
  if (shortMatch) return s.padStart(5, "0");
  return null;
}

/**
 * Attempt to auto-detect which column contains zip codes.
 * Returns the column name, or null if not found.
 */
function detectZipColumn(
  headers: string[],
  firstRow: Record<string, string>
): string | null {
  // 1. Try header name match
  for (const h of headers) {
    if (KNOWN_ZIP_HEADERS.includes(h.toLowerCase().trim())) return h;
  }

  // 2. Scan first row values for a 5-digit pattern
  for (const h of headers) {
    const val = (firstRow[h] ?? "").trim();
    if (ZIP5_RE.test(val) || DIGIT5_RE.test(val)) return h;
  }

  return null;
}

export function parseCSVFile(
  file: File,
  columnOverride?: string
): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        try {
          const { data, meta } = results;
          if (!data.length) {
            reject(new Error("CSV file is empty or has no data rows."));
            return;
          }

          const headers: string[] = meta.fields ?? [];
          const firstRow = data[0];

          let col = columnOverride ?? detectZipColumn(headers, firstRow);
          if (!col) {
            reject(
              new Error(
                "Could not detect a zip code column. Please specify the column name manually."
              )
            );
            return;
          }

          // If the override column doesn't exist, tell the user
          if (!headers.includes(col) && columnOverride) {
            reject(
              new Error(
                `Column "${col}" not found in file. Available columns: ${headers.join(", ")}`
              )
            );
            return;
          }

          const seen = new Set<string>();
          let skippedRows = 0;

          for (const row of data) {
            const raw = (row[col] ?? "").toString().trim();
            const zip = normalizeZip(raw);
            if (zip) {
              seen.add(zip);
            } else {
              skippedRows++;
            }
          }

          resolve({
            zips: Array.from(seen),
            detectedColumn: col,
            totalRows: data.length,
            skippedRows,
          });
        } catch (err) {
          reject(err);
        }
      },
      error(err) {
        reject(new Error(`CSV parse error: ${err.message}`));
      },
    });
  });
}
