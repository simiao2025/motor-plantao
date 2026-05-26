"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { pharmacyApi } from "@/services/api";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, ArrowRight, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
import Link from "next/link";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Captura alertas via parâmetros da URL (Confirmação de e-mail, etc.)
  useEffect(() => {
    const confirmed = searchParams.get("confirmed");
    const errParam = searchParams.get("error");

    if (confirmed === "true") {
      setNotification({
        type: "success",
        text: "E-mail confirmado com sucesso! Insira suas credenciais abaixo para seu primeiro acesso.",
      });
    } else if (errParam === "token_invalid") {
      setNotification({
        type: "error",
        text: "O token de ativação é inválido, expirou ou já foi utilizado.",
      });
    } else if (errParam === "auth_failed") {
      setNotification({
        type: "error",
        text: "Ocorreu uma falha de autenticação ao ativar sua conta.",
      });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotification(null);

    try {
      // 1. Autenticação real com Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        throw new Error(authError.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : authError.message);
      }

      // 2. Buscar o perfil para verificar se o onboarding foi preenchido
      try {
        const profile = await pharmacyApi.getProfile();
        
        if (profile && profile.profile_completed === false) {
          // Bloqueia entrada no painel e envia para Onboarding comercial
          router.push("/onboarding/perfil");
        } else {
          // Acesso livre ao painel
          router.push("/dashboard");
        }
      } catch (profileErr) {
        console.error("Erro ao verificar onboarding:", profileErr);
        // Fallback: Redireciona para onboarding caso haja erro
        router.push("/onboarding/perfil");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md glass-window p-8 md:p-12 rounded-[2.5rem] space-y-8 relative z-10 border border-white/5 bg-black/40 backdrop-blur-xl">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-white font-heading uppercase tracking-tighter">
          Motor <span className="text-gradient-medical">Plantão</span>
        </h1>
        <p className="text-muted">Acesse seu painel de controle.</p>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-start gap-2.5 border ${
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-sm text-center font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <InputField 
            type="email"
            label="E-mail" 
            placeholder="seu@email.com" 
            icon={<Mail className="w-5 h-5" />}
            value={formData.email}
            onChange={(v: string) => setFormData({...formData, email: v})}
          />
          <InputField 
            type="password"
            label="Senha" 
            placeholder="••••••••" 
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
              ENTRAR
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="text-center text-sm text-muted">
        Não tem uma conta? <Link href="/register" className="text-rose-500 hover:text-rose-400 font-bold">Criar conta</Link>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden bg-grid-white/[0.02]">
      <Spotlight className="-top-40 right-0 md:right-60 md:-top-20" fill="#f97316" />
      
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-500/10 blur-[120px] rounded-full"></div>

      <Suspense fallback={<Loader2 className="w-8 h-8 text-orange-400 animate-spin" />}>
        <LoginContent />
      </Suspense>
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
