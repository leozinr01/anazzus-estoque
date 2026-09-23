export type UserRole = "admin" | "gerente" | "vendedora";

export interface TeamMember {
  id: string;
  nome: string;
  cargo: string;
  role: UserRole;
  meta: number;
  ativo: boolean;
}

export interface Product {
  id: string;
  nome: string;
  sku: string;
  codigoBarras: string | null;
  categoriaId: string | null;
  categoria: string;
  tamanho: string;
  cor: string;
  preco: number;
  /** null quando o usuário não tem acesso ao custo (só admin/gerente) */
  precoCusto: number | null;
  estoque: number;
  estoqueMinimo: number;
  ativo: boolean;
}

export interface Category {
  id: string;
  nome: string;
}

export interface Customer {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  cpf: string | null;
  clienteDesde: string;
}

export interface SaleItem {
  id: string;
  produto: Product | null;
  productId: string;
  quantidade: number;
  precoUnitario: number;
}

export type PaymentMethod = "dinheiro" | "pix" | "debito" | "credito" | "outro";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  debito: "Cartão de débito",
  credito: "Cartão de crédito",
  outro: "Outro",
};

export interface Sale {
  id: string;
  numero: string;
  data: string;
  hora: string;
  createdAt: string;
  cliente: Customer | null;
  vendedora: TeamMember | null;
  items: SaleItem[];
  subtotal: number;
  desconto: number;
  total: number;
  pecas: number;
  formaPagamento: PaymentMethod;
  status: "Concluída" | "Cancelada";
}

export interface CartItem {
  product: Product;
  quantidade: number;
}

export type DiscountType = "percentual" | "valor_fixo";

export interface Discount {
  id: string;
  codigo: string | null;
  descricao: string | null;
  tipo: DiscountType;
  valor: number;
  ativo: boolean;
  validoDe: string | null;
  validoAte: string | null;
  usoMaximo: number | null;
  usoAtual: number;
}

export interface StoreSettings {
  nomeLoja: string;
  cnpj: string | null;
  telefone: string | null;
  endereco: string | null;
  diasTroca: number;
  politicaTroca: string | null;
  nfceProvider: string | null;
}

export type ExchangeType = "troca" | "devolucao";
export type ExchangeStatus = "pendente" | "aprovada" | "negada" | "concluida";

export interface Exchange {
  id: string;
  saleId: string;
  saleNumero: string;
  saleItemId: string | null;
  tipo: ExchangeType;
  motivo: string | null;
  status: ExchangeStatus;
  produtoNovoId: string | null;
  createdAt: string;
}

export type InvoiceStatus = "nao_emitida" | "pendente" | "emitida" | "cancelada" | "erro";

export interface Invoice {
  id: string;
  saleId: string;
  status: InvoiceStatus;
  numeroNfce: string | null;
  chaveAcesso: string | null;
  urlDanfe: string | null;
}
