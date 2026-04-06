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
        <span className="text-sm text-gray-500">1 mile</span>
        <div className="text-center">
          <span className="text-3xl font-bold text-gray-900">{radius}</span>
          <span className="text-gray-500 ml-1 text-sm">miles</span>
        </div>
        <span className="text-sm text-gray-500">100 miles</span>
      </div>

      <input
        type="range"
        min={1}
        max={100}
        step={1}
        value={radius}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#1D9E75] bg-gray-200"
        style={{
          background: `linear-gradient(to right, #1D9E75 0%, #1D9E75 ${radius}%, #e5e7eb ${radius}%, #e5e7eb 100%)`,
        }}
      />

      <div className="flex gap-2 flex-wrap">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`flex-1 min-w-[3.5rem] py-2 text-sm font-medium rounded-lg border transition-all duration-150
              ${radius === p
                ? "bg-[#1D9E75] text-white border-[#1D9E75] shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#1D9E75] hover:text-[#1D9E75]"
              }`}
          >
            {p} mi
          </button>
        ))}
      </div>
    </div>
  );
}
