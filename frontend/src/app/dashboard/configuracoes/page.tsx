import { Settings } from "lucide-react";

export default function Configuracoes() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-white font-heading tracking-tighter">
          Ajustes do Sistema
        </h1>
        <p className="text-muted text-sm mt-1">Configure o perfil da sua farmácia, instâncias e regras da IA.</p>
      </header>

      <div className="glass-window rounded-[2rem] p-8 min-h-[500px] flex flex-col items-center justify-center text-center border border-dashed border-white/10 bg-white/[0.01]">
        <Settings className="w-12 h-12 text-blue-500 mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-white mb-2">Em Construção</h2>
        <p className="text-muted max-w-sm">
          A tela de configurações avançadas (Integração WhatsApp, Prompts da IA e Billing) está sendo finalizada.
        </p>
      </div>
    </div>
  );
}
