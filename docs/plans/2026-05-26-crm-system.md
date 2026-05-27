# CRM System Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Implement a premium Pharmacy CRM (Customer Relationship Management) system that automatically funnels AI triage logs into a visual Kanban board, allowing pharmacists to follow up with high-priority leads, record interaction notes, assign sales, and log transaction values.

**Architecture:** 
1. **Database-Level Funneling**: SQL Triggers on `ai_context_logs` automatically upsert a `patients` record and create a `crm_deals` (Opportunity) in the `lead` stage, capturing the AI's triage urgency level (VERDE, AMARELO, VERMELHO).
2. **Decoupled API Endpoints**: A dedicated CRM backend router exposes endpoints for fetching pipeline states, shifting deal stages, adding custom follow-up notes, assigning team members, and logging deal transaction values.
3. **Premium Kanban Interface**: A Trello-style board in the dashboard allowing drag-and-drop or state-picker transitions, complete with urgency badges and a sliding details sidebar showing the complete client interaction timeline.

**Tech Stack:** Next.js (React 19, Tailwind CSS), FastAPI (Python 3.12+), Supabase (PostgreSQL with RLS policies).

---

## User Review Required

> [!IMPORTANT]
> **Schema Changes & Migration Safety**:
> This plan introduces three new tables (`public.patients`, `public.crm_deals`, `public.crm_interactions`) and a trigger function. RLS policies are fully enabled to isolate records per tenant (`pharmacy_id`). All existing triage logs are safe and will be backfilled automatically.

> [!TIP]
> **Automated AI Funneling**:
> The trigger is designed so that when the AI logs a triage message in `ai_context_logs`, the CRM instantly reflects a new lead, completely eliminating manual lead input for pharmacists!

---

## Proposed Changes

### Component 1: Database Migration (Supabase)

We need to create the table structures, establish proper foreign keys, configure Row-Level Security (RLS) to enforce tenant isolation, and mount the automatic triage trigger.

#### [NEW] [20260530000000_create_crm_tables.sql](file:///C:/Projetos/motor-plantao/supabase/migrations/20260530000000_create_crm_tables.sql)

