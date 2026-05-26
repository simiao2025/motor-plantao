"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Users, Settings, Activity, ShieldPlus, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { pharmacyApi } from "@/services/api";

export function Sidebar() {
  const router = useRouter();
  const [pharmacyName, setPharmacyName] = useState("");
  const [whatsappStatus, setWhatsappStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const [whatsappChannel, setWhatsappChannel] = useState("evolution");

  const links = [
    { name: "Visão Geral", href: "/dashboard", icon: <Home className="w-5 h-5" /> },
    { name: "Triagens", href: "/dashboard/triagens", icon: <Activity className="w-5 h-5" /> },
    { name: "Clientes", href: "/dashboard/clientes", icon: <Users className="w-5 h-5" /> },
    { name: "Plantões", href: "/dashboard/plantao", icon: <ShieldPlus className="w-5 h-5" /> },
    { name: "Ajustes", href: "/dashboard/configuracoes", icon: <Settings className="w-5 h-5" /> },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function loadPharmacyAndStatus() {
      try {
        const profile = await pharmacyApi.getProfile();
        if (profile?.name) {
          setPharmacyName(profile.name);
        }

        const channel = profile?.whatsapp_channel || "evolution";
        setWhatsappChannel(channel);

        if (channel === "meta") {
          if (profile?.meta_token && profile?.meta_phone_number_id) {
            setWhatsappStatus("connected");
          } else {
            setWhatsappStatus("disconnected");
          }
        } else if (channel === "evolution" && profile?.cnpj) {
          const checkStatus = async () => {
            try {
              const res = await pharmacyApi.getInstanceStatus(profile.cnpj);
              const state = res?.instance?.state || res?.state;
              if (state === "open" || state === "connected") {
                setWhatsappStatus("connected");
              } else {
                setWhatsappStatus("disconnected");
              }
            } catch (err) {
              console.error("Erro ao verificar status do WhatsApp na Sidebar:", err);
              setWhatsappStatus("disconnected");
            }
          };

          // Verificação imediata
          await checkStatus();

          // Polling a cada 15 segundos
          interval = setInterval(checkStatus, 15000);
        } else {
          setWhatsappStatus("disconnected");
        }
      } catch (err) {
        console.error("Erro ao carregar dados da Sidebar:", err);
        setWhatsappStatus("disconnected");
      }
    }

    loadPharmacyAndStatus();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Erro ao deslogar:", err);
    }
  };

  return (
    <aside className="w-64 border-r border-white/5 bg-s1 hidden md:flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-white/5 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <img 
            src="/icons-farmacia.png" 
            alt="Ícone Farmácia" 
            className="w-16 h-16 rounded-xl border border-white/10 object-cover shadow-lg" 
          />
          <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-tight">
            Motor<br/><span className="text-gradient-medical">Plantão</span>
          </h2>
        </div>
        {pharmacyName && (
          <span className="text-xs font-bold text-slate-400 truncate mt-1 bg-white/5 px-2.5 py-1 rounded-md border border-white/5 w-fit">
            🏪 {pharmacyName}
          </span>
        )}
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

        {/* Botão Sair da Conta */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500/80 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20 mt-6 cursor-pointer"
        >
          <LogOut className="w-5 h-5 text-rose-500 shrink-0" />
          Sair da Conta
        </button>
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl backdrop-blur-md relative overflow-hidden group">
          <p className="text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-wider">
            WhatsApp {whatsappChannel === "meta" ? "Cloud API" : "Evolution"}
          </p>
          
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  whatsappStatus === "connected" ? "bg-emerald-400" : whatsappStatus === "checking" ? "bg-slate-400" : "bg-amber-400"
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  whatsappStatus === "connected" ? "bg-emerald-500" : whatsappStatus === "checking" ? "bg-slate-500" : "bg-amber-500"
                }`}></span>
              </span>
              <span className="text-xs font-bold text-white capitalize">
                {whatsappStatus === "connected" ? "Online" : whatsappStatus === "checking" ? "Verificando..." : "Desconectado"}
              </span>
            </div>
            
            {whatsappStatus === "disconnected" && (
              <Link 
                href="/dashboard/configuracoes" 
                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold transition-all px-2 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg border border-rose-500/10 hover:border-rose-500/20"
              >
                Conectar
              </Link>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
