import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg text-white font-sans flex">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen bg-grid-white/[0.02]">
        <Navbar />
        <main className="flex-1 p-8 overflow-x-hidden relative">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/10 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
