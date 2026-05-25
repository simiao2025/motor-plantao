"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pharmacyApi } from "@/services/api";
import { Building2, MapPin, Hash, ArrowRight, Loader2 } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    cnpj: "",
    name: "",
    city_id: "7b1373e2-8b65-424b-b0b3-f0a9a4b3b2b1",
    address: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await pharmacyApi.register(formData);
      router.push("/dashboard?welcome=true");
    } catch (err: any) {
      setError(err.message || "Erro ao registrar farmácia.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden bg-grid-white/[0.02]">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#f43f5e" />
      
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-xl glass-window p-8 md:p-12 rounded-[2.5rem] space-y-8 relative z-10 border border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-white font-heading uppercase tracking-tighter">
            Configurar <span className="text-gradient-medical">Farmácia</span>
          </h1>
          <p className="text-muted">Complete os dados para ativar sua IA de plantão.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <InputField 
              label="CNPJ da Farmácia" 
              placeholder="00.000.000/0000-00" 
              icon={<Hash className="w-5 h-5" />}
              value={formData.cnpj}
              onChange={(v: string) => setFormData({...formData, cnpj: v.replace(/\D/g, "")})}
            />
            <InputField 
              label="Nome Comercial" 
              placeholder="Ex: Farmácia São João" 
              icon={<Building2 className="w-5 h-5" />}
              value={formData.name}
              onChange={(v: string) => setFormData({...formData, name: v})}
            />
            <InputField 
              label="Endereço Completo" 
              placeholder="Rua, Número, Bairro" 
              icon={<MapPin className="w-5 h-5" />}
              value={formData.address}
              onChange={(v: string) => setFormData({...formData, address: v})}
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
                SALVAR E CONTINUAR
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

interface InputFieldProps {
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
}

function InputField({ label, placeholder, icon, value, onChange }: InputFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-muted uppercase ml-2">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-rose-500 transition-colors">
          {icon}
        </div>
        <input
          type="text"
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
