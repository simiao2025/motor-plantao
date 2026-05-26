"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pharmacyApi } from "@/services/api";
import { supabase } from "@/lib/supabase";
import { Spotlight } from "@/components/ui/spotlight";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  MapPin, 
  Phone, 
  User, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  Mail, 
  Hash, 
  CheckCircle2, 
  Smartphone,
  Store
} from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 350, damping: 25 } },
} as const;

export default function OnboardingPerfil() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [step, setStep] = useState<"form" | "provisioning">("form");
  const [provisionStep, setProvisionStep] = useState(0);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    razao_social: "",
    nome_responsavel: "",
    responsible_cpf: "",
    phone: "",
    email: "",
    cep: "",
    address: "",
    neighborhood: "",
    city_name: "",
    state: "",
  });

  // Preenche dados básicos vindos do login/cadastro
  useEffect(() => {
    async function loadPreFill() {
      try {
        // Aguarda a sessão estar disponível com retries para evitar race condition na inicialização do Supabase
        let session = null;
        for (let i = 0; i < 5; i++) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            session = sessionData.session;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        if (!session) {
          // Sem sessão ativa após retentativas — redireciona para o login
          router.push("/login");
          return;
        }
        
        const prefill = await pharmacyApi.getPreFillData();
        if (prefill) {
          setFormData((prev) => ({
            ...prev,
            name: prefill.name || "",
            nome_responsavel: prefill.nome_responsavel || "",
            email: prefill.email || "",
            razao_social: prefill.name || prefill.nome_responsavel || "", // Fallback
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar dados pré-onboarding:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPreFill();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep("provisioning");
    setFinalizing(true);
    setError("");

    // Simulação visual de etapas de provisionamento técnico para dar sensação premium
    const steps = [
      "Criando instância Evolution API Go...",
      "Gerando chaves de segurança encriptadas...",
      "Sincronizando webhook de triagem de sintomas...",
      "Salvando dados comerciais e ativando painel...",
    ];

    for (let i = 0; i < steps.length; i++) {
      setProvisionStep(i);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    try {
      await pharmacyApi.finalizeOnboarding(formData);
      router.push("/dashboard?welcome=true");
    } catch (err: any) {
      console.error("Erro ao finalizar onboarding:", err);
      setError(err.message || "Erro de rede ao provisionar sua farmácia.");
      setStep("form");
      setFinalizing(false);
    }
  };

  const provisionLogs = [
    "Criando instância Evolution API Go...",
    "Gerando chaves de segurança encriptadas...",
    "Sincronizando webhook de triagem de sintomas...",
    "Salvando dados comerciais e ativando painel...",
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center text-slate-400">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-rose-500 animate-spin mx-auto" />
          <p className="text-sm">Iniciando assistente de configuração...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg py-16 px-4 relative overflow-hidden bg-grid-white/[0.02] flex items-center justify-center">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#f43f5e" />
      
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-3xl relative z-10">
        <AnimatePresence mode="wait">
          {step === "form" ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="glass-window p-8 md:p-12 rounded-[2.5rem] space-y-8 border border-white/5 bg-black/40 backdrop-blur-xl"
            >
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-4 h-4" /> Configuração Obrigatória
                </div>
                <h1 className="text-4xl font-black text-white font-heading uppercase tracking-tighter">
                  Completar <span className="text-gradient-medical">Cadastro</span>
                </h1>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  Insira os dados comerciais para ativarmos o seu painel e criarmos sua instância dedicada do robô.
                </p>
              </div>

              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm text-center font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Seção Identificação */}
                <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-rose-500" /> 1. Identificação da Farmácia
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase ml-2 block mb-2">Nome Fantasia (Comercial)</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full bg-s2 border border-white/10 rounded-2xl py-3.5 pl-10 pr-4 text-white focus:outline-none focus:border-rose-500/50 focus:bg-white/5 transition-all text-sm"
                          placeholder="Ex: Farmácia Popular"
                          required
                        />
                        <Store className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase ml-2 block mb-2">Razão Social</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="razao_social"
                          value={formData.razao_social}
                          onChange={handleChange}
                          className="w-full bg-s2 border border-white/10 rounded-2xl py-3.5 pl-10 pr-4 text-white focus:outline-none focus:border-rose-500/50 focus:bg-white/5 transition-all text-sm"
                          placeholder="Ex: Ramos Comercial Farmacêutica Ltda"
                          required
                        />
                        <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase ml-2 block mb-2">CNPJ Comercial</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="cnpj"
                          value={formData.cnpj}
                          onChange={handleChange}
                          className="w-full bg-s2 border border-white/10 rounded-2xl py-3.5 pl-10 pr-4 text-white focus:outline-none focus:border-rose-500/50 focus:bg-white/5 transition-all text-sm"
                          placeholder="Ex: 00.000.000/0001-00"
                          required
                        />
                        <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase ml-2 block mb-2">Nome do Responsável</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="nome_responsavel"
                          value={formData.nome_responsavel}
                          onChange={handleChange}
                          className="w-full bg-s2 border border-white/10 rounded-2xl py-3.5 pl-10 pr-4 text-white focus:outline-none focus:border-rose-500/50 focus:bg-white/5 transition-all text-sm"
                          placeholder="Farmacêutico ou Gestor"
                          required
                        />
                        <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase ml-2 block mb-2">CPF do Responsável</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="responsible_cpf"
                          value={formData.responsible_cpf}
                          onChange={handleChange}
                          className="w-full bg-s2 border border-white/10 rounded-2xl py-3.5 pl-10 pr-4 text-white focus:outline-none focus:border-rose-500/50 focus:bg-white/5 transition-all text-sm"
                          placeholder="Apenas números (11 dígitos)"
                          maxLength={11}
                          required
                        />
                        <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Seção Contato */}
                <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 pt-4 border-t border-white/5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-rose-500" /> 2. Canais de Contato
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase ml-2 block mb-2">Celular / WhatsApp Comercial</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full bg-s2 border border-white/10 rounded-2xl py-3.5 pl-10 pr-4 text-white focus:outline-none focus:border-rose-500/50 focus:bg-white/5 transition-all text-sm"
                          placeholder="Ex: (11) 99999-9999"
                          required
                        />
                        <Smartphone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase ml-2 block mb-2">E-mail Comercial</label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full bg-s2 border border-white/10 rounded-2xl py-3.5 pl-10 pr-4 text-white focus:outline-none focus:border-rose-500/50 focus:bg-white/5 transition-all text-sm"
                          placeholder="Ex: contato@farmacia.com"
                          required
                        />
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Seção Localização */}
                <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 pt-4 border-t border-white/5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-rose-500" /> 3. Endereço e Localização
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-2 block mb-2">Endereço Comercial</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full bg-s2 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:border-rose-500/50 focus:bg-white/5 transition-all text-sm"
                        placeholder="Rua, Número, Bloco"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase ml-2 block mb-2">Bairro</label>
                      <input
                        type="text"
                        name="neighborhood"
                        value={formData.neighborhood}
                        onChange={handleChange}
                        className="w-full bg-s2 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:border-rose-500/50 focus:bg-white/5 transition-all text-sm"
                        placeholder="Bairro"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase ml-2 block mb-2">CEP</label>
                      <input
                        type="text"
                        name="cep"
                        value={formData.cep}
                        onChange={handleChange}
                        className="w-full bg-s2 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:border-rose-500/50 focus:bg-white/5 transition-all text-sm"
                        placeholder="00000-000"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase ml-2 block mb-2">Cidade</label>
                      <input
                        type="text"
                        name="city_name"
                        value={formData.city_name}
                        onChange={handleChange}
                        className="w-full bg-s2 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:border-rose-500/50 focus:bg-white/5 transition-all text-sm"
                        placeholder="Cidade"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase ml-2 block mb-2">Estado (UF)</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full bg-s2 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:border-rose-500/50 focus:bg-white/5 transition-all text-sm"
                        placeholder="Ex: SP"
                        maxLength={2}
                        required
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Botão de Envio */}
                <div className="flex justify-end pt-6 border-t border-white/5">
                  <button
                    type="submit"
                    className="px-8 py-4 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-rose-500/20"
                  >
                    ATIVAR MINHA IA & CONTA
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="provisioning"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="glass-window p-8 md:p-12 rounded-[2.5rem] space-y-8 border border-white/5 bg-black/40 backdrop-blur-xl text-center flex flex-col items-center py-16"
            >
              <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-rose-500/10 border-t-rose-500 animate-spin"></div>
                <Smartphone className="w-10 h-10 text-orange-400 animate-pulse" />
              </div>

              <div className="space-y-3 max-w-md">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  Criando seu Espaço Dedicado
                </h2>
                <p className="text-slate-400 text-sm">
                  Por favor, aguarde alguns instantes enquanto configuramos e ativamos os servidores comerciais do seu Agente Autônomo.
                </p>
              </div>

              {/* Console de Log de Provisionamento */}
              <div className="w-full max-w-md bg-black/60 border border-white/10 rounded-2xl p-4 text-xs font-mono text-left space-y-2 text-slate-400">
                {provisionLogs.map((log, index) => {
                  const isDone = index < provisionStep;
                  const isCurrent = index === provisionStep;
                  return (
                    <div key={index} className="flex items-center gap-2">
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-800 shrink-0" />
                      )}
                      <span className={isDone ? "text-slate-400 font-bold" : isCurrent ? "text-white font-bold" : "text-slate-600"}>
                        {log}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
