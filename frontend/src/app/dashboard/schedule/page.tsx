import { Calendar as CalendarIcon, Clock, Plus, CheckCircle2 } from "lucide-react";

export default function Schedule() {
  const upcomingDuties = [
    { date: "12 de Maio", city: "Itajaí", status: "Confirmado" },
    { date: "19 de Maio", city: "Itajaí", status: "Pendente" },
    { date: "26 de Maio", city: "Itajaí", status: "Pendente" },
  ];

  return (
    <div className="min-h-screen p-8 space-y-12 max-w-5xl mx-auto">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-emerald-500">
            <CalendarIcon className="w-6 h-6" />
            <h1 className="text-3xl font-black font-outfit text-white uppercase tracking-tight">Escala de Plantão</h1>
          </div>
          <p className="text-slate-400 font-medium">Gerencie suas datas de plantão na cidade.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-dark font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20">
          <Plus className="w-5 h-5" />
          SOLICITAR DATA
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest ml-4">Próximas Datas</h2>
          {upcomingDuties.map((duty, i) => (
            <div key={i} className="glass p-6 rounded-[2rem] flex items-center justify-between group hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-6">
                <div className="p-4 rounded-2xl bg-white/5 text-emerald-500 group-hover:scale-110 transition-transform">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{duty.date}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> 08:00 - 08:00 (24h)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-4 py-2 rounded-xl text-xs font-bold ${
                  duty.status === "Confirmado" ? "bg-emerald-500/10 text-emerald-500" : "bg-yellow-500/10 text-yellow-500"
                }`}>
                  {duty.status.toUpperCase()}
                </span>
                {duty.status === "Confirmado" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="glass p-8 rounded-[2.5rem] bg-emerald-500/5 border-emerald-500/20">
            <h3 className="text-lg font-bold text-white mb-4">Regras do Plantão</h3>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                Trocas devem ser solicitadas com 48h de antecedência.
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                O Agente de IA começará a direcionar às 08h do dia escalado.
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                Certifique-se de que seu WhatsApp está conectado.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
