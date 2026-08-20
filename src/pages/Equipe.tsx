import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAppStore } from "@/store/useAppStore";
import { useDerivedData } from "@/hooks/useDerivedData";
import { fmtCurrency } from "@/utils/format";

export function Equipe() {
  const navigate = useNavigate();
  const products = useAppStore((s) => s.products);
  const d = useDerivedData(products);

  return (
    <div>
      <PageHeader title="Equipe" description="Desempenho mensal da equipe Anazzus" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {d.ranking.map((r: any, i: number) => (
          <div
            key={r.vendedor.id}
            onClick={() => navigate(`/equipe/${r.vendedor.id}`)}
            className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 cursor-pointer transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-800 text-white flex items-center justify-center font-semibold">
                  {r.vendedor.nome[0]}
                </div>
                <div>
                  <div className="font-semibold">{r.vendedor.nome}</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">{r.vendedor.cargo}</div>
                </div>
              </div>
              {i === 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                  <Star size={13} fill="currentColor" /> 1º lugar
                </span>
              )}
            </div>
            <div className="text-xl font-semibold tabular-nums mb-1">{fmtCurrency(r.faturamento)}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
              {r.vendas} vendas · {r.clientesAtendidos} clientes · ticket {fmtCurrency(r.ticketMedio)}
            </div>
            <ProgressBar value={r.progresso} />
            <div className="mt-1.5 text-xs font-medium text-red-600">{r.progresso.toFixed(0)}% da meta</div>
          </div>
        ))}
      </div>
    </div>
  );
}
