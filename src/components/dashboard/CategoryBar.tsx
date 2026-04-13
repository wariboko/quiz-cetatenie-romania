"use client";

interface CategoryBarProps {
  category: string;
  seen: number;
  total: number;
  mastered: number;
  score: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Constitution: "bg-purple-500",
  Culture: "bg-yellow-500",
  Geography: "bg-teal-500",
  History: "bg-orange-500",
};

export function CategoryBar({ category, seen, total, score }: CategoryBarProps) {
  const pct = Math.round(score * 100);
  const seenPct = Math.round((seen / total) * 100);
  const barColor = CATEGORY_COLORS[category] ?? "bg-blue-500";

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-gray-700">{category}</span>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{seen}/{total} seen</span>
          <span className="font-semibold text-gray-700">{pct}%</span>
        </div>
      </div>

      {/* Background bar (seen vs unseen) */}
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden relative">
        {/* Seen portion */}
        <div
          className="absolute inset-y-0 left-0 bg-gray-200 rounded-full transition-all duration-500"
          style={{ width: `${seenPct}%` }}
        />
        {/* Mastery within seen */}
        <div
          className={`absolute inset-y-0 left-0 ${barColor} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
