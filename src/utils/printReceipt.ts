import { PAYMENT_LABELS, type Sale, type StoreSettings } from "@/types";
import { fmtCurrency } from "./format";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

export function printReceipt(sale: Sale, settings: StoreSettings | null) {
  const win = window.open("", "_blank", "width=420,height=600");
  if (!win) {
    window.alert("Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está desativado.");
    return;
  }

  const itemsHtml = sale.items
    .map(
      (it) => `
      <div class="item">
        <div class="item-nome">${escapeHtml(it.produto?.nome || "Produto")}</div>
        <div class="item-linha"><span>${it.quantidade} x ${fmtCurrency(it.precoUnitario)}</span><span>${fmtCurrency(it.precoUnitario * it.quantidade)}</span></div>
      </div>`
    )
    .join("");

  win.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Comprovante ${escapeHtml(sale.numero)}</title>
        <style>
          @page { size: 80mm auto; margin: 3mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            font-weight: 600;
            color: #000;
            margin: 0;
            width: 72mm;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .item { margin-bottom: 4px; }
          .item-nome { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .item-linha, .totais > div {
            display: grid;
            grid-template-columns: 1fr auto;
            column-gap: 6px;
          }
          .item-linha span:first-child, .totais > div span:first-child {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .item-linha span:last-child, .totais > div span:last-child {
            text-align: right;
            white-space: nowrap;
          }
          .totais .total { font-weight: bold; font-size: 14px; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="center bold">${escapeHtml(settings?.nomeLoja || "Anazzus Boutique")}</div>
        ${settings?.cnpj ? `<div class="center">CNPJ ${escapeHtml(settings.cnpj)}</div>` : ""}
        ${settings?.endereco ? `<div class="center">${escapeHtml(settings.endereco)}</div>` : ""}
        <div class="divider"></div>
        <div>Venda ${escapeHtml(sale.numero)}</div>
        <div>${escapeHtml(sale.data)} ${escapeHtml(sale.hora)}</div>
        <div>Cliente: ${escapeHtml(sale.cliente?.nome || "Não identificado")}</div>
        <div>Vendedora: ${escapeHtml(sale.vendedora?.nome || "—")}</div>
        <div class="divider"></div>
        ${itemsHtml}
        <div class="divider"></div>
        <div class="totais">
          <div><span>Subtotal</span><span>${fmtCurrency(sale.subtotal)}</span></div>
          <div><span>Desconto</span><span>${fmtCurrency(sale.desconto)}</span></div>
          <div class="total"><span>TOTAL</span><span>${fmtCurrency(sale.total)}</span></div>
          <div><span>Pagamento</span><span>${PAYMENT_LABELS[sale.formaPagamento]}</span></div>
        </div>
        <div class="divider"></div>
        ${settings?.politicaTroca ? `<div style="font-size:10px">${escapeHtml(settings.politicaTroca)}</div>` : ""}
        <div class="center" style="margin-top:8px">Obrigada pela preferência!</div>
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
