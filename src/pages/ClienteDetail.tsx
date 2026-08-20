import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Users, Receipt, TrendingUp, ShoppingCart, Phone, Mail } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppStore } from "@/store/useAppStore";
import { useDerivedData } from "@/hooks/useDerivedData";
import { CUSTOMERS } from "@/data/customers";
import { SALES } from "@/data/sales";
import { fmtCurrency } from "@/utils/format";

export function ClienteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const products = useAppStore((s) => s.products);
  const d = useDerivedData(products);
  const cliente = CUSTOMERS.find((c) => c.id === id);

  if (!cliente || !id) return <EmptyState icon={Users} title="Cliente não encontrado" />;

  const info = d.porCliente[id];
  const historico = SALES.filter((s) => s.cliente?.id === id);
  const ticketMedio = info.compras ? info.total / info.compras : 0;

  return (
    <div>
      <button onClick={() => navigate("/clientes")} className="flex items-center gap-1.5 text-sm mb-4 text-neutral-500 dark:text-neutral-400 hover:text-red-600">
        <ArrowLeft size={15} /> Voltar para clientes
      </button>
      <PageHeader title={cliente.nome} description={`Cliente desde ${cliente.clienteDesde}`} />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Compras realizadas" value={info.compras} icon={Receipt} />
        <MetricCard label="Total gasto" value={fmtCurrency(info.total)} icon={TrendingUp} />
        <MetricCard label="Ticket médio" value={fmtCurrency(ticketMedio)} icon={ShoppingCart} />
        <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-3">Contato</div>
          <div className="text-sm flex items-center gap-2 mb-1.5"><Phone size={13} className="text-neutral-400" /> {cliente.telefone}</div>
          <div className="text-sm flex items-center gap-2"><Mail size={13} className="text-neutral-400" /> {cliente.email}</div>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-neutral-800 font-semibold text-sm">Histórico de vendas</div>
        {historico.length === 0 ? (
          <EmptyState icon={Receipt} title="Nenhuma compra registrada" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-900 text-left text-neutral-500 dark:text-neutral-400">
                <th className="px-5 py-3 font-medium">Venda</th>
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3 font-medium">Vendedora</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {historico.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/60">
                  <td className="px-5 py-3 font-medium">{s.numero}</td>
                  <td className="px-5 py-3">{s.data}</td>
                  <td className="px-5 py-3">{s.vendedora.nome}</td>
                  <td className="px-5 py-3 text-right font-medium tabular-nums">{fmtCurrency(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
