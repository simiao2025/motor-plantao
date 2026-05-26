"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { pharmacyApi } from "@/services/api";
import { supabase } from "@/lib/supabase";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  KeyRound, 
  Loader2, 
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  Mail,
  User
} from "lucide-react";

interface TeamMember {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "salesperson";
  created_at: string;
}

export default function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // States para criar novo membro
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"manager" | "salesperson">("salesperson");

  // States para Alteração de Senha
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [newMemberPassword, setNewMemberPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Perfil do Usuário Logado
  const [currentUserRole, setCurrentUserRole] = useState<string>("salesperson");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const loadTeam = async () => {
    setLoading(true);
    try {
      // 1. Pegar dados dos membros
      const data = await pharmacyApi.getUsers();
      setMembers(data || []);

      // 2. Pegar usuário logado e herdar seu papel
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        setCurrentUserRole(user.user_metadata?.role || "salesperson");
      }
    } catch (err) {
      console.error("Erro ao carregar membros da equipe:", err);
      setMessage({ type: "error", text: "Falha ao carregar a lista de membros da equipe." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "A senha provisória deve conter no mínimo 6 caracteres." });
      setSaving(false);
      return;
    }

    try {
      await pharmacyApi.addUser({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole
      });
      setMessage({ type: "success", text: `Membro ${newName} cadastrado e ativo com sucesso!` });
      
      // Limpa formulário
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setShowAddForm(false);
      
      // Recarrega lista
      await loadTeam();
    } catch (err: any) {
      console.error("Erro ao cadastrar membro:", err);
      setMessage({ type: "error", text: err.message || "Erro ao cadastrar funcionário." });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o acesso de ${name}? Esta ação é permanente.`)) return;
    
    setMessage(null);
    try {
      await pharmacyApi.deleteUser(id);
      setMessage({ type: "success", text: `Acesso do membro ${name} removido com sucesso!` });
      await loadTeam();
    } catch (err: any) {
      console.error("Erro ao remover funcionário:", err);
      setMessage({ type: "error", text: err.message || "Erro ao remover funcionário." });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setChangingPassword(true);
    setMessage(null);

    if (newMemberPassword.length < 6) {
      setMessage({ type: "error", text: "A nova senha deve conter no mínimo 6 caracteres." });
      setChangingPassword(false);
      return;
    }

    try {
      await pharmacyApi.changeUserPassword(selectedMember.id, newMemberPassword);
      setMessage({ type: "success", text: `Senha de ${selectedMember.name} redefinida com sucesso!` });
      setNewMemberPassword("");
      setSelectedMember(null);
    } catch (err: any) {
      console.error("Erro ao alterar senha do membro:", err);
      setMessage({ type: "error", text: err.message || "Erro ao redefinir credenciais." });
    } finally {
      setChangingPassword(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { label: string; style: string }> = {
      owner: { label: "Proprietário", style: "bg-rose-500/10 border-rose-500/20 text-rose-400" },
      manager: { label: "Gerente", style: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
      salesperson: { label: "Balconista", style: "bg-sky-500/10 border-sky-500/20 text-sky-400" },
    };
    const b = badges[role] || { label: role, style: "bg-slate-500/10 border-slate-500/20 text-slate-400" };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${b.style}`}>
        {b.label}
      </span>
    );
  };

  // Bloqueio de Segurança: Balconista não visualiza as opções de gestão de time
  const hasManagementPermission = currentUserRole === "owner" || currentUserRole === "manager" || currentUserRole === "admin";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin mb-2" />
        <p className="text-sm">Carregando lista de membros da equipe...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header do Time */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Membros da Equipe</h3>
            <p className="text-xs text-slate-400">
              Gerencie os proprietários, gerentes e balconistas com acesso a esta farmácia.
            </p>
          </div>
        </div>

        {hasManagementPermission && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 w-fit shadow-md shadow-white/5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Adicionar Membro
          </button>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Formulário de Adicionar Novo Membro */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-6 bg-white/5 border border-white/10 rounded-2xl overflow-hidden space-y-4"
          >
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-rose-500" /> Cadastrar Novo Usuário
            </h4>
            <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Nome Completo</label>
                <div className="relative">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/40 transition-all"
                    placeholder="Nome do Funcionário"
                    required
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">E-mail de Login</label>
                <div className="relative">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/40 transition-all"
                    placeholder="email@login.com"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Senha Provisória</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/40 transition-all"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Nível de Permissão (Cargo)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as "manager" | "salesperson")}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/40 transition-all"
                >
                  <option value="salesperson">Balconista (Leitura e Escala básica)</option>
                  {currentUserRole === "owner" && (
                    <option value="manager">Gerente (Gestão básica e Configuração)</option>
                  )}
                </select>
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-white/10 text-slate-400 hover:text-white rounded-xl text-sm font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Salvando..." : "Confirmar Cadastro"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulário de Redefinir Senha do Membro */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-6 bg-rose-500/5 border border-rose-500/20 rounded-2xl overflow-hidden space-y-4"
          >
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-rose-400" /> Redefinir Senha de <span className="text-rose-400">{selectedMember.name}</span>
            </h4>
            <form onSubmit={handleChangePassword} className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-slate-400 mb-2">Nova Senha</label>
                <input
                  type="password"
                  value={newMemberPassword}
                  onChange={(e) => setNewMemberPassword(e.target.value)}
                  className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/40 transition-all"
                  placeholder="Minimo 6 caracteres"
                  required
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="px-4 py-3 border border-white/10 text-slate-400 hover:text-white rounded-xl text-sm font-bold transition-all flex-1 sm:flex-initial cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex-1 sm:flex-initial cursor-pointer"
                >
                  {changingPassword ? "Salvando..." : "Salvar Senha"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de Membros da Equipe */}
      <div className="bg-black/20 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 text-xs font-bold uppercase tracking-wider text-slate-500 bg-white/[0.01]">
                <th className="p-4 pl-6">Nome / E-mail</th>
                <th className="p-4">Cargo</th>
                <th className="p-4">Cadastrado em</th>
                {hasManagementPermission && <th className="p-4 pr-6 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-slate-300">
              {members.length > 0 ? (
                members.map((member) => {
                  const isSelf = member.user_id === currentUserId;
                  return (
                    <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          {member.name} {isSelf && <span className="text-[10px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded-md font-medium font-sans">Você</span>}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{member.email}</div>
                      </td>
                      <td className="p-4">
                        {getRoleBadge(member.role)}
                      </td>
                      <td className="p-4 text-xs text-slate-500">
                        {new Date(member.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      
                      {hasManagementPermission && (
                        <td className="p-4 pr-6 text-right">
                          <div className="inline-flex items-center gap-2">
                            {/* Proprietário não pode ser excluído nem gerenciado por gerente */}
                            {member.role !== "owner" && (
                              <>
                                <button
                                  onClick={() => setSelectedMember(member)}
                                  className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/5 transition-all cursor-pointer"
                                  title="Redefinir senha do funcionário"
                                >
                                  <KeyRound className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMember(member.id, member.name)}
                                  className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 border border-white/5 transition-all cursor-pointer"
                                  title="Excluir acesso do funcionário"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            
                            {/* Dono pode resetar a própria senha aqui também */}
                            {isSelf && (
                              <button
                                onClick={() => setSelectedMember(member)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/5 transition-all cursor-pointer"
                                title="Alterar minha própria senha"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={hasManagementPermission ? 4 : 3} className="p-8 text-center text-slate-500 font-medium">
                    Nenhum membro cadastrado nesta farmácia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trava visual informativa para balconistas */}
      {!hasManagementPermission && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-slate-500 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-slate-400" />
          Apenas Proprietários e Gerentes podem cadastrar ou remover acessos de funcionários desta farmácia.
        </div>
      )}
    </div>
  );
}
