"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, 
  Building2, 
  Smartphone, 
  ShieldCheck, 
  Save, 
  Loader2, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Info,
  Sliders,
  KeyRound,
  Layers,
  ShieldAlert
} from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import ProfileForm from "@/components/ProfileForm";
import TeamManagement from "@/components/TeamManagement";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { pharmacyApi } from "@/services/api";
import { supabase } from "@/lib/supabase";

type TabId = "agente" | "perfil" | "whatsapp" | "seguranca";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 350, damping: 25 } },
} as const;

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState<TabId>("agente");
  
  // States para IA / SDR
  const [systemPrompt, setSystemPrompt] = useState("");
  const [ragBase, setRagBase] = useState("");
  const [autoResponse, setAutoResponse] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // States para Canais de WhatsApp (Evolution vs Meta)
  const [whatsappChannel, setWhatsappChannel] = useState("evolution");
  const [metaToken, setMetaToken] = useState("");
  const [metaPhoneNumberId, setMetaPhoneNumberId] = useState("");
  const [metaWabaId, setMetaWabaId] = useState("");

  // States para WhatsApp
  const [profile, setProfile] = useState<any>(null);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [checkingWhatsapp, setCheckingWhatsapp] = useState(false);

  // Papel (Role) do Usuário Logado (RBAC)
  const [currentUserRole, setCurrentUserRole] = useState("salesperson");

  // Carrega as configurações de IA e o Perfil ao iniciar
  const loadAllData = async () => {
    setLoadingSettings(true);
    try {
      // 1. Carrega dados de IA e Canais
      const settings = await pharmacyApi.getSettings();
      setSystemPrompt(settings.system_prompt || "");
      setRagBase(settings.rag_base || "");
      setAutoResponse(settings.auto_response !== false);
      setWhatsappChannel(settings.whatsapp_channel || "evolution");
      setMetaToken(settings.meta_token || "");
      setMetaPhoneNumberId(settings.meta_phone_number_id || "");
      setMetaWabaId(settings.meta_waba_id || "");

      // 2. Carrega Perfil para pegar o CNPJ (Instance Name)
      const prof = await pharmacyApi.getProfile();
      setProfile(prof);

      // 3. Verifica WhatsApp se for Evolution
      if (prof?.cnpj && (settings.whatsapp_channel || "evolution") === "evolution") {
        await checkWhatsappStatus(prof.cnpj);
      }

      // 4. Carrega papel de segurança do usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserRole(user.user_metadata?.role || "salesperson");
      }
    } catch (err) {
      console.error("Erro ao carregar dados de ajustes:", err);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const checkWhatsappStatus = async (cnpj: string) => {
    setCheckingWhatsapp(true);
    try {
      const res = await pharmacyApi.getInstanceStatus(cnpj);
      const state = res?.instance?.state || res?.state;
      if (state === "open" || state === "connected") {
        setWhatsappConnected(true);
      } else {
        setWhatsappConnected(false);
      }
    } catch (err) {
      console.error("Erro ao verificar status do WhatsApp:", err);
      setWhatsappConnected(false);
    } finally {
      setCheckingWhatsapp(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMessage(null);
    try {
      await pharmacyApi.updateSettings({
        system_prompt: systemPrompt,
        rag_base: ragBase,
        auto_response: autoResponse,
        whatsapp_channel: whatsappChannel,
        meta_token: metaToken,
        meta_phone_number_id: metaPhoneNumberId,
        meta_waba_id: metaWabaId
      });
      setSettingsMessage({ type: "success", text: "Ajustes salvos com sucesso no servidor!" });
      setTimeout(() => setSettingsMessage(null), 4000);
    } catch (err: any) {
      console.error("Erro ao salvar configurações:", err);
      setSettingsMessage({ type: "error", text: err.message || "Erro ao salvar configurações no servidor." });
    } finally {
      setSavingSettings(false);
    }
  };

  const tabs = [
    { id: "agente", label: "Agente SDR IA", icon: Bot, color: "text-sky-400" },
    { id: "perfil", label: "Dados da Farmácia", icon: Building2, color: "text-emerald-400" },
    { id: "whatsapp", label: "Conexão WhatsApp", icon: Smartphone, color: "text-orange-400" },
    { id: "seguranca", label: "Membros e Acesso", icon: ShieldCheck, color: "text-rose-400" },
  ];

  // Permissões
  const isSalesperson = currentUserRole === "salesperson";
  const hasSettingsWritePermission = currentUserRole === "owner" || currentUserRole === "manager" || currentUserRole === "admin";

  return (
    <motion.div initial="hidden" animate="show" variants={container} className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <motion.header variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white font-heading tracking-tighter">
            Ajustes do Painel
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Gerencie o comportamento do seu Agente Inteligente, dados comerciais, WhatsApp e credenciais.
          </p>
        </div>
      </motion.header>

      {/* Grid de Configurações */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Sidebar de Navegação de Tabs */}
        <motion.div variants={item} className="md:col-span-1 space-y-2 bg-black/40 border border-white/5 p-4 rounded-3xl backdrop-blur-md">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all relative overflow-hidden ${
                  isActive 
                    ? "bg-white/10 text-white shadow-md border-l-4 border-rose-400 pl-3" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? tab.color : "text-slate-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* Bloco de Conteúdo */}
        <motion.div variants={item} className="md:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === "agente" && (
              <motion.div
                key="agente"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <MagicCard gradientColor="rgba(56, 189, 248, 0.08)" className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400 border border-sky-500/20">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Configurações do Agente IA (SDR)</h2>
                      <p className="text-sm text-slate-400">Instruções principais e base de conhecimento personalizada.</p>
                    </div>
                  </div>

                  {loadingSettings ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <Loader2 className="w-8 h-8 text-sky-400 animate-spin mb-2" />
                      <p className="text-sm">Carregando configurações de IA...</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveSettings} className="space-y-6">
                      {settingsMessage && (
                        <div
                          className={`p-4 rounded-xl border text-sm font-medium ${
                            settingsMessage.type === "success"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                          }`}
                        >
                          {settingsMessage.text}
                        </div>
                      )}

                      <div className="space-y-4">
                        {isSalesperson && (
                          <div className="p-3 bg-white/5 border border-white/5 text-slate-400 text-xs flex items-center gap-2 rounded-xl">
                            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                            Você está logado como Balconista. Edições de inteligência estão bloqueadas.
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Prompt do Sistema (System Prompt)
                          </label>
                          <textarea
                            disabled={isSalesperson}
                            className="w-full h-44 bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none transition-all disabled:opacity-50"
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            placeholder="Defina as regras, tom de voz, persona e objetivos do robô..."
                            required
                          ></textarea>
                          <p className="text-xs text-slate-500 mt-2 flex items-start gap-1">
                            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            Esta é a diretriz mestre que o robô de atendimento seguirá. Descreva a persona da farmácia, restrições e comportamento humano/empático.
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Base de Conhecimento RAG (Texto Livre)
                          </label>
                          <textarea
                            disabled={isSalesperson}
                            className="w-full h-48 bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none transition-all disabled:opacity-50"
                            value={ragBase}
                            onChange={(e) => setRagBase(e.target.value)}
                            placeholder="Insira informações específicas da sua farmácia: promoções ativas, horários de funcionamento, serviços de saúde, endereços, links úteis, listas de produtos comuns, etc."
                          ></textarea>
                          <p className="text-xs text-slate-500 mt-2 flex items-start gap-1">
                            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            A Base RAG permite alimentar a inteligência com o estoque de ofertas e as informações exclusivas da sua loja. O robô lerá este bloco antes de responder aos pacientes!
                          </p>
                        </div>

                        {/* Toggle de Auto-resposta ocultado/bloqueado se balconista */}
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-white">Robô de Respostas Ativo</h3>
                            <p className="text-xs text-slate-400">Permitir que a IA responda os leads autonomamente.</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              disabled={isSalesperson}
                              type="checkbox"
                              checked={autoResponse}
                              onChange={(e) => setAutoResponse(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                          </label>
                        </div>
                      </div>

                      {hasSettingsWritePermission && (
                        <div className="flex justify-end pt-4 border-t border-white/5">
                          <button
                            type="submit"
                            disabled={savingSettings}
                            className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
                          >
                            {savingSettings ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin text-black" />
                                Salvando...
                              </>
                            ) : (
                              <>
                                <Save className="w-5 h-5 text-black" />
                                Salvar Ajustes IA
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </form>
                  )}
                </MagicCard>
              </motion.div>
            )}

            {activeTab === "perfil" && (
              <motion.div
                key="perfil"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <MagicCard gradientColor="rgba(16, 185, 129, 0.08)" className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Perfil Comercial da Farmácia</h2>
                      <p className="text-sm text-slate-400">Gerencie a identificação, contatos e endereço do estabelecimento.</p>
                    </div>
                  </div>

                  <ProfileForm />
                </MagicCard>
              </motion.div>
            )}

            {activeTab === "whatsapp" && (
              <motion.div
                key="whatsapp"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <MagicCard gradientColor="rgba(249, 115, 22, 0.08)" className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400 border border-orange-500/20">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Configurar Canal WhatsApp</h2>
                        <p className="text-sm text-slate-400">Escolha o método de conexão de mensagens do seu Agente.</p>
                      </div>
                    </div>
                  </div>

                  {settingsMessage && (
                    <div
                      className={`p-4 rounded-xl border text-sm font-medium mb-6 ${
                        settingsMessage.type === "success"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                      }`}
                    >
                      {settingsMessage.text}
                    </div>
                  )}

                  {/* Switcher de Canais WhatsApp */}
                  <div className="grid grid-cols-2 gap-4 bg-white/5 border border-white/10 p-2 rounded-2xl mb-8">
                    <button
                      disabled={isSalesperson}
                      onClick={() => setWhatsappChannel("evolution")}
                      className={`py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                        whatsappChannel === "evolution"
                          ? "bg-white/10 text-white shadow-md"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-orange-400" /> WhatsApp Web (Evolution)
                    </button>
                    <button
                      disabled={isSalesperson}
                      onClick={() => setWhatsappChannel("meta")}
                      className={`py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                        whatsappChannel === "meta"
                          ? "bg-white/10 text-white shadow-md"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                      }`}
                    >
                      <Layers className="w-4 h-4 text-sky-400" /> API Oficial (Meta)
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {whatsappChannel === "evolution" ? (
                      /* CONEXÃO EVOLUTION API */
                      <motion.div
                        key="evolution"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-6"
                      >
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                          <span className="text-sm font-bold text-white flex items-center gap-2">
                            <Info className="w-4 h-4 text-orange-400" /> Integração via QR Code ativo
                          </span>
                          {profile?.cnpj && (
                            <button
                              onClick={() => checkWhatsappStatus(profile.cnpj)}
                              disabled={checkingWhatsapp}
                              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 transition-all disabled:opacity-50"
                            >
                              <RefreshCw className={`w-4 h-4 ${checkingWhatsapp ? "animate-spin" : ""}`} />
                            </button>
                          )}
                        </div>

                        {checkingWhatsapp && !profile ? (
                          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Loader2 className="w-8 h-8 text-orange-400 animate-spin mb-2" />
                            <p className="text-sm">Buscando dados da instância comercial...</p>
                          </div>
                        ) : whatsappConnected ? (
                          <div className="space-y-6">
                            <div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center text-center gap-4 animate-fadeIn">
                              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                                <CheckCircle2 className="w-8 h-8" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase block mb-1">
                                  Aparelho Conectado e Ativo
                                </span>
                                <h3 className="text-lg font-bold text-white">{profile?.name || "Instância WhatsApp"}</h3>
                                <p className="text-sm text-slate-400 mt-2 max-w-sm">
                                  Sua integração está ativa e os webhooks de entrada estão configurados. O Agente SDR está pronto para conversar no WhatsApp!
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-500 text-sm flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold block">Aparelho Desconectado</span>
                                <span className="text-xs text-amber-500/85">
                                  O bot de atendimento está inativo no momento. Escaneie o QR Code abaixo com o WhatsApp do celular do plantão comercial para conectar a instância do Agente Autônomo.
                                </span>
                              </div>
                            </div>

                            <QRCodeDisplay 
                              instanceName={profile?.cnpj} 
                              onConnected={() => setWhatsappConnected(true)} 
                            />
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      /* CONEXÃO META API OFICIAL */
                      <motion.div
                        key="meta"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-6"
                      >
                        <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm flex items-start gap-3">
                          <Sliders className="w-5 h-5 shrink-0 mt-0.5 text-sky-400" />
                          <div>
                            <span className="font-bold block">WhatsApp Oficial (Meta Cloud API)</span>
                            <span className="text-xs text-sky-400/85">
                              Esta opção utiliza a infraestrutura em nuvem oficial da Meta. Insira as credenciais do seu aplicativo desenvolvedor no formulário abaixo para ativá-lo.
                            </span>
                          </div>
                        </div>

                        <form onSubmit={handleSaveSettings} className="space-y-6">
                          <div className="grid grid-cols-1 gap-6">
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-2">
                                Token de Acesso Permanente (Access Token)
                              </label>
                              <div className="relative">
                                <input
                                  disabled={isSalesperson}
                                  type="password"
                                  value={metaToken}
                                  onChange={(e) => setMetaToken(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all font-mono disabled:opacity-50"
                                  placeholder="EAABw..."
                                  required
                                />
                                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">
                                  ID do Número de Telefone (Phone Number ID)
                                </label>
                                <input
                                  disabled={isSalesperson}
                                  type="text"
                                  value={metaPhoneNumberId}
                                  onChange={(e) => setMetaPhoneNumberId(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all font-mono disabled:opacity-50"
                                  placeholder="Digite o ID do Número"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">
                                  ID da Conta WhatsApp Business (WABA ID)
                                </label>
                                <input
                                  disabled={isSalesperson}
                                  type="text"
                                  value={metaWabaId}
                                  onChange={(e) => setMetaWabaId(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all font-mono disabled:opacity-50"
                                  placeholder="Digite o ID WABA"
                                  required
                                />
                              </div>
                            </div>
                          </div>

                          {hasSettingsWritePermission && (
                            <div className="flex justify-end pt-4 border-t border-white/5">
                              <button
                                type="submit"
                                disabled={savingSettings}
                                className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_4px_20px_rgba(56,189,248,0.2)]"
                              >
                                {savingSettings ? (
                                  <>
                                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                                    Salvando...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-5 h-5 text-white" />
                                    Salvar Integração Meta
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </MagicCard>
              </motion.div>
            )}

            {activeTab === "seguranca" && (
              <motion.div
                key="seguranca"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <MagicCard gradientColor="rgba(244, 63, 94, 0.08)" className="p-8">
                  <TeamManagement />
                </MagicCard>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
