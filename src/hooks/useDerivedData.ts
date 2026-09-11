import { useMemo } from "react";
import { statusEstoque } from "@/utils/format";
import type { Customer, Product, Sale, TeamMember } from "@/types";

export function useDerivedData(products: Product[], sales: Sale[], team: TeamMember[], customers: Customer[]) {
  return useMemo(() => {
    const validSales = sales.filter((s) => s.status !== "Cancelada");
    const faturamento = validSales.reduce((s, v) => s + v.total, 0);
    const qtdVendas = validSales.length;
    const clientesAtendidosSet = new Set(validSales.map((v) => (v.cliente ? v.cliente.id : `walkin-${v.id}`)));
    const ticketMedio = qtdVendas ? faturamento / qtdVendas : 0;

    const porVendedor: Record<string, any> = {};
    team.forEach((t) => {
      porVendedor[t.id] = { vendedor: t, faturamento: 0, vendas: 0, clientes: new Set() };
    });
    validSales.forEach((v) => {
      if (!v.vendedora) return;
      const entry = porVendedor[v.vendedora.id];
      if (!entry) return;
      entry.faturamento += v.total;
      entry.vendas += 1;
      entry.clientes.add(v.cliente ? v.cliente.id : `walkin-${v.id}`);
    });
    const ranking = Object.values(porVendedor)
      .map((e: any) => ({
        ...e,
        clientesAtendidos: e.clientes.size,
        ticketMedio: e.vendas ? e.faturamento / e.vendas : 0,
        progresso: e.vendedor.meta > 0 ? Math.min(100, (e.faturamento / e.vendedor.meta) * 100) : 0,
      }))
      .sort((a: any, b: any) => b.faturamento - a.faturamento);

    const porCliente: Record<string, any> = {};
    customers.forEach((c) => (porCliente[c.id] = { cliente: c, compras: 0, total: 0, ultima: null, ultimaVendedora: null }));
    validSales.forEach((v) => {
      if (!v.cliente) return;
      const e = porCliente[v.cliente.id];
      if (!e) return;
      e.compras += 1;
      e.total += v.total;
      if (!e.ultima) {
        e.ultima = v.data;
        e.ultimaVendedora = v.vendedora?.nome || "—";
      }
    });

    const totalPecas = products.reduce((s, p) => s + p.estoque, 0);
    const estoqueBaixo = products.filter((p) => statusEstoque(p) === "Estoque baixo").length;
    const semEstoque = products.filter((p) => statusEstoque(p) === "Sem estoque").length;

    return {
      faturamento,
      qtdVendas,
      clientesAtendidos: clientesAtendidosSet.size,
      ticketMedio,
      ranking,
      porCliente,
      totalPecas,
      estoqueBaixo,
      semEstoque,
      validSales,
    };
  }, [products, sales, team, customers]);
}
