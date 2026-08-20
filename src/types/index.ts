export interface TeamMember {
  id: string;
  nome: string;
  cargo: string;
  meta: number;
}

export interface Product {
  id: string;
  nome: string;
  sku: string;
  codigoBarras: string;
  categoria: string;
  tamanho: string;
  cor: string;
  preco: number;
  estoque: number;
  estoqueMinimo: number;
}

export interface Customer {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  clienteDesde: string;
}

export interface SaleItem {
  produto: Product;
  quantidade: number;
  precoUnitario: number;
}

export interface Sale {
  id: string;
  numero: string;
  data: string;
  hora: string;
  cliente: Customer | null;
  vendedora: TeamMember;
  items: SaleItem[];
  subtotal: number;
  desconto: number;
  total: number;
  pecas: number;
  status: "Concluída" | "Cancelada";
}

export interface CartItem {
  product: Product;
  quantidade: number;
}
