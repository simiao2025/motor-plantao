import Link from "next/link";
import { Home, Users, Settings, Activity, ShieldPlus } from "lucide-react";

export function Sidebar() {
  const links = [
    { name: "Visão Geral", href: "/dashboard", icon: <Home className="w-5 h-5" /> },
    { name: "Triagens", href: "/dashboard/triagens", icon: <Activity className="w-5 h-5" /> },
    { name: "Clientes", href: "/dashboard/clientes", icon: <Users className="w-5 h-5" /> },
    { name: "Plantões", href: "/dashboard/plantao", icon: <ShieldPlus className="w-5 h-5" /> },
    { name: "Ajustes", href: "/dashboard/configuracoes", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 border-r border-white/5 bg-s1 hidden md:flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-white/5">
        <h2 className="text-xl font-black text-white uppercase tracking-tighter">
          Motor <span className="text-gradient-medical">Plantão</span>
        </h2>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <p className="px-4 text-xs font-bold text-muted uppercase tracking-wider mb-4">Menu Principal</p>
        {links.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-300 rounded-xl hover:bg-white/5 hover:text-white transition-colors group"
          >
            <span className="text-muted group-hover:text-rose-500 transition-colors">
              {link.icon}
            </span>
            {link.name}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="glass-window p-4 rounded-2xl">
          <p className="text-xs text-muted mb-2">Instância WhatsApp</p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-2 rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="text-sm font-bold text-white">Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
