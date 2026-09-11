import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, Receipt, Package, Boxes, Users, UserSquare2,
  Settings, Sun, Moon, Repeat, LogOut, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/useAuthStore";
import { Brand } from "@/components/ui/Brand";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pos", label: "Nova Venda", icon: ShoppingCart },
  { to: "/vendas", label: "Vendas", icon: Receipt },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/estoque", label: "Estoque", icon: Boxes },
  { to: "/trocas", label: "Trocas", icon: Repeat },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/equipe", label: "Equipe", icon: UserSquare2 },
];

const ROLE_LABEL: Record<string, string> = {
  admin: "Administradora",
  gerente: "Gerente",
  vendedora: "Vendedora",
};

interface Props {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export function Sidebar({ mobileOpen, setMobileOpen }: Props) {
  const { isDark, toggle } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const canManage = profile?.role === "admin" || profile?.role === "gerente";

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem("anazzus-sidebar-collapsed") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("anazzus-sidebar-collapsed", collapsed ? "1" : "0");
    } catch {
      /* noop */
    }
  }, [collapsed]);

  const renderContent = (isCollapsed: boolean) => (
    <div className="h-full flex flex-col border-r bg-black border-black overflow-hidden">
      <div className={`py-6 flex flex-col gap-2 ${isCollapsed ? "px-0 items-center" : "px-5 items-start"}`}>
        {isCollapsed ? (
          <span className="font-script text-white text-xl leading-none">
            A<span className="text-red-600">z</span>
          </span>
        ) : (
          <>
            <Brand className="text-white text-2xl" />
            <div className="text-neutral-500 text-[10px] tracking-wide uppercase">Sistema Interno</div>
          </>
        )}
      </div>
      <nav className={`flex-1 space-y-1 overflow-y-auto scrollbar-hide ${isCollapsed ? "px-2" : "px-3"}`}>
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={isCollapsed ? item.label : undefined}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `w-full flex items-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isCollapsed ? "justify-center px-0" : "gap-3 px-3"
                } ${isActive ? "bg-red-600 text-white" : "text-neutral-400 hover:bg-white/10 hover:text-white"}`
              }
            >
              <Icon size={17} className="shrink-0" />
              {!isCollapsed && item.label}
            </NavLink>
          );
        })}
        {canManage && (
          <NavLink
            to="/configuracoes"
            title={isCollapsed ? "Configurações" : undefined}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `w-full flex items-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isCollapsed ? "justify-center px-0" : "gap-3 px-3"
              } ${isActive ? "bg-red-600 text-white" : "text-neutral-400 hover:bg-white/10 hover:text-white"}`
            }
          >
            <Settings size={17} className="shrink-0" />
            {!isCollapsed && "Configurações"}
          </NavLink>
        )}
      </nav>
      <div className={`py-4 border-t border-white/10 space-y-1 ${isCollapsed ? "px-2" : "px-3"}`}>
        <button
          onClick={toggle}
          title={isCollapsed ? (isDark ? "Modo claro" : "Modo escuro") : undefined}
          className={`w-full flex items-center py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:bg-white/10 hover:text-white ${
            isCollapsed ? "justify-center px-0" : "gap-3 px-3"
          }`}
        >
          {isDark ? <Sun size={17} className="shrink-0" /> : <Moon size={17} className="shrink-0" />}
          {!isCollapsed && (isDark ? "Modo claro" : "Modo escuro")}
        </button>
        <button
          onClick={signOut}
          title={isCollapsed ? "Sair" : undefined}
          className={`w-full flex items-center py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:bg-white/10 hover:text-white ${
            isCollapsed ? "justify-center px-0" : "gap-3 px-3"
          }`}
        >
          <LogOut size={17} className="shrink-0" />
          {!isCollapsed && "Sair"}
        </button>
        <div className={`flex items-center py-3 mt-1 ${isCollapsed ? "justify-center" : "gap-3 px-3"}`}>
          <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {profile?.nome?.[0]?.toUpperCase() || "?"}
          </div>
          {!isCollapsed && (
            <div className="leading-tight min-w-0">
              <div className="text-white text-sm font-medium truncate">{profile?.nome || "..."}</div>
              <div className="text-neutral-500 text-xs">{profile ? ROLE_LABEL[profile.role] : ""}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden md:block shrink-0 h-screen sticky top-0 relative transition-[width] duration-200 ${
          collapsed ? "w-[76px]" : "w-60"
        }`}
      >
        {renderContent(collapsed)}
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          className={`hidden md:flex absolute -right-3 w-6 h-6 rounded-full bg-black border border-white/20 items-center justify-center text-white hover:bg-neutral-800 z-10 ${
            collapsed ? "top-[116px]" : "top-[186px]"
          }`}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64">{renderContent(false)}</div>
        </div>
      )}
    </>
  );
}
