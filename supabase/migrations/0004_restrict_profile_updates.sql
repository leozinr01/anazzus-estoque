-- Antes, qualquer usuario autenticado podia atualizar a propria linha em
-- profiles (id = auth.uid()), o que incluia a coluna role -- ou seja, uma
-- vendedora poderia chamar a API do Supabase diretamente e se promover a
-- admin. Nenhuma tela do app depende de autoatualizacao de perfil, entao
-- a atualizacao de profiles fica restrita a admin/gerente.
drop policy if exists "profiles_update_self" on profiles;

create policy "profiles_update_admin" on profiles for update to authenticated
  using (is_admin_or_gerente())
  with check (is_admin_or_gerente());
