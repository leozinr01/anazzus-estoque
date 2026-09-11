import type { Sale } from "@/types";

export function buildChartData(sales: Sale[], range: "7d" | "30d" | "mes") {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : new Date().getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totals = new Map<string, number>();
  const out: { label: string; valor: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    totals.set(key, 0);
    out.push({ label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), valor: 0 });
  }

  sales
    .filter((s) => s.status !== "Cancelada")
    .forEach((s) => {
      const key = s.createdAt.slice(0, 10);
      if (totals.has(key)) {
        totals.set(key, (totals.get(key) || 0) + s.total);
      }
    });

  let idx = 0;
  for (const key of totals.keys()) {
    out[idx].valor = Math.round((totals.get(key) || 0) * 100) / 100;
    idx += 1;
  }
  return out;
}
