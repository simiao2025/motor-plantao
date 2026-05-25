import Link from "next/link";
import { ArrowRight, Bot, Shield, Zap } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-bg relative overflow-hidden flex flex-col items-center justify-center pt-20 pb-16 px-4 bg-grid-white/[0.02]">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#f43f5e" />
      
      {/* Background Glows */}
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-500/10 blur-[120px] rounded-full"></div>

      <div className="relative z-10 w-full max-w-5xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-rose-400 text-sm font-medium mb-4 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-2 rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          Motor de IA V2.0 Lançado
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white font-heading tracking-tighter uppercase leading-tight">
          A Revolução no Atendimento <br className="hidden md:block" />
          <span className="text-gradient-medical">da sua Farmácia</span>
        </h1>

        <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto font-medium">
          Automatize a triagem, resolva dúvidas e direcione seus pacientes para a unidade certa 24 horas por dia com nossa Inteligência Artificial integrada ao WhatsApp.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-black rounded-full transition-all flex items-center justify-center gap-2 group shadow-lg shadow-rose-500/25">
            COMEÇAR AGORA
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-full transition-all flex items-center justify-center gap-2">
            ACESSAR PAINEL
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-24">
          <FeatureCard 
            icon={<Bot className="w-6 h-6 text-rose-500" />}
            title="IA Treinada"
            description="Modelo ajustado com protocolos farmacêuticos para triagem segura."
          />
          <FeatureCard 
            icon={<Zap className="w-6 h-6 text-orange-500" />}
            title="Resposta em Segundos"
            description="Atenda múltiplos pacientes simultaneamente sem tempo de espera."
          />
          <FeatureCard 
            icon={<Shield className="w-6 h-6 text-rose-500" />}
            title="Segurança de Dados"
            description="Criptografia ponta-a-ponta e conformidade com LGPD."
          />
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-window p-6 rounded-3xl text-left border border-white/5 bg-black/20 hover:bg-black/40 transition-colors">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/5">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-muted">{description}</p>
    </div>
  );
}
