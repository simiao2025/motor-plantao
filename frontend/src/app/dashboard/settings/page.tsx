import QRCodeDisplay from "@/components/QRCodeDisplay";
import { Settings as SettingsIcon, MessageCircle } from "lucide-react";

export default function Settings() {
  return (
    <div className="min-h-screen p-8 space-y-12 max-w-4xl mx-auto">
      <header className="space-y-2">
        <div className="flex items-center gap-3 text-emerald-500">
          <SettingsIcon className="w-6 h-6" />
          <h1 className="text-3xl font-black font-outfit text-white uppercase tracking-tight">Configurações</h1>
        </div>
        <p className="text-slate-400 font-medium">Gerencie sua conexão e parâmetros da IA.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="glass p-8 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">WhatsApp</h2>
            </div>
            
            <p className="text-sm text-slate-400 leading-relaxed">
              Escaneie o QR Code ao lado para conectar seu número à inteligência artificial do Motor de Plantão.
            </p>

            <div className="space-y-4">
              <StatusItem label="Status" value="Aguardando..." />
              <StatusItem label="Instância" value="Ativa" />
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="glass p-12 rounded-[2.5rem] flex flex-col items-center justify-center">
            <QRCodeDisplay />
            <p className="mt-8 text-xs text-slate-500 text-center max-w-[200px]">
              Abra o WhatsApp {">"} Aparelhos Conectados {">"} Conectar um Aparelho
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5">
      <span className="text-xs font-bold text-slate-500 uppercase">{label}</span>
      <span className="text-sm text-white font-medium">{value}</span>
    </div>
  );
}
