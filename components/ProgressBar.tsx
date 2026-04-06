"use client";

interface Props {
  processed: number;
  total: number;
  status: "loading-db" | "processing" | "done";
}

export default function ProgressBar({ processed, total, status }: Props) {
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="space-y-3">
      {status === "loading-db" ? (
        <div className="flex items-center gap-3">
          <svg className="w-4 h-4 text-[#1D9E75] animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-gray-600">Loading zip code database...</span>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">
              {status === "done"
                ? "Processing complete"
                : `Processing zip codes...`}
            </span>
            <span className="font-semibold text-gray-800 tabular-nums">
              {processed.toLocaleString()} / {total.toLocaleString()}
            </span>
          </div>

          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${status === "done" ? "bg-[#1D9E75]" : "bg-[#1D9E75] animate-pulse"}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="text-right text-xs text-gray-400 tabular-nums">{pct}%</div>
        </>
      )}
    </div>
  );
}
