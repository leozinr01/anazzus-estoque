import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon, title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
      <div className="p-3 rounded-full mb-3 bg-gray-50 dark:bg-neutral-800">
        <Icon size={22} className="text-neutral-400 dark:text-neutral-500" />
      </div>
      <p className="font-medium">{title}</p>
      {description && <p className="text-sm mt-1 text-neutral-500 dark:text-neutral-400">{description}</p>}
    </div>
  );
}
