import { ShieldPlus } from "lucide-react";

export default function Plantao() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-white font-heading tracking-tighter">
          Escala de Plantões
        </h1>
        <p className="text-muted text-sm mt-1">Organize as datas e horários de plantão da sua farmácia.</p>
      </header>

      <div className="glass-window rounded-[2rem] p-8 min-h-[500px] flex flex-col items-center justify-center text-center border border-dashed border-white/10 bg-white/[0.01]">
        <ShieldPlus className="w-12 h-12 text-green-500 mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-white mb-2">Calendário Vazio</h2>
        <p className="text-muted max-w-sm">
          Configure a sua escala para que a IA informe corretamente os dias de funcionamento 24h aos clientes.
        </p>
      </div>
    </div>
  );
}
