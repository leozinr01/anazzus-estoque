import { useState } from "react";
import { Search, Plus, Package } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/useAppStore";
import { CATEGORIAS, TAMANHOS } from "@/data/products";
import { fmtCurrency, statusEstoque } from "@/utils/format";

export function Produtos() {
  const products = useAppStore((s) => s.products);
  const notify = useAppStore((s) => s.notify);
  const [busca, setBusca] = useState("");
  const [categoriaF, setCategoriaF] = useState("Todas");
  const [showModal, setShowModal] = useState(false);

  const filtered = products.filter((p) => {
    if (categoriaF !== "Todas" && p.categoria !== categoriaF) return false;
    if (busca && !(p.nome.toLowerCase().includes(busca.toLowerCase()) || p.sku.toLowerCase().includes(busca.toLowerCase()))) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Produtos"
        description={`${products.length} produtos cadastrados`}
        action={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium">
            <Plus size={15} /> Novo Produto
          </button>
        }
      />
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou SKU..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
          />
        </div>
        <select value={categoriaF} onChange={(e) => setCategoriaF(e.target.value)} className="rounded-lg border px-3 py-2.5 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700">
          <option>Todas</option>
          {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-900 text-left text-neutral-500 dark:text-neutral-400">
                <th className="px-5 py-3 font-medium">Produto</th>
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Categoria</th>
                <th className="px-5 py-3 font-medium">Cor</th>
                <th className="px-5 py-3 font-medium text-right">Preço</th>
                <th className="px-5 py-3 font-medium text-right">Estoque</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/60">
                  <td className="px-5 py-3 font-medium">{p.nome}</td>
                  <td className="px-5 py-3 text-neutral-500 dark:text-neutral-400">{p.sku}</td>
                  <td className="px-5 py-3">{p.categoria}</td>
                  <td className="px-5 py-3">{p.cor}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{fmtCurrency(p.preco)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{p.estoque}</td>
                  <td className="px-5 py-3"><StatusBadge status={statusEstoque(p)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState icon={Package} title="Nenhum produto encontrado" />}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo Produto" wide>
        <div className="grid grid-cols-2 gap-3">
          {["Nome", "SKU", "Código de barras", "Preço"].map((l) => (
            <div key={l} className={l === "Nome" ? "col-span-2" : ""}>
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">{l}</label>
              <input className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" placeholder={l} />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Categoria</label>
            <select className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700">
              {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Tamanho</label>
            <select className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700">
              {TAMANHOS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Estoque inicial</label>
            <input type="number" className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" placeholder="0" />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Estoque mínimo</label>
            <input type="number" className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" placeholder="5" />
          </div>
        </div>
        <button
          onClick={() => {
            setShowModal(false);
            notify("Produto adicionado (somente nesta sessão).");
          }}
          className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 text-sm font-medium"
        >
          Salvar produto
        </button>
      </Modal>
    </div>
  );
}
