function ean13CheckDigit(digits12: string) {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const n = Number(digits12[i]);
    sum += i % 2 === 0 ? n : n * 3;
  }
  return (10 - (sum % 10)) % 10;
}

/**
 * Gera um código de barras EAN-13 válido usando o prefixo 20-29,
 * reservado pelo padrão GS1 para uso interno/em loja (não colide com
 * produtos de fábrica reais).
 */
export function generateBarcode(existing: Set<string>): string {
  let code = "";
  do {
    const prefix = "20";
    const body = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");
    const digits12 = prefix + body;
    code = digits12 + ean13CheckDigit(digits12);
  } while (existing.has(code));
  return code;
}

/**
 * Gera um SKU sequencial (ex: AB-0007) com base no maior número já usado
 * com o mesmo prefixo.
 */
export function generateSku(existing: string[], prefix = "AB"): string {
  const re = new RegExp(`^${prefix}-(\\d+)$`, "i");
  const max = existing.reduce((max, sku) => {
    const m = sku.match(re);
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}
