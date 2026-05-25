import { Activity } from "lucide-react";

export default function Triagens() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-white font-heading tracking-tighter">
          Triagens e Consultas
        </h1>
        <p className="text-muted text-sm mt-1">Histórico de conversas processadas pela IA.</p>
      </header>

      <div className="glass-window rounded-[2rem] p-8 min-h-[500px] flex flex-col items-center justify-center text-center border border-dashed border-white/10 bg-white/[0.01]">
        <Activity className="w-12 h-12 text-rose-500 mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-white mb-2">Nenhuma triagem recente</h2>
        <p className="text-muted max-w-sm">
          Quando a inteligência artificial atender pacientes no WhatsApp, o histórico e a classificação de risco aparecerão aqui.
        </p>
      </div>
    </div>
  );
}
