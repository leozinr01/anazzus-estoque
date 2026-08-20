import type { Sale } from "@/types";
import { TEAM } from "./team";
import { CUSTOMERS } from "./customers";
import { PRODUCTS } from "./products";

function makeSales(): Sale[] {
  const sales: Sale[] = [];
  let n = 184;
  const sellers = TEAM.filter((t) => t.id !== "carlos");
  for (let i = 0; i < 30; i++) {
    n -= 1;
    const seller = sellers[i % 4];
    const customer = i % 6 === 0 ? null : CUSTOMERS[i % CUSTOMERS.length];
    const itemCount = 1 + (i % 3);
    const items = [];
    for (let j = 0; j < itemCount; j++) {
      const prod = PRODUCTS[(i * 3 + j * 7) % PRODUCTS.length];
      const qtd = 1 + ((i + j) % 2);
      items.push({ produto: prod, quantidade: qtd, precoUnitario: prod.preco });
    }
    const subtotal = items.reduce((s, it) => s + it.precoUnitario * it.quantidade, 0);
    const desconto = i % 5 === 0 ? Math.round(subtotal * 0.05 * 100) / 100 : 0;
    const total = Math.round((subtotal - desconto) * 100) / 100;
    const day = 20 - (i % 20);
    const hour = 9 + (i % 9);
    const minute = (i * 7) % 60;
    sales.push({
      id: `v${n}`,
      numero: `#${String(n).padStart(5, "0")}`,
      data: `${String(day).padStart(2, "0")}/08/2026`,
      hora: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      cliente: customer,
      vendedora: seller,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      desconto,
      total,
      pecas: items.reduce((s, it) => s + it.quantidade, 0),
      status: i % 11 === 0 ? "Cancelada" : "Concluída",
    });
  }
  return sales.sort((a, b) => (a.numero < b.numero ? 1 : -1));
}

export const SALES: Sale[] = makeSales();

export function chartData(range: "7d" | "30d" | "mes") {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 20;
  const out = [];
  for (let i = days; i >= 1; i--) {
    const seed = (i * 37 + days * 11) % 100;
    out.push({
      label: `${String(21 - (i % 20)).padStart(2, "0")}/08`,
      valor: Math.round(900 + seed * 24 + (i % 5) * 130),
    });
  }
  return out;
}
