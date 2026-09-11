import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { useCatalogStore } from "@/store/useCatalogStore";
import { useCustomersStore } from "@/store/useCustomersStore";
import { useSalesStore } from "@/store/useSalesStore";
import { useTeamStore } from "@/store/useTeamStore";
import { useAppStore } from "@/store/useAppStore";
import { useDerivedData } from "@/hooks/useDerivedData";
import { fmtCurrency } from "@/utils/format";

const emptyForm = { nome: "", telefone: "", email: "", cpf: "" };

export function Clientes() {
  const navigate = useNavigate();
  const products = useCatalogStore((s) => s.products);
  const sales = useSalesStore((s) => s.sales);
  const salesLoaded = useSalesStore((s) => s.loaded);
  const fetchSales = useSalesStore((s) => s.fetchAll);
  const team = useTeamStore((s) => s.team);
  const teamLoaded = useTeamStore((s) => s.loaded);
  const fetchTeam = useTeamStore((s) => s.fetchAll);
  const customers = useCustomersStore((s) => s.customers);
  const custLoaded = useCustomersStore((s) => s.loaded);
  const fetchCustomers = useCustomersStore((s) => s.fetchAll);
  const addCustomer = useCustomersStore((s) => s.addCustomer);
  const notify = useAppStore((s) => s.notify);

  const d = useDerivedData(products, sales, team, customers);
  const [busca, setBusca] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!custLoaded) fetchCustomers();
    if (!salesLoaded) fetchSales();
    if (!teamLoaded) fetchTeam();
  }, [custLoaded, fetchCustomers, salesLoaded, fetchSales, teamLoaded, fetchTeam]);

  const filtered = customers.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()));

  const handleSave = async () => {
    setError(null);
    if (!form.nome.trim()) {
      setError("Nome é obrigatório.");
      return;
    }
    setSaving(true);
    const { error: err } = await addCustomer(form);
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    setShowModal(false);
    setForm(emptyForm);
    notify("Cliente cadastrado.");
  };

  return (
    <div>
      <PageHeader
        title="Clientes"
        description={`${customers.length} clientes cadastrados`}
        action={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium">
            <Plus size={15} /> Novo Cliente
          </button>
        }
      />
      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar cliente..."
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
        />
      </div>
      <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-[#faf7f2] dark:bg-neutral-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-900 text-left text-neutral-500 dark:text-neutral-400">
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium">Telefone</th>
                <th className="px-5 py-3 font-medium">Última compra</th>
                <th className="px-5 py-3 font-medium text-right">Compras</th>
                <th className="px-5 py-3 font-medium text-right">Total gasto</th>
                <th className="px-5 py-3 font-medium">Última vendedora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {filtered.map((c) => {
                const info = d.porCliente[c.id];
                return (
                  <tr key={c.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800/60" onClick={() => navigate(`/clientes/${c.id}`)}>
                    <td className="px-5 py-3 font-medium">{c.nome}</td>
                    <td className="px-5 py-3 text-neutral-500 dark:text-neutral-400">{c.telefone}</td>
                    <td className="px-5 py-3">{info?.ultima || "—"}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{info?.compras || 0}</td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums">{fmtCurrency(info?.total || 0)}</td>
                    <td className="px-5 py-3">{info?.ultimaVendedora || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo cliente">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Nome</label>
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Telefone</label>
            <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" placeholder="(21) 90000-0000" />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">E-mail</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">CPF (opcional)</label>
            <input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700" />
          </div>
        </div>
        {error && <div className="text-sm text-red-600 mt-3">{error}</div>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-4 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg py-2.5 text-sm font-medium"
        >
          {saving ? "Salvando..." : "Salvar cliente"}
        </button>
      </Modal>
    </div>
  );
}
