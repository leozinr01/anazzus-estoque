-- Anazzus Boutique — schema inicial
-- Produtos, estoque, clientes, vendas, equipe/perfis, descontos, caixa, trocas, nota fiscal (scaffold)

create extension if not exists pgcrypto;

-- ==========================================================================
-- ENUMS
-- ==========================================================================
create type user_role as enum ('admin', 'gerente', 'vendedora');
create type sale_status as enum ('concluida', 'cancelada');
create type movement_type as enum ('entrada', 'saida', 'ajuste', 'devolucao');
create type payment_method as enum ('dinheiro', 'pix', 'debito', 'credito', 'outro');
create type exchange_status as enum ('pendente', 'aprovada', 'negada', 'concluida');
create type exchange_type as enum ('troca', 'devolucao');
create type invoice_status as enum ('nao_emitida', 'pendente', 'emitida', 'cancelada', 'erro');
create type discount_type as enum ('percentual', 'valor_fixo');
create type caixa_status as enum ('aberto', 'fechado');

-- ==========================================================================
-- PERFIS (equipe: admin, gerente, vendedora) — 1:1 com auth.users
-- ==========================================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  cargo text not null default 'Vendedora',
  role user_role not null default 'vendedora',
  meta numeric(12,2) not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

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
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'vendedora'),
    coalesce(new.raw_user_meta_data->>'cargo', 'Vendedora')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin_or_gerente()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) in ('admin', 'gerente'), false);
$$;

