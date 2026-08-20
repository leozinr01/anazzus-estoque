import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ToastContainer } from "@/components/ui/Toast";
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

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen w-full flex bg-gray-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 min-w-0">
        <Topbar onOpenMenu={() => setMobileOpen(true)} />
        <main className="p-4 sm:p-6 max-w-[1400px] mx-auto">
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
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