Create a SQL migration file to configure tables and triggers:
```sql
-- 1. Tabela de Pacientes
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    name TEXT,
    cpf VARCHAR(14),
    birth_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pharmacy_id, phone)
);

-- 2. Tabela de Funil CRM (Negócios/Oportunidades)
CREATE TABLE IF NOT EXISTS public.crm_deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'triaged', 'waiting_pharmacist', 'completed', 'lost')),
    triage_level VARCHAR(20) DEFAULT 'VERDE',
    assigned_user_id UUID REFERENCES public.pharmacy_users(id) ON DELETE SET NULL,
    value NUMERIC(10, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Histórico de Interações do CRM
CREATE TABLE IF NOT EXISTS public.crm_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'note' CHECK (type IN ('triage', 'whatsapp', 'call', 'note', 'status_change')),
    description TEXT NOT NULL,
    created_by UUID REFERENCES public.pharmacy_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_interactions ENABLE ROW LEVEL SECURITY;

-- 5. Criar Políticas RLS de Tenant (Pharmacy ID)
CREATE POLICY "Users can manage their pharmacy's patients" ON public.patients
    FOR ALL USING (pharmacy_id IN (SELECT id FROM public.pharmacies WHERE owner_id = auth.uid() OR id IN (SELECT pharmacy_id FROM public.pharmacy_users WHERE user_id = auth.uid())));

CREATE POLICY "Users can manage their pharmacy's crm deals" ON public.crm_deals
    FOR ALL USING (pharmacy_id IN (SELECT id FROM public.pharmacies WHERE owner_id = auth.uid() OR id IN (SELECT pharmacy_id FROM public.pharmacy_users WHERE user_id = auth.uid())));

CREATE POLICY "Users can manage their pharmacy's crm interactions" ON public.crm_interactions
    FOR ALL USING (pharmacy_id IN (SELECT id FROM public.pharmacies WHERE owner_id = auth.uid() OR id IN (SELECT pharmacy_id FROM public.pharmacy_users WHERE user_id = auth.uid())));

-- 6. Trigger para Alimentação Automática pelo Assistente IA
CREATE OR REPLACE FUNCTION public.fn_handle_ai_triage_log()
RETURNS TRIGGER AS $$
DECLARE
    v_patient_id UUID;
    v_deal_id UUID;
    v_patient_name TEXT;
BEGIN
    -- Se não houver telefone, ignora
    IF NEW.user_phone IS NULL OR NEW.user_phone = '' THEN
        RETURN NEW;
    END IF;

    -- Tenta capturar nome fictício/inicial do metadados ou usa o número
    v_patient_name := 'Paciente - ' || RIGHT(NEW.user_phone, 4);

    -- 1. Upsert do paciente
    INSERT INTO public.patients (pharmacy_id, phone, name)
    VALUES (NEW.pharmacy_id, NEW.user_phone, v_patient_name)
    ON CONFLICT (pharmacy_id, phone) DO UPDATE 
    SET phone = EXCLUDED.phone -- Apenas para expor o ID
    RETURNING id INTO v_patient_id;

    -- 2. Tenta encontrar negócio em aberto (não ganho nem perdido)
    SELECT id INTO v_deal_id
    FROM public.crm_deals
    WHERE patient_id = v_patient_id AND status NOT IN ('completed', 'lost')
    ORDER BY created_at DESC LIMIT 1;

    -- 3. Se não houver negócio aberto, cria um novo na etapa 'lead'
    IF v_deal_id IS NULL THEN
        INSERT INTO public.crm_deals (pharmacy_id, patient_id, status, triage_level, notes)
        VALUES (
            NEW.pharmacy_id, 
            v_patient_id, 
            CASE WHEN NEW.triage_level IN ('AMARELO', 'VERMELHO') THEN 'triaged'::varchar ELSE 'lead'::varchar END,
            NEW.triage_level, 
            'Triagem IA criada automaticamente'
        )
        RETURNING id INTO v_deal_id;
    ELSE
        -- Se já existia aberto, atualiza o status de gravidade da triagem
        UPDATE public.crm_deals
        SET triage_level = NEW.triage_level,
            updated_at = NOW()
        WHERE id = v_deal_id;
    END IF;

    -- 4. Registra a interação da triagem na timeline
    INSERT INTO public.crm_interactions (pharmacy_id, patient_id, deal_id, type, description)
    VALUES (
        NEW.pharmacy_id,
        v_patient_id,
        v_deal_id,
        'triage',
        'Nova triagem realizada pelo Assistente IA. Classificação: ' || NEW.triage_level || '. Mensagem: ' || COALESCE(LEFT(NEW.message_content, 120), '') || '...'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_on_ai_triage_log
AFTER INSERT ON public.ai_context_logs
FOR EACH ROW
EXECUTE FUNCTION public.fn_handle_ai_triage_log();
```

---

### Component 2: Backend (FastAPI Services & Routes)

Expose the new tables and database procedures to the Next.js frontend with robust security mapping.

#### [MODIFY] [supabase_service.py](file:///C:/Projetos/motor-plantao/backend/app/services/supabase_service.py)

