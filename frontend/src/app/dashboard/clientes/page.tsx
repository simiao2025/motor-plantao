"use client";

import CRMBoard from "@/components/crm/CRMBoard";

export default function Clientes() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-white font-heading tracking-tighter">
          CRM de Atendimentos
        </h1>
        <p className="text-muted text-sm mt-1">Gerencie e acompanhe o relacionamento e funil de vendas com seus pacientes.</p>
      </header>

      {/* Kanban Board do CRM */}
      <CRMBoard />
    </div>
  );
}
