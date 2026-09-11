import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Customer } from "@/types";

interface CustomerRow {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  cpf: string | null;
  cliente_desde: string;
}

function mapCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    nome: row.nome,
    telefone: row.telefone || "",
    email: row.email || "",
    cpf: row.cpf,
    clienteDesde: row.cliente_desde,
  };
}

export interface NewCustomerInput {
  nome: string;
  telefone: string;
  email: string;
  cpf?: string;
}

interface CustomersState {
  customers: Customer[];
  loading: boolean;
  loaded: boolean;
  fetchAll: () => Promise<void>;
  addCustomer: (input: NewCustomerInput) => Promise<{ customer: Customer | null; error: string | null }>;
}

export const useCustomersStore = create<CustomersState>((set) => ({
  customers: [],
  loading: false,
  loaded: false,

  fetchAll: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from("customers").select("*").order("nome");
    if (error) console.error(error);
    set({ customers: (data || []).map(mapCustomer), loading: false, loaded: true });
  },

  addCustomer: async (input) => {
    const { data, error } = await supabase
      .from("customers")
      .insert({ nome: input.nome, telefone: input.telefone || null, email: input.email || null, cpf: input.cpf || null })
      .select()
      .single();
    if (error) return { customer: null, error: error.message };
    const customer = mapCustomer(data);
    set((s) => ({ customers: [...s.customers, customer].sort((a, b) => a.nome.localeCompare(b.nome)) }));
    return { customer, error: null };
  },
}));
