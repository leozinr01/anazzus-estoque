-- adjust_stock falhava com "column tipo is of type movement_type but
-- expression is of type text" (42804): o CASE WHEN ... THEN 'entrada'
-- ELSE 'ajuste' END resolve como text e o Postgres nao faz o cast
-- implicito pro enum movement_type ao inserir em stock_movements.
create or replace function public.adjust_stock(
  p_product_id uuid,
  p_novo_estoque integer,
  p_motivo text default 'Ajuste manual'
)
returns products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_atual integer;
  v_delta integer;
  v_produto products;
begin
  select estoque into v_atual from products where id = p_product_id for update;
  if v_atual is null then
    raise exception 'Produto não encontrado';
  end if;
  v_delta := p_novo_estoque - v_atual;

  update products set estoque = p_novo_estoque, updated_at = now()
   where id = p_product_id
   returning * into v_produto;

  insert into stock_movements (product_id, tipo, quantidade, estoque_resultante, motivo, usuario_id)
  values (
    p_product_id,
    (case when v_delta >= 0 then 'entrada' else 'ajuste' end)::movement_type,
    v_delta,
    p_novo_estoque,
    p_motivo,
    auth.uid()
  );

  return v_produto;
end;
$$;

grant execute on function public.adjust_stock(uuid, integer, text) to authenticated;
