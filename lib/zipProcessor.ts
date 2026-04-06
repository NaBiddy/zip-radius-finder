import { haversineDistance } from "./haversine";

type ZipDB = Record<string, [number, number]>;

export interface InputZipCoord {
  zip: string;
  lat: number;
  lng: number;
}

let cachedDB: ZipDB | null = null;

export async function loadZipDB(): Promise<ZipDB> {
  if (cachedDB) return cachedDB;
  const res = await fetch("/zipcodes.json");
  if (!res.ok) throw new Error(`Failed to load zip database: ${res.status}`);
  cachedDB = await res.json();
  return cachedDB!;
}

export interface ProcessOptions {
  inputZips: string[];
  radiusMiles: number;
  db: ZipDB;
  onProgress: (processed: number, total: number) => void;
}

const CHUNK_SIZE = 50;

/** Yield control to the browser between chunks */
function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function findZipsInRadius({
  inputZips,
  radiusMiles,
  db,
  onProgress,
}: ProcessOptions): Promise<string[]> {
  // Pre-fetch coordinates for all input zips, skip unknowns silently
  const inputCoords: Array<{ zip: string; lat: number; lng: number }> = [];
  for (const z of inputZips) {
    const entry = db[z];
    if (entry) inputCoords.push({ zip: z, lat: entry[0], lng: entry[1] });
  }

  if (!inputCoords.length) return [];

  const allZipEntries = Object.entries(db) as Array<[string, [number, number]]>;
  const found = new Set<string>();

  for (let i = 0; i < inputCoords.length; i += CHUNK_SIZE) {
    const chunk = inputCoords.slice(i, i + CHUNK_SIZE);

    for (const { lat: iLat, lng: iLng } of chunk) {
      for (const [zip, [cLat, cLng]] of allZipEntries) {
        if (haversineDistance(iLat, iLng, cLat, cLng) <= radiusMiles) {
          found.add(zip);
        }
      }
    }

    onProgress(Math.min(i + CHUNK_SIZE, inputCoords.length), inputCoords.length);
    await yieldToBrowser();
  }

  return Array.from(found).sort();
}

/** Extract lat/lng for a list of zip codes from the (already-loaded) DB. */
export function getInputCoords(zips: string[], db: Awaited<ReturnType<typeof loadZipDB>>): InputZipCoord[] {
  return zips.flatMap((z) => {
    const entry = db[z];
    return entry ? [{ zip: z, lat: entry[0], lng: entry[1] }] : [];
  });
}
