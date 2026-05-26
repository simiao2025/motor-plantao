"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pharmacyApi } from "@/services/api";
import { Mail, Lock, User, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await pharmacyApi.register(formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Erro ao registrar usuário.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden bg-grid-white/[0.02]">
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#10b981" />
        
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full"></div>

        <div className="w-full max-w-md glass-window p-8 md:p-12 rounded-[2.5rem] space-y-8 relative z-10 border border-white/5 bg-black/40 backdrop-blur-xl text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-white font-heading tracking-tighter uppercase">
              Confirme seu E-mail!
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Enviamos um e-mail de confirmação de segurança para <strong className="text-emerald-400 font-bold">{formData.email}</strong> via Resend.com.
            </p>
          </div>

          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs text-slate-500 text-left">
            <span className="font-bold text-slate-400 block mb-1">Próximos passos:</span>
            1. Abra seu gerenciador de e-mail.<br />
            2. Clique no link/botão "Confirmar meu E-mail".<br />
            3. Você será ativado automaticamente e direcionado ao login.
          </div>

          <Link
            href="/login"
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20 block"
          >
            VOLTAR AO LOGIN
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden bg-grid-white/[0.02]">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#f43f5e" />
      
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md glass-window p-8 md:p-12 rounded-[2.5rem] space-y-8 relative z-10 border border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-white font-heading uppercase tracking-tighter">
            Criar <span className="text-gradient-medical">Conta</span>
          </h1>
          <p className="text-muted">Junte-se ao Motor de Plantão IA.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <InputField 
              type="text"
              label="Seu Nome Completo" 
              placeholder="Digite seu nome" 
              icon={<User className="w-5 h-5" />}
              value={formData.name}
              onChange={(v: string) => setFormData({...formData, name: v})}
            />
            <InputField 
              type="email"
              label="E-mail Corporativo" 
              placeholder="seu@email.com" 
              icon={<Mail className="w-5 h-5" />}
              value={formData.email}
              onChange={(v: string) => setFormData({...formData, email: v})}
            />
            <InputField 
              type="password"
              label="Senha de Acesso" 
              placeholder="Minimo 6 caracteres" 
              icon={<Lock className="w-5 h-5" />}
              value={formData.password}
              onChange={(v: string) => setFormData({...formData, password: v})}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 disabled:opacity-50 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-rose-500/20"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                CONFIRMAR E CADASTRAR
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-sm text-muted">
          Já tem uma conta? <Link href="/login" className="text-rose-500 hover:text-rose-400 font-bold">Acessar Login</Link>
        </div>
      </div>
    </main>
  );
}

interface InputFieldProps {
  type?: string;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
}

function InputField({ type = "text", label, placeholder, icon, value, onChange }: InputFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-muted uppercase ml-2">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-rose-500 transition-colors">
          {icon}
        </div>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-s2 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-rose-500/50 focus:bg-white/5 transition-all"
          required
        />
      </div>
    </div>
  );
}
