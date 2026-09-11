import { useEffect, useMemo, useState } from "react";
import { Search, Repeat, CheckCircle2, XCircle, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSalesStore } from "@/store/useSalesStore";
import { useCatalogStore } from "@/store/useCatalogStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useExchangesStore } from "@/store/useExchangesStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";
import { fmtCurrency } from "@/utils/format";
import type { ExchangeType, Sale, SaleItem } from "@/types";

function diasDesde(dataISO: string) {
  const then = new Date(dataISO).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export function Trocas() {
  const sales = useSalesStore((s) => s.sales);
  const salesLoaded = useSalesStore((s) => s.loaded);
  const fetchSales = useSalesStore((s) => s.fetchAll);
  const products = useCatalogStore((s) => s.products);
  const productsLoaded = useCatalogStore((s) => s.loaded);
  const fetchProducts = useCatalogStore((s) => s.fetchAll);
  const settings = useSettingsStore((s) => s.settings);
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const fetchSettings = useSettingsStore((s) => s.fetchAll);
  const exchanges = useExchangesStore((s) => s.exchanges);
  const exchangesLoaded = useExchangesStore((s) => s.loaded);
  const fetchExchanges = useExchangesStore((s) => s.fetchAll);
  const createExchange = useExchangesStore((s) => s.createExchange);
  const completeExchange = useExchangesStore((s) => s.completeExchange);
  const profile = useAuthStore((s) => s.profile);
  const notify = useAppStore((s) => s.notify);

  useEffect(() => {
    if (!salesLoaded) fetchSales();
    if (!productsLoaded) fetchProducts();
    if (!settingsLoaded) fetchSettings();
    if (!exchangesLoaded) fetchExchanges();
  }, [salesLoaded, fetchSales, productsLoaded, fetchProducts, settingsLoaded, fetchSettings, exchangesLoaded, fetchExchanges]);

  const canManage = profile?.role === "admin" || profile?.role === "gerente";
  const diasTroca = settings?.diasTroca ?? 30;

  const [busca, setBusca] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedItem, setSelectedItem] = useState<SaleItem | null>(null);
  const [tipo, setTipo] = useState<ExchangeType>("troca");
  const [produtoNovoId, setProdutoNovoId] = useState("");
  const [produtoBusca, setProdutoBusca] = useState("");
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);

  const results = useMemo(() => {
    if (!busca.trim()) return [];
    const q = busca.toLowerCase();
    return sales.filter((s) => s.numero.toLowerCase().includes(q) || (s.cliente && s.cliente.nome.toLowerCase().includes(q))).slice(0, 8);
  }, [busca, sales]);

  const produtoResults = useMemo(() => {
    if (!produtoBusca.trim()) return [];
    const q = produtoBusca.toLowerCase();
    return products.filter((p) => p.nome.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 6);
  }, [produtoBusca, products]);

  const diasPassados = selectedSale ? diasDesde(selectedSale.createdAt) : 0;
  const dentroDoPrazo = diasPassados <= diasTroca;

  const submit = async () => {
    if (!selectedSale) return;
    setSaving(true);
    const err = await createExchange({
      saleId: selectedSale.id,
      saleItemId: selectedItem?.id || null,
      tipo,
      motivo,
      produtoNovoId: tipo === "troca" ? produtoNovoId || null : null,
    });
    setSaving(false);
    if (err) {
      notify(err);
      return;
    }
    notify("Troca registrada. Aguardando conclusão.");
    setSelectedSale(null);
    setSelectedItem(null);
    setMotivo("");
    setProdutoNovoId("");
    setProdutoBusca("");
    setBusca("");
  };

  const handleComplete = async (id: string) => {
    const err = await completeExchange(id);
    if (err) {
      notify(err);
      return;
    }
    notify("Troca concluída e estoque atualizado.");
  };

  return (
    <div>
      <PageHeader title="Trocas e Devoluções" description={`Prazo configurado: ${diasTroca} dias após a compra`} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-[#faf7f2] dark:bg-neutral-900 shadow-sm p-4">
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 flex items-center gap-1.5">
            <Search size={14} /> Buscar venda por número ou cliente
          </label>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="V000123 ou nome do cliente"
            className="w-full rounded-lg border px-3 py-2.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
          />
          {results.length > 0 && (
            <div className="rounded-lg border divide-y border-gray-200 dark:border-neutral-800 divide-gray-100 dark:divide-neutral-800 overflow-hidden mb-3">
              {results.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSale(s);
                    setSelectedItem(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-neutral-800"
                >
                  <span>
                    <span className="font-medium">{s.numero}</span>
                    <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">{s.data} · {s.cliente?.nome || "Não identificado"}</span>
                  </span>
                  <span className="font-medium tabular-nums">{fmtCurrency(s.total)}</span>
                </button>
              ))}
            </div>
          )}

          {selectedSale && (
            <div className="border-t border-gray-200 dark:border-neutral-800 pt-3 mt-1 space-y-3">
              <div className={`flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 ${dentroDoPrazo ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400" : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400"}`}>
                <Clock size={13} />
                {dentroDoPrazo
                  ? `Dentro do prazo de troca (${diasPassados} de ${diasTroca} dias).`
                  : `Fora do prazo de troca (${diasPassados} dias, limite ${diasTroca}).`}
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Peça</label>
                <select
                  value={selectedItem?.id || ""}
                  onChange={(e) => setSelectedItem(selectedSale.items.find((it) => it.id === e.target.value) || null)}
                  className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
                >
                  <option value="">Selecione a peça</option>
                  {selectedSale.items.map((it) => (
                    <option key={it.id} value={it.id}>{it.produto?.nome || "Produto"} ({it.quantidade}x)</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                {(["troca", "devolucao"] as ExchangeType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTipo(t)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${
                      tipo === t ? "bg-red-600 text-white border-red-600" : "border-gray-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400"
                    }`}
                  >
                    {t === "troca" ? "Troca por outra peça" : "Devolução"}
                  </button>
                ))}
              </div>

              {tipo === "troca" && (
                <div>
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Nova peça</label>
                  <input
                    value={produtoBusca}
                    onChange={(e) => setProdutoBusca(e.target.value)}
                    placeholder="Buscar produto..."
                    className="w-full rounded-lg border px-3 py-2 text-sm mb-1 bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
                  />
                  {produtoResults.length > 0 && (
                    <div className="rounded-lg border divide-y border-gray-200 dark:border-neutral-800 divide-gray-100 dark:divide-neutral-800 overflow-hidden">
                      {produtoResults.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setProdutoNovoId(p.id);
                            setProdutoBusca(p.nome);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-neutral-800 ${produtoNovoId === p.id ? "bg-gray-50 dark:bg-neutral-800" : ""}`}
                        >
                          <span>{p.nome}</span>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">{p.estoque} em estoque</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Motivo</label>
                <input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
                  placeholder="Tamanho errado, defeito..."
                />
              </div>

              <button
                onClick={submit}
                disabled={saving || !selectedItem || (tipo === "troca" && !produtoNovoId)}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg py-2.5 text-sm font-medium"
              >
                {saving ? "Registrando..." : "Registrar troca/devolução"}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-[#faf7f2] dark:bg-neutral-900 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-neutral-800 font-semibold text-sm">Histórico</div>
          {exchanges.length === 0 ? (
            <EmptyState icon={Repeat} title="Nenhuma troca registrada" />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-neutral-800 max-h-[560px] overflow-y-auto">
              {exchanges.map((ex) => (
                <div key={ex.id} className="px-4 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm">
                      {ex.tipo === "troca" ? "Troca" : "Devolução"} · Venda {ex.saleNumero}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{ex.motivo || "Sem motivo informado"}</div>
                  </div>
                  {ex.status === "concluida" ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 shrink-0"><CheckCircle2 size={13} /> Concluída</span>
                  ) : canManage ? (
                    <button
                      onClick={() => handleComplete(ex.id)}
                      className="text-xs font-medium text-red-600 hover:underline shrink-0"
                    >
                      Concluir
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600 shrink-0"><XCircle size={13} /> Pendente</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
