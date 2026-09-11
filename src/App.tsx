import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ToastContainer } from "@/components/ui/Toast";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { POS } from "@/pages/POS";
import { Vendas } from "@/pages/Vendas";
import { VendaDetail } from "@/pages/VendaDetail";
import { Produtos } from "@/pages/Produtos";
import { Estoque } from "@/pages/Estoque";
import { Clientes } from "@/pages/Clientes";
import { ClienteDetail } from "@/pages/ClienteDetail";
import { Equipe } from "@/pages/Equipe";
import { MembroDetail } from "@/pages/MembroDetail";
import { Trocas } from "@/pages/Trocas";
import { Configuracoes } from "@/pages/Configuracoes";
import { useAuthStore } from "@/store/useAuthStore";

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const init = useAuthStore((s) => s.init);
  const session = useAuthStore((s) => s.session);
  const loading = useAuthStore((s) => s.loading);

  useEffect(() => {
    const unsub = init();
    return unsub;
  }, [init]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#ece5db] dark:bg-neutral-950">
        <div className="text-sm text-neutral-500 dark:text-neutral-400">Carregando...</div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="min-h-screen w-full flex bg-[#ece5db] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 min-w-0">
        <Topbar onOpenMenu={() => setMobileOpen(true)} />
        <main className="p-4 sm:p-8 max-w-[1400px] mx-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/vendas/:id" element={<VendaDetail />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/clientes/:id" element={<ClienteDetail />} />
            <Route path="/equipe" element={<Equipe />} />
            <Route path="/equipe/:id" element={<MembroDetail />} />
            <Route path="/trocas" element={<Trocas />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
