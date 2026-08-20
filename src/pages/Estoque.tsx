import { useState } from "react";
import { Boxes, PackageCheck, AlertCircle, PackageX } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/useAppStore";
import { fmtCurrency, statusEstoque } from "@/utils/format";
import type { Product } from "@/types";

export function Estoque() {
  const products = useAppStore((s) => s.products);
  const adjustStock = useAppStore((s) => s.adjustStock);
  const notify = useAppStore((s) => s.notify);
  const [ajuste, setAjuste] = useState<Product | null>(null);
  const [novoValor, setNovoValor] = useState("");

  const totalPecas = products.reduce((s, p) => s + p.estoque, 0);
  const baixo = products.filter((p) => statusEstoque(p) === "Estoque baixo").length;
  const zerado = products.filter((p) => statusEstoque(p) === "Sem estoque").length;

  return (
    <div>
      <PageHeader title="Estoque" description="Controle de peças disponíveis" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total de peças" value={totalPecas} icon={Boxes} />
        <MetricCard label="Produtos cadastrados" value={products.length} icon={PackageCheck} />
        <MetricCard label="Estoque baixo" value={baixo} icon={AlertCircle} />
        <MetricCard label="Sem estoque" value={zerado} icon={PackageX} />
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-900 text-left text-neutral-500 dark:text-neutral-400">
                <th className="px-5 py-3 font-medium">Produto</th>
                <th className="px-5 py-3 font-medium">Código</th>
                <th className="px-5 py-3 font-medium text-right">Atual</th>
                <th className="px-5 py-3 font-medium text-right">Mínimo</th>
                <th className="px-5 py-3 font-medium">Situação</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/60">
                  <td className="px-5 py-3 font-medium">{p.nome}</td>
                  <td className="px-5 py-3 text-neutral-500 dark:text-neutral-400">{p.sku}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{p.estoque}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{p.estoqueMinimo}</td>
                  <td className="px-5 py-3"><StatusBadge status={statusEstoque(p)} /></td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => {
                        setAjuste(p);
                        setNovoValor(String(p.estoque));
                      }}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Ajustar estoque
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!ajuste} onClose={() => setAjuste(null)} title="Ajustar estoque">
        {ajuste && (
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-neutral-500 dark:text-neutral-400">Produto</div>
              <div className="font-medium">{ajuste.nome}</div>
            </div>
            <div>
              <div className="text-neutral-500 dark:text-neutral-400">Estoque atual</div>
              <div className="font-medium">{ajuste.estoque}</div>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Novo estoque</label>
              <input
                type="number"
                value={novoValor}
                onChange={(e) => setNovoValor(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Motivo</label>
              <select className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700">
                <option>Entrada de mercadoria</option>
                <option>Perda</option>
                <option>Devolução</option>
                <option>Correção</option>
              </select>
            </div>
            <button
              onClick={() => {
                adjustStock(ajuste.id, Number(novoValor) || 0);
                setAjuste(null);
                notify("Estoque atualizado.");
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 text-sm font-medium"
            >
              Confirmar ajuste
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
