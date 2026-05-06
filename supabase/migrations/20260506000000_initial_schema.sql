-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Cidades
CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    state CHAR(2) NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Farmácias (Multi-tenant)
CREATE TABLE IF NOT EXISTS pharmacies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cnpj VARCHAR(14) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city_id UUID NOT NULL REFERENCES cities(id),
    instance_name TEXT UNIQUE, -- CNPJ
    evolution_apikey TEXT, -- Encriptado
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Escalas de Plantão
CREATE TABLE IF NOT EXISTS duty_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    duty_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(city_id, duty_date)
);

-- 4. Tabela de Logs de Contexto (Memory / Autoalimentação)
CREATE TABLE IF NOT EXISTS ai_context_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE SET NULL,
    message_content TEXT NOT NULL,
    ai_response TEXT,
    was_resolved BOOLEAN DEFAULT TRUE,
    feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Configurações de RLS (Row Level Security)
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_context_logs ENABLE ROW LEVEL SECURITY;

-- Policies para Pharmacies
CREATE POLICY "Users can manage their own pharmacy" 
ON pharmacies FOR ALL 
USING (auth.uid() = owner_id);

-- Policies para Duty Schedules
CREATE POLICY "Schedules are publicly readable" 
ON duty_schedules FOR SELECT 
USING (true);

CREATE POLICY "Pharmacy owners can manage their schedules" 
ON duty_schedules FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM pharmacies 
        WHERE pharmacies.id = duty_schedules.pharmacy_id 
        AND pharmacies.owner_id = auth.uid()
    )
);

-- Indices para Performance
CREATE INDEX idx_duty_date_city ON duty_schedules(duty_date, city_id);
CREATE INDEX idx_pharmacy_owner ON pharmacies(owner_id);
CREATE INDEX idx_pharmacy_cnpj ON pharmacies(cnpj);
