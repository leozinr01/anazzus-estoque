import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: Props) {
  return (
    <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">{title}</h1>
        {description && <p className="text-sm mt-1 text-neutral-500 dark:text-neutral-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}
