-- Funções RPC para operações atômicas (venda, ajuste de estoque, troca)

create or replace function public.create_sale(
  p_cliente_id uuid,
  p_vendedora_id uuid,
  p_desconto numeric,
  p_discount_id uuid,
  p_forma_pagamento payment_method,
  p_items jsonb
)
returns sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale sales;
  v_subtotal numeric := 0;
  v_pecas integer := 0;
  v_item jsonb;
  v_estoque_atual integer;
begin
  select coalesce(sum((i->>'quantidade')::int * (i->>'preco_unitario')::numeric), 0),
         coalesce(sum((i->>'quantidade')::int), 0)
    into v_subtotal, v_pecas
    from jsonb_array_elements(p_items) i;

  if v_pecas = 0 then
    raise exception 'Venda sem itens';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select estoque into v_estoque_atual from products where id = (v_item->>'product_id')::uuid for update;
    if v_estoque_atual is null then
      raise exception 'Produto não encontrado: %', (v_item->>'product_id');
    end if;
    if v_estoque_atual < (v_item->>'quantidade')::int then
      raise exception 'Estoque insuficiente para o produto %', (v_item->>'product_id');
    end if;
  end loop;

  insert into sales (cliente_id, vendedora_id, subtotal, desconto, discount_id, total, pecas, forma_pagamento)
  values (p_cliente_id, p_vendedora_id, v_subtotal, p_desconto, p_discount_id, greatest(v_subtotal - p_desconto, 0), v_pecas, p_forma_pagamento)
  returning * into v_sale;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into sale_items (sale_id, product_id, quantidade, preco_unitario)
    values (v_sale.id, (v_item->>'product_id')::uuid, (v_item->>'quantidade')::int, (v_item->>'preco_unitario')::numeric);
  end loop;

  if p_discount_id is not null then
    update discounts set uso_atual = uso_atual + 1 where id = p_discount_id;
  end if;

  return v_sale;
end;
$$;

grant execute on function public.create_sale(uuid, uuid, numeric, uuid, payment_method, jsonb) to authenticated;

-- ajuste manual de estoque (entrada, perda, correção...)
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
    case when v_delta >= 0 then 'entrada' else 'ajuste' end,
    v_delta,
    p_novo_estoque,
    p_motivo,
    auth.uid()
  );

  return v_produto;
end;
$$;

grant execute on function public.adjust_stock(uuid, integer, text) to authenticated;

-- conclui uma troca/devolução, devolvendo a peça antiga ao estoque
-- e retirando a peça nova (quando aplicável). Assume 1 unidade por troca.
create or replace function public.complete_exchange(p_exchange_id uuid)
returns exchanges
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exchange exchanges;
  v_sale_item sale_items;
  v_novo_estoque integer;
begin
  select * into v_exchange from exchanges where id = p_exchange_id for update;
  if v_exchange is null then
    raise exception 'Troca não encontrada';
  end if;
  if v_exchange.status = 'concluida' then
    return v_exchange;
  end if;

  if v_exchange.sale_item_id is not null then
    select * into v_sale_item from sale_items where id = v_exchange.sale_item_id;
    if v_sale_item is not null then
      update products set estoque = estoque + v_sale_item.quantidade, updated_at = now()
       where id = v_sale_item.product_id
       returning estoque into v_novo_estoque;
      insert into stock_movements (product_id, tipo, quantidade, estoque_resultante, motivo, usuario_id)
      values (v_sale_item.product_id, 'devolucao', v_sale_item.quantidade, coalesce(v_novo_estoque, 0), 'Troca/devolução ' || p_exchange_id, auth.uid());
    end if;
  end if;

  if v_exchange.produto_novo_id is not null then
    select estoque into v_novo_estoque from products where id = v_exchange.produto_novo_id for update;
    if coalesce(v_novo_estoque, 0) < 1 then
      raise exception 'Produto de troca sem estoque disponível';
    end if;
    update products set estoque = estoque - 1, updated_at = now()
     where id = v_exchange.produto_novo_id
     returning estoque into v_novo_estoque;
    insert into stock_movements (product_id, tipo, quantidade, estoque_resultante, motivo, usuario_id)
    values (v_exchange.produto_novo_id, 'saida', 1, coalesce(v_novo_estoque, 0), 'Troca ' || p_exchange_id, auth.uid());
  end if;

  update exchanges set status = 'concluida' where id = p_exchange_id returning * into v_exchange;
  return v_exchange;
end;
$$;

grant execute on function public.complete_exchange(uuid) to authenticated;
