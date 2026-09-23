import type { PostgrestError } from "@supabase/supabase-js";

const PAGE_SIZE = 1000;

/**
 * O Supabase devolve no máximo 1000 linhas por requisição (max-rows) e corta
 * o resto sem avisar. Busca página por página até vir uma página vazia. A
 * consulta precisa de ordenação estável terminando numa coluna única (ex.: id),
 * senão linhas podem repetir ou sumir entre páginas.
 */
export async function fetchAllRows<T = any>(
  query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>
): Promise<{ data: T[]; error: PostgrestError | null }> {
  const rows: T[] = [];
  for (;;) {
    const { data, error } = await query(rows.length, rows.length + PAGE_SIZE - 1);
    if (error) return { data: rows, error };
    if (!data || data.length === 0) return { data: rows, error: null };
    rows.push(...data);
  }
}
