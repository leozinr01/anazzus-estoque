import JsBarcode from "jsbarcode";
import type { Product } from "@/types";
import { fmtCurrency } from "./format";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

function ean13CheckDigitOk(digits13: string) {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += i % 2 === 0 ? Number(digits13[i]) : Number(digits13[i]) * 3;
  return (10 - (sum % 10)) % 10 === Number(digits13[12]);
}

/**
 * Usa a simbologia correta para o valor do código (EAN-13/UPC/EAN-8 quando o
 * valor é numericamente válido nesses padrões), caindo para CODE128 apenas
 * quando o código não se encaixa em nenhum padrão numérico — leitores de
 * PDV/varejo esperam EAN/UPC e podem falhar ao ler um CODE128 genérico.
 */
function pickBarcodeFormat(code: string): string {
  if (/^\d{13}$/.test(code) && ean13CheckDigitOk(code)) return "EAN13";
  if (/^\d{12}$/.test(code)) return "UPC";
  if (/^\d{8}$/.test(code)) return "EAN8";
  return "CODE128";
}

export function printProductLabel(product: Product, copies = 1) {
  if (!product.codigoBarras) {
    window.alert("Este produto não tem código de barras cadastrado.");
    return;
  }

  const canvas = document.createElement("canvas");
  const baseOptions = {
    width: 3,
    height: 80,
    fontSize: 24,
    fontOptions: "",
    margin: 4,
    displayValue: true,
  };
  try {
    JsBarcode(canvas, product.codigoBarras, { ...baseOptions, format: pickBarcodeFormat(product.codigoBarras) });
  } catch {
    // Código não é válido no formato detectado (ex.: dígito verificador
    // incorreto digitado manualmente) — CODE128 aceita qualquer texto.
    JsBarcode(canvas, product.codigoBarras, { ...baseOptions, format: "CODE128" });
  }
  const dataUrl = canvas.toDataURL("image/png");

  const win = window.open("", "_blank", "width=420,height=320");
  if (!win) {
    window.alert("Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está desativado.");
    return;
  }

  const labelBlock = `
    <div class="label">
      <div class="nome">${escapeHtml(product.nome)}</div>
      <div class="variacao">${escapeHtml(product.tamanho)}${product.cor ? " · " + escapeHtml(product.cor) : ""}</div>
      <img src="${dataUrl}" alt="barcode" />
      <div class="preco">${fmtCurrency(product.preco)}</div>
    </div>`;

  win.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Etiqueta - ${escapeHtml(product.sku)}</title>
        <style>
          @page { size: 40mm 25mm; margin: 1mm; }
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; margin: 0; }
          .label {
            width: 38mm;
            padding: 1mm;
            text-align: center;
            page-break-after: always;
          }
          .nome { font-size: 8px; line-height: 1.1; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .variacao { font-size: 7px; line-height: 1.1; font-weight: bold; color: #000; margin-bottom: 0.5mm; }
          img { width: 34mm; height: auto; display: block; margin: 0 auto; }
          .preco { font-size: 9px; line-height: 1.1; font-weight: bold; margin-top: 0.5mm; }
        </style>
      </head>
      <body>
        ${Array.from({ length: Math.max(1, copies) }, () => labelBlock).join("")}
        <script>
          window.onload = function () {
            window.print();
            window.onafterprint = function () { window.close(); };
          };
        </script>
      </body>
    </html>
  `);
  win.document.close();
}
