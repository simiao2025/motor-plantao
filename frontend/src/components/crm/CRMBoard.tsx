"use client";

import { useEffect, useState } from "react";
import { pharmacyApi, apiFetch } from "@/services/api";
import { 
  Loader2, RefreshCw, HeartPulse, DollarSign, User, Calendar, 
  MessageSquare, ChevronRight, CheckCircle2, X, PlusCircle, Trash2 
} from "lucide-react";

export default function CRMBoard() {
  const [board, setBoard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newNoteLoading, setNewNoteLoading] = useState(false);

  const fetchBoard = async () => {
    setLoading(true);
    try {
      const data = await pharmacyApi.getCRMBoard();
      setBoard(data);
    } catch (e) {
      console.error("Erro ao carregar funil CRM", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, []);

  const handleCardClick = async (deal: any) => {
    setSelectedDeal(deal);
    setSelectedPatientId(deal.patient?.id || null);
    if (!deal.patient?.id) return;

    setHistoryLoading(true);
    try {
      // Busca perfil e histórico completo no backend
      const res = await apiFetch(`/admin/crm/patients/${deal.patient.id}/history`);
      setHistory(res);
    } catch (err) {
      console.error("Erro ao carregar histórico do paciente", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleStageChange = async (dealId: string, newStage: string) => {
    try {
      await pharmacyApi.updateDealStage(dealId, newStage);
      
      // Atualiza a UI localmente ou recarrega o board
      fetchBoard();
      if (selectedDeal && selectedDeal.id === dealId) {
        setSelectedDeal((prev: any) => ({ ...prev, status: newStage }));
        // Recarrega o histórico para mostrar a interação auditável de alteração de status
        if (selectedPatientId) {
          const res = await apiFetch(`/admin/crm/patients/${selectedPatientId}/history`);
          setHistory(res);
        }
      }
    } catch (e) {
      console.error("Erro ao alterar estágio", e);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedPatientId || !selectedDeal) return;

    setNewNoteLoading(true);
    try {
      // Grava uma nova nota de interação manual na timeline
      await apiFetch(`/admin/crm/patients/${selectedPatientId}/notes`, {
        method: "POST",
        body: JSON.stringify({ description: newNote })
      });
      setNewNote("");
      // Recarrega a timeline
      const res = await apiFetch(`/admin/crm/patients/${selectedPatientId}/history`);
      setHistory(res);
    } catch (err) {
      console.error("Erro ao adicionar nota", err);
    } finally {
      setNewNoteLoading(false);
    }
  };

  const columns = [
    { id: "lead", title: "Novos Contatos", color: "border-slate-500/20 bg-slate-500/5 text-slate-400" },
    { id: "triaged", title: "Prioridade Triada", color: "border-amber-500/20 bg-amber-500/5 text-amber-400" },
    { id: "waiting_pharmacist", title: "Em Atendimento", color: "border-rose-500/20 bg-rose-500/5 text-rose-400" },
    { id: "completed", title: "Prescrições Ganhas", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-3">
        <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
        <span className="text-slate-500 text-xs font-bold">Carregando painel de negócios...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Funil atualizado em tempo real</span>
        </div>
        <button
          onClick={fetchBoard}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar Quadro
        </button>
      </div>

      {/* Grid do Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {columns.map(col => {
          const list = board?.[col.id] || [];
          return (
            <div key={col.id} className="flex flex-col h-[650px] bg-s2/40 border border-white/5 rounded-3xl p-4 overflow-hidden relative">
              <div className="flex items-center justify-between mb-4 px-2 select-none">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${col.color}`}>
                  {col.title}
                </span>
                <span className="text-xs font-black text-slate-500">{list.length}</span>
              </div>

              <div 
                className="flex-1 overflow-y-auto space-y-3 pr-1"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {list.length === 0 ? (
                  <div className="text-center py-16 text-slate-600 text-xs border border-dashed border-white/5 rounded-2xl p-4 bg-white/[0.005]">
                    Nenhum paciente neste estágio.
                  </div>
                ) : (
                  list.map((deal: any) => (
                    <div 
                      key={deal.id} 
                      onClick={() => handleCardClick(deal)}
                      className={`p-4 bg-s1/60 border rounded-2xl transition-all cursor-pointer space-y-3 shadow-md relative overflow-hidden group select-none ${
                        selectedDeal?.id === deal.id ? "border-rose-500/50 bg-rose-500/[0.02]" : "border-white/5 hover:border-white/10 hover:bg-s1/90"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-sm font-bold text-white block truncate w-32">
                            {deal.patient?.name || "Paciente Provisório"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {deal.patient?.phone || "Sem contato"}
                          </span>
                        </div>

                        {/* Urgência da Triagem */}
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 border animate-pulse ${
                          deal.triage_level === "VERMELHO" 
                            ? "bg-rose-500/10 text-rose-500 border-rose-500/10" 
                            : deal.triage_level === "AMARELO"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/10"
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/10"
                        }`}>
                          <HeartPulse className="w-2.5 h-2.5" /> {deal.triage_level || "VERDE"}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-400 truncate leading-relaxed">
                        {deal.notes || "Triagem gerada automaticamente pelo robô..."}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[10px] text-slate-500 font-bold">
                        <span className="flex items-center gap-0.5 text-slate-400">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> R$ {deal.value?.toFixed(2) || "0.00"}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-medium text-slate-400">
                          <User className="w-3 h-3 text-slate-500" /> {deal.assigned_agent?.name || "Sem atendente"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-out Sidebar (Ficha do Paciente) */}
      {selectedDeal && (
        <div className="fixed inset-0 z-50 overflow-hidden md:ml-64">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedDeal(null)} />
          
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-lg bg-s1 border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col h-full text-white">
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Ficha do Paciente</h3>
                  <p className="text-xs text-slate-400 font-medium">Histórico, triagem e controle de vendas</p>
                </div>
                <button 
                  onClick={() => setSelectedDeal(null)}
                  className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Corpo principal */}
              <div 
                className="flex-1 overflow-y-auto p-6 space-y-6"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {/* Perfil Rápido */}
                <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center font-black text-rose-500">
                      {selectedDeal.patient?.name ? selectedDeal.patient.name[0].toUpperCase() : "P"}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{selectedDeal.patient?.name || "Paciente Sem Nome"}</h4>
                      <p className="text-xs text-slate-400 font-mono">{selectedDeal.patient?.phone || "Sem telefone"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Mudar Estágio</span>
                      <select
                        value={selectedDeal.status}
                        onChange={(e) => handleStageChange(selectedDeal.id, e.target.value)}
                        className="bg-s2 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 w-full outline-none focus:border-rose-500/50 transition-all mt-1 cursor-pointer font-bold"
                      >
                        <option value="lead">Novos Contatos</option>
                        <option value="triaged">Prioridade Triada</option>
                        <option value="waiting_pharmacist">Em Atendimento</option>
                        <option value="completed">Prescrição Ganha</option>
                        <option value="lost">Lead Perdido</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Valor Estimado</span>
                      <div className="flex items-center gap-1 bg-s2 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 mt-1">
                        <span className="text-emerald-500 font-bold">R$</span>
                        <input
                          type="number"
                          value={selectedDeal.value}
                          onChange={async (e) => {
                            const val = parseFloat(e.target.value) || 0.0;
                            setSelectedDeal((prev: any) => ({ ...prev, value: val }));
                            try {
                              await apiFetch(`/admin/crm/deals/${selectedDeal.id}/value`, {
                                method: "PUT",
                                body: JSON.stringify({ value: val })
                              });
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="bg-transparent border-none outline-none text-white w-full font-bold"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Histórico Cronológico */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Histórico de Contatos</h5>
                  
                  {historyLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
                    </div>
                  ) : history?.timeline && history.timeline.length > 0 ? (
                    <div className="space-y-4 relative pl-4 border-l border-white/5">
                      {history.timeline.map((item: any) => (
                        <div key={item.id} className="relative space-y-1">
                          {/* Bolinha conectora do histórico */}
                          <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-s1 ${
                            item.type === "triage" ? "bg-rose-500" : item.type === "status_change" ? "bg-amber-500" : "bg-slate-500"
                          }`} />
                          
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                            <span className="capitalize">{item.type}</span>
                            <span>{new Date(item.created_at).toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <p className="text-xs text-slate-300 bg-white/[0.01] border border-white/5 rounded-2xl p-3.5 leading-relaxed">
                            {item.description}
                          </p>
                          {item.pharmacy_users?.name && (
                            <span className="text-[9px] text-slate-500 font-medium block text-right">Por: {item.pharmacy_users.name}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-500">
                      Nenhuma timeline encontrada para o paciente.
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé: Input para Nova Nota */}
              <div className="p-6 border-t border-white/5 bg-s2/30">
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Adicionar observação na timeline..."
                    className="flex-1 bg-s2 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-rose-500/50 transition-all font-medium"
                    disabled={newNoteLoading}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    disabled={newNoteLoading || !newNote.trim()}
                  >
                    {newNoteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gravar"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
