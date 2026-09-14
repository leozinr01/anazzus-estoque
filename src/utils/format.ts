export const fmtCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function fmtPhone(raw: string | null | undefined) {
  if (!raw) return "—";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return raw;
}

export function statusEstoque(p: { estoque: number; estoqueMinimo: number }) {
  if (p.estoque === 0) return "Sem estoque";
  if (p.estoque <= p.estoqueMinimo) return "Estoque baixo";
  return "Em estoque";
}
