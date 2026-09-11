import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { TeamMember } from "@/types";

interface AuthState {
  session: Session | null;
  profile: TeamMember | null;
  loading: boolean;
  init: () => () => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  loadProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  loading: true,

  init: () => {
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, loading: false });
      if (data.session) get().loadProfile(data.session.user.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, loading: false });
      if (session) {
        get().loadProfile(session.user.id);
      } else {
        set({ profile: null });
      }
    });

    return () => sub.subscription.unsubscribe();
  },

  loadProfile: async (userId: string) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error || !data) {
      set({ profile: null });
      return;
    }
    set({
      profile: {
        id: data.id,
        nome: data.nome,
        cargo: data.cargo,
        role: data.role,
        meta: Number(data.meta),
        ativo: data.ativo,
      },
    });
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },
}));
