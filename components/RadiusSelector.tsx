"use client";

const PRESETS = [5, 10, 20, 30, 50];

interface Props {
  radius: number;
  onChange: (r: number) => void;
}

export default function RadiusSelector({ radius, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--text-2)" }}>1 mi</span>
        <div className="text-center">
          <span className="text-4xl font-bold tabular-nums" style={{ color: "var(--text-1)" }}>{radius}</span>
          <span className="text-sm ml-1.5" style={{ color: "var(--text-2)" }}>miles</span>
        </div>
        <span className="text-xs" style={{ color: "var(--text-2)" }}>100 mi</span>
      </div>

      <input
        type="range"
        min={1}
        max={100}
        step={1}
        value={radius}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{
          background: `linear-gradient(to right, #1D9E75 0%, #1D9E75 ${radius}%, var(--bg-raised) ${radius}%, var(--bg-raised) 100%)`,
        }}
      />

      <div className="flex gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className="flex-1 py-2 text-xs font-semibold rounded-lg border transition-all duration-150"
            style={{
              background:   radius === p ? "#1D9E75"          : "var(--bg-raised)",
              color:        radius === p ? "#fff"             : "var(--text-2)",
              borderColor:  radius === p ? "#1D9E75"          : "var(--border)",
            }}
          >
            {p} mi
          </button>
        ))}
      </div>
    </div>
  );
}
