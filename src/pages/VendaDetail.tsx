import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer, Receipt } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SALES } from "@/data/sales";
import { fmtCurrency } from "@/utils/format";

export function VendaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const sale = SALES.find((s) => s.id === id);

  if (!sale) return <EmptyState icon={Receipt} title="Venda não encontrada" />;

  return (
    <div>
      <button onClick={() => navigate("/vendas")} className="flex items-center gap-1.5 text-sm mb-4 text-neutral-500 dark:text-neutral-400 hover:text-red-600">
        <ArrowLeft size={15} /> Voltar para vendas
      </button>
      <PageHeader
        title={`Venda ${sale.numero}`}
        description={`${sale.data} às ${sale.hora}`}
        action={
          <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium">
            <Printer size={14} /> Imprimir comprovante
          </button>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 print-area">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-neutral-800 font-semibold text-sm">Produtos</div>
            <div className="divide-y divide-gray-100 dark:divide-neutral-800">
              {sale.items.map((it, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="font-medium text-sm">{it.produto.nome}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">{it.quantidade} x {fmtCurrency(it.precoUnitario)}</div>
                  </div>
                  <div className="font-medium text-sm tabular-nums">{fmtCurrency(it.precoUnitario * it.quantidade)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
            <div className="text-sm space-y-2 mb-4">
              <div className="flex justify-between"><span className="text-neutral-500 dark:text-neutral-400">Cliente</span><span className="font-medium">{sale.cliente ? sale.cliente.nome : "Não identificado"}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500 dark:text-neutral-400">Vendedora</span><span className="font-medium">{sale.vendedora.nome}</span></div>
              <div className="flex justify-between items-center"><span className="text-neutral-500 dark:text-neutral-400">Status</span><StatusBadge status={sale.status} /></div>
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-neutral-800 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500 dark:text-neutral-400">Subtotal</span><span className="tabular-nums">{fmtCurrency(sale.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500 dark:text-neutral-400">Desconto</span><span className="tabular-nums">{fmtCurrency(sale.desconto)}</span></div>
              <div className="flex justify-between pt-2 text-base"><span className="font-semibold">Total</span><span className="font-bold text-red-600 tabular-nums">{fmtCurrency(sale.total)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
