import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, TrendingUp, Receipt, Users, ShoppingCart, UserSquare2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/ui/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppStore } from "@/store/useAppStore";
import { useDerivedData } from "@/hooks/useDerivedData";
import { useTheme } from "@/hooks/useTheme";
import { SALES, chartData } from "@/data/sales";
import { fmtCurrency } from "@/utils/format";

export function MembroDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const products = useAppStore((s) => s.products);
  const d = useDerivedData(products);
  const { isDark } = useTheme();
  const membro = d.ranking.find((r: any) => r.vendedor.id === id);
  const historico = SALES.filter((s) => s.vendedora.id === id).slice(0, 8);

  if (!membro) return <EmptyState icon={UserSquare2} title="Membro não encontrado" />;

  const data = chartData("30d").map((p) => ({ ...p, valor: Math.round(p.valor * 0.25) }));

  return (
    <div>
      <button onClick={() => navigate("/equipe")} className="flex items-center gap-1.5 text-sm mb-4 text-neutral-500 dark:text-neutral-400 hover:text-red-600">
        <ArrowLeft size={15} /> Voltar para equipe
      </button>
      <PageHeader title={membro.vendedor.nome} description={membro.vendedor.cargo} />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Faturamento" value={fmtCurrency(membro.faturamento)} icon={TrendingUp} />
        <MetricCard label="Vendas" value={membro.vendas} icon={Receipt} />
        <MetricCard label="Clientes atendidos" value={membro.clientesAtendidos} icon={Users} />
        <MetricCard label="Ticket médio" value={fmtCurrency(membro.ticketMedio)} icon={ShoppingCart} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <h3 className="font-semibold text-sm mb-4">Desempenho no mês</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#f0f0f0"} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: isDark ? "#a3a3a3" : "#737373" }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: isDark ? "#a3a3a3" : "#737373" }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: isDark ? "#171717" : "#fff", border: `1px solid ${isDark ? "#27272a" : "#e5e5e5"}`, borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [fmtCurrency(v), "Vendas"]}
              />
              <Bar dataKey="valor" fill="#dc2626" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <h3 className="font-semibold text-sm mb-3">Meta mensal</h3>
          <ProgressBar value={membro.progresso} />
          <div className="mt-2 text-sm font-medium text-red-600">{membro.progresso.toFixed(1)}% de {fmtCurrency(membro.vendedor.meta)}</div>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 mt-4">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-neutral-800 font-semibold text-sm">Vendas recentes</div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
            {historico.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/60">
                <td className="px-5 py-3 font-medium">{s.numero}</td>
                <td className="px-5 py-3">{s.data}</td>
                <td className="px-5 py-3">{s.cliente ? s.cliente.nome : "Não identificado"}</td>
                <td className="px-5 py-3 text-right font-medium tabular-nums">{fmtCurrency(s.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
