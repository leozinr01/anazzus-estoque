import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Receipt, Star, Eye } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useCatalogStore } from "@/store/useCatalogStore";
import { useCustomersStore } from "@/store/useCustomersStore";
import { useSalesStore } from "@/store/useSalesStore";
import { useTeamStore } from "@/store/useTeamStore";
import { useDerivedData } from "@/hooks/useDerivedData";
import { fmtCurrency } from "@/utils/format";

export function Vendas() {
  const navigate = useNavigate();
  const products = useCatalogStore((s) => s.products);
  const sales = useSalesStore((s) => s.sales);
  const salesLoaded = useSalesStore((s) => s.loaded);
  const fetchSales = useSalesStore((s) => s.fetchAll);
  const team = useTeamStore((s) => s.team);
  const teamLoaded = useTeamStore((s) => s.loaded);
  const fetchTeam = useTeamStore((s) => s.fetchAll);
  const customers = useCustomersStore((s) => s.customers);

  const [busca, setBusca] = useState("");
  const [statusF, setStatusF] = useState("Todos");
  const [vendedorF, setVendedorF] = useState("Todos");

  useEffect(() => {
    if (!salesLoaded) fetchSales();
    if (!teamLoaded) fetchTeam();
  }, [salesLoaded, fetchSales, teamLoaded, fetchTeam]);

  const d = useDerivedData(products, sales, team, customers);

  const filtered = sales.filter((s) => {
    if (statusF !== "Todos" && s.status !== statusF) return false;
    if (vendedorF !== "Todos" && s.vendedora?.id !== vendedorF) return false;
    if (busca && !(s.numero.includes(busca) || (s.cliente && s.cliente.nome.toLowerCase().includes(busca.toLowerCase())))) return false;
    return true;
  });

  return (
    <div>
      <PageHeader title="Histórico de Vendas" description={`${filtered.length} vendas encontradas`} />
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar venda..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
          />
        </div>
        <select value={vendedorF} onChange={(e) => setVendedorF(e.target.value)} className="rounded-lg border px-3 py-2.5 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700">
          <option value="Todos">Todas as vendedoras</option>
          {team.map((s) => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="rounded-lg border px-3 py-2.5 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700">
          <option>Todos</option>
          <option>Concluída</option>
          <option>Cancelada</option>
        </select>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-900 text-left text-neutral-500 dark:text-neutral-400">
                <th className="px-5 py-3 font-medium">Número</th>
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Vendedora</th>
                <th className="px-5 py-3 font-medium">Peças</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {filtered.map((s) => (
                <tr key={s.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800/60" onClick={() => navigate(`/vendas/${s.id}`)}>
                  <td className="px-5 py-3 font-medium">{s.numero}</td>
                  <td className="px-5 py-3">{s.data} · {s.hora}</td>
                  <td className="px-5 py-3">{s.cliente ? s.cliente.nome : "Não identificado"}</td>
                  <td className="px-5 py-3">{s.vendedora?.nome || "—"}</td>
                  <td className="px-5 py-3">{s.pecas}</td>
                  <td className="px-5 py-3 text-right font-medium tabular-nums">{fmtCurrency(s.total)}</td>
                  <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-5 py-3">
                    <button
                      className="flex items-center gap-1.5 text-xs font-medium text-neutral-800 dark:text-white hover:underline whitespace-nowrap"
                      onClick={(e) => { e.stopPropagation(); navigate(`/vendas/${s.id}`); }}
                    >
                      <Eye size={15} /> Comprovante
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState icon={Receipt} title="Nenhuma venda encontrada" />}
      </div>

      <h3 className="font-semibold text-sm mt-8 mb-3">Desempenho da equipe</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {d.ranking.map((r: any, i: number) => (
          <div
            key={r.vendedor.id}
            onClick={() => navigate(`/equipe/${r.vendedor.id}`)}
            className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-5 cursor-pointer transition-shadow hover:shadow-sm"
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
              {i === 0 && r.faturamento > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                  <Star size={13} fill="currentColor" /> 1º lugar
                </span>
              )}
            </div>
            <div className="text-xl font-semibold tabular-nums mb-1">{fmtCurrency(r.faturamento)}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
              {r.vendas} vendas · {r.clientesAtendidos} clientes · ticket {fmtCurrency(r.ticketMedio)}
            </div>
            {r.vendedor.meta > 0 ? (
              <>
                <ProgressBar value={r.progresso} />
                <div className="mt-1.5 text-xs font-medium text-red-600">{r.progresso.toFixed(0)}% da meta</div>
              </>
            ) : (
              <div className="mt-1.5 text-xs font-medium text-neutral-400 dark:text-neutral-500">Meta não definida</div>
            )}
          </div>
        ))}
        {d.ranking.length === 0 && (
          <div className="text-sm text-neutral-500 dark:text-neutral-400 col-span-full">Nenhum membro da equipe cadastrado ainda.</div>
        )}
      </div>
    </div>
  );
}
