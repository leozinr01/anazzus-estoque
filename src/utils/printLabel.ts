import JsBarcode from "jsbarcode";
import type { Product } from "@/types";
import { fmtCurrency } from "./format";

/**
 * Rolo de etiquetas 40x25mm em 2 colunas (Elgin L42 Pro Full). Cada "página"
 * enviada à impressora é uma linha inteira do rolo, com as duas etiquetas lado
 * a lado — o driver precisa estar configurado com esse mesmo tamanho de página
 * (ROW_WIDTH_MM x LABEL_HEIGHT_MM). Se a impressão sair deslocada para um lado,
 * ajuste COLUMN_GAP_MM / ROW_OFFSET_MM conforme a medida real do rolo.
 */
const LABEL_WIDTH_MM = 40;
const LABEL_HEIGHT_MM = 25;
const COLUMNS = 2;
const COLUMN_GAP_MM = 3;
const ROW_OFFSET_MM = 0;
const ROW_WIDTH_MM = ROW_OFFSET_MM + COLUMNS * LABEL_WIDTH_MM + (COLUMNS - 1) * COLUMN_GAP_MM;

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

function barcodeDataUrl(code: string) {
  const canvas = document.createElement("canvas");
  const baseOptions = {
    width: 3,
    height: 50,
    fontSize: 20,
    fontOptions: "",
    margin: 4,
    displayValue: true,
  };
  try {
    JsBarcode(canvas, code, { ...baseOptions, format: pickBarcodeFormat(code) });
  } catch {
    // Código não é válido no formato detectado (ex.: dígito verificador
    // incorreto digitado manualmente) — CODE128 aceita qualquer texto.
    JsBarcode(canvas, code, { ...baseOptions, format: "CODE128" });
  }
  return canvas.toDataURL("image/png");
}

/** Imprime uma etiqueta por item da lista, preenchendo as linhas do rolo em 2 colunas. */
export function printProductLabels(products: Product[]) {
  const printable = products.filter((p) => p.codigoBarras);
  if (printable.length === 0) {
    window.alert("Este produto não tem código de barras cadastrado.");
    return;
  }

  const win = window.open("", "_blank", "width=520,height=320");
  if (!win) {
    window.alert("Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está desativado.");
    return;
  }

  const barcodes = new Map<string, string>();
  const labelBlocks = printable.map((product) => {
    const code = product.codigoBarras as string;
    if (!barcodes.has(code)) barcodes.set(code, barcodeDataUrl(code));
    return `
      <div class="label">
        <div class="nome">${escapeHtml(product.nome)}</div>
        <div class="variacao">${escapeHtml(product.tamanho)}${product.cor ? " · " + escapeHtml(product.cor) : ""}</div>
        <img src="${barcodes.get(code)}" alt="barcode" />
        <div class="preco">${fmtCurrency(product.preco)}</div>
      </div>`;
  });

  const rows: string[] = [];
  for (let i = 0; i < labelBlocks.length; i += COLUMNS) {
    rows.push(`<div class="row">${labelBlocks.slice(i, i + COLUMNS).join("")}</div>`);
  }

  win.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Etiquetas</title>
        <style>
          @page { size: ${ROW_WIDTH_MM}mm ${LABEL_HEIGHT_MM}mm; margin: 0; }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; color: #000; }
          .row {
            display: flex;
            gap: ${COLUMN_GAP_MM}mm;
            width: ${ROW_WIDTH_MM}mm;
            height: ${LABEL_HEIGHT_MM}mm;
            padding-left: ${ROW_OFFSET_MM}mm;
            overflow: hidden;
          }
          .row:not(:last-child) { break-after: page; page-break-after: always; }
          .label {
            width: ${LABEL_WIDTH_MM}mm;
            height: ${LABEL_HEIGHT_MM}mm;
            padding: 1.5mm 1mm;
            overflow: hidden;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .nome { font-size: 8px; line-height: 1.1; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .variacao { font-size: 7px; line-height: 1.1; font-weight: bold; margin-bottom: 0.5mm; }
          img { width: 34mm; height: auto; display: block; margin: 0 auto; }
          .preco { font-size: 9px; line-height: 1.1; font-weight: bold; margin-top: 0.5mm; }
        </style>
      </head>
      <body>
        ${rows.join("")}
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

export function printProductLabel(product: Product, copies = 1) {
  printProductLabels(Array.from({ length: Math.max(1, copies) }, () => product));
}
