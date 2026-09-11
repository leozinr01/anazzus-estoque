import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Exchange, ExchangeType } from "@/types";

function mapExchange(row: any): Exchange {
  return {
    id: row.id,
    saleId: row.sale_id,
    saleNumero: row.sales?.numero || "",
    saleItemId: row.sale_item_id,
    tipo: row.tipo,
    motivo: row.motivo,
    status: row.status,
    produtoNovoId: row.produto_novo_id,
    createdAt: row.created_at,
  };
}

interface ExchangesState {
  exchanges: Exchange[];
  loading: boolean;
  loaded: boolean;
  fetchAll: () => Promise<void>;
  createExchange: (input: {
    saleId: string;
    saleItemId: string | null;
    tipo: ExchangeType;
    motivo: string;
    produtoNovoId: string | null;
  }) => Promise<string | null>;
  completeExchange: (id: string) => Promise<string | null>;
}

export const useExchangesStore = create<ExchangesState>((set) => ({
  exchanges: [],
  loading: false,
  loaded: false,

  fetchAll: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("exchanges")
      .select("*, sales(numero)")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    set({ exchanges: (data || []).map(mapExchange), loading: false, loaded: true });
  },

  createExchange: async (input) => {
    const { data, error } = await supabase
      .from("exchanges")
      .insert({
        sale_id: input.saleId,
        sale_item_id: input.saleItemId,
        tipo: input.tipo,
        motivo: input.motivo || null,
        produto_novo_id: input.produtoNovoId,
      })
      .select("*, sales(numero)")
      .single();
    if (error) return error.message;
    set((s) => ({ exchanges: [mapExchange(data), ...s.exchanges] }));
    return null;
  },

  completeExchange: async (id) => {
    const { error } = await supabase.rpc("complete_exchange", { p_exchange_id: id });
    if (error) return error.message;
    set((s) => ({ exchanges: s.exchanges.map((e) => (e.id === id ? { ...e, status: "concluida" } : e)) }));
    return null;
  },
}));
