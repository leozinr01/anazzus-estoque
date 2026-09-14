import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Receipt, Users, ShoppingCart, ChevronRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/ui/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useCatalogStore } from "@/store/useCatalogStore";
import { useCustomersStore } from "@/store/useCustomersStore";
import { useSalesStore } from "@/store/useSalesStore";
import { useTeamStore } from "@/store/useTeamStore";
import { useDerivedData } from "@/hooks/useDerivedData";
import { buildChartData } from "@/utils/chartData";
import { fmtCurrency } from "@/utils/format";
import { useTheme } from "@/hooks/useTheme";

export function Dashboard() {
  const navigate = useNavigate();
  const products = useCatalogStore((s) => s.products);
  const productsLoaded = useCatalogStore((s) => s.loaded);
  const fetchProducts = useCatalogStore((s) => s.fetchAll);
  const sales = useSalesStore((s) => s.sales);
  const salesLoaded = useSalesStore((s) => s.loaded);
  const fetchSales = useSalesStore((s) => s.fetchAll);
  const team = useTeamStore((s) => s.team);
  const teamLoaded = useTeamStore((s) => s.loaded);
  const fetchTeam = useTeamStore((s) => s.fetchAll);
  const customers = useCustomersStore((s) => s.customers);
  const custLoaded = useCustomersStore((s) => s.loaded);
  const fetchCustomers = useCustomersStore((s) => s.fetchAll);

  const { isDark } = useTheme();
  const [range, setRange] = useState<"7d" | "30d" | "mes">("30d");

  useEffect(() => {
    if (!productsLoaded) fetchProducts();
    if (!salesLoaded) fetchSales();
    if (!teamLoaded) fetchTeam();
    if (!custLoaded) fetchCustomers();
  }, [productsLoaded, fetchProducts, salesLoaded, fetchSales, teamLoaded, fetchTeam, custLoaded, fetchCustomers]);

  const d = useDerivedData(products, sales, team, customers);
  const data = useMemo(() => buildChartData(sales, range), [sales, range]);
  const metaTotal = team.reduce((s, t) => s + t.meta, 0);

  return (
    <div>
      <PageHeader title="Dashboard" description="Visão geral da Anazzus" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Faturamento do mês" value={fmtCurrency(d.faturamento)} icon={TrendingUp} />
        <MetricCard label="Vendas no mês" value={d.qtdVendas} icon={Receipt} />
        <MetricCard label="Clientes atendidos" value={d.clientesAtendidos} icon={Users} />
        <MetricCard label="Ticket médio" value={fmtCurrency(d.ticketMedio)} icon={ShoppingCart} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Faturamento</h3>
            <div className="flex text-xs rounded-lg border border-gray-200 dark:border-neutral-800 overflow-hidden">
              {(
                [
                  ["7d", "7 dias"],
                  ["30d", "30 dias"],
                  ["mes", "Mês atual"],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setRange(k)}
                  className={`px-3 py-1.5 font-medium ${
                    range === k
                      ? "bg-red-600 text-white"
                      : "text-neutral-500 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#f0f0f0"} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: isDark ? "#a3a3a3" : "#737373" }}
                axisLine={false}
                tickLine={false}
                interval={Math.ceil(data.length / 8)}
              />
              <YAxis
                tick={{ fontSize: 11, fill: isDark ? "#a3a3a3" : "#737373" }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: isDark ? "#171717" : "#fff",
                  border: `1px solid ${isDark ? "#27272a" : "#e5e5e5"}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => [fmtCurrency(v), "Faturamento"]}
              />
              <Line type="monotone" dataKey="valor" stroke="#e0242f" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-5">
          <h3 className="font-semibold text-sm mb-4">Meta do mês (equipe)</h3>
          <div className="text-2xl font-semibold tabular-nums mb-1">{fmtCurrency(d.faturamento)}</div>
          {metaTotal ? (
            <>
              <div className="text-sm mb-4 text-neutral-500 dark:text-neutral-400">de {fmtCurrency(metaTotal)}</div>
              <ProgressBar value={(d.faturamento / metaTotal) * 100} />
              <div className="mt-2 text-sm font-medium text-red-600">{((d.faturamento / metaTotal) * 100).toFixed(1)}%</div>
            </>
          ) : (
            <div className="text-sm mb-1 text-neutral-500 dark:text-neutral-400">
              Nenhuma meta definida.{" "}
              <button onClick={() => navigate("/vendas")} className="text-red-600 hover:underline font-medium">
                Definir no Histórico de Vendas
              </button>
            </div>
          )}

          <h3 className="font-semibold text-sm mt-6 mb-3">Ranking do mês</h3>
          <div className="space-y-2">
            {d.ranking.slice(0, 5).map((r: any, i: number) => (
              <div key={r.vendedor.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                      i === 0
                        ? "bg-red-600 text-white"
                        : "bg-gray-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {r.vendedor.nome}
                </span>
                <span className="font-medium tabular-nums">{fmtCurrency(r.faturamento)}</span>
              </div>
            ))}
            {d.ranking.length === 0 && <div className="text-sm text-neutral-500 dark:text-neutral-400">Sem dados ainda.</div>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
          <h3 className="font-semibold text-sm">Últimas vendas</h3>
          <button
            onClick={() => navigate("/vendas")}
            className="text-xs font-medium text-red-600 hover:underline flex items-center gap-1"
          >
            Ver todas <ChevronRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-900 text-left text-neutral-500 dark:text-neutral-400">
                <th className="px-5 py-3 font-medium">Venda</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Vendedora</th>
                <th className="px-5 py-3 font-medium">Horário</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {sales.slice(0, 6).map((s) => (
                <tr
                  key={s.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800/60"
                  onClick={() => navigate(`/vendas/${s.id}`)}
                >
                  <td className="px-5 py-3 font-medium">{s.numero}</td>
                  <td className="px-5 py-3">{s.cliente ? s.cliente.nome : "Não identificado"}</td>
                  <td className="px-5 py-3">{s.vendedora?.nome || "—"}</td>
                  <td className="px-5 py-3">{s.hora}</td>
                  <td className="px-5 py-3 text-right font-medium tabular-nums">{fmtCurrency(s.total)}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-neutral-500 dark:text-neutral-400">Nenhuma venda registrada ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
