"use client";

import { useEffect, useState } from "react";
import { pharmacyApi } from "@/services/api";
import { Save, Loader2, Building2, MapPin, User, Mail, Phone, Hash } from "lucide-react";

interface ProfileData {
  name: string;
  razao_social: string;
  cnpj: string;
  address: string;
  neighborhood: string;
  cep: string;
  state: string;
  phone: string;
  email: string;
  nome_responsavel: string;
}

const initialProfile: ProfileData = {
  name: "",
  razao_social: "",
  cnpj: "",
  address: "",
  neighborhood: "",
  cep: "",
  state: "",
  phone: "",
  email: "",
  nome_responsavel: "",
};

export default function ProfileForm() {
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await pharmacyApi.getProfile();
        // Preenche com strings vazias caso venha nulo do banco
        const formattedData: ProfileData = {
          name: data.name || "",
          razao_social: data.razao_social || "",
          cnpj: data.cnpj || "",
          address: data.address || "",
          neighborhood: data.neighborhood || "",
          cep: data.cep || "",
          state: data.state || "",
          phone: data.phone || "",
          email: data.email || "",
          nome_responsavel: data.nome_responsavel || "",
        };
        setProfile(formattedData);
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
        setMessage({ type: "error", text: "Não foi possível carregar os dados do perfil." });
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await pharmacyApi.updateProfile(profile);
      setMessage({ type: "success", text: "Perfil atualizado com sucesso!" });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      console.error("Erro ao salvar perfil:", err);
      setMessage({ type: "error", text: err.message || "Erro ao salvar alterações do perfil." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin mb-2" />
        <p className="text-sm">Carregando dados da farmácia...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Grid de Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bloco Dados Gerais */}
        <div className="space-y-4 md:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-400" /> Identificação Corporativa
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Nome Fantasia</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all"
                placeholder="Ex: Farmácia do Povo"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Razão Social</label>
              <input
                type="text"
                name="razao_social"
                value={profile.razao_social}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all"
                placeholder="Ex: Farmácia Ramos Ltda"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">CNPJ</label>
              <div className="relative">
                <input
                  type="text"
                  name="cnpj"
                  value={profile.cnpj}
                  onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all"
                  placeholder="Ex: 00.000.000/0001-00"
                  required
                />
                <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Nome do Responsável</label>
              <div className="relative">
                <input
                  type="text"
                  name="nome_responsavel"
                  value={profile.nome_responsavel}
                  onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all"
                  placeholder="Nome do Farmacêutico ou Proprietário"
                  required
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* Bloco Contato */}
        <div className="space-y-4 md:col-span-2 pt-4 border-t border-white/5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Phone className="w-4 h-4 text-sky-400" /> Canais de Contato
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">E-mail</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all"
                  placeholder="Ex: contato@farmacia.com"
                  required
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">WhatsApp / Telefone</label>
              <div className="relative">
                <input
                  type="text"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all"
                  placeholder="Ex: (11) 99999-9999"
                  required
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* Bloco Endereço */}
        <div className="space-y-4 md:col-span-2 pt-4 border-t border-white/5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-400" /> Localização
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-2">Endereço Comercial</label>
              <input
                type="text"
                name="address"
                value={profile.address}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all"
                placeholder="Rua, Número, Complemento"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Bairro</label>
              <input
                type="text"
                name="neighborhood"
                value={profile.neighborhood}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all"
                placeholder="Bairro"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">CEP</label>
              <input
                type="text"
                name="cep"
                value={profile.cep}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all"
                placeholder="00000-000"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Estado (UF)</label>
              <input
                type="text"
                name="state"
                value={profile.state}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all"
                placeholder="Ex: SP"
                maxLength={2}
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Botão de Envio */}
      <div className="flex justify-end pt-4 border-t border-white/5">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-black" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 text-black" />
              Salvar Alterações
            </>
          )}
        </button>
      </div>
    </form>
  );
}
