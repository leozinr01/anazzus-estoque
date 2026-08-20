export const fmtCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function statusEstoque(p: { estoque: number; estoqueMinimo: number }) {
  if (p.estoque === 0) return "Sem estoque";
  if (p.estoque <= p.estoqueMinimo) return "Estoque baixo";
  return "Em estoque";
}
