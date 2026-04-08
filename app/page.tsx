"use client";

import { useState, useCallback, useRef } from "react";
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
  const [showTopBar, setShowTopBar] = useState(false);
  const topBarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleParsed = useCallback((result: ParseResult) => {
    setParseResult(result);
    setStage("configure");
  }, []);

  const handleFindZips = useCallback(async () => {
    if (!parseResult) return;
    setStage("processing");
    setProcessStatus("loading-db");
    setProgress({ processed: 0, total: parseResult.zips.length });
    topBarTimer.current = setTimeout(() => setShowTopBar(true), 1000);
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
      if (topBarTimer.current) clearTimeout(topBarTimer.current);
      setShowTopBar(false);
      setStage("results");
    } catch (err) {
      console.error(err);
      if (topBarTimer.current) clearTimeout(topBarTimer.current);
      setShowTopBar(false);
      alert("Something went wrong. Check the console for details.");
      setStage("configure");
    }
  }, [parseResult, radius]);

  const handleDemo = useCallback(() => {
    handleParsed({
      zips: ["90027", "90802", "55906", "55414", "80014", "59715"],
      detectedColumn: "demo",
      totalRows: 6,
      skippedRows: 0,
    });
  }, [handleParsed]);

  const handleReset = useCallback(() => {
    setStage("upload");
    setParseResult(null);
    setRadius(20);
    setProgress({ processed: 0, total: 0 });
    setResults([]);
    setInputCoords([]);
    setShowTopBar(false);
    setProcessStatus("loading-db");
  }, []);

  const steps = [
    { n: 1, label: "Upload CSV",      s: "upload" },
    { n: 2, label: "Set Radius",      s: "configure" },
    { n: 3, label: "Find & Download", s: "results" },
  ];

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>

      {/* Top loading bar — appears after 1s if still processing */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-[2px] transition-opacity duration-300"
        style={{ opacity: showTopBar ? 1 : 0, pointerEvents: "none", background: "var(--border)" }}
      >
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: progress.total > 0 ? `${Math.round((progress.processed / progress.total) * 100)}%` : "15%",
            background: "linear-gradient(to right, #1D9E75, #25c98f)",
            boxShadow: "0 0 8px rgba(29,158,117,0.6)",
          }}
        />
      </div>

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
          <span className="hidden sm:inline text-xs font-mono px-2 py-1 rounded" style={{ background: "var(--bg-raised)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12", label: "Upload your CSV", desc: "Any CSV with a zip code column" },
                { icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7", label: "Set a radius", desc: "From 1 to 100 miles" },
                { icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4", label: "Download results", desc: "Clean CSV, sorted & deduped" },
              ].map(({ icon, label, desc }, i) => (
                <div key={i} className="rounded-xl p-3 sm:p-3.5 flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                  <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-[#1D9E75]/10 flex items-center justify-center flex-shrink-0">
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
            <div className="p-5 space-y-4">
              <UploadZone onParsed={handleParsed} />
              {stage === "upload" && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                  <span className="text-xs" style={{ color: "var(--text-2)" }}>or</span>
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                </div>
              )}
              {stage === "upload" && (
                <button
                  onClick={handleDemo}
                  className="w-full py-2.5 text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                  style={{ border: "1px solid var(--border)", color: "var(--text-2)", background: "transparent" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#1D9E75"; e.currentTarget.style.color = "#1D9E75"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-2)"; }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Don't have a file? Try a demo with sample zip codes
                </button>
              )}
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

        <p className="text-center text-xs" style={{ color: "var(--text-2)" }}>
          All processing happens in your browser · No data leaves your machine
        </p>

        {/* Contact */}
        <div className="flex flex-col items-center gap-3 pb-8">
          <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>Contact me</p>
          <a
            href="https://www.linkedin.com/in/nathan-bidinger-59769712a/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-75 active:opacity-50"
            aria-label="LinkedIn profile"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
              <rect width="40" height="40" rx="8" fill="#0A66C2" />
              <path fill="#fff" d="M13.5 16.5h-3v10h3v-10zm-1.5-1a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5zm15 11h-3v-5c0-1.2-.02-2.75-1.68-2.75-1.68 0-1.93 1.31-1.93 2.66v5.09h-3v-10h2.88v1.36h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.59v5.61z"/>
            </svg>
          </a>
        </div>
      </div>
    </main>
  );
}
