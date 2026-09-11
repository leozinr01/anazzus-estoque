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
    <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-5 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
        {Icon && (
          <span className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center shrink-0">
            <Icon size={16} className="text-red-600 dark:text-red-400" />
          </span>
        )}
      </div>
      <div className="text-2xl font-bold tracking-tight tabular-nums">{value}</div>
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
