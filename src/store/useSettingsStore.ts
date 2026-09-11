import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Discount, DiscountType, StoreSettings } from "@/types";

function mapSettings(row: any): StoreSettings {
  return {
    nomeLoja: row.nome_loja,
    cnpj: row.cnpj,
    telefone: row.telefone,
    endereco: row.endereco,
    diasTroca: row.dias_troca,
    politicaTroca: row.politica_troca,
    nfceProvider: row.nfce_provider,
  };
}

function mapDiscount(row: any): Discount {
  return {
    id: row.id,
    codigo: row.codigo,
    descricao: row.descricao,
    tipo: row.tipo,
    valor: Number(row.valor),
    ativo: row.ativo,
    validoDe: row.valido_de,
    validoAte: row.valido_ate,
    usoMaximo: row.uso_maximo,
    usoAtual: row.uso_atual,
  };
}

interface SettingsState {
  settings: StoreSettings | null;
  discounts: Discount[];
  loading: boolean;
  loaded: boolean;
  fetchAll: () => Promise<void>;
  updateSettings: (patch: Partial<{
    nomeLoja: string; cnpj: string; telefone: string; endereco: string; diasTroca: number; politicaTroca: string; nfceProvider: string;
  }>) => Promise<string | null>;
  addDiscount: (input: { codigo: string; descricao: string; tipo: DiscountType; valor: number; usoMaximo: number | null }) => Promise<string | null>;
  toggleDiscount: (id: string, ativo: boolean) => Promise<string | null>;
  findDiscountByCode: (code: string) => Discount | undefined;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  discounts: [],
  loading: false,
  loaded: false,

  fetchAll: async () => {
    set({ loading: true });
    const [{ data: settings, error: sErr }, { data: discounts, error: dErr }] = await Promise.all([
      supabase.from("store_settings").select("*").single(),
      supabase.from("discounts").select("*").order("created_at", { ascending: false }),
    ]);
    if (sErr) console.error(sErr);
    if (dErr) console.error(dErr);
    set({
      settings: settings ? mapSettings(settings) : null,
      discounts: (discounts || []).map(mapDiscount),
      loading: false,
      loaded: true,
    });
  },

  updateSettings: async (patch) => {
    const payload: Record<string, unknown> = {};
    if (patch.nomeLoja !== undefined) payload.nome_loja = patch.nomeLoja;
    if (patch.cnpj !== undefined) payload.cnpj = patch.cnpj;
    if (patch.telefone !== undefined) payload.telefone = patch.telefone;
    if (patch.endereco !== undefined) payload.endereco = patch.endereco;
    if (patch.diasTroca !== undefined) payload.dias_troca = patch.diasTroca;
    if (patch.politicaTroca !== undefined) payload.politica_troca = patch.politicaTroca;
    if (patch.nfceProvider !== undefined) payload.nfce_provider = patch.nfceProvider;

    const { data, error } = await supabase.from("store_settings").update(payload).eq("id", true).select().single();
    if (error) return error.message;
    set({ settings: mapSettings(data) });
    return null;
  },

  addDiscount: async (input) => {
    const { data, error } = await supabase
      .from("discounts")
      .insert({
        codigo: input.codigo.trim().toUpperCase() || null,
        descricao: input.descricao || null,
        tipo: input.tipo,
        valor: input.valor,
        uso_maximo: input.usoMaximo,
      })
      .select()
      .single();
    if (error) return error.message;
    set((s) => ({ discounts: [mapDiscount(data), ...s.discounts] }));
    return null;
  },

  toggleDiscount: async (id, ativo) => {
    const { data, error } = await supabase.from("discounts").update({ ativo }).eq("id", id).select().single();
    if (error) return error.message;
    set((s) => ({ discounts: s.discounts.map((d) => (d.id === id ? mapDiscount(data) : d)) }));
    return null;
  },

  findDiscountByCode: (code) => {
    const c = code.trim().toUpperCase();
    return get().discounts.find((d) => d.ativo && d.codigo === c);
  },
}));
