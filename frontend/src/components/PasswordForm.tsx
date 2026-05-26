"use client";

import { useState } from "react";
import { pharmacyApi } from "@/services/api";
import { KeyRound, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

export default function PasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "A nova senha deve ter pelo menos 6 caracteres." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "As senhas informadas não coincidem." });
      return;
    }

    setSaving(true);
    try {
      await pharmacyApi.changePassword(newPassword);
      setMessage({ type: "success", text: "Senha alterada com sucesso via Supabase Auth!" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Erro ao alterar senha:", err);
      setMessage({ type: "error", text: err.message || "Erro ao alterar senha no servidor." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
          <KeyRound className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Alteração de Senha</h3>
          <p className="text-xs text-slate-400">
            Atualize sua senha de acesso ao painel de forma segura.
          </p>
        </div>
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

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Nova Senha</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/40 transition-all"
              placeholder="Digite no mínimo 6 caracteres"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Confirmar Nova Senha</label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/40 transition-all"
            placeholder="Confirme a nova senha"
            required
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-white/5">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_4px_20px_rgba(244,63,94,0.3)]"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              Alterando Senha...
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5 text-white" />
              Confirmar Alteração
            </>
          )}
        </button>
      </div>
    </form>
  );
}
