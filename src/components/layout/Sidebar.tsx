import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, Receipt, Package, Boxes, Users, UserSquare2,
  Settings, Sun, Moon,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pos", label: "Nova Venda", icon: ShoppingCart },
  { to: "/vendas", label: "Vendas", icon: Receipt },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/estoque", label: "Estoque", icon: Boxes },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/equipe", label: "Equipe", icon: UserSquare2 },
];

interface Props {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export function Sidebar({ mobileOpen, setMobileOpen }: Props) {
  const { isDark, toggle } = useTheme();

  const content = (
    <div className="h-full flex flex-col border-r bg-neutral-900 border-neutral-900">
      <div className="px-5 py-6 flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white text-sm">A</div>
        <div>
          <div className="text-white font-bold tracking-widest text-sm leading-none">ANAZZUS</div>
          <div className="text-neutral-500 text-[10px] mt-1 tracking-wide">SISTEMA INTERNO</div>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-red-600 text-white" : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }`
              }
            >
              <Icon size={17} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-neutral-800 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white">
          <Settings size={17} /> Configurações
        </button>
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
          {isDark ? "Modo claro" : "Modo escuro"}
        </button>
        <div className="flex items-center gap-3 px-3 py-3 mt-1">
          <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-white text-xs font-semibold">C</div>
          <div className="leading-tight">
            <div className="text-white text-sm font-medium">Carlos</div>
            <div className="text-neutral-500 text-xs">Administrador</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:block w-60 shrink-0 h-screen sticky top-0">{content}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64">{content}</div>
        </div>
      )}
    </>
  );
}