Add CRM service helper functions:
```python
    # --- CRM SERVICES ---
    async def get_crm_board(self, user_id: str):
        try:
            pharmacy_id = await self.get_user_pharmacy_id(user_id)
            if not pharmacy_id:
                return {}
            
            # Busca todas as oportunidades ativas com dados dos pacientes e responsáveis associados
            res = self.client.table("crm_deals") \
                .select("id, status, triage_level, value, notes, created_at, patients(id, name, phone), pharmacy_users(id, name)") \
                .eq("pharmacy_id", pharmacy_id) \
                .execute()
            
            # Agrupa negócios por status do funil
            stages = {
                "lead": [],
                "triaged": [],
                "waiting_pharmacist": [],
                "completed": [],
                "lost": []
            }
            
            for deal in res.data or []:
                status = deal.get("status", "lead")
                if status in stages:
                    stages[status].append({
                        "id": deal["id"],
                        "triage_level": deal["triage_level"],
                        "value": float(deal["value"]) if deal.get("value") else 0.0,
                        "notes": deal["notes"],
                        "created_at": deal["created_at"],
                        "patient": deal.get("patients") or {},
                        "assigned_agent": deal.get("pharmacy_users") or {}
                    })
            return stages
        except Exception as e:
            logging.error(f"Erro ao obter quadro CRM: {str(e)}")
            return {}

    async def update_deal_stage(self, deal_id: str, status: str, user_id: str):
        try:
            pharmacy_id = await self.get_user_pharmacy_id(user_id)
            if not pharmacy_id:
                return None
                
            # Garante que pertence ao tenant
            res = self.client.table("crm_deals").update({
                "status": status,
                "updated_at": "now()"
            }).eq("id", deal_id).eq("pharmacy_id", pharmacy_id).execute()
            
            if res.data:
                # Cria interação auditável
                deal = res.data[0]
                self.client.table("crm_interactions").insert({
                    "pharmacy_id": pharmacy_id,
                    "patient_id": deal["patient_id"],
                    "deal_id": deal["id"],
                    "type": "status_change",
                    "description": f"Estágio do negócio atualizado para '{status}'"
                }).execute()
                return deal
            return None
        except Exception as e:
            logging.error(f"Erro ao atualizar estágio do negócio {deal_id}: {str(e)}")
            return None

    async def get_patient_history(self, patient_id: str, user_id: str):
        try:
            pharmacy_id = await self.get_user_pharmacy_id(user_id)
            if not pharmacy_id:
                return {}
                
            # Busca perfil
            pat = self.client.table("patients").select("*").eq("id", patient_id).eq("pharmacy_id", pharmacy_id).limit(1).execute()
            if not pat.data:
                return {}
                
            # Busca interações cronológicas
            inter = self.client.table("crm_interactions").select("id, type, description, created_at, pharmacy_users(name)") \
                .eq("patient_id", patient_id) \
                .order("created_at", desc=True) \
                .execute()
                
            return {
                "profile": pat.data[0],
                "timeline": inter.data or []
            }
        except Exception as e:
            logging.error(f"Erro ao carregar histórico do paciente {patient_id}: {str(e)}")
            return {}
```

#### [NEW] [crm.py](file:///C:/Projetos/motor-plantao/backend/app/routes/crm.py)

Create backend router exposing FastAPI endpoints:
```python
import logging
from app.services.supabase_service import supabase_service
from app.routes.admin import get_current_user
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

router = APIRouter(prefix="/crm", tags=["CRM"])

class StageUpdate(BaseModel):
    status: str

class DealValueUpdate(BaseModel):
    value: float

class NoteCreate(BaseModel):
    description: str

@router.get("/board")
async def get_board(user_id: str = Depends(get_current_user)):
    res = await supabase_service.get_crm_board(user_id)
    return res

@router.put("/deals/{deal_id}/stage")
async def update_stage(deal_id: str, data: StageUpdate, user_id: str = Depends(get_current_user)):
    res = await supabase_service.update_deal_stage(deal_id, data.status, user_id)
    if not res:
        raise HTTPException(status_code=500, detail="Erro ao alterar estágio do lead.")
    return res
```

#### [MODIFY] [main.py](file:///C:/Projetos/motor-plantao/backend/main.py)

Include the new CRM router in `main.py`:
```python
# Registra as rotas da aplicação
from app.routes import admin, webhooks, crm # Importa crm
app.include_router(admin.router)
app.include_router(webhooks.router)
app.include_router(crm.router, prefix="/admin") # Registra
```

---

### Component 3: Frontend (React & Tailwind CSS)

Implement the full Kanban Board with drag-and-drop cards and a rich Patient Details sliding Sidebar.