-- ==========================================================================
-- CATEGORIAS / PRODUTOS
-- ==========================================================================
create table categories (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  sku text not null unique,
  codigo_barras text unique,
  categoria_id uuid references categories(id) on delete set null,
  tamanho text,
  cor text,
  preco numeric(12,2) not null default 0,
  preco_custo numeric(12,2) not null default 0,
  estoque integer not null default 0,
  estoque_minimo integer not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_categoria_idx on products(categoria_id);
create index products_ativo_idx on products(ativo);

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  tipo movement_type not null,
  quantidade integer not null,
  estoque_resultante integer not null,
  motivo text,
  usuario_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index stock_movements_product_idx on stock_movements(product_id);

-- ==========================================================================
-- CLIENTES
-- ==========================================================================
create table customers (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  cpf text,
  data_nascimento date,
  endereco text,
  cliente_desde date not null default current_date,
  created_at timestamptz not null default now()
);

create index customers_nome_idx on customers using gin (to_tsvector('portuguese', nome));

-- ==========================================================================
-- DESCONTOS
-- ==========================================================================
create table discounts (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,
  descricao text,
  tipo discount_type not null,
  valor numeric(12,2) not null,
  ativo boolean not null default true,
  valido_de date,
  valido_ate date,
  uso_maximo integer,
  uso_atual integer not null default 0,
  created_at timestamptz not null default now()
);

-- ==========================================================================
-- CONFIGURAÇÕES DA LOJA (linha única)
-- ==========================================================================
create table store_settings (
  id boolean primary key default true check (id),
  nome_loja text not null default 'Anazzus Boutique',
  cnpj text,
  telefone text,
  endereco text,
  dias_troca integer not null default 30,
  politica_troca text default 'Trocas em até 30 dias mediante apresentação do cupom fiscal, com a etiqueta e sem uso.',
  nfce_provider text,
  updated_at timestamptz not null default now()
);

insert into store_settings (id) values (true);

-- ==========================================================================
-- CAIXA
-- ==========================================================================
create table cash_sessions (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references profiles(id) on delete set null,
  valor_abertura numeric(12,2) not null default 0,
  valor_fechamento numeric(12,2),
  observacao text,
  status caixa_status not null default 'aberto',
  aberto_em timestamptz not null default now(),
  fechado_em timestamptz
);

-- ==========================================================================
-- VENDAS
-- ==========================================================================
create sequence sale_number_seq start 1;

create table sales (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique default ('V' || lpad(nextval('sale_number_seq')::text, 6, '0')),
  cliente_id uuid references customers(id) on delete set null,
  vendedora_id uuid references profiles(id) on delete set null,
  cash_session_id uuid references cash_sessions(id) on delete set null,
  subtotal numeric(12,2) not null default 0,
  desconto numeric(12,2) not null default 0,
  discount_id uuid references discounts(id) on delete set null,
  total numeric(12,2) not null default 0,
  pecas integer not null default 0,
  forma_pagamento payment_method not null default 'dinheiro',
  status sale_status not null default 'concluida',
  created_at timestamptz not null default now()
);

create index sales_cliente_idx on sales(cliente_id);
create index sales_vendedora_idx on sales(vendedora_id);
create index sales_created_idx on sales(created_at);

create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid not null references products(id),
  quantidade integer not null check (quantidade > 0),
  preco_unitario numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create index sale_items_sale_idx on sale_items(sale_id);
create index sale_items_product_idx on sale_items(product_id);

-- baixa automática de estoque + histórico ao registrar item de venda
create or replace function public.handle_sale_item_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  novo_estoque integer;
  vendedora uuid;
begin
  update products
     set estoque = estoque - new.quantidade,
         updated_at = now()
   where id = new.product_id
   returning estoque into novo_estoque;

  select vendedora_id into vendedora from sales where id = new.sale_id;

  insert into stock_movements (product_id, tipo, quantidade, estoque_resultante, motivo, usuario_id)
  values (new.product_id, 'saida', new.quantidade, coalesce(novo_estoque, 0), 'Venda ' || new.sale_id, vendedora);

  return new;
end;
$$;

create trigger on_sale_item_insert
  after insert on sale_items
  for each row execute function public.handle_sale_item_insert();

-- ==========================================================================
-- TROCAS / DEVOLUÇÕES
-- ==========================================================================
create table exchanges (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  sale_item_id uuid references sale_items(id) on delete set null,
  tipo exchange_type not null default 'troca',
  motivo text,
  status exchange_status not null default 'pendente',
  produto_novo_id uuid references products(id),
  usuario_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ==========================================================================
-- NOTA FISCAL (scaffold — emissão real requer integração externa, ver README)
-- ==========================================================================
create table invoices (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  status invoice_status not null default 'nao_emitida',
  numero_nfce text,
  chave_acesso text,
  url_danfe text,
  provider text,
  erro_mensagem text,
  emitida_em timestamptz,
  created_at timestamptz not null default now()
);

-- ==========================================================================
-- updated_at automático
-- ==========================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on products
  for each row execute function public.set_updated_at();

create trigger store_settings_set_updated_at
  before update on store_settings
  for each row execute function public.set_updated_at();

-- ==========================================================================
-- RLS — sistema interno: qualquer leitura exige usuário autenticado (staff)
-- ==========================================================================
alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table stock_movements enable row level security;
alter table customers enable row level security;
alter table discounts enable row level security;
alter table store_settings enable row level security;
alter table cash_sessions enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table exchanges enable row level security;
alter table invoices enable row level security;

-- profiles
create policy "profiles_select_auth" on profiles for select to authenticated using (true);
create policy "profiles_update_self" on profiles for update to authenticated
  using (id = auth.uid() or is_admin_or_gerente())
  with check (id = auth.uid() or is_admin_or_gerente());
create policy "profiles_insert_admin" on profiles for insert to authenticated with check (is_admin_or_gerente());
create policy "profiles_delete_admin" on profiles for delete to authenticated using (current_user_role() = 'admin');

-- categories
create policy "categories_select" on categories for select to authenticated using (true);
create policy "categories_write" on categories for all to authenticated
  using (is_admin_or_gerente()) with check (is_admin_or_gerente());

-- products
create policy "products_select" on products for select to authenticated using (true);
create policy "products_insert" on products for insert to authenticated with check (true);
create policy "products_update" on products for update to authenticated using (true) with check (true);
create policy "products_delete" on products for delete to authenticated using (is_admin_or_gerente());

-- stock_movements
create policy "stock_movements_select" on stock_movements for select to authenticated using (true);
create policy "stock_movements_insert" on stock_movements for insert to authenticated with check (true);

-- customers
create policy "customers_select" on customers for select to authenticated using (true);
create policy "customers_insert" on customers for insert to authenticated with check (true);
create policy "customers_update" on customers for update to authenticated using (true) with check (true);
create policy "customers_delete" on customers for delete to authenticated using (is_admin_or_gerente());

-- discounts
create policy "discounts_select" on discounts for select to authenticated using (true);
create policy "discounts_write" on discounts for all to authenticated
  using (is_admin_or_gerente()) with check (is_admin_or_gerente());

-- store_settings
create policy "store_settings_select" on store_settings for select to authenticated using (true);
create policy "store_settings_update" on store_settings for update to authenticated
  using (is_admin_or_gerente()) with check (is_admin_or_gerente());

-- cash_sessions
create policy "cash_sessions_select" on cash_sessions for select to authenticated using (true);
create policy "cash_sessions_insert" on cash_sessions for insert to authenticated with check (true);
create policy "cash_sessions_update" on cash_sessions for update to authenticated
  using (usuario_id = auth.uid() or is_admin_or_gerente())
  with check (usuario_id = auth.uid() or is_admin_or_gerente());

-- sales
create policy "sales_select" on sales for select to authenticated using (true);
create policy "sales_insert" on sales for insert to authenticated with check (true);
create policy "sales_update" on sales for update to authenticated
  using (is_admin_or_gerente()) with check (is_admin_or_gerente());

-- sale_items
create policy "sale_items_select" on sale_items for select to authenticated using (true);
create policy "sale_items_insert" on sale_items for insert to authenticated with check (true);

-- exchanges
create policy "exchanges_select" on exchanges for select to authenticated using (true);
create policy "exchanges_insert" on exchanges for insert to authenticated with check (true);
create policy "exchanges_update" on exchanges for update to authenticated
  using (is_admin_or_gerente()) with check (is_admin_or_gerente());

-- invoices
create policy "invoices_select" on invoices for select to authenticated using (true);
create policy "invoices_insert" on invoices for insert to authenticated with check (true);
create policy "invoices_update" on invoices for update to authenticated using (true) with check (true);
