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

    -- Tenta capturar nome fictício/inicial
    v_patient_name := 'Paciente - ' || RIGHT(NEW.user_phone, 4);

    -- 1. Upsert do paciente
    INSERT INTO public.patients (pharmacy_id, phone, name)
    VALUES (NEW.pharmacy_id, NEW.user_phone, v_patient_name)
    ON CONFLICT (pharmacy_id, phone) DO UPDATE 
    SET phone = EXCLUDED.phone
    RETURNING id INTO v_patient_id;

    -- 2. Tenta encontrar negócio em aberto (não ganho nem perdido)
    SELECT id INTO v_deal_id
    FROM public.crm_deals
    WHERE patient_id = v_patient_id AND status NOT IN ('completed', 'lost')
    ORDER BY created_at DESC LIMIT 1;

    -- 3. Se não houver negócio aberto, cria um novo na etapa 'lead' ou 'triaged'
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

-- Evita erro se o trigger já existir
DROP TRIGGER IF EXISTS trg_on_ai_triage_log ON public.ai_context_logs;

CREATE TRIGGER trg_on_ai_triage_log
AFTER INSERT ON public.ai_context_logs
FOR EACH ROW
EXECUTE FUNCTION public.fn_handle_ai_triage_log();
