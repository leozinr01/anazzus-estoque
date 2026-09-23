import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/fetchAllRows";
import type { Category, Product } from "@/types";

interface ProductRow {
  id: string;
  nome: string;
  sku: string;
  codigo_barras: string | null;
  categoria_id: string | null;
  tamanho: string | null;
  cor: string | null;
  preco: number;
  estoque: number;
  estoque_minimo: number;
  ativo: boolean;
  categories: { nome: string } | null;
}

function mapProduct(row: ProductRow, precoCusto: number | null = null): Product {
  return {
    id: row.id,
    nome: row.nome,
    sku: row.sku,
    codigoBarras: row.codigo_barras,
    categoriaId: row.categoria_id,
    categoria: row.categories?.nome || "Sem categoria",
    tamanho: row.tamanho || "Único",
    cor: row.cor || "",
    preco: Number(row.preco),
    precoCusto,
    estoque: row.estoque,
    estoqueMinimo: row.estoque_minimo,
    ativo: row.ativo,
  };
}

export interface NewProductInput {
  nome: string;
  sku: string;
  codigoBarras: string;
  categoriaNome: string;
  tamanho: string;
  cor: string;
  preco: number;
  precoCusto: number;
  estoque: number;
  estoqueMinimo: number;
}

interface CatalogState {
  products: Product[];
  categories: Category[];
  loading: boolean;
  loaded: boolean;
  fetchAll: () => Promise<void>;
  addProduct: (input: NewProductInput) => Promise<string | null>;
  adjustStock: (productId: string, novoEstoque: number, motivo: string) => Promise<string | null>;
  findByBarcode: (code: string) => Product | undefined;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  products: [],
  categories: [],
  loading: false,
  loaded: false,

  fetchAll: async () => {
    set({ loading: true });
    const [{ data: products, error: pErr }, { data: categories, error: cErr }, { data: costs, error: kErr }] = await Promise.all([
      fetchAllRows((from, to) => supabase.from("products").select("*, categories(nome)").order("nome").order("id").range(from, to)),
      supabase.from("categories").select("*").order("nome"),
      // RLS só devolve linhas para admin/gerente; para vendedoras vem vazio
      fetchAllRows((from, to) => supabase.from("product_costs").select("product_id, preco_custo").order("product_id").range(from, to)),
    ]);
    if (pErr) console.error(pErr);
    if (cErr) console.error(cErr);
    if (kErr) console.error(kErr);
    const costByProduct = new Map((costs || []).map((c) => [c.product_id as string, Number(c.preco_custo)]));
    set({
      products: (products || []).map((r) => mapProduct(r as unknown as ProductRow, costByProduct.get(r.id) ?? null)),
      categories: (categories || []).map((c) => ({ id: c.id, nome: c.nome })),
      loading: false,
      loaded: true,
    });
  },

  addProduct: async (input) => {
    let categoriaId: string | null = null;
    const existing = get().categories.find((c) => c.nome.toLowerCase() === input.categoriaNome.trim().toLowerCase());
    if (existing) {
      categoriaId = existing.id;
    } else if (input.categoriaNome.trim()) {
      const { data, error } = await supabase
        .from("categories")
        .insert({ nome: input.categoriaNome.trim() })
        .select()
        .single();
      if (error) return error.message;
      categoriaId = data.id;
      set((s) => ({ categories: [...s.categories, { id: data.id, nome: data.nome }].sort((a, b) => a.nome.localeCompare(b.nome)) }));
    }

    const { data, error } = await supabase
      .from("products")
      .insert({
        nome: input.nome,
        sku: input.sku,
        codigo_barras: input.codigoBarras || null,
        categoria_id: categoriaId,
        tamanho: input.tamanho,
        cor: input.cor,
        preco: input.preco,
        estoque: input.estoque,
        estoque_minimo: input.estoqueMinimo,
      })
      .select("*, categories(nome)")
      .single();
    if (error) return error.message;

    // insert sem .select(): vendedoras podem gravar o custo, mas não lê-lo de volta
    const { error: costErr } = await supabase
      .from("product_costs")
      .insert({ product_id: data.id, preco_custo: input.precoCusto });
    if (costErr) console.error(costErr);

    set((s) => ({ products: [mapProduct(data as unknown as ProductRow, costErr ? null : input.precoCusto), ...s.products] }));
    return null;
  },

  adjustStock: async (productId, novoEstoque, motivo) => {
    const { data, error } = await supabase.rpc("adjust_stock", {
      p_product_id: productId,
      p_novo_estoque: novoEstoque,
      p_motivo: motivo,
    });
    if (error) return error.message;
    set((s) => ({
      products: s.products.map((p) => (p.id === productId ? { ...p, estoque: data.estoque } : p)),
    }));
    return null;
  },

  findByBarcode: (code) => get().products.find((p) => p.codigoBarras === code),
}));
