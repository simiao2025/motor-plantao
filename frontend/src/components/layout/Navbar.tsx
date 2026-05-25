import { Bell, Menu, Search, UserCircle } from "lucide-react";

export function Navbar() {
  return (
    <header className="h-20 border-b border-white/5 bg-bg/80 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-muted hover:text-white transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden md:flex items-center gap-2 bg-s2/50 border border-white/5 rounded-full px-4 py-2 w-64 focus-within:border-rose-500/50 focus-within:bg-s2 transition-all">
          <Search className="w-4 h-4 text-muted" />
          <input 
            type="text" 
            placeholder="Buscar paciente ou triagem..." 
            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-muted"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative text-muted hover:text-white transition-colors p-2 rounded-full hover:bg-white/5">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-bg"></span>
        </button>
        
        <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
        
        <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white">Dr. Admin</p>
            <p className="text-xs text-muted">Gestor</p>
          </div>
          <UserCircle className="w-9 h-9 text-rose-500" />
        </button>
      </div>
    </header>
  );
}
