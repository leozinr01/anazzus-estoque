import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, TrendingUp, Receipt, Users, ShoppingCart, UserSquare2, Pencil, Check, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/ui/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCatalogStore } from "@/store/useCatalogStore";
import { useCustomersStore } from "@/store/useCustomersStore";
import { useSalesStore } from "@/store/useSalesStore";
import { useTeamStore } from "@/store/useTeamStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";
import { useDerivedData } from "@/hooks/useDerivedData";
import { useTheme } from "@/hooks/useTheme";
import { buildChartData } from "@/utils/chartData";
import { fmtCurrency } from "@/utils/format";

export function MembroDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const products = useCatalogStore((s) => s.products);
  const sales = useSalesStore((s) => s.sales);
  const salesLoaded = useSalesStore((s) => s.loaded);
  const fetchSales = useSalesStore((s) => s.fetchAll);
  const team = useTeamStore((s) => s.team);
  const teamLoaded = useTeamStore((s) => s.loaded);
  const fetchTeam = useTeamStore((s) => s.fetchAll);
  const updateMember = useTeamStore((s) => s.updateMember);
  const customers = useCustomersStore((s) => s.customers);
  const { isDark } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const notify = useAppStore((s) => s.notify);
  const canEditMeta = profile?.role === "admin" || profile?.role === "gerente";

  const [editingMeta, setEditingMeta] = useState(false);
  const [metaInput, setMetaInput] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);

  useEffect(() => {
    if (!teamLoaded) fetchTeam();
    if (!salesLoaded) fetchSales();
  }, [teamLoaded, fetchTeam, salesLoaded, fetchSales]);

  const d = useDerivedData(products, sales, team, customers);
  const membro = d.ranking.find((r: any) => r.vendedor.id === id);
  const historico = sales.filter((s) => s.vendedora?.id === id).slice(0, 8);
  const memberSales = useMemo(() => sales.filter((s) => s.vendedora?.id === id), [sales, id]);
  const data = buildChartData(memberSales, "30d");

  if (!membro) return <EmptyState icon={UserSquare2} title="Membro não encontrado" />;

  const startEditMeta = () => {
    setMetaInput(String(membro.vendedor.meta || ""));
    setEditingMeta(true);
  };

  const saveMeta = async () => {
    if (!id) return;
    const meta = Number(metaInput) || 0;
    setSavingMeta(true);
    const err = await updateMember(id, { meta });
    setSavingMeta(false);
    if (err) {
      notify(err);
      return;
    }
    setEditingMeta(false);
    notify("Meta atualizada.");
  };

  return (
    <div>
      <button onClick={() => navigate("/vendas")} className="flex items-center gap-1.5 text-sm mb-4 text-neutral-500 dark:text-neutral-400 hover:text-red-600">
        <ArrowLeft size={15} /> Voltar para histórico de vendas
      </button>
      <PageHeader title={membro.vendedor.nome} description={membro.vendedor.cargo} />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Faturamento" value={fmtCurrency(membro.faturamento)} icon={TrendingUp} />
        <MetricCard label="Vendas" value={membro.vendas} icon={Receipt} />
        <MetricCard label="Clientes atendidos" value={membro.clientesAtendidos} icon={Users} />
        <MetricCard label="Ticket médio" value={fmtCurrency(membro.ticketMedio)} icon={ShoppingCart} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-5">
          <h3 className="font-semibold text-sm mb-4">Desempenho nos últimos 30 dias</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#f0f0f0"} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: isDark ? "#a3a3a3" : "#737373" }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: isDark ? "#a3a3a3" : "#737373" }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: isDark ? "#171717" : "#fff", border: `1px solid ${isDark ? "#27272a" : "#e5e5e5"}`, borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [fmtCurrency(v), "Vendas"]}
              />
              <Bar dataKey="valor" fill="#e0242f" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Meta mensal</h3>
            {canEditMeta && !editingMeta && (
              <button onClick={startEditMeta} className="text-neutral-400 hover:text-red-600" title="Editar meta">
                <Pencil size={14} />
              </button>
            )}
          </div>

          {editingMeta ? (
            <div className="flex items-center gap-2 mb-1">
              <input
                type="number"
                autoFocus
                value={metaInput}
                onChange={(e) => setMetaInput(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
              />
              <button onClick={saveMeta} disabled={savingMeta} className="p-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white" title="Salvar">
                <Check size={14} />
              </button>
              <button onClick={() => setEditingMeta(false)} className="p-2 rounded-lg border border-gray-300 dark:border-neutral-700" title="Cancelar">
                <X size={14} />
              </button>
            </div>
          ) : membro.vendedor.meta > 0 ? (
            <>
              <ProgressBar value={membro.progresso} />
              <div className="mt-2 text-sm font-medium text-red-600">{membro.progresso.toFixed(1)}% de {fmtCurrency(membro.vendedor.meta)}</div>
            </>
          ) : (
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              Nenhuma meta definida{canEditMeta ? " — clique no lápis para definir." : "."}
            </div>
          )}
        </div>
      </div>
      <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm mt-4">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-neutral-800 font-semibold text-sm">Vendas recentes</div>
        {historico.length === 0 ? (
          <EmptyState icon={Receipt} title="Nenhuma venda registrada" />
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {historico.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/60 cursor-pointer" onClick={() => navigate(`/vendas/${s.id}`)}>
                  <td className="px-5 py-3 font-medium">{s.numero}</td>
                  <td className="px-5 py-3">{s.data}</td>
                  <td className="px-5 py-3">{s.cliente ? s.cliente.nome : "Não identificado"}</td>
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
