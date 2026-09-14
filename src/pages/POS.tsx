import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Barcode, Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle2, Printer, Tag } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/useAppStore";
import { useCatalogStore } from "@/store/useCatalogStore";
import { useCustomersStore } from "@/store/useCustomersStore";
import { useTeamStore } from "@/store/useTeamStore";
import { useSalesStore } from "@/store/useSalesStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useAuthStore } from "@/store/useAuthStore";
import { fmtCurrency } from "@/utils/format";
import { printReceipt } from "@/utils/printReceipt";
import { printProductLabel } from "@/utils/printLabel";
import { PAYMENT_LABELS, type Customer, type PaymentMethod, type Sale } from "@/types";

const PAYMENT_METHODS: PaymentMethod[] = ["dinheiro", "pix", "debito", "credito", "outro"];

export function POS() {
  const navigate = useNavigate();
  const cart = useAppStore((s) => s.cart);
  const addToCart = useAppStore((s) => s.addToCart);
  const updateCartQty = useAppStore((s) => s.updateCartQty);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const clearCart = useAppStore((s) => s.clearCart);
  const notify = useAppStore((s) => s.notify);

  const products = useCatalogStore((s) => s.products);
  const productsLoaded = useCatalogStore((s) => s.loaded);
  const fetchProducts = useCatalogStore((s) => s.fetchAll);
  const findByBarcode = useCatalogStore((s) => s.findByBarcode);

  const customers = useCustomersStore((s) => s.customers);
  const custLoaded = useCustomersStore((s) => s.loaded);
  const fetchCustomers = useCustomersStore((s) => s.fetchAll);
  const addCustomer = useCustomersStore((s) => s.addCustomer);

  const team = useTeamStore((s) => s.team);
  const teamLoaded = useTeamStore((s) => s.loaded);
  const fetchTeam = useTeamStore((s) => s.fetchAll);

  const settings = useSettingsStore((s) => s.settings);
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const fetchSettings = useSettingsStore((s) => s.fetchAll);
  const findDiscountByCode = useSettingsStore((s) => s.findDiscountByCode);

  const createSale = useSalesStore((s) => s.createSale);
  const profile = useAuthStore((s) => s.profile);

  useEffect(() => {
    if (!productsLoaded) fetchProducts();
    if (!custLoaded) fetchCustomers();
    if (!teamLoaded) fetchTeam();
    if (!settingsLoaded) fetchSettings();
  }, [productsLoaded, fetchProducts, custLoaded, fetchCustomers, teamLoaded, fetchTeam, settingsLoaded, fetchSettings]);

  const [barcode, setBarcode] = useState("");
  const [seller, setSeller] = useState("");
  const [customerId, setCustomerId] = useState<string>("none");
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [manualDiscount, setManualDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("dinheiro");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ nome: "", telefone: "", email: "" });
  const [successModal, setSuccessModal] = useState<Sale | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile && !seller) setSeller(profile.id);
  }, [profile, seller]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcode.trim();
    if (!code) return;
    const found = findByBarcode(code);
    if (found) {
      if (found.estoque <= 0) {
        notify(`${found.nome} sem estoque disponível.`);
      } else {
        addToCart(found);
        notify(`${found.nome} adicionado à venda.`);
      }
    } else {
      notify("Produto não encontrado.");
    }
    setBarcode("");
    inputRef.current?.focus();
  };

  const productResults = useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.toLowerCase();
    return products
      .filter((p) => p.nome.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.codigoBarras || "").includes(q))
      .slice(0, 6);
  }, [productSearch, products]);

  const customerResults = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 5);
    const q = customerSearch.toLowerCase();
    return customers.filter((c) => c.nome.toLowerCase().includes(q)).slice(0, 5);
  }, [customerSearch, customers]);

  const subtotal = cart.reduce((s, it) => s + it.product.preco * it.quantidade, 0);
  const appliedDiscount = discountCode.trim() ? findDiscountByCode(discountCode) : undefined;
  const discountFromCode = appliedDiscount
    ? appliedDiscount.tipo === "percentual"
      ? (subtotal * appliedDiscount.valor) / 100
      : appliedDiscount.valor
    : 0;
  const discount = appliedDiscount ? discountFromCode : manualDiscount;
  const total = Math.max(0, subtotal - discount);
  const selectedCustomer: Customer | null = customerId === "none" ? null : customers.find((c) => c.id === customerId) || null;

  const finalize = async () => {
    if (cart.length === 0) {
      notify("Adicione ao menos um produto.");
      return;
    }
    if (!seller) {
      notify("Selecione a vendedora responsável.");
      return;
    }
    setSaving(true);
    const { sale, error } = await createSale({
      clienteId: selectedCustomer?.id || null,
      vendedoraId: seller,
      desconto: Math.round(discount * 100) / 100,
      discountId: appliedDiscount?.id || null,
      formaPagamento: paymentMethod,
      items: cart,
    });
    setSaving(false);
    if (error || !sale) {
      notify(error || "Não foi possível registrar a venda.");
      return;
    }
    setSuccessModal(sale);
  };

  const resetSale = () => {
    clearCart();
    setManualDiscount(0);
    setDiscountCode("");
    setCustomerId("none");
    setCustomerSearch("");
    setSuccessModal(null);
    fetchProducts();
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerForm.nome.trim()) {
      notify("Informe o nome do cliente.");
      return;
    }
    const { customer, error } = await addCustomer(newCustomerForm);
    if (error || !customer) {
      notify(error || "Erro ao cadastrar cliente.");
      return;
    }
    setCustomerId(customer.id);
    setShowNewCustomer(false);
    setNewCustomerForm({ nome: "", telefone: "", email: "" });
    notify("Cliente cadastrado e selecionado.");
  };

  return (
    <div>
      <PageHeader title="Nova Venda" description="Registre uma venda no ponto de venda" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleBarcodeSubmit} className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-4">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 flex items-center gap-1.5">
              <Barcode size={14} /> Escaneie ou digite o código de barras
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="789100000001"
                className="flex-1 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
                autoFocus
              />
              <button type="submit" className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                Adicionar
              </button>
            </div>
          </form>

          <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-4">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 flex items-center gap-1.5">
              <Search size={14} /> Buscar por nome, SKU ou código
            </label>
            <input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Camiseta preta, AZ-0001..."
              className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
            />
            {productResults.length > 0 && (
              <div className="mt-2 rounded-lg border divide-y border-gray-200 dark:border-neutral-800 divide-gray-100 dark:divide-neutral-800 overflow-hidden">
                {productResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (p.estoque <= 0) {
                        notify(`${p.nome} sem estoque disponível.`);
                        return;
                      }
                      addToCart(p);
                      notify(`${p.nome} adicionado à venda.`);
                      setProductSearch("");
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-neutral-800"
                  >
                    <span>
                      <span className="font-medium">{p.nome}</span>
                      <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">{p.sku} · {p.estoque} em estoque</span>
                    </span>
                    <span className="font-medium tabular-nums">{fmtCurrency(p.preco)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-neutral-800 font-semibold text-sm">
              Itens da venda ({cart.length})
            </div>
            {cart.length === 0 ? (
              <EmptyState icon={ShoppingCart} title="Nenhum item adicionado" description="Escaneie um código de barras ou busque um produto" />
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                {cart.map((it) => (
                  <div key={it.product.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{it.product.nome}</div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {it.product.tamanho !== "Único" ? `Tam. ${it.product.tamanho} · ` : ""}
                        {it.product.cor}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQty(it.product.id, -1)}
                        className="w-7 h-7 rounded-lg border flex items-center justify-center border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-6 text-center text-sm font-medium tabular-nums">{it.quantidade}</span>
                      <button
                        onClick={() => {
                          if (it.quantidade >= it.product.estoque) {
                            notify("Estoque insuficiente.");
                            return;
                          }
                          updateCartQty(it.product.id, 1);
                        }}
                        className="w-7 h-7 rounded-lg border flex items-center justify-center border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <div className="w-24 text-right font-medium text-sm tabular-nums">
                      {fmtCurrency(it.product.preco * it.quantidade)}
                    </div>
                    <button onClick={() => removeFromCart(it.product.id)} className="text-neutral-400 hover:text-red-600 p-1">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-4">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 block">Cliente</label>
            <input
              value={customerId === "none" ? customerSearch : selectedCustomer?.nome || ""}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setCustomerId("none");
              }}
              placeholder="Buscar cliente..."
              className="w-full rounded-lg border px-3 py-2.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
            />
            <div className="flex flex-wrap gap-1.5 mb-2 max-h-32 overflow-y-auto">
              <button
                onClick={() => {
                  setCustomerId("none");
                  setCustomerSearch("");
                }}
                className={`px-2.5 py-1 rounded-full text-xs border ${
                  customerId === "none"
                    ? "bg-red-600 text-white border-red-600"
                    : "border-gray-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400"
                }`}
              >
                Não identificado
              </button>
              {customerResults.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCustomerId(c.id)}
                  className={`px-2.5 py-1 rounded-full text-xs border ${
                    customerId === c.id
                      ? "bg-red-600 text-white border-red-600"
                      : "border-gray-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  {c.nome}
                </button>
              ))}
            </div>
            <button onClick={() => setShowNewCustomer(true)} className="text-xs font-medium text-red-600 hover:underline flex items-center gap-1">
              <Plus size={13} /> Novo cliente
            </button>
          </div>

          <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-4">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 block">Vendedora responsável</label>
            <select
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
            >
              <option value="" disabled>Selecione...</option>
              {team.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-4">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 block">Forma de pagamento</label>
            <div className="grid grid-cols-2 gap-1.5">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`px-2.5 py-2 rounded-lg text-xs font-medium border ${
                    paymentMethod === m
                      ? "bg-red-600 text-white border-red-600"
                      : "border-gray-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  {PAYMENT_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-500 dark:text-neutral-400">Subtotal</span>
              <span className="font-medium tabular-nums">{fmtCurrency(subtotal)}</span>
            </div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1"><Tag size={12} /> Cupom de desconto</label>
            <input
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="Código (opcional)"
              className="w-full rounded-lg border px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
            />
            {discountCode.trim() && !appliedDiscount && <div className="text-xs text-red-600 mb-2">Cupom inválido ou expirado.</div>}
            <div className="flex justify-between items-center text-sm mb-3">
              <span className="text-neutral-500 dark:text-neutral-400">Desconto manual</span>
              <input
                type="number"
                min="0"
                disabled={!!appliedDiscount}
                value={appliedDiscount ? Math.round(discountFromCode * 100) / 100 : manualDiscount}
                onChange={(e) => setManualDiscount(Math.max(0, Number(e.target.value) || 0))}
                className="w-24 rounded-lg border px-2 py-1 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700 disabled:opacity-60"
              />
            </div>
            <div className="flex justify-between items-baseline pt-3 border-t border-gray-200 dark:border-neutral-800">
              <span className="font-semibold">TOTAL</span>
              <span className="text-2xl font-bold text-red-600 tabular-nums">{fmtCurrency(total)}</span>
            </div>
            <button
              onClick={finalize}
              disabled={saving}
              className="w-full mt-4 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg py-3 text-sm font-semibold transition-colors"
            >
              {saving ? "Registrando..." : "Finalizar Venda"}
            </button>
          </div>
        </div>
      </div>

      <Modal open={showNewCustomer} onClose={() => setShowNewCustomer(false)} title="Novo cliente">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Nome</label>
            <input
              value={newCustomerForm.nome}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, nome: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Telefone</label>
            <input
              value={newCustomerForm.telefone}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, telefone: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">E-mail (opcional)</label>
            <input
              value={newCustomerForm.email}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
            />
          </div>
        </div>
        <button
          onClick={handleCreateCustomer}
          className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 text-sm font-medium"
        >
          Salvar e selecionar
        </button>
      </Modal>

      <Modal open={!!successModal} onClose={resetSale} title="Venda finalizada com sucesso" wide>
        {successModal && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} className="text-green-600" />
              </div>
              <div>
                <div className="font-semibold">{successModal.numero}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Venda registrada no sistema</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div>
                <div className="text-neutral-500 dark:text-neutral-400">Cliente</div>
                <div className="font-medium">{successModal.cliente?.nome || "Não identificado"}</div>
              </div>
              <div>
                <div className="text-neutral-500 dark:text-neutral-400">Vendedora</div>
                <div className="font-medium">{successModal.vendedora?.nome}</div>
              </div>
              <div className="col-span-2">
                <div className="text-neutral-500 dark:text-neutral-400">Total</div>
                <div className="font-semibold text-red-600 text-lg tabular-nums">{fmtCurrency(successModal.total)}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={resetSale} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 text-sm font-medium min-w-[100px]">
                Nova venda
              </button>
              <button
                onClick={() => {
                  navigate("/vendas");
                  resetSale();
                }}
                className="flex-1 rounded-lg border py-2.5 text-sm font-medium border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 min-w-[100px]"
              >
                Ver vendas
              </button>
              <button
                onClick={() => printReceipt(successModal, settings)}
                className="flex-1 rounded-lg border py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 min-w-[100px]"
              >
                <Printer size={14} /> Comprovante
              </button>
              {successModal.items.some((it) => it.produto?.codigoBarras) && (
                <button
                  onClick={() => successModal.items.forEach((it) => it.produto && printProductLabel(it.produto))}
                  className="flex-1 rounded-lg border py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 min-w-[100px]"
                >
                  <Tag size={14} /> Etiquetas
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
