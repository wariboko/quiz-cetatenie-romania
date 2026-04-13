"use client";

interface MasteryRingProps {
  score: number; // 0–1
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function MasteryRing({
  score,
  size = 140,
  strokeWidth = 12,
  label = "Overall Mastery",
}: MasteryRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - score * circumference;
  const pct = Math.round(score * 100);

  const color = pct >= 80 ? "#22c55e" : pct >= 50 ? "#3b82f6" : pct >= 25 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="text-center -mt-[calc(140px/2+4px)]" style={{ marginTop: `-${size / 2 + 4}px` }}>
        <p className="text-3xl font-bold text-gray-900">{pct}%</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}
