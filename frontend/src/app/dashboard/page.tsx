import { Activity, Calendar, MessageSquare, Zap } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen p-8 space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-outfit font-black text-white">Dashboard</h1>
          <p className="text-slate-400">Bem-vindo ao centro de comando da sua farmácia.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-widest">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-2 rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Agente IA Online
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Atendimentos Hoje" value="127" icon={<MessageSquare className="w-5 h-5" />} color="text-blue-400" />
        <StatCard title="Resolutividade IA" value="98.2%" icon={<Zap className="w-5 h-5" />} color="text-yellow-400" />
        <StatCard title="Próximo Plantão" value="12/05" icon={<Calendar className="w-5 h-5" />} color="text-emerald-400" />
        <StatCard title="Uptime Sistema" value="100%" icon={<Activity className="w-5 h-5" />} color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-[2rem] p-8 min-h-[400px]">
          <h2 className="text-xl font-bold text-white mb-6">Volume de Consultas (24h)</h2>
          <div className="flex items-center justify-center h-64 text-slate-500">
            [Gráfico de Área - Em breve]
          </div>
        </div>
        <div className="glass rounded-[2rem] p-8">
          <h2 className="text-xl font-bold text-white mb-6">Status da Instância</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm">WhatsApp</span>
              <span className="text-xs font-bold px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded">CONECTADO</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Instância</span>
              <span className="text-xs text-slate-400">CNPJ_45123...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="glass p-6 rounded-3xl space-y-4 hover:border-emerald-500/30 transition-all group">
      <div className={`p-3 rounded-2xl bg-white/5 w-fit ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-400">{title}</p>
        <p className="text-2xl font-black text-white group-hover:scale-105 transition-transform origin-left">{value}</p>
      </div>
    </div>
  );
}
