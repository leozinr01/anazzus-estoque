# Anazzus — Sistema Interno

Sistema de gestão interno da Anazzus Boutique: PDV com leitor de código de barras, estoque, vendas, clientes,
equipe (com papéis de admin/gerente/vendedora), descontos, trocas/devoluções, impressão de etiquetas e
comprovantes, e scaffold para nota fiscal eletrônica. Conectado ao Supabase (Postgres + Auth).

## Rodando localmente

1. Copie `.env.example` para `.env` e preencha com a URL e a chave publicável do projeto Supabase
   (Settings → API Keys no painel do Supabase).
2. Instale as dependências e rode:

```bash
npm install
npm run dev
```

## Banco de dados

O schema (tabelas, RLS, funções) está em `supabase/migrations/`, aplicado via SQL Editor do Supabase.
Não há CLI/local dev configurado — as migrações foram aplicadas diretamente no projeto remoto.

Para criar um novo login (vendedora, gerente ou admin): no painel do Supabase, vá em
**Authentication → Users → Add user**, informe e-mail/senha e em "User Metadata" adicione
`{"nome":"Nome da pessoa","role":"vendedora"}` (ou `"gerente"`/`"admin"`). O perfil é criado automaticamente
no primeiro login.

## Build

```bash
npm run build
```

## Stack

React + TypeScript + Vite + Tailwind CSS + React Router + Zustand + Recharts + Lucide Icons + Supabase JS.

## Pendências conhecidas

- **Nota fiscal (NFC-e)**: a emissão automática exige CNPJ ativo, certificado digital A1 e um provedor fiscal
  contratado (Focus NFe, PlugNotas, eNotas, etc.). Hoje o sistema só marca a venda como "pendente de nota"; a
  integração real com a SEFAZ precisa ser configurada depois.
- **Etiquetas**: a impressão assume uma etiqueta de ~60x40mm (ajustável em `src/utils/printLabel.ts`). Confirme
  o tamanho de papel da impressora usada na loja e ajuste se necessário.
- **Caixa (abertura/fechamento)**: a tabela `cash_sessions` já existe no banco, mas ainda não há tela dedicada
  para abrir/fechar caixa no frontend.
