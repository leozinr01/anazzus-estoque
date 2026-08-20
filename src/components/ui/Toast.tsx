import { CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
      {toasts.map((tst) => (
        <div
          key={tst.id}
          className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm border border-neutral-800"
        >
          <CheckCircle2 size={16} className="text-red-500 shrink-0" />
          {tst.msg}
        </div>
      ))}
    </div>
  );
}
