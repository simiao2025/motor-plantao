"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { MagicCard } from "@/components/ui/magic-card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { HeartbeatLine } from "@/components/ui/heartbeat-line";
import { pharmacyApi } from "@/services/api";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
} as const;

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_triagens: 0,
    criticos: 0,
    verdes: 0,
    pacientes_unicos: 0,
  });
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [whatsappStatus, setWhatsappStatus] = useState<"checking" | "connected" | "disconnected">("checking");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const dashboardData = await pharmacyApi.getDashboardStats();
      if (dashboardData.stats) {
        setStats(dashboardData.stats);
      }
      if (dashboardData.history) {
        setHistory(dashboardData.history);
      }
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Polling WhatsApp status every 15s
  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function checkWhatsApp() {
      try {
        const profile = await pharmacyApi.getProfile();
        const channel = profile?.whatsapp_channel || "evolution";

        if (channel === "meta") {
          setWhatsappStatus(profile?.meta_token && profile?.meta_phone_number_id ? "connected" : "disconnected");
        } else if (channel === "evolution" && profile?.cnpj) {
          const res = await pharmacyApi.getInstanceStatus(profile.cnpj);
          const state = res?.instance?.state || res?.state;
          setWhatsappStatus(state === "open" || state === "connected" ? "connected" : "disconnected");
        } else {
          setWhatsappStatus("disconnected");
        }
      } catch {
        setWhatsappStatus("disconnected");
      }
    }

    checkWhatsApp();
    interval = setInterval(checkWhatsApp, 15000);

    return () => clearInterval(interval);
  }, []);

  const maxHistory = history.length > 0 ? Math.max(...history.map((h: any) => h.total)) : 1;

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={container}
      className="space-y-8"
    >
      <motion.header variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <HeartbeatLine
            status={whatsappStatus}
            className="w-52 h-8 mb-4"
          />
          <h1 className="text-4xl font-black text-white font-heading tracking-tighter">
            Visão Geral
          </h1>
          <p className="text-muted text-sm mt-2 max-w-xl">
            Acompanhe o desempenho do seu assistente de saúde autônomo em tempo real.
          </p>
        </div>
      </motion.header>

      {/* Grid de 4 Cards de Estatísticas */}
      <motion.div variants={container} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <motion.div variants={item} className="h-full">
          <MagicCard gradientColor="rgba(244, 63, 94, 0.15)" className="p-6 flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-4">
              <img src="/icon-brain-3d.png" alt="Triagens" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-500 ease-out drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
                <TrendingUp className="w-3 h-3" /> Hoje
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Triagens Realizadas</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white tracking-tighter">
                  {isLoading ? "..." : <NumberTicker value={stats.total_triagens} />}
                </span>
              </div>
            </div>
          </MagicCard>
        </motion.div>

        <motion.div variants={item} className="h-full">
          <MagicCard gradientColor="rgba(249, 115, 22, 0.15)" className="p-6 flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-4">
              <img src="/icon-heart-3d.png" alt="Críticos" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-500 ease-out drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Casos Críticos (Vermelho)</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white tracking-tighter text-rose-500">
                  {isLoading ? "..." : <NumberTicker value={stats.criticos} />}
                </span>
              </div>
            </div>
          </MagicCard>
        </motion.div>

        <motion.div variants={item} className="h-full">
          <MagicCard gradientColor="rgba(56, 189, 248, 0.15)" className="p-6 flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-4">
              <img src="/icon-shield-3d.png" alt="Pacientes" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-500 ease-out drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
              <span className="text-xs font-bold text-slate-400 bg-white/5 px-2 py-1 rounded-md">
                Únicos
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Pacientes Atendidos</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white tracking-tighter">
                  {isLoading ? "..." : <NumberTicker value={stats.pacientes_unicos} />}
                </span>
              </div>
            </div>
          </MagicCard>
        </motion.div>

        <motion.div variants={item} className="h-full">
          <MagicCard gradientColor="rgba(168, 85, 247, 0.15)" className="p-6 flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-4">
              <img src="/icon-server-3d.png" alt="Uptime" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-500 ease-out drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
              <span className="text-xs font-bold text-slate-400 bg-white/5 px-2 py-1 rounded-md">
                Estável
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Uptime Sistema</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white tracking-tighter">
                  <NumberTicker value={100} />
                </span>
                <span className="text-2xl font-bold text-slate-500">%</span>
              </div>
            </div>
          </MagicCard>
        </motion.div>
      </motion.div>

      {/* Seção Gráfico Completo */}
      <motion.div variants={container} className="w-full">
        <motion.div variants={item} className="w-full">
          <MagicCard gradientColor="rgba(244, 63, 94, 0.05)" className="p-8 min-h-[420px] w-full">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Evolução de Triagens Diárias
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Histórico consolidado de triagens reais registradas nos últimos 7 dias.
                </p>
              </div>
              
              <Link 
                href="/dashboard/triagens" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-bold text-rose-500 hover:text-rose-400 uppercase tracking-wider flex items-center gap-1 transition-colors w-fit cursor-pointer bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 px-4 py-2.5 rounded-xl"
              >
                Ver Relatório
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            
            {/* Gráfico de Barras Responsivo ou Zero State */}
            {history.length === 0 ? (
              <div className="h-64 w-full flex flex-col items-center justify-center text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.005]">
                <TrendingUp className="w-10 h-10 text-slate-600 mb-3" />
                <h3 className="text-sm font-bold text-slate-300">Nenhuma triagem cadastrada</h3>
                <p className="text-[11px] text-slate-500 max-w-xs mt-1 leading-relaxed">
                  Conecte seu WhatsApp em Ajustes e inicie conversas com os pacientes para alimentar o gráfico com dados reais.
                </p>
              </div>
            ) : (
              <div className="relative h-64 w-full flex items-end gap-3 sm:gap-4 px-4 pb-2 border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-t from-rose-500/[0.03] to-transparent rounded-b-2xl mix-blend-screen pointer-events-none"></div>
                
                {history.map((day, i) => {
                  const barHeight = Math.max((day.total / maxHistory) * 200, 15);
                  const dateLabel = day.date.split("-").reverse().slice(0, 2).join("/");

                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                      {/* Tooltip flutuante no Hover */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none bg-slate-950 border border-white/10 px-3 py-1.5 rounded-xl shadow-2xl text-[10px] font-bold text-white whitespace-nowrap z-10 scale-90 group-hover:scale-100">
                        {day.total} {day.total === 1 ? "triagem" : "triagens"}
                      </div>

                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${barHeight}px` }}
                        transition={{ delay: 0.2 + i * 0.05, type: "spring", stiffness: 120, damping: 20 }}
                        className="w-full bg-gradient-to-t from-rose-600/50 to-orange-400/80 hover:from-rose-500 hover:to-orange-300 shadow-[0_0_15px_rgba(244,63,94,0.1)] rounded-t-lg cursor-pointer transition-all duration-300"
                      ></motion.div>
                      
                      <span className="text-[10px] text-slate-500 font-black tracking-tighter block select-none mt-1">
                        {dateLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </MagicCard>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
