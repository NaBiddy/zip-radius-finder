"use client";

import dynamic from "next/dynamic";
import type { InputZipCoord } from "@/lib/zipProcessor";

const ResultsMap = dynamic(() => import("./ResultsMap"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-gray-200 bg-gray-50 animate-pulse" style={{ height: 420 }} />
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
    const header = "zipcode\n";
    const body = results.join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zip_radius_${radius}mi_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const preview = results.slice(0, PREVIEW_COUNT);
  const remainder = results.length - PREVIEW_COUNT;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 tabular-nums">
            {inputCount.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">Input zip codes</div>
        </div>
        <div className="bg-[#1D9E75]/5 border border-[#1D9E75]/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#1D9E75] tabular-nums">
            {results.length.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">Zip codes found</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 tabular-nums">
            {radius}
          </div>
          <div className="text-xs text-gray-500 mt-1">Mile radius</div>
        </div>
      </div>

      {/* Map */}
      {inputCoords.length > 0 && (
        <ResultsMap inputCoords={inputCoords} radiusMiles={radius} />
      )}

      {results.length === 0 ? (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-center">
          <p className="text-yellow-800 font-medium">No zip codes found</p>
          <p className="text-yellow-700 text-sm mt-1">
            None of the input zip codes matched any zip codes in our database within {radius} miles.
            Try increasing the radius.
          </p>
        </div>
      ) : (
        <>
          {/* Preview */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Preview{" "}
              <span className="text-gray-400 font-normal">
                (first {Math.min(PREVIEW_COUNT, results.length)} of {results.length.toLocaleString()})
              </span>
            </p>
            <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
              <code className="font-mono text-sm text-green-400 leading-relaxed">
                <span className="text-gray-500 text-xs block mb-2">zipcode</span>
                {preview.map((z) => (
                  <span key={z} className="block">{z}</span>
                ))}
                {remainder > 0 && (
                  <span className="text-gray-500 mt-2 block">
                    ... and {remainder.toLocaleString()} more
                  </span>
                )}
              </code>
            </div>
          </div>

          {/* Download */}
          <button
            onClick={downloadCSV}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-[#1D9E75] text-white font-semibold rounded-xl hover:bg-[#179966] active:scale-[0.99] transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download zip_radius_{radius}mi_results.csv
          </button>
        </>
      )}

      {/* Reset */}
      <button
        onClick={onReset}
        className="w-full py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-colors"
      >
        Run new search
      </button>
    </div>
  );
}