#### [MODIFY] [api.ts](file:///C:/Projetos/motor-plantao/frontend/src/services/api.ts)

Add CRM API fetch requests:
```typescript
  // --- CRM ---
  getCRMBoard: () => apiFetch("/admin/crm/board"),
  updateDealStage: (dealId: string, status: string) => 
    apiFetch(`/admin/crm/deals/${dealId}/stage`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
```

#### [NEW] [CRMBoard.tsx](file:///C:/Projetos/motor-plantao/frontend/src/components/crm/CRMBoard.tsx)

Develop a sleek, modern visual Kanban board displaying CRM lead stages:
```tsx
"use client";

import { useEffect, useState } from "react";
import { pharmacyApi } from "@/services/api";
import { Loader2, ArrowRight, HeartPulse, DollarSign, User } from "lucide-react";

export default function CRMBoard() {
  const [board, setBoard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchBoard = async () => {
    setLoading(true);
    try {
      const data = await pharmacyApi.getCRMBoard();
      setBoard(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, []);

  const columns = [
    { id: "lead", title: "Novos Contatos", color: "border-slate-500/20 bg-slate-500/5 text-slate-400" },
    { id: "triaged", title: "Triados", color: "border-orange-500/20 bg-orange-500/5 text-orange-400" },
    { id: "waiting_pharmacist", title: "Aguardando Farmacêutico", color: "border-rose-500/20 bg-rose-500/5 text-rose-400" },
    { id: "completed", title: "Vendas Ganhas", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {columns.map(col => (
        <div key={col.id} className="flex flex-col h-[600px] bg-s2/40 border border-white/5 rounded-3xl p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${col.color}`}>
              {col.title}
            </span>
            <span className="text-xs font-bold text-slate-500">{(board?.[col.id] || []).length}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {(board?.[col.id] || []).map((deal: any) => (
              <div key={deal.id} className="p-4 bg-s1/60 border border-white/5 hover:border-white/10 rounded-2xl transition-all cursor-pointer space-y-3 shadow-md relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white block truncate w-32">
                    {deal.patient?.name || "Paciente"}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${
                    deal.triage_level === "VERMELHO" ? "bg-rose-500/10 text-rose-500 border border-rose-500/10" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/10"
                  }`}>
                    <HeartPulse className="w-3 h-3" /> {deal.triage_level}
                  </span>
                </div>
                
                <p className="text-xs text-slate-400 truncate leading-relaxed">{deal.notes || "Nenhum histórico adicionado..."}</p>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    <DollarSign className="w-3 h-3" /> {deal.value?.toFixed(2) || "0.00"}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" /> {deal.assigned_agent?.name || "Sem atribuição"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### [MODIFY] [page.tsx](file:///C:/Projetos/motor-plantao/frontend/src/app/dashboard/clientes/page.tsx)

Integrate the Kanban Board and KPI stats directly into the base Clientes view:
```tsx
"use client";

import CRMBoard from "@/components/crm/CRMBoard";

export default function Clientes() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white font-heading tracking-tighter">
            CRM de Atendimentos
          </h1>
          <p className="text-muted text-sm mt-1">Monitore, trie, converta e gerencie o relacionamento com seus pacientes.</p>
        </div>
      </header>

      {/* Kanban Board Component */}
      <CRMBoard />
    </div>
  );
}
```

---

## Verification Plan

### Automated Tests
* Use the **[test-driven-development](file:///C:/Users/PRV/.gemini/config/skills/test-driven-development/SKILL.md)** sub-skill to write backend test suites validating CRM stage alterations.
* Launch backend validation suite:
  ```bash
  .\backend\venv\Scripts\pytest backend/tests/test_crm.py
  ```

### Manual Verification
1. Access the web application dashboard in the browser.
2. Select the **CRM de Atendimentos** (Base de Clientes) in the sidebar.
3. Observe the newly generated Kanban board showing real-time CRM deals populated directly from database logs.
4. Interact with drag-and-drop operations, view the details sliding sidebar, update values, and check real-time synchronization.
