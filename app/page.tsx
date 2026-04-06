"use client";

import { useState, useCallback } from "react";
import UploadZone from "@/components/UploadZone";
import RadiusSelector from "@/components/RadiusSelector";
import ProgressBar from "@/components/ProgressBar";
import ResultsPanel from "@/components/ResultsPanel";
import { ParseResult } from "@/lib/csvParser";
import { loadZipDB, findZipsInRadius, getInputCoords, InputZipCoord } from "@/lib/zipProcessor";

type AppStage = "upload" | "configure" | "processing" | "results";

export default function Home() {
  const [stage, setStage] = useState<AppStage>("upload");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [radius, setRadius] = useState(20);
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  const [processStatus, setProcessStatus] = useState<"loading-db" | "processing" | "done">("loading-db");
  const [results, setResults] = useState<string[]>([]);
  const [inputCoords, setInputCoords] = useState<InputZipCoord[]>([]);

  const handleParsed = useCallback((result: ParseResult) => {
    setParseResult(result);
    setStage("configure");
  }, []);

  const handleFindZips = useCallback(async () => {
    if (!parseResult) return;

    setStage("processing");
    setProcessStatus("loading-db");
    setProgress({ processed: 0, total: parseResult.zips.length });

    try {
      const db = await loadZipDB();
      setInputCoords(getInputCoords(parseResult.zips, db));
      setProcessStatus("processing");

      const found = await findZipsInRadius({
        inputZips: parseResult.zips,
        radiusMiles: radius,
        db,
        onProgress: (processed, total) => {
          setProgress({ processed, total });
        },
      });

      setProcessStatus("done");
      setProgress({ processed: parseResult.zips.length, total: parseResult.zips.length });
      setResults(found);
      setStage("results");
    } catch (err) {
      console.error(err);
      alert("Something went wrong processing zip codes. Check the console for details.");
      setStage("configure");
    }
  }, [parseResult, radius]);

  const handleReset = useCallback(() => {
    setStage("upload");
    setParseResult(null);
    setRadius(20);
    setProgress({ processed: 0, total: 0 });
    setResults([]);
    setInputCoords([]);
    setProcessStatus("loading-db");
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1D9E75] rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-none">Zip Radius Finder</h1>
            <p className="text-xs text-gray-400 mt-0.5">Meta ad targeting · US zip codes</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {/* Step indicators */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
          {[
            { n: 1, label: "Upload CSV", s: "upload" },
            { n: 2, label: "Set Radius", s: "configure" },
            { n: 3, label: "Find & Download", s: "results" },
          ].map(({ n, label, s }, i, arr) => {
            const isActive = stage === s || (s === "results" && (stage === "processing" || stage === "results"));
            const isComplete =
              (s === "upload" && stage !== "upload") ||
              (s === "configure" && (stage === "processing" || stage === "results"));

            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 ${isActive ? "text-[#1D9E75]" : isComplete ? "text-[#1D9E75]" : "text-gray-300"}`}>
                  <div className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border-2 transition-colors ${
                    isActive
                      ? "border-[#1D9E75] bg-[#1D9E75] text-white"
                      : isComplete
                      ? "border-[#1D9E75] text-[#1D9E75]"
                      : "border-gray-300 text-gray-300"
                  }`}>
                    {isComplete ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : n}
                  </div>
                  <span className="font-medium hidden sm:inline">{label}</span>
                </div>
                {i < arr.length - 1 && <div className="w-6 h-px bg-gray-200" />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Upload */}
        {(stage === "upload" || stage === "configure") && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="w-6 h-6 bg-[#1D9E75] text-white text-xs font-bold rounded-full flex items-center justify-center">1</span>
              <h2 className="font-semibold text-gray-900">Upload zip code CSV</h2>
            </div>
            <div className="p-6">
              <UploadZone onParsed={handleParsed} />
            </div>
          </div>
        )}

        {/* Step 2: Set Radius */}
        {stage === "configure" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="w-6 h-6 bg-[#1D9E75] text-white text-xs font-bold rounded-full flex items-center justify-center">2</span>
              <h2 className="font-semibold text-gray-900">Set search radius</h2>
            </div>
            <div className="p-6">
              <RadiusSelector radius={radius} onChange={setRadius} />
            </div>
          </div>
        )}

        {/* Find button */}
        {stage === "configure" && parseResult && (
          <button
            onClick={handleFindZips}
            className="w-full py-4 bg-[#1D9E75] hover:bg-[#179966] active:scale-[0.99] text-white font-bold text-base rounded-2xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Find zip codes within {radius} miles
          </button>
        )}

        {/* Step 3: Processing */}
        {stage === "processing" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="w-6 h-6 bg-[#1D9E75] text-white text-xs font-bold rounded-full flex items-center justify-center">3</span>
              <h2 className="font-semibold text-gray-900">Finding zip codes</h2>
            </div>
            <div className="p-6">
              <ProgressBar
                processed={progress.processed}
                total={progress.total}
                status={processStatus}
              />
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {stage === "results" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="w-6 h-6 bg-[#1D9E75] text-white text-xs font-bold rounded-full flex items-center justify-center">3</span>
              <h2 className="font-semibold text-gray-900">Results</h2>
            </div>
            <div className="p-6">
              <ResultsPanel
                results={results}
                inputCoords={inputCoords}
                inputCount={parseResult?.zips.length ?? 0}
                radius={radius}
                onReset={handleReset}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pt-4">
          All processing happens in your browser · No data is uploaded anywhere
        </p>
      </div>
    </main>
  );
}
