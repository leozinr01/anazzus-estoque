import { useEffect, useState } from "react";
import { Boxes, PackageCheck, AlertCircle, PackageX, Printer } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { Modal } from "@/components/ui/Modal";
import { useCatalogStore } from "@/store/useCatalogStore";
import { useAppStore } from "@/store/useAppStore";
import { statusEstoque } from "@/utils/format";
import { printProductLabel } from "@/utils/printLabel";
import type { Product } from "@/types";

const MOTIVOS = ["Entrada de mercadoria", "Perda/avaria", "Devolução de fornecedor", "Correção de contagem"];

export function Estoque() {
  const products = useCatalogStore((s) => s.products);
  const loaded = useCatalogStore((s) => s.loaded);
  const fetchAll = useCatalogStore((s) => s.fetchAll);
  const adjustStock = useCatalogStore((s) => s.adjustStock);
  const notify = useAppStore((s) => s.notify);

  const [ajuste, setAjuste] = useState<Product | null>(null);
  const [novoValor, setNovoValor] = useState("");
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loaded) fetchAll();
  }, [loaded, fetchAll]);

  const totalPecas = products.reduce((s, p) => s + p.estoque, 0);
  const baixo = products.filter((p) => statusEstoque(p) === "Estoque baixo").length;
  const zerado = products.filter((p) => statusEstoque(p) === "Sem estoque").length;

  const confirmar = async () => {
    if (!ajuste) return;
    setSaving(true);
    const err = await adjustStock(ajuste.id, Number(novoValor) || 0, motivo);
    setSaving(false);
    if (err) {
      notify(err);
      return;
    }
    setAjuste(null);
    notify("Estoque atualizado.");
  };

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
                    <button onClick={() => printProductLabel(p)} className="text-neutral-400 hover:text-red-600 p-1 mr-1" title="Imprimir etiqueta">
                      <Printer size={15} />
                    </button>
                    <button
                      onClick={() => {
                        setAjuste(p);
                        setNovoValor(String(p.estoque));
                        setMotivo(MOTIVOS[0]);
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
              <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700">
                {MOTIVOS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <button
              onClick={confirmar}
              disabled={saving}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg py-2.5 text-sm font-medium"
            >
              {saving ? "Salvando..." : "Confirmar ajuste"}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
