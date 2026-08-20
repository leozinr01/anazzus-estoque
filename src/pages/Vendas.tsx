import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Receipt } from "lucide-react";
import { SALES } from "@/data/sales";
import { TEAM } from "@/data/team";
import { fmtCurrency } from "@/utils/format";

export function Vendas() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [statusF, setStatusF] = useState("Todos");
  const [vendedorF, setVendedorF] = useState("Todos");

  const filtered = SALES.filter((s) => {
    if (statusF !== "Todos" && s.status !== statusF) return false;
    if (vendedorF !== "Todos" && s.vendedora.id !== vendedorF) return false;
    if (busca && !(s.numero.includes(busca) || (s.cliente && s.cliente.nome.toLowerCase().includes(busca.toLowerCase())))) return false;
    return true;
  });

  return (
    <div>
      <PageHeader title="Vendas" description={`${filtered.length} vendas encontradas`} />
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
          {TEAM.map((s) => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="rounded-lg border px-3 py-2.5 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700">
          <option>Todos</option>
          <option>Concluída</option>
          <option>Cancelada</option>
        </select>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {filtered.map((s) => (
                <tr key={s.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800/60" onClick={() => navigate(`/vendas/${s.id}`)}>
                  <td className="px-5 py-3 font-medium">{s.numero}</td>
                  <td className="px-5 py-3">{s.data} · {s.hora}</td>
                  <td className="px-5 py-3">{s.cliente ? s.cliente.nome : "Não identificado"}</td>
                  <td className="px-5 py-3">{s.vendedora.nome}</td>
                  <td className="px-5 py-3">{s.pecas}</td>
                  <td className="px-5 py-3 text-right font-medium tabular-nums">{fmtCurrency(s.total)}</td>
                  <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState icon={Receipt} title="Nenhuma venda encontrada" />}
      </div>
    </div>
  );
}
