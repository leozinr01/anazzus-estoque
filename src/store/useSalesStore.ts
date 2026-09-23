import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { CartItem, PaymentMethod, Sale } from "@/types";

const SALE_SELECT = `
  *,
  customers ( id, nome, telefone, email, cpf, cliente_desde ),
  profiles ( id, nome, cargo, role, meta, ativo ),
  sale_items (
    id, product_id, quantidade, preco_unitario,
    products ( id, nome, sku, codigo_barras, categoria_id, tamanho, cor, preco, estoque, estoque_minimo, ativo, categories ( nome ) )
  )
`;

function mapSale(row: any): Sale {
  const createdAt: string = row.created_at;
  const dt = new Date(createdAt);
  return {
    id: row.id,
    numero: row.numero,
    data: dt.toLocaleDateString("pt-BR"),
    hora: dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    createdAt,
    cliente: row.customers
      ? {
          id: row.customers.id,
          nome: row.customers.nome,
          telefone: row.customers.telefone || "",
          email: row.customers.email || "",
          cpf: row.customers.cpf,
          clienteDesde: row.customers.cliente_desde,
        }
      : null,
    vendedora: row.profiles
      ? {
          id: row.profiles.id,
          nome: row.profiles.nome,
          cargo: row.profiles.cargo,
          role: row.profiles.role,
          meta: Number(row.profiles.meta),
          ativo: row.profiles.ativo,
        }
      : null,
    items: (row.sale_items || []).map((it: any) => ({
      id: it.id,
      productId: it.product_id,
      quantidade: it.quantidade,
      precoUnitario: Number(it.preco_unitario),
      produto: it.products
        ? {
            id: it.products.id,
            nome: it.products.nome,
            sku: it.products.sku,
            codigoBarras: it.products.codigo_barras,
            categoriaId: it.products.categoria_id,
            categoria: it.products.categories?.nome || "Sem categoria",
            tamanho: it.products.tamanho || "Único",
            cor: it.products.cor || "",
            preco: Number(it.products.preco),
            precoCusto: null,
            estoque: it.products.estoque,
            estoqueMinimo: it.products.estoque_minimo,
            ativo: it.products.ativo,
          }
        : null,
    })),
    subtotal: Number(row.subtotal),
    desconto: Number(row.desconto),
    total: Number(row.total),
    pecas: row.pecas,
    formaPagamento: row.forma_pagamento,
    status: row.status === "cancelada" ? "Cancelada" : "Concluída",
  };
}

interface SalesState {
  sales: Sale[];
  loading: boolean;
  loaded: boolean;
  fetchAll: () => Promise<void>;
  createSale: (input: {
    clienteId: string | null;
    vendedoraId: string;
    desconto: number;
    discountId: string | null;
    formaPagamento: PaymentMethod;
    items: CartItem[];
  }) => Promise<{ sale: Sale | null; error: string | null }>;
}

export const useSalesStore = create<SalesState>((set) => ({
  sales: [],
  loading: false,
  loaded: false,

  fetchAll: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from("sales").select(SALE_SELECT).order("created_at", { ascending: false });
    if (error) console.error(error);
    set({ sales: (data || []).map(mapSale), loading: false, loaded: true });
  },

  createSale: async ({ clienteId, vendedoraId, desconto, discountId, formaPagamento, items }) => {
    const { data: saleId, error } = await supabase.rpc("create_sale", {
      p_cliente_id: clienteId,
      p_vendedora_id: vendedoraId,
      p_desconto: desconto,
      p_discount_id: discountId,
      p_forma_pagamento: formaPagamento,
      p_items: items.map((it) => ({
        product_id: it.product.id,
        quantidade: it.quantidade,
        preco_unitario: it.product.preco,
      })),
    });
    if (error) return { sale: null, error: error.message };

    const id = (saleId as any)?.id || saleId;
    const { data: full, error: fetchErr } = await supabase.from("sales").select(SALE_SELECT).eq("id", id).single();
    if (fetchErr || !full) return { sale: null, error: fetchErr?.message || "Venda criada, mas não foi possível recarregar os dados." };

    const sale = mapSale(full);
    set((s) => ({ sales: [sale, ...s.sales] }));
    return { sale, error: null };
  },
}));
