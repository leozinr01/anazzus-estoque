import type { Product } from "@/types";

export const CATEGORIAS = ["Camisetas", "Calças", "Vestidos", "Blusas", "Saias", "Jaquetas", "Acessórios"];
export const CORES = ["Preto", "Branco", "Vermelho", "Azul", "Bege", "Cinza", "Rosa"];
export const TAMANHOS = ["PP", "P", "M", "G", "GG"];

function makeProducts(): Product[] {
  const base: [string, string, string][] = [
    ["Camiseta Preta", "Camisetas", "Preto"], ["Camiseta Branca", "Camisetas", "Branco"],
    ["Camiseta Estampada", "Camisetas", "Cinza"], ["Calça Jeans", "Calças", "Azul"],
    ["Calça Alfaiataria", "Calças", "Preto"], ["Calça Cargo", "Calças", "Bege"],
    ["Vestido Midi Vermelho", "Vestidos", "Vermelho"], ["Vestido Longo Floral", "Vestidos", "Rosa"],
    ["Vestido Tubinho", "Vestidos", "Preto"], ["Blusa Básica", "Blusas", "Branco"],
    ["Blusa de Seda", "Blusas", "Bege"], ["Blusa Cropped", "Blusas", "Rosa"],
    ["Saia Midi", "Saias", "Preto"], ["Saia Jeans", "Saias", "Azul"],
    ["Saia Plissada", "Saias", "Cinza"], ["Jaqueta Jeans", "Jaquetas", "Azul"],
    ["Jaqueta Couro", "Jaquetas", "Preto"], ["Casaco Trench", "Jaquetas", "Bege"],
    ["Cinto de Couro", "Acessórios", "Preto"], ["Lenço Estampado", "Acessórios", "Vermelho"],
    ["Bolsa Tote", "Acessórios", "Bege"], ["Camiseta Listrada", "Camisetas", "Azul"],
    ["Calça Wide Leg", "Calças", "Cinza"], ["Vestido Curto", "Vestidos", "Vermelho"],
    ["Blusa Manga Longa", "Blusas", "Preto"],
  ];
  const tamanhosPorCat: Record<string, string[]> = { "Acessórios": ["Único"] };
  return base.map((b, i) => {
    const [nome, categoria, cor] = b;
    const tamanhos = tamanhosPorCat[categoria] || TAMANHOS;
    const tamanho = tamanhos[i % tamanhos.length];
    const precoBase = 49.9 + (i % 9) * 20;
    const estoque = [0, 2, 3, 5, 8, 12, 18, 24, 30][i % 9];
    return {
      id: `p${i + 1}`,
      nome: `${nome} ${tamanho !== "Único" ? tamanho : ""}`.trim(),
      sku: `AZ-${String(i + 1).padStart(4, "0")}`,
      codigoBarras: `78910000${String(i + 1).padStart(4, "0")}`,
      categoria,
      tamanho,
      cor,
      preco: Math.round(precoBase * 100) / 100,
      estoque,
      estoqueMinimo: 5,
    };
  });
}

export const PRODUCTS: Product[] = makeProducts();
