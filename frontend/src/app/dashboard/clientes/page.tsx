import { Users } from "lucide-react";

export default function Clientes() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-white font-heading tracking-tighter">
          Base de Clientes
        </h1>
        <p className="text-muted text-sm mt-1">Gerencie os contatos que interagiram com sua farmácia.</p>
      </header>

      <div className="glass-window rounded-[2rem] p-8 min-h-[500px] flex flex-col items-center justify-center text-center border border-dashed border-white/10 bg-white/[0.01]">
        <Users className="w-12 h-12 text-orange-500 mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-white mb-2">Nenhum cliente cadastrado</h2>
        <p className="text-muted max-w-sm">
          Os pacientes são adicionados automaticamente assim que enviam a primeira mensagem no WhatsApp.
        </p>
      </div>
    </div>
  );
}
