"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { pharmacyApi } from "@/services/api";
import { Bell, Menu, Search, UserCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  onToggleMenu?: () => void;
}

export function Navbar({ onToggleMenu }: NavbarProps) {
  const [userName, setUserName] = useState("Dr. Admin");
  const [userRole, setUserRole] = useState("Gestor");
  const [pharmacyName, setPharmacyName] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: "1",
      title: "Onboarding Concluído!",
      body: "Sua farmácia está configurada e com RLS seguros ativos.",
      time: "Agora",
      type: "success",
      read: false
    },
    {
      id: "2",
      title: "Nova Triagem Emergencial",
      body: "Paciente com suspeita de dengue triado como VERMELHO.",
      time: "10m atrás",
      type: "critical",
      read: false
    }
  ]);

  useEffect(() => {
    async function loadUserAndPharmacy() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Busca o nome do metadados, ou usa o e-mail como fallback
          const displayName = user.user_metadata?.name || user.email?.split("@")[0] || "Administrador";
          setUserName(displayName);
          
          // Busca o papel (role) do metadados se existir, ou define Gestor por padrão
          const role = user.user_metadata?.role || "Gestor";
          // Traduz cargos para o visual
          const rolesMap: Record<string, string> = {
            owner: "Proprietário",
            manager: "Gerente",
            salesperson: "Balconista",
            admin: "Gestor",
            Gestor: "Gestor"
          };
          setUserRole(rolesMap[role] || role);
        }

        const profile = await pharmacyApi.getProfile();
        if (profile?.name) {
          setPharmacyName(profile.name);
        }

        // Verifica status do WhatsApp e insere alerta nas notificações se estiver desconectado
        if (profile?.cnpj) {
          try {
            const res = await pharmacyApi.getInstanceStatus(profile.cnpj);
            const state = res?.instance?.state || res?.state;
            if (state !== "open" && state !== "connected") {
              setNotifications(prev => {
                if (prev.some(n => n.id === "whatsapp-alert")) return prev;
                return [
                  {
                    id: "whatsapp-alert",
                    title: "WhatsApp Desconectado!",
                    body: "Conecte sua instância nas configurações para iniciar atendimentos.",
                    time: "Atenção",
                    type: "warning",
                    read: false
                  },
                  ...prev
                ];
              });
            }
          } catch (whatsappErr) {
            console.error("Erro ao verificar status para notificações:", whatsappErr);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar usuário e farmácia na Navbar:", err);
      }
    }
    loadUserAndPharmacy();
  }, []);

  const hasUnread = notifications.some(n => !n.read);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchVal(val);
    window.dispatchEvent(new CustomEvent("global-search", { detail: val }));
  };

  return (
    <header className="h-20 border-b border-white/5 bg-bg/80 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleMenu}
          className="md:hidden text-slate-300 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg cursor-pointer"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden md:flex items-center gap-2 bg-s2/50 border border-white/5 rounded-full px-4 py-2 w-64 focus-within:border-rose-500/50 focus-within:bg-s2 transition-all">
          <Search className="w-4 h-4 text-muted" />
          <input 
            type="text" 
            value={searchVal}
            onChange={handleSearchChange}
            placeholder="Buscar paciente ou triagem..." 
            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-muted"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 relative">
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative text-muted hover:text-white transition-colors p-2 rounded-full hover:bg-white/5 cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          {hasUnread && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-bg animate-pulse"></span>
          )}
        </button>

        {/* Dropdown flutuante premium */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="absolute right-0 top-16 w-80 bg-slate-950/95 border border-white/10 rounded-3xl p-5 shadow-[0_10px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl z-50 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">Notificações</h4>
                {hasUnread && (
                  <button 
                    onClick={markAllRead}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-bold transition-all px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg cursor-pointer"
                  >
                    Marcar como lidas
                  </button>
                )}
              </div>

              <div className="h-[200px] overflow-y-auto space-y-3 pr-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    Nenhuma notificação por enquanto.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`p-3 rounded-xl border text-xs transition-all relative ${
                        !n.read ? "bg-white/[0.03] border-white/10" : "bg-transparent border-transparent opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold ${
                          n.type === "critical" ? "text-rose-400" : n.type === "warning" ? "text-amber-400" : "text-emerald-400"
                        }`}>
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-500">{n.time}</span>
                      </div>
                      <p className="text-slate-400 leading-relaxed">{n.body}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
        
        <div className="flex items-center gap-3 select-none">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white capitalize">{userName}</p>
            <p className="text-xs text-muted font-medium">
              {userRole}{pharmacyName ? ` • 🏪 ${pharmacyName}` : ""}
            </p>
          </div>
          <UserCircle className="w-9 h-9 text-rose-500" />
        </div>
      </div>
    </header>
  );
}
