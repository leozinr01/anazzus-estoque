import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  delta?: number;
  icon?: LucideIcon;
}

export function MetricCard({ label, value, delta, icon: Icon }: Props) {
  const positive = delta !== undefined ? delta >= 0 : null;
  return (
    <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
        {Icon && <Icon size={18} className="text-neutral-400 dark:text-neutral-500" />}
      </div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {delta !== undefined && (
        <div className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${positive ? "text-green-600" : "text-red-600"}`}>
          {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {positive ? "+" : ""}
          {delta.toFixed(1)}% em relação ao mês anterior
        </div>
      )}
    </div>
  );
}
