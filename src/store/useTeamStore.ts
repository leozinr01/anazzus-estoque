import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { TeamMember, UserRole } from "@/types";

interface ProfileRow {
  id: string;
  nome: string;
  cargo: string;
  role: UserRole;
  meta: number;
  ativo: boolean;
}

function mapProfile(row: ProfileRow): TeamMember {
  return { id: row.id, nome: row.nome, cargo: row.cargo, role: row.role, meta: Number(row.meta), ativo: row.ativo };
}

interface TeamState {
  team: TeamMember[];
  loading: boolean;
  loaded: boolean;
  fetchAll: () => Promise<void>;
  updateMember: (id: string, patch: Partial<{ nome: string; cargo: string; role: UserRole; meta: number; ativo: boolean }>) => Promise<string | null>;
}

export const useTeamStore = create<TeamState>((set) => ({
  team: [],
  loading: false,
  loaded: false,

  fetchAll: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from("profiles").select("*").order("nome");
    if (error) console.error(error);
    set({ team: (data || []).map(mapProfile), loading: false, loaded: true });
  },

  updateMember: async (id, patch) => {
    const { data, error } = await supabase.from("profiles").update(patch).eq("id", id).select().single();
    if (error) return error.message;
    set((s) => ({ team: s.team.map((t) => (t.id === id ? mapProfile(data) : t)) }));
    return null;
  },
}));
