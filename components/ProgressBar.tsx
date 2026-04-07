"use client";

interface Props {
  processed: number;
  total: number;
  status: "loading-db" | "processing" | "done";
}

export default function ProgressBar({ processed, total, status }: Props) {
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {status === "loading-db" ? (
        <div className="flex items-center gap-3">
          <svg className="w-4 h-4 text-[#1D9E75] animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm" style={{ color: "var(--text-2)" }}>Loading zip code database...</span>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: "var(--text-2)" }}>
              {status === "done" ? "Complete" : "Processing zip codes..."}
            </span>
            <span className="text-sm font-semibold tabular-nums font-mono" style={{ color: "var(--text-1)" }}>
              {processed.toLocaleString()} / {total.toLocaleString()}
            </span>
          </div>

          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-raised)" }}>
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${status !== "done" ? "animate-pulse" : ""}`}
              style={{ width: `${pct}%`, background: "#1D9E75" }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full"
                  style={{ background: i < Math.round(pct / 5) ? "#1D9E75" : "var(--border)" }}
                />
              ))}
            </div>
            <span className="text-xs tabular-nums font-mono" style={{ color: "var(--text-2)" }}>{pct}%</span>
          </div>
        </>
      )}
    </div>
  );
}
