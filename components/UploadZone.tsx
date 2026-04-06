"use client";

import { useCallback, useRef, useState } from "react";
import { parseCSVFile, ParseResult } from "@/lib/csvParser";

interface Props {
  onParsed: (result: ParseResult, file: File) => void;
}

export default function UploadZone({ onParsed }: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [columnOverride, setColumnOverride] = useState("");
  const [showOverride, setShowOverride] = useState(false);
  const fileRef = useRef<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File, override?: string) => {
      if (!file.name.match(/\.csv$/i)) {
        setError("Please upload a .csv file.");
        return;
      }
      setError(null);
      setLoading(true);
      setFileName(file.name);
      fileRef.current = file;
      try {
        const result = await parseCSVFile(file, override || undefined);
        if (result.zips.length === 0) {
          setError(
            `No valid zip codes found in column "${result.detectedColumn}". Try overriding the column name.`
          );
          setShowOverride(true);
          setParsed(null);
        } else {
          setParsed(result);
          setShowOverride(false);
          onParsed(result, file);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        setShowOverride(true);
        setParsed(null);
      } finally {
        setLoading(false);
      }
    },
    [onParsed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleRetry = () => {
    if (fileRef.current) processFile(fileRef.current, columnOverride || undefined);
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 select-none
          ${dragging ? "border-[#1D9E75] bg-[#1D9E75]/5 scale-[1.01]" : "border-gray-200 hover:border-[#1D9E75] hover:bg-gray-50"}
          ${loading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleChange}
        />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${dragging ? "bg-[#1D9E75]/10" : "bg-gray-100"}`}>
            <svg className={`w-7 h-7 ${dragging ? "text-[#1D9E75]" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          {loading ? (
            <p className="text-gray-500 text-sm">Parsing CSV...</p>
          ) : (
            <>
              <p className="text-gray-700 font-medium">
                Drop your CSV file here, or{" "}
                <span className="text-[#1D9E75] underline underline-offset-2">browse</span>
              </p>
              <p className="text-gray-400 text-sm">.csv files only</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {showOverride && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
          <p className="text-sm text-gray-600 font-medium">Override column name</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. zip_code"
              value={columnOverride}
              onChange={(e) => setColumnOverride(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40 focus:border-[#1D9E75]"
            />
            <button
              onClick={handleRetry}
              disabled={!columnOverride}
              className="px-4 py-2 bg-[#1D9E75] text-white text-sm rounded-lg hover:bg-[#179966] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {parsed && (
        <div className="rounded-lg border border-[#1D9E75]/30 bg-[#1D9E75]/5 p-4 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-[#1D9E75] flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 truncate max-w-xs">{fileName}</p>
            <p className="text-sm text-gray-600 mt-0.5">
              <span className="font-medium text-[#1D9E75]">{parsed.zips.length.toLocaleString()}</span> unique zip codes detected
              {" "}from column <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-xs font-mono">{parsed.detectedColumn}</code>
            </p>
            {parsed.skippedRows > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {parsed.skippedRows} rows skipped (no valid zip code)
              </p>
            )}
            <button
              onClick={() => {
                setShowOverride(!showOverride);
                setColumnOverride("");
              }}
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
