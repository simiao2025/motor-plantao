"use client";

import { Activity, Calendar, MessageSquare, Zap, ArrowUpRight, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { MagicCard } from "@/components/ui/magic-card";
import { NumberTicker } from "@/components/ui/number-ticker";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function Dashboard() {
  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={container}
      className="space-y-8"
    >
      <motion.header variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-widest mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-2 rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            Agente IA Online
          </div>
          <h1 className="text-4xl font-black text-white font-heading tracking-tighter">
            Visão Geral
          </h1>
          <p className="text-muted text-sm mt-2 max-w-xl">
            Acompanhe o desempenho do seu assistente de inteligência artificial em tempo real.
          </p>
        </div>
      </motion.header>

      <motion.div variants={container} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <motion.div variants={item} className="h-full">
          <MagicCard gradientColor="rgba(244, 63, 94, 0.15)" className="p-6 flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-rose-400 group-hover:scale-110 transition-transform duration-500 ease-out">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
                <TrendingUp className="w-3 h-3" /> +12%
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Atendimentos Hoje</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white tracking-tighter">
                  <NumberTicker value={127} />
                </span>
              </div>
            </div>
          </MagicCard>
        </motion.div>

        <motion.div variants={item} className="h-full">
          <MagicCard gradientColor="rgba(249, 115, 22, 0.15)" className="p-6 flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-orange-400 group-hover:scale-110 transition-transform duration-500 ease-out">
                <Zap className="w-5 h-5" />
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
                <TrendingUp className="w-3 h-3" /> +1.2%
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Resolutividade IA</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white tracking-tighter">
                  <NumberTicker value={98} />
                </span>
                <span className="text-2xl font-bold text-slate-500">.2%</span>
              </div>
            </div>
          </MagicCard>
        </motion.div>

        <motion.div variants={item} className="h-full">
          <MagicCard gradientColor="rgba(56, 189, 248, 0.15)" className="p-6 flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-sky-400 group-hover:scale-110 transition-transform duration-500 ease-out">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-400 bg-white/5 px-2 py-1 rounded-md">
                Em 3 dias
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Próximo Plantão</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white tracking-tighter">
                  12/05
                </span>
              </div>
            </div>
          </MagicCard>
        </motion.div>

        <motion.div variants={item} className="h-full">
          <MagicCard gradientColor="rgba(168, 85, 247, 0.15)" className="p-6 flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-purple-400 group-hover:scale-110 transition-transform duration-500 ease-out">
                <Activity className="w-5 h-5" />
              </div>
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

      <motion.div variants={container} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-2">
          <MagicCard gradientColor="rgba(244, 63, 94, 0.05)" className="p-8 min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Volume de Consultas (24h)</h2>
              <button className="text-xs font-bold text-rose-500 hover:text-rose-400 uppercase tracking-wider flex items-center gap-1 transition-colors">
                Ver Relatório
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
            
            {/* Fake chart placeholder for aesthetics */}
            <div className="relative h-64 w-full flex items-end gap-2 px-4">
              <div className="absolute inset-0 bg-gradient-to-t from-rose-500/10 to-transparent rounded-b-2xl mix-blend-screen pointer-events-none"></div>
              {[40, 70, 45, 90, 65, 85, 120, 95, 110, 80, 130, 105].map((height, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}px` }}
                  transition={{ delay: 0.5 + i * 0.05, type: "spring", stiffness: 100 }}
                  className="flex-1 bg-gradient-to-t from-rose-600/50 to-orange-400/80 rounded-t-sm hover:from-rose-500 hover:to-orange-300 cursor-pointer transition-colors"
                ></motion.div>
              ))}
            </div>
          </MagicCard>
        </motion.div>
        
        <motion.div variants={item} className="h-full">
          <MagicCard gradientColor="rgba(16, 185, 129, 0.08)" className="p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20">
                <Activity className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Instância Evolution</h2>
              <p className="text-sm text-slate-400 mb-8">
                Sua conexão com o WhatsApp está operando normalmente com latência mínima.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="text-sm font-medium text-slate-300">WhatsApp API</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">ONLINE</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-75"></div>
                    <span className="text-sm font-medium text-slate-300">Webhooks</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">ATIVO</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5">
              <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold text-sm tracking-wide rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 group">
                <Zap className="w-4 h-4 text-orange-400 group-hover:scale-125 transition-transform" />
                Sincronizar Manualmente
              </button>
            </div>
          </MagicCard>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
