import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAppStore } from "@/store/useAppStore";
import { useDerivedData } from "@/hooks/useDerivedData";
import { CUSTOMERS } from "@/data/customers";
import { fmtCurrency } from "@/utils/format";

export function Clientes() {
  const navigate = useNavigate();
  const products = useAppStore((s) => s.products);
  const d = useDerivedData(products);
  const [busca, setBusca] = useState("");
  const filtered = CUSTOMERS.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div>
      <PageHeader title="Clientes" description={`${CUSTOMERS.length} clientes cadastrados`} />
      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar cliente..."
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
        />
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-900 text-left text-neutral-500 dark:text-neutral-400">
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium">Telefone</th>
                <th className="px-5 py-3 font-medium">Última compra</th>
                <th className="px-5 py-3 font-medium text-right">Compras</th>
                <th className="px-5 py-3 font-medium text-right">Total gasto</th>
                <th className="px-5 py-3 font-medium">Última vendedora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {filtered.map((c) => {
                const info = d.porCliente[c.id];
                return (
                  <tr key={c.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800/60" onClick={() => navigate(`/clientes/${c.id}`)}>
                    <td className="px-5 py-3 font-medium">{c.nome}</td>
                    <td className="px-5 py-3 text-neutral-500 dark:text-neutral-400">{c.telefone}</td>
                    <td className="px-5 py-3">{info?.ultima || "—"}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{info?.compras || 0}</td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums">{fmtCurrency(info?.total || 0)}</td>
                    <td className="px-5 py-3">{info?.ultimaVendedora || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
