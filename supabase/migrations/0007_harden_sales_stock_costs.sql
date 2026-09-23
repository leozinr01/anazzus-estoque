-- Endurece as regras de venda, estoque, trocas e custo:
--
-- 1. create_sale confiava no preco_unitario e no desconto enviados pelo
--    navegador. Agora o preco vem de products e o desconto de cupom e
--    calculado aqui (validando ativo, validade e limite de usos). O desconto
--    manual continua permitido, limitado entre 0 e o subtotal.
-- 2. Qualquer usuario autenticado podia dar UPDATE direto em products (preco,
--    estoque) sem passar por adjust_stock nem gerar historico, e inserir
--    direto em sales/sale_items/stock_movements contornando create_sale.
--    Essas escritas agora so acontecem pelas funções (security definer).
-- 3. complete_exchange nao checava o cargo, entao uma vendedora concluia uma
--    troca pendente de aprovacao chamando a RPC direto.
-- 4. preco_custo sai de products (legivel por todos) para product_costs, que
--    so admin/gerente conseguem ler.

-- ==========================================================================
-- 1. create_sale
-- ==========================================================================
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
  v_discount discounts;
  v_subtotal numeric := 0;
  v_desconto numeric := 0;
  v_pecas integer := 0;
  v_row record;
  v_estoque_atual integer;
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Venda sem itens';
  end if;

  if exists (
    select 1 from jsonb_to_recordset(p_items) as x(product_id uuid, quantidade int)
     where x.product_id is null or coalesce(x.quantidade, 0) <= 0
  ) then
    raise exception 'Item de venda inválido';
  end if;

  -- trava os produtos e confere o estoque somando repetições do mesmo produto
  for v_row in
    select x.product_id, sum(x.quantidade)::int as quantidade
      from jsonb_to_recordset(p_items) as x(product_id uuid, quantidade int)
     group by x.product_id
     order by x.product_id
  loop
    select estoque into v_estoque_atual from products where id = v_row.product_id for update;
    if not found then
      raise exception 'Produto não encontrado: %', v_row.product_id;
    end if;
    if v_estoque_atual < v_row.quantidade then
      raise exception 'Estoque insuficiente para o produto %', v_row.product_id;
    end if;
  end loop;

  select coalesce(sum(x.quantidade * p.preco), 0), coalesce(sum(x.quantidade), 0)
    into v_subtotal, v_pecas
    from jsonb_to_recordset(p_items) as x(product_id uuid, quantidade int)
    join products p on p.id = x.product_id;

  if p_discount_id is not null then
    select * into v_discount from discounts where id = p_discount_id for update;
    if not found
       or not v_discount.ativo
       or (v_discount.valido_de is not null and v_discount.valido_de > v_hoje)
       or (v_discount.valido_ate is not null and v_discount.valido_ate < v_hoje)
       or (v_discount.uso_maximo is not null and v_discount.uso_atual >= v_discount.uso_maximo) then
      raise exception 'Cupom inválido ou expirado';
    end if;
    v_desconto := case v_discount.tipo
      when 'percentual' then round(v_subtotal * v_discount.valor / 100, 2)
      else v_discount.valor
    end;
  else
    v_desconto := coalesce(p_desconto, 0);
  end if;
  v_desconto := least(greatest(v_desconto, 0), v_subtotal);

  insert into sales (cliente_id, vendedora_id, subtotal, desconto, discount_id, total, pecas, forma_pagamento)
  values (p_cliente_id, p_vendedora_id, v_subtotal, v_desconto, p_discount_id, v_subtotal - v_desconto, v_pecas, p_forma_pagamento)
  returning * into v_sale;

  insert into sale_items (sale_id, product_id, quantidade, preco_unitario)
  select v_sale.id, x.product_id, x.quantidade, p.preco
    from jsonb_to_recordset(p_items) as x(product_id uuid, quantidade int)
    join products p on p.id = x.product_id;

  if p_discount_id is not null then
    update discounts set uso_atual = uso_atual + 1 where id = p_discount_id;
  end if;

  return v_sale;
end;
$$;

grant execute on function public.create_sale(uuid, uuid, numeric, uuid, payment_method, jsonb) to authenticated;

-- ==========================================================================
-- 2. escritas diretas
-- ==========================================================================
drop policy if exists "products_update" on products;
create policy "products_update" on products for update to authenticated
  using (is_admin_or_gerente()) with check (is_admin_or_gerente());

-- sem policy de insert: só create_sale, adjust_stock, complete_exchange e o
-- gatilho de sale_items (todos security definer) gravam nessas tabelas
drop policy if exists "sales_insert" on sales;
drop policy if exists "sale_items_insert" on sale_items;
drop policy if exists "stock_movements_insert" on stock_movements;

-- ==========================================================================
-- 3. complete_exchange só para admin/gerente
-- ==========================================================================
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
  if not is_admin_or_gerente() then
    raise exception 'Apenas admin ou gerente podem concluir trocas';
  end if;

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

-- ==========================================================================
-- 4. preço de custo visível só para admin/gerente
-- ==========================================================================
create table product_costs (
  product_id uuid primary key references products(id) on delete cascade,
  preco_custo numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);

insert into product_costs (product_id, preco_custo)
select id, preco_custo from products;

alter table products drop column preco_custo;

create trigger product_costs_set_updated_at
  before update on product_costs
  for each row execute function public.set_updated_at();

alter table product_costs enable row level security;

create policy "product_costs_select" on product_costs for select to authenticated using (is_admin_or_gerente());
-- vendedoras cadastram produtos (e o custo junto), mas não leem o custo depois
create policy "product_costs_insert" on product_costs for insert to authenticated with check (true);
create policy "product_costs_update" on product_costs for update to authenticated
  using (is_admin_or_gerente()) with check (is_admin_or_gerente());
create policy "product_costs_delete" on product_costs for delete to authenticated using (is_admin_or_gerente());
