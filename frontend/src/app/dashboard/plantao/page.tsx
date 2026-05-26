"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Clock, Plus, Trash2, CalendarCheck, CalendarDays } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { pharmacyApi } from "@/services/api";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
} as const;

export default function Plantao() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [newDate, setNewDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const loadShifts = async () => {
    setIsLoading(true);
    try {
      const data = await pharmacyApi.getShifts();
      setShifts(data || []);
    } catch (error) {
      console.error("Erro ao carregar plantões", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, []);

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;
    
    setIsAdding(true);
    try {
      await pharmacyApi.addShift(newDate);
      setNewDate("");
      await loadShifts();
    } catch (error) {
      console.error("Erro ao adicionar plantão", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteShift = async (id: string) => {
    try {
      await pharmacyApi.deleteShift(id);
      await loadShifts();
    } catch (error) {
      console.error("Erro ao deletar plantão", error);
    }
  };

  // Separa plantões futuros e passados
  const today = new Date().toISOString().split('T')[0];
  const upcomingShifts = shifts.filter(s => s.shift_date >= today);
  const pastShifts = shifts.filter(s => s.shift_date < today);

  return (
    <motion.div initial="hidden" animate="show" variants={container} className="space-y-8 max-w-6xl mx-auto">
      <motion.header variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white font-heading tracking-tighter">
            Escala de Plantões
          </h1>
          <p className="text-muted text-sm mt-1 max-w-xl">
            Organize as datas em que sua farmácia estará de plantão 24 horas.
          </p>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna Esquerda: Adicionar Plantão */}
        <motion.div variants={item} className="lg:col-span-1 space-y-6">
          <MagicCard gradientColor="rgba(56, 189, 248, 0.1)" className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400 border border-sky-500/20">
                <CalendarPlus className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Novo Plantão</h2>
            </div>
            
            <form onSubmit={handleAddShift} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Data do Plantão (24h)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="date"
                    required
                    min={today}
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-black/50 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 sm:text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-start gap-3">
                <Clock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400">
                  O plantão será considerado para todo o dia selecionado. A IA informará aos pacientes que a farmácia está aberta 24h nesta data.
                </p>
              </div>

              <button
                type="submit"
                disabled={isAdding || !newDate}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-sky-600 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 transition-colors"
              >
                {isAdding ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Agendar Plantão
                  </>
                )}
              </button>
            </form>
          </MagicCard>
        </motion.div>

        {/* Coluna Direita: Lista de Plantões */}
        <motion.div variants={item} className="lg:col-span-2 space-y-6">
          <MagicCard gradientColor="rgba(16, 185, 129, 0.05)" className="p-6 h-full min-h-[400px]">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <CalendarCheck className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Próximos Plantões</h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <span className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
              </div>
            ) : upcomingShifts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <CalendarDays className="w-16 h-16 text-slate-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-300">Calendário Vazio</h3>
                <p className="text-slate-500 max-w-sm mt-2">Nenhum plantão agendado. Use o formulário ao lado para adicionar as próximas datas da escala.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingShifts.map((shift) => {
                  const dateObj = new Date(shift.shift_date + 'T12:00:00Z');
                  const formattedDate = new Intl.DateTimeFormat('pt-BR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  }).format(dateObj);

                  return (
                    <motion.div 
                      key={shift.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex flex-col items-center justify-center text-emerald-400">
                          <span className="text-sm font-bold leading-none mb-0.5">{dateObj.getDate()}</span>
                          <span className="text-[10px] uppercase tracking-wider font-medium">{dateObj.toLocaleString('pt-BR', { month: 'short' })}</span>
                        </div>
                        <div>
                          <p className="text-white font-bold capitalize">{formattedDate}</p>
                          <p className="text-sm text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Plantão 24 Horas
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteShift(shift.id)}
                        className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Remover plantão"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            )}
            
            {pastShifts.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/5">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Plantões Anteriores</h3>
                <div className="space-y-2 opacity-50">
                  {pastShifts.slice(0, 3).map((shift) => (
                    <div key={shift.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-slate-400">{shift.shift_date.split('-').reverse().join('/')}</span>
                      <span className="text-xs font-bold text-slate-500">Concluído</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </MagicCard>
        </motion.div>

      </div>
    </motion.div>
  );
}

function CalendarPlus(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" />
      <path d="M3 10h18" />
      <path d="M16 19h6" />
      <path d="M19 16v6" />
    </svg>
  )
}
