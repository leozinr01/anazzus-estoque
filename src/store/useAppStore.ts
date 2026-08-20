import { create } from "zustand";
import type { CartItem, Product } from "@/types";
import { PRODUCTS } from "@/data/products";

interface Toast {
  id: number;
  msg: string;
}

interface AppState {
  // PDV cart (sessão atual)
  cart: CartItem[];
  addToCart: (product: Product) => void;
  updateCartQty: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // produtos (permite ajuste de estoque em memória durante a sessão)
  products: Product[];
  adjustStock: (productId: string, novoEstoque: number) => void;
  addProduct: (product: Product) => void;

  // toasts
  toasts: Toast[];
  notify: (msg: string) => void;
  dismissToast: (id: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  cart: [],
  addToCart: (product) =>
    set((state) => {
      const idx = state.cart.findIndex((it) => it.product.id === product.id);
      if (idx >= 0) {
        const copy = [...state.cart];
        copy[idx] = { ...copy[idx], quantidade: copy[idx].quantidade + 1 };
        return { cart: copy };
      }
      return { cart: [...state.cart, { product, quantidade: 1 }] };
    }),
  updateCartQty: (productId, delta) =>
    set((state) => ({
      cart: state.cart
        .map((it) => (it.product.id === productId ? { ...it, quantidade: it.quantidade + delta } : it))
        .filter((it) => it.quantidade > 0),
    })),
  removeFromCart: (productId) =>
    set((state) => ({ cart: state.cart.filter((it) => it.product.id !== productId) })),
  clearCart: () => set({ cart: [] }),

  products: PRODUCTS,
  adjustStock: (productId, novoEstoque) =>
    set((state) => ({
      products: state.products.map((p) => (p.id === productId ? { ...p, estoque: novoEstoque } : p)),
    })),
  addProduct: (product) => set((state) => ({ products: [product, ...state.products] })),

  toasts: [],
  notify: (msg) =>
    set((state) => {
      const id = Date.now() + Math.random();
      setTimeout(() => {
        useAppStore.getState().dismissToast(id);
      }, 3000);
      return { toasts: [...state.toasts, { id, msg }] };
    }),
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
