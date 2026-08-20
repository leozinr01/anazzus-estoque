export function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-neutral-800">
      <div className="h-2 rounded-full bg-red-600 transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}
