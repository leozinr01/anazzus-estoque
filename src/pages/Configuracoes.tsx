import { useEffect, useState } from "react";
import { Info, Plus, Save } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTeamStore } from "@/store/useTeamStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";
import { fmtCurrency } from "@/utils/format";
import type { DiscountType, UserRole } from "@/types";

const ROLE_LABEL: Record<UserRole, string> = { admin: "Administradora", gerente: "Gerente", vendedora: "Vendedora" };

export function Configuracoes() {
  const settings = useSettingsStore((s) => s.settings);
  const discounts = useSettingsStore((s) => s.discounts);
  const loaded = useSettingsStore((s) => s.loaded);
  const fetchAll = useSettingsStore((s) => s.fetchAll);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const addDiscount = useSettingsStore((s) => s.addDiscount);
  const toggleDiscount = useSettingsStore((s) => s.toggleDiscount);

  const team = useTeamStore((s) => s.team);
  const teamLoaded = useTeamStore((s) => s.loaded);
  const fetchTeam = useTeamStore((s) => s.fetchAll);
  const updateMember = useTeamStore((s) => s.updateMember);

  const profile = useAuthStore((s) => s.profile);
  const notify = useAppStore((s) => s.notify);

  const [form, setForm] = useState({ nomeLoja: "", cnpj: "", telefone: "", endereco: "", diasTroca: 30, politicaTroca: "" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [newDiscount, setNewDiscount] = useState({ codigo: "", descricao: "", tipo: "percentual" as DiscountType, valor: "", usoMaximo: "" });
  const [savingDiscount, setSavingDiscount] = useState(false);

  useEffect(() => {
    if (!loaded) fetchAll();
    if (!teamLoaded) fetchTeam();
  }, [loaded, fetchAll, teamLoaded, fetchTeam]);

  useEffect(() => {
    if (settings) {
      setForm({
        nomeLoja: settings.nomeLoja,
        cnpj: settings.cnpj || "",
        telefone: settings.telefone || "",
        endereco: settings.endereco || "",
        diasTroca: settings.diasTroca,
        politicaTroca: settings.politicaTroca || "",
      });
    }
  }, [settings]);

  if (profile && profile.role === "vendedora") {
    return (
      <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Apenas administradoras e gerentes podem acessar as configurações.
      </div>
    );
  }

  const saveSettings = async () => {
    setSavingSettings(true);
    const err = await updateSettings(form);
    setSavingSettings(false);
    if (err) {
      notify(err);
      return;
    }
    notify("Configurações salvas.");
  };

  const saveDiscount = async () => {
    if (!newDiscount.valor) {
      notify("Informe o valor do desconto.");
      return;
    }
    setSavingDiscount(true);
    const err = await addDiscount({
      codigo: newDiscount.codigo,
      descricao: newDiscount.descricao,
      tipo: newDiscount.tipo,
      valor: Number(newDiscount.valor),
      usoMaximo: newDiscount.usoMaximo ? Number(newDiscount.usoMaximo) : null,
    });
    setSavingDiscount(false);
    if (err) {
      notify(err);
      return;
    }
    setNewDiscount({ codigo: "", descricao: "", tipo: "percentual", valor: "", usoMaximo: "" });
    notify("Cupom de desconto criado.");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Dados da loja, descontos, equipe e nota fiscal" />

      <section className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-5">
        <h3 className="font-semibold text-sm mb-4">Dados da loja e política de troca</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Nome da loja</label>
            <input value={form.nomeLoja} onChange={(e) => setForm({ ...form, nomeLoja: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">CNPJ</label>
            <input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Telefone</label>
            <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Endereço</label>
            <input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Prazo para troca (dias)</label>
            <input type="number" value={form.diasTroca} onChange={(e) => setForm({ ...form, diasTroca: Number(e.target.value) || 0 })} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Texto da política de troca (impresso no comprovante)</label>
            <textarea value={form.politicaTroca} onChange={(e) => setForm({ ...form, politicaTroca: e.target.value })} rows={2} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" />
          </div>
        </div>
        <button onClick={saveSettings} disabled={savingSettings} className="mt-4 flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg px-4 py-2 text-sm font-medium">
          <Save size={14} /> {savingSettings ? "Salvando..." : "Salvar"}
        </button>
      </section>

      <section className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-5">
        <h3 className="font-semibold text-sm mb-4">Cupons de desconto</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
          <input value={newDiscount.codigo} onChange={(e) => setNewDiscount({ ...newDiscount, codigo: e.target.value })} placeholder="Código" className="rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" />
          <input value={newDiscount.descricao} onChange={(e) => setNewDiscount({ ...newDiscount, descricao: e.target.value })} placeholder="Descrição" className="rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" />
          <select value={newDiscount.tipo} onChange={(e) => setNewDiscount({ ...newDiscount, tipo: e.target.value as DiscountType })} className="rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700">
            <option value="percentual">%</option>
            <option value="valor_fixo">R$</option>
          </select>
          <input type="number" value={newDiscount.valor} onChange={(e) => setNewDiscount({ ...newDiscount, valor: e.target.value })} placeholder="Valor" className="rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" />
          <button onClick={saveDiscount} disabled={savingDiscount} className="flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg px-3 py-2 text-sm font-medium">
            <Plus size={14} /> Criar
          </button>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-neutral-800">
          {discounts.map((d) => (
            <div key={d.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <span className="font-medium">{d.codigo || "(sem código)"}</span>
                <span className="ml-2 text-neutral-500 dark:text-neutral-400">
                  {d.tipo === "percentual" ? `${d.valor}%` : fmtCurrency(d.valor)} · {d.descricao || "—"} · usado {d.usoAtual}x
                </span>
              </div>
              <button onClick={() => toggleDiscount(d.id, !d.ativo)} className={`text-xs font-medium ${d.ativo ? "text-green-600" : "text-neutral-400"}`}>
                {d.ativo ? "Ativo" : "Inativo"}
              </button>
            </div>
          ))}
          {discounts.length === 0 && <div className="text-sm text-neutral-500 dark:text-neutral-400 py-2">Nenhum cupom criado.</div>}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-5">
        <h3 className="font-semibold text-sm mb-4">Equipe e permissões</h3>
        <div className="divide-y divide-gray-100 dark:divide-neutral-800">
          {team.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="flex-1 min-w-[140px]">
                <div className="font-medium text-sm">{t.nome}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">{t.cargo}</div>
              </div>
              <select
                value={t.role}
                onChange={(e) => updateMember(t.id, { role: e.target.value as UserRole })}
                className="rounded-lg border px-2 py-1.5 text-xs bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
              >
                {(["vendedora", "gerente", "admin"] as UserRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
              <input
                type="number"
                defaultValue={t.meta}
                onBlur={(e) => updateMember(t.id, { meta: Number(e.target.value) || 0 })}
                className="w-24 rounded-lg border px-2 py-1.5 text-xs text-right tabular-nums bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
                title="Meta mensal"
              />
              <button
                onClick={() => updateMember(t.id, { ativo: !t.ativo })}
                className={`text-xs font-medium px-2 py-1 rounded-lg ${t.ativo ? "text-green-600" : "text-neutral-400"}`}
              >
                {t.ativo ? "Ativa" : "Inativa"}
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-gray-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 p-3 text-xs mt-4">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>
            Para criar um novo login (vendedora, gerente ou admin), acesse o painel do Supabase em{" "}
            <strong>Authentication → Users → Add user</strong>, informe e-mail e senha, e em "User Metadata" adicione{" "}
            <code>{"{"}"nome":"Nome da pessoa","role":"vendedora"{"}"}</code> (ou "gerente"/"admin"). O perfil aparece
            automaticamente aqui após o primeiro login.
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-5">
        <h3 className="font-semibold text-sm mb-2">Nota Fiscal Eletrônica (NFC-e)</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          A emissão automática de nota fiscal exige: CNPJ ativo, certificado digital A1 e contratação de um provedor
          fiscal (ex.: Focus NFe, PlugNotas, eNotas). Nenhum desses itens está configurado ainda — as vendas podem
          ser marcadas como "pendente de nota" na tela da venda, mas a emissão real precisa ser feita por fora até
          essa integração ser configurada. Fale com o administrador do sistema quando tiver essas credenciais para
          habilitarmos a emissão automática.
        </p>
      </section>
    </div>
  );
}
