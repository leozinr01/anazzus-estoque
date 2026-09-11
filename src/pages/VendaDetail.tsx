import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer, Receipt, FileText, Info } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useSalesStore } from "@/store/useSalesStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase";
import { fmtCurrency } from "@/utils/format";
import { printReceipt } from "@/utils/printReceipt";
import { PAYMENT_LABELS, type Invoice } from "@/types";

export function VendaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const sales = useSalesStore((s) => s.sales);
  const salesLoaded = useSalesStore((s) => s.loaded);
  const fetchSales = useSalesStore((s) => s.fetchAll);
  const settings = useSettingsStore((s) => s.settings);
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const fetchSettings = useSettingsStore((s) => s.fetchAll);
  const notify = useAppStore((s) => s.notify);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [showNfInfo, setShowNfInfo] = useState(false);
  const [emitting, setEmitting] = useState(false);

  useEffect(() => {
    if (!salesLoaded) fetchSales();
    if (!settingsLoaded) fetchSettings();
  }, [salesLoaded, fetchSales, settingsLoaded, fetchSettings]);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("invoices")
      .select("*")
      .eq("sale_id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setInvoice({ id: data.id, saleId: data.sale_id, status: data.status, numeroNfce: data.numero_nfce, chaveAcesso: data.chave_acesso, urlDanfe: data.url_danfe });
        }
      });
  }, [id]);

  const sale = sales.find((s) => s.id === id);

  if (!sale) return <EmptyState icon={Receipt} title="Venda não encontrada" />;

  const handleEmitirNota = async () => {
    setEmitting(true);
    const { data, error } = await supabase
      .from("invoices")
      .upsert({ sale_id: sale.id, status: "pendente" }, { onConflict: "sale_id" })
      .select()
      .single();
    setEmitting(false);
    if (error) {
      notify(error.message);
      return;
    }
    setInvoice({ id: data.id, saleId: data.sale_id, status: data.status, numeroNfce: data.numero_nfce, chaveAcesso: data.chave_acesso, urlDanfe: data.url_danfe });
    setShowNfInfo(true);
  };

  return (
    <div>
      <button onClick={() => navigate("/vendas")} className="flex items-center gap-1.5 text-sm mb-4 text-neutral-500 dark:text-neutral-400 hover:text-red-600">
        <ArrowLeft size={15} /> Voltar para vendas
      </button>
      <PageHeader
        title={`Venda ${sale.numero}`}
        description={`${sale.data} às ${sale.hora}`}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => (invoice ? setShowNfInfo(true) : handleEmitirNota())}
              disabled={emitting}
              className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800"
            >
              <FileText size={14} /> {invoice ? "Status da Nota Fiscal" : "Emitir Nota Fiscal"}
            </button>
            <button onClick={() => printReceipt(sale, settings)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium">
              <Printer size={14} /> Imprimir comprovante
            </button>
          </div>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-neutral-800 font-semibold text-sm">Produtos</div>
            <div className="divide-y divide-gray-100 dark:divide-neutral-800">
              {sale.items.map((it) => (
                <div key={it.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="font-medium text-sm">{it.produto?.nome || "Produto removido"}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">{it.quantidade} x {fmtCurrency(it.precoUnitario)}</div>
                  </div>
                  <div className="font-medium text-sm tabular-nums">{fmtCurrency(it.precoUnitario * it.quantidade)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-4">
            <div className="text-sm space-y-2 mb-4">
              <div className="flex justify-between"><span className="text-neutral-500 dark:text-neutral-400">Cliente</span><span className="font-medium">{sale.cliente ? sale.cliente.nome : "Não identificado"}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500 dark:text-neutral-400">Vendedora</span><span className="font-medium">{sale.vendedora?.nome || "—"}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500 dark:text-neutral-400">Pagamento</span><span className="font-medium">{PAYMENT_LABELS[sale.formaPagamento]}</span></div>
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

      <Modal open={showNfInfo} onClose={() => setShowNfInfo(false)} title="Nota Fiscal (NFC-e)">
        <div className="text-sm space-y-3">
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 p-3">
            <Info size={16} className="shrink-0 mt-0.5" />
            <span>
              Esta venda está marcada como <strong>pendente de emissão</strong>. A emissão real de NFC-e junto à
              SEFAZ exige CNPJ, certificado digital e um provedor fiscal (ex.: Focus NFe, PlugNotas, eNotas)
              configurado nas Configurações. Isso ainda não foi contratado/configurado — fale com o administrador
              para habilitar a emissão automática.
            </span>
          </div>
          <div className="text-neutral-500 dark:text-neutral-400">
            Assim que a integração estiver configurada, este botão passará a emitir a nota automaticamente e mostrar
            o número, a chave de acesso e o link do DANFE aqui.
          </div>
        </div>
      </Modal>
    </div>
  );
}
