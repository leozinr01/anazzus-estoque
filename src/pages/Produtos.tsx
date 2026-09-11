import { useEffect, useState } from "react";
import { Search, Plus, Package, Printer } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useCatalogStore } from "@/store/useCatalogStore";
import { useAppStore } from "@/store/useAppStore";
import { CORES, TAMANHOS } from "@/data/options";
import { fmtCurrency, statusEstoque } from "@/utils/format";
import { printProductLabel } from "@/utils/printLabel";

const emptyForm = {
  nome: "",
  sku: "",
  codigoBarras: "",
  categoriaNome: "",
  tamanho: TAMANHOS[0],
  cor: CORES[0],
  preco: "",
  precoCusto: "",
  estoque: "0",
  estoqueMinimo: "5",
};

export function Produtos() {
  const products = useCatalogStore((s) => s.products);
  const categories = useCatalogStore((s) => s.categories);
  const loaded = useCatalogStore((s) => s.loaded);
  const fetchAll = useCatalogStore((s) => s.fetchAll);
  const addProduct = useCatalogStore((s) => s.addProduct);
  const notify = useAppStore((s) => s.notify);

  const [busca, setBusca] = useState("");
  const [categoriaF, setCategoriaF] = useState("Todas");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) fetchAll();
  }, [loaded, fetchAll]);

  const filtered = products.filter((p) => {
    if (categoriaF !== "Todas" && p.categoria !== categoriaF) return false;
    if (busca && !(p.nome.toLowerCase().includes(busca.toLowerCase()) || p.sku.toLowerCase().includes(busca.toLowerCase()))) return false;
    return true;
  });

  const handleSave = async () => {
    setError(null);
    if (!form.nome.trim() || !form.sku.trim()) {
      setError("Nome e SKU são obrigatórios.");
      return;
    }
    setSaving(true);
    const err = await addProduct({
      nome: form.nome.trim(),
      sku: form.sku.trim(),
      codigoBarras: form.codigoBarras.trim(),
      categoriaNome: form.categoriaNome.trim() || "Sem categoria",
      tamanho: form.tamanho,
      cor: form.cor,
      preco: Number(form.preco) || 0,
      precoCusto: Number(form.precoCusto) || 0,
      estoque: Number(form.estoque) || 0,
      estoqueMinimo: Number(form.estoqueMinimo) || 0,
    });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    setShowModal(false);
    setForm(emptyForm);
    notify("Produto cadastrado.");
  };

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
          {categories.map((c) => <option key={c.id}>{c.nome}</option>)}
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
                <th className="px-5 py-3 font-medium"></th>
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
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => printProductLabel(p)}
                      className="text-neutral-400 hover:text-red-600 p-1"
                      title="Imprimir etiqueta"
                    >
                      <Printer size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState icon={Package} title="Nenhum produto encontrado" />}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo Produto" wide>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Nome</label>
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">SKU</label>
            <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Código de barras</label>
            <input value={form.codigoBarras} onChange={(e) => setForm({ ...form, codigoBarras: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" placeholder="Escaneie ou digite" />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Preço de venda</label>
            <input type="number" step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Preço de custo</label>
            <input type="number" step="0.01" value={form.precoCusto} onChange={(e) => setForm({ ...form, precoCusto: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Categoria</label>
            <input
              list="categorias-list"
              value={form.categoriaNome}
              onChange={(e) => setForm({ ...form, categoriaNome: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
              placeholder="Digite ou escolha"
            />
            <datalist id="categorias-list">
              {categories.map((c) => <option key={c.id} value={c.nome} />)}
            </datalist>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Cor</label>
            <select value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700">
              {CORES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Tamanho</label>
            <select value={form.tamanho} onChange={(e) => setForm({ ...form, tamanho: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700">
              {TAMANHOS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Estoque inicial</label>
            <input type="number" value={form.estoque} onChange={(e) => setForm({ ...form, estoque: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Estoque mínimo</label>
            <input type="number" value={form.estoqueMinimo} onChange={(e) => setForm({ ...form, estoqueMinimo: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" />
          </div>
        </div>
        {error && <div className="text-sm text-red-600 mt-3">{error}</div>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-4 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg py-2.5 text-sm font-medium"
        >
          {saving ? "Salvando..." : "Salvar produto"}
        </button>
      </Modal>
    </div>
  );
}
