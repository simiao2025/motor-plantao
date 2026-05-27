"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Home, Users, Settings, Activity, ShieldPlus, LogOut, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { pharmacyApi } from "@/services/api";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pharmacyName, setPharmacyName] = useState("");

  const links = [
    { name: "Visão Geral", href: "/dashboard", icon: <Home className="w-5 h-5" /> },
    { name: "Triagens", href: "/dashboard/triagens", icon: <Activity className="w-5 h-5" /> },
    { name: "Clientes", href: "/dashboard/clientes", icon: <Users className="w-5 h-5" /> },
    { name: "Plantões", href: "/dashboard/plantao", icon: <ShieldPlus className="w-5 h-5" /> },
    { name: "Ajustes", href: "/dashboard/configuracoes", icon: <Settings className="w-5 h-5" /> },
  ];

  useEffect(() => {
    async function loadPharmacy() {
      try {
        const profile = await pharmacyApi.getProfile();
        if (profile?.name) {
          setPharmacyName(profile.name);
        }
      } catch (err) {
        console.error("Erro ao carregar dados da Sidebar:", err);
      }
    }
    loadPharmacy();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Erro ao deslogar:", err);
    }
  };

  const sidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-s1 text-white">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <img 
            src="/icons-farmacia.png" 
            alt="Ícone Farmácia" 
            className="w-12 h-12 rounded-xl border border-white/10 object-cover shadow-lg" 
          />
          <h2 className="text-lg font-black text-white uppercase tracking-tighter leading-tight">
            Motor<br/><span className="text-gradient-medical">Plantão</span>
          </h2>
        </div>
        
        {isMobile && onClose && (
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {pharmacyName && (
        <div className="px-6 pt-4">
          <span className="text-xs font-bold text-slate-400 truncate bg-white/5 px-2.5 py-1 rounded-md border border-white/5 block w-fit">
            🏪 {pharmacyName}
          </span>
        </div>
      )}
      
      {/* Navigation */}
      <nav 
        className="flex-1 p-4 space-y-2 overflow-y-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <p className="px-4 text-xs font-bold text-muted uppercase tracking-wider mb-4">Menu Principal</p>
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => {
                if (isMobile && onClose) onClose();
              }}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all group ${
                isActive 
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                  : "text-slate-300 hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              <span className={`transition-colors ${isActive ? "text-rose-400" : "text-muted group-hover:text-rose-500"}`}>
                {link.icon}
              </span>
              {link.name}
            </Link>
          );
        })}

        {/* Botão Sair da Conta */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500/80 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20 mt-6 cursor-pointer"
        >
          <LogOut className="w-5 h-5 text-rose-500 shrink-0" />
          Sair da Conta
        </button>
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-s1 hidden md:flex flex-col h-screen fixed left-0 top-0">
        {sidebarContent(false)}
      </aside>

      {/* Mobile Drawer (shown only when isOpen is true) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={onClose}
          />
          
          {/* Sliding panel */}
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-s1 border-r border-white/10 shadow-[5px_0_30px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out flex flex-col h-screen">
            {sidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
