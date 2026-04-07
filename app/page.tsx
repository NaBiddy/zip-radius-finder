"use client";

import { useState, useCallback } from "react";
import UploadZone from "@/components/UploadZone";
import RadiusSelector from "@/components/RadiusSelector";
import ProgressBar from "@/components/ProgressBar";
import ResultsPanel from "@/components/ResultsPanel";
import { ParseResult } from "@/lib/csvParser";
import { loadZipDB, findZipsInRadius, getInputCoords, InputZipCoord } from "@/lib/zipProcessor";

type AppStage = "upload" | "configure" | "processing" | "results";

function StepBadge({ n, active, complete }: { n: number; active: boolean; complete: boolean }) {
  return (
    <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center border-2 transition-all ${
      active    ? "border-[#1D9E75] bg-[#1D9E75] text-white" :
      complete  ? "border-[#1D9E75] text-[#1D9E75]" :
                  "border-[#30363D] text-[#8B949E]"
    }`}>
      {complete ? (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : n}
    </div>
  );
}

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
        onProgress: (processed, total) => setProgress({ processed, total }),
      });
      setProcessStatus("done");
      setProgress({ processed: parseResult.zips.length, total: parseResult.zips.length });
      setResults(found);
      setStage("results");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Check the console for details.");
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

  const steps = [
    { n: 1, label: "Upload CSV",      s: "upload" },
    { n: 2, label: "Set Radius",      s: "configure" },
    { n: 3, label: "Find & Download", s: "results" },
  ];

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>

      {/* Header */}
      <header style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }} className="sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#1D9E75] rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>Zip Radius Finder</span>
          </div>
          <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: "var(--bg-raised)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
            Meta Ad Targeting
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Hero — only on upload step */}
        {stage === "upload" && (
          <div className="rounded-2xl p-6 space-y-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-1)" }}>
                Find every zip code within your radius
              </h1>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
                Upload a list of your client locations, set a mile radius, and this tool will instantly find every US zip code whose centroid falls within that radius — deduplicated and ready to paste into Meta Ads Manager.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12", label: "Upload your CSV", desc: "Any CSV with a zip code column" },
                { icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7", label: "Set a radius", desc: "From 1 to 100 miles" },
                { icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4", label: "Download results", desc: "Clean CSV, sorted & deduped" },
              ].map(({ icon, label, desc }, i) => (
                <div key={i} className="rounded-xl p-3.5 space-y-2" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                  <div className="w-7 h-7 rounded-lg bg-[#1D9E75]/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#1D9E75]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-1">
          {steps.map(({ n, label, s }, i) => {
            const isActive   = stage === s || (s === "results" && (stage === "processing" || stage === "results"));
            const isComplete = (s === "upload" && stage !== "upload") || (s === "configure" && (stage === "processing" || stage === "results"));
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 ${isActive || isComplete ? "text-[#1D9E75]" : ""}`} style={{ color: isActive || isComplete ? "#1D9E75" : "var(--text-2)" }}>
                  <StepBadge n={n} active={isActive} complete={isComplete} />
                  <span className="text-xs font-medium hidden sm:inline">{label}</span>
                </div>
                {i < steps.length - 1 && <div className="w-8 h-px" style={{ background: "var(--border)" }} />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Upload */}
        {(stage === "upload" || stage === "configure") && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <StepBadge n={1} active={stage === "upload"} complete={stage === "configure"} />
              <h2 className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>Upload zip code CSV</h2>
            </div>
            <div className="p-5">
              <UploadZone onParsed={handleParsed} />
            </div>
          </div>
        )}

        {/* Step 2: Radius */}
        {stage === "configure" && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <StepBadge n={2} active={true} complete={false} />
              <h2 className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>Set search radius</h2>
            </div>
            <div className="p-5">
              <RadiusSelector radius={radius} onChange={setRadius} />
            </div>
          </div>
        )}

        {/* Find button */}
        {stage === "configure" && parseResult && (
          <button
            onClick={handleFindZips}
            className="w-full py-3.5 font-bold text-sm rounded-2xl transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.99]"
            style={{ background: "#1D9E75", color: "#fff" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#179966")}
            onMouseLeave={e => (e.currentTarget.style.background = "#1D9E75")}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Find zip codes within {radius} miles
          </button>
        )}

        {/* Step 3: Processing */}
        {stage === "processing" && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <StepBadge n={3} active={true} complete={false} />
              <h2 className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>Finding zip codes</h2>
            </div>
            <div className="p-5">
              <ProgressBar processed={progress.processed} total={progress.total} status={processStatus} />
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {stage === "results" && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <StepBadge n={3} active={false} complete={true} />
              <h2 className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>Results</h2>
            </div>
            <div className="p-5">
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

        <p className="text-center text-xs pb-4" style={{ color: "var(--text-2)" }}>
          All processing happens in your browser · No data leaves your machine
        </p>
      </div>
    </main>
  );
}
