import JsBarcode from "jsbarcode";
import type { Product } from "@/types";
import { fmtCurrency } from "./format";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

export function printProductLabel(product: Product, copies = 1) {
  if (!product.codigoBarras) {
    window.alert("Este produto não tem código de barras cadastrado.");
    return;
  }

  const canvas = document.createElement("canvas");
  JsBarcode(canvas, product.codigoBarras, {
    format: "CODE128",
    width: 1.6,
    height: 44,
    fontSize: 16,
    fontOptions: "bold",
    margin: 2,
    displayValue: true,
  });
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
          @page { size: 60mm 40mm; margin: 2mm; }
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; margin: 0; }
          .label {
            width: 56mm;
            padding: 2mm;
            text-align: center;
            page-break-after: always;
          }
          .nome { font-size: 10px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .variacao { font-size: 9px; color: #333; margin-bottom: 1mm; }
          img { width: 42mm; height: auto; display: block; margin: 0 auto; }
          .preco { font-size: 13px; font-weight: bold; margin-top: 1mm; }
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
