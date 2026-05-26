"use client";

import { useEffect, useState } from "react";
import { Activity, Search, AlertTriangle, ShieldCheck, Clock, ShieldAlert } from "lucide-react";
import { pharmacyApi } from "@/services/api";

interface TriageLog {
  id: string;
  created_at: string;
  message_content: string;
  ai_response: string;
  triage_level: string;
  user_phone: string;
  was_resolved: boolean;
}

export default function Triagens() {
  const [allTriages, setAllTriages] = useState<TriageLog[]>([]);
  const [filteredTriages, setFilteredTriages] = useState<TriageLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTriages() {
      try {
        const data = await pharmacyApi.getDashboardStats();
        const logs = data.recent_activity || [];
        setAllTriages(logs);
        setFilteredTriages(logs);
      } catch (err) {
        console.error("Erro ao carregar triagens:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTriages();
  }, []);

  // Escuta evento global de busca enviado pelo Topbar
  useEffect(() => {
    const handleGlobalSearch = (e: Event) => {
      const query = (e as CustomEvent).detail || "";
      setSearchQuery(query);
    };

    window.addEventListener("global-search", handleGlobalSearch);
    return () => window.removeEventListener("global-search", handleGlobalSearch);
  }, []);

  // Re-filtra a lista sempre que a query de busca ou a lista principal mudar
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTriages(allTriages);
      return;
    }

    const lower = searchQuery.toLowerCase();
    const filtered = allTriages.filter(t => 
      (t.user_phone && t.user_phone.toLowerCase().includes(lower)) ||
      (t.message_content && t.message_content.toLowerCase().includes(lower)) ||
      (t.triage_level && t.triage_level.toLowerCase().includes(lower))
    );
    setFilteredTriages(filtered);
  }, [searchQuery, allTriages]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-white font-heading tracking-tighter">
          Triagens e Consultas
        </h1>
        <p className="text-muted text-sm mt-1">Histórico de conversas processadas em tempo real pela IA.</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="text-slate-400 text-sm animate-pulse">Carregando triagens...</span>
        </div>
      ) : filteredTriages.length === 0 ? (
        <div className="glass-window rounded-[2rem] p-12 min-h-[400px] flex flex-col items-center justify-center text-center border border-white/5 bg-white/[0.01]">
          <Activity className="w-12 h-12 text-rose-500 mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-white mb-2">Nenhuma triagem encontrada</h2>
          <p className="text-muted max-w-sm text-sm">
            {searchQuery ? "Nenhum resultado corresponde à sua busca." : "Quando o assistente receber mensagens, o histórico aparecerá aqui."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTriages.map((t) => (
            <div 
              key={t.id} 
              className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all flex flex-col md:flex-row md:items-start justify-between gap-6"
            >
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3.5 py-1 bg-white/5 border border-white/5 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5">
                    📱 {t.user_phone || "Paciente Anônimo"}
                  </span>
                  
                  <span className={`px-3.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                    t.triage_level === "VERMELHO" 
                      ? "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                      : t.triage_level === "AMARELO"
                        ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                        : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  }`}>
                    {t.triage_level === "VERMELHO" ? "🔴 Urgente" : t.triage_level === "AMARELO" ? "🟡 Moderado" : "🟢 Leve"}
                  </span>

                  <span className="text-slate-500 text-xs flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(t.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Mensagem do Paciente</span>
                    <p className="text-slate-300 text-xs leading-relaxed">{t.message_content}</p>
                  </div>
                  <div className="bg-rose-500/[0.02] rounded-2xl p-4 border border-rose-500/5">
                    <span className="text-[10px] text-rose-400/70 font-bold uppercase tracking-wider block mb-2">Resposta da IA</span>
                    <p className="text-slate-300 text-xs leading-relaxed">{t.ai_response}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
