-- handle_new_user lia role e cargo de raw_user_meta_data, que e enviado pelo
-- proprio usuario no signUp. Com o cadastro publico habilitado, qualquer um
-- com a chave publica podia criar uma conta ja como admin. Agora todo perfil
-- novo nasce como vendedora; promocoes sao feitas por admin/gerente na tela
-- de Equipe.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, role, cargo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    'vendedora',
    'Vendedora'
  );
  return new;
end;
$$;
