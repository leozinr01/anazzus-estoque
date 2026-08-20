import type { Customer } from "@/types";

const CUSTOMERS_BASE = [
  "Maria Eduarda", "Ana Paula", "Juliana Souza", "Mariana Costa", "Beatriz Oliveira",
  "Fernanda Lima", "Camila Rocha", "Patrícia Alves", "Larissa Mendes", "Débora Santos",
  "Renata Farias", "Vanessa Ribeiro", "Aline Cardoso", "Bruna Teixeira", "Priscila Nunes",
];

export const CUSTOMERS: Customer[] = CUSTOMERS_BASE.map((nome, i) => ({
  id: `c${i + 1}`,
  nome,
  telefone: `(21) 9${String(8000 + i * 137).padStart(4, "0")}-${String(1000 + i * 97).padStart(4, "0")}`,
  email: `${nome.toLowerCase().split(" ")[0]}@email.com`,
  clienteDesde: `${String(10 + (i % 20)).padStart(2, "0")}/0${(i % 6) + 1}/2025`,
}));
