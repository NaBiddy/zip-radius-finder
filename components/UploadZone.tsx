"use client";

import { useCallback, useRef, useState } from "react";
import { parseCSVFile, ParseResult } from "@/lib/csvParser";

interface Props {
  onParsed: (result: ParseResult, file: File) => void;
}

export default function UploadZone({ onParsed }: Props) {
  const [dragging, setDragging]         = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [loading, setLoading]           = useState(false);
  const [parsed, setParsed]             = useState<ParseResult | null>(null);
  const [fileName, setFileName]         = useState<string>("");
  const [columnOverride, setColumnOverride] = useState("");
  const [showOverride, setShowOverride] = useState(false);
  const fileRef  = useRef<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File, override?: string) => {
    if (!file.name.match(/\.csv$/i)) { setError("Please upload a .csv file."); return; }
    setError(null); setLoading(true); setFileName(file.name); fileRef.current = file;
    try {
      const result = await parseCSVFile(file, override || undefined);
      if (result.zips.length === 0) {
        setError(`No valid zip codes found in column "${result.detectedColumn}". Try overriding the column name.`);
        setShowOverride(true); setParsed(null);
      } else {
        setParsed(result); setShowOverride(false); onParsed(result, file);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setShowOverride(true); setParsed(null);
    } finally { setLoading(false); }
  }, [onParsed]);

  const handleDrop   = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0]; if (file) processFile(file);
  }, [processFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 select-none ${loading ? "pointer-events-none opacity-50" : ""}`}
        style={{
          borderColor:     dragging ? "#1D9E75" : "var(--border)",
          background:      dragging ? "rgba(29,158,117,0.06)" : "var(--bg-raised)",
          transform:       dragging ? "scale(1.01)" : "scale(1)",
        }}
      >
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} />
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: dragging ? "rgba(29,158,117,0.15)" : "var(--bg-card)" }}>
            <svg className="w-6 h-6" style={{ color: dragging ? "#1D9E75" : "var(--text-2)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          {loading ? (
            <p className="text-sm" style={{ color: "var(--text-2)" }}>Parsing CSV...</p>
          ) : (
            <>
              <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
                Drop your CSV here, or{" "}
                <span className="text-[#1D9E75] underline underline-offset-2">browse</span>
              </p>
              <p className="text-xs" style={{ color: "var(--text-2)" }}>.csv files only · zip, zipcode, zip_code, postal columns auto-detected</p>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg p-3.5 text-sm" style={{ background: "rgba(248,81,73,0.1)", border: "1px solid rgba(248,81,73,0.3)", color: "#f85149" }}>
          {error}
        </div>
      )}

      {/* Column override */}
      {showOverride && (
        <div className="rounded-lg p-4 space-y-2.5" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-medium" style={{ color: "var(--text-2)" }}>Override column name</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. zip_code"
              value={columnOverride}
              onChange={(e) => setColumnOverride(e.target.value)}
              className="flex-1 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-1)" }}
            />
            <button
              onClick={() => fileRef.current && processFile(fileRef.current, columnOverride || undefined)}
              disabled={!columnOverride}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "#1D9E75", color: "#fff" }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Success state */}
      {parsed && (
        <div className="rounded-lg p-4 flex items-start gap-3" style={{ background: "rgba(29,158,117,0.08)", border: "1px solid rgba(29,158,117,0.25)" }}>
          <div className="w-5 h-5 rounded-full bg-[#1D9E75] flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold truncate max-w-xs" style={{ color: "var(--text-1)" }}>{fileName}</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>
              <span className="font-semibold text-[#1D9E75]">{parsed.zips.length.toLocaleString()}</span> unique zip codes from column{" "}
              <code className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-1)" }}>{parsed.detectedColumn}</code>
            </p>
            {parsed.skippedRows > 0 && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>{parsed.skippedRows} rows skipped</p>
            )}
            <button
              onClick={() => { setShowOverride(!showOverride); setColumnOverride(""); }}
              className="text-xs text-[#1D9E75] underline underline-offset-2 mt-1"
            >
              Wrong column? Change it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
