"use client";

import dynamic from "next/dynamic";
import type { InputZipCoord } from "@/lib/zipProcessor";

const ResultsMap = dynamic(() => import("./ResultsMap"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl animate-pulse" style={{ height: 420, background: "var(--bg-raised)", border: "1px solid var(--border)" }} />
  ),
});

const PREVIEW_COUNT = 30;

interface Props {
  results: string[];
  inputCoords: InputZipCoord[];
  inputCount: number;
  radius: number;
  onReset: () => void;
}

export default function ResultsPanel({ results, inputCoords, inputCount, radius, onReset }: Props) {
  const downloadCSV = () => {
    const blob = new Blob(["zipcode\n" + results.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `zip_radius_${radius}mi_results.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const preview   = results.slice(0, PREVIEW_COUNT);
  const remainder = results.length - PREVIEW_COUNT;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { value: inputCount.toLocaleString(),     label: "Input zips",  accent: false },
          { value: results.length.toLocaleString(), label: "Zips found",  accent: true  },
          { value: `${radius} mi`,                  label: "Radius",      accent: false },
        ].map(({ value, label, accent }) => (
          <div key={label} className="rounded-xl p-3 sm:p-4 text-center" style={{
            background: accent ? "rgba(29,158,117,0.08)" : "var(--bg-raised)",
            border:     `1px solid ${accent ? "rgba(29,158,117,0.25)" : "var(--border)"}`,
          }}>
            <div className="text-lg sm:text-2xl font-bold tabular-nums leading-tight" style={{ color: accent ? "#1D9E75" : "var(--text-1)" }}>{value}</div>
            <div className="text-xs mt-1" style={{ color: "var(--text-2)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Map */}
      {inputCoords.length > 0 && <ResultsMap inputCoords={inputCoords} radiusMiles={radius} />}

      {results.length === 0 ? (
        <div className="rounded-xl p-5 text-center" style={{ background: "rgba(210,153,34,0.08)", border: "1px solid rgba(210,153,34,0.25)" }}>
          <p className="font-semibold text-sm" style={{ color: "#d2992a" }}>No zip codes found</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
            Try increasing the radius — none of the input zip codes had matches within {radius} miles.
          </p>
        </div>
      ) : (
        <>
          {/* Download — right below the map */}
          <button
            onClick={downloadCSV}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 font-semibold text-sm rounded-xl transition-all active:scale-[0.99]"
            style={{ background: "#1D9E75", color: "#fff" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#179966")}
            onMouseLeave={e => (e.currentTarget.style.background = "#1D9E75")}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="truncate">Download zip_radius_{radius}mi_results.csv</span>
          </button>

          {/* Preview */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--text-2)" }}>
              Preview — first {Math.min(PREVIEW_COUNT, results.length)} of {results.length.toLocaleString()} results
            </p>
            <div className="rounded-xl p-4 overflow-x-auto" style={{ background: "#0D1117", border: "1px solid var(--border)" }}>
              <code className="font-mono text-sm leading-relaxed" style={{ color: "#1D9E75" }}>
                <span className="block text-xs mb-2" style={{ color: "var(--text-2)" }}>zipcode</span>
                {preview.map((z) => <span key={z} className="block">{z}</span>)}
                {remainder > 0 && (
                  <span className="block mt-2" style={{ color: "var(--text-2)" }}>... and {remainder.toLocaleString()} more</span>
                )}
              </code>
            </div>
          </div>
        </>
      )}

      {/* Reset */}
      <button
        onClick={onReset}
        className="w-full py-2.5 text-sm rounded-xl transition-colors"
        style={{ border: "1px solid var(--border)", color: "var(--text-2)", background: "transparent" }}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-raised)"; e.currentTarget.style.color = "var(--text-1)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent";       e.currentTarget.style.color = "var(--text-2)"; }}
      >
        Run new search
      </button>
    </div>
  );
}
