"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import {
  LayoutDashboard, Calendar, Users, Scissors, CreditCard,
  Package, Settings, LogOut, ChevronRight, Layers, TrendingUp, Clock, Target, DollarSign, KanbanSquare
} from "lucide-react";

const ownerNav = [
  { href: "/painel", label: "Dashboard", icon: LayoutDashboard },
  { href: "/painel/agendamentos", label: "Agendamentos", icon: Calendar },
  { href: "/painel/barbeiros", label: "Barbeiros", icon: Users },
  { href: "/painel/servicos", label: "Serviços", icon: Scissors },
  { href: "/painel/planos", label: "Planos", icon: Layers },
  { href: "/painel/assinaturas", label: "Assinantes", icon: CreditCard },
  { href: "/painel/financeiro", label: "Financeiro", icon: TrendingUp },
  { href: "/painel/ocupacao", label: "Ocupação", icon: Clock },
  { href: "/painel/metas", label: "Metas", icon: Target },
  { href: "/painel/comissoes", label: "Comissões", icon: DollarSign },
  { href: "/painel/kanban", label: "Kanban", icon: KanbanSquare },
  { href: "/painel/produtos", label: "Produtos", icon: Package },
  { href: "/painel/clientes", label: "Clientes", icon: Users },
  { href: "/painel/configuracoes", label: "Configurações", icon: Settings },
];

const barberNav = [
  { href: "/barbeiro", label: "Minha Agenda", icon: Calendar },
  { href: "/barbeiro/producao", label: "Produção", icon: TrendingUp },
  { href: "/barbeiro/comissoes", label: "Comissões", icon: CreditCard },
  { href: "/barbeiro/clientes", label: "Clientes", icon: Users },
  { href: "/painel/kanban", label: "Tarefas", icon: KanbanSquare },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const nav = user?.role === "BARBER" ? barberNav : ownerNav;

  function logout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-zinc-900 text-white">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-800">
        <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center">
          <Scissors className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">BarberApp</p>
          <p className="text-xs text-zinc-400 truncate">{user?.name}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/painel" && href !== "/barbeiro" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-amber-500 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-4 h-4" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-zinc-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
