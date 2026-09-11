import { Menu } from "lucide-react";
import { Brand } from "@/components/ui/Brand";

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-neutral-800">
      <button onClick={onOpenMenu} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800">
        <Menu size={18} />
      </button>
      <Brand className="text-lg" />
      <span className="w-8" />
    </div>
  );
}
