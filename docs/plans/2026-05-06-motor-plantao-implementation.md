# Motor de Plantão IA - Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Build a multi-tenant SaaS platform for automated pharmacy duty direction via WhatsApp using Python, FastAPI, and Supabase.

**Architecture:** A FastAPI backend acts as the central hub, receiving webhooks from Evolution Go and orchestrating AI agents that query a multi-tenant Supabase database. The frontend is a Next.js 15 dashboard for pharmacy owners.

**Tech Stack:** Python 3.13+, FastAPI, LangChain, Supabase, Next.js 15, Evolution API v2 (Go).

---

## Phase 1: Project Setup & Database

### Task 1: Project Initialization
**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/main.py`
- Create: `docs/context.md`

**Step 1: Create directory structure**
Run: `mkdir backend frontend docs/plans`
Expected: Directories created.

**Step 2: Initialize requirements.txt**
Create `backend/requirements.txt` with:
```text
fastapi==0.110.0
uvicorn==0.27.1
supabase==2.3.7
python-dotenv==1.0.1
langchain==0.1.12
langchain-openai==0.0.8
pydantic==2.6.3
```

**Step 3: Commit**
Run: `git add . && git commit -m "chore: initial project structure and requirements"`

### Task 2: Supabase Schema Definition (SQL)
**Files:**
- Create: `supabase/migrations/20260506000000_initial_schema.sql`

**Step 1: Define the SQL Schema**
```sql
-- Enable RLS
-- Create Tables: cities, pharmacies, duty_schedules
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    state TEXT NOT NULL
);

CREATE TABLE pharmacies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    cnpj TEXT UNIQUE NOT NULL,
    address TEXT NOT NULL,
    city_id UUID REFERENCES cities(id),
    instance_name TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE duty_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id UUID REFERENCES pharmacies(id),
    city_id UUID REFERENCES cities(id),
    duty_date DATE NOT NULL,
    UNIQUE(city_id, duty_date)
);

-- Apply RLS Policies
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own pharmacy" ON pharmacies FOR ALL USING (auth.uid() = owner_id);
```

**Step 2: Apply migration (Manual or via CLI)**
Run: `supabase migration add initial_schema` (assuming supabase cli setup)

---

## Phase 2: SaaS Onboarding & Provisioning

### Task 3: Marketplace Webhook & Instance Creation
**Files:**
- Create: `backend/app/services/evolution_service.py`
- Create: `backend/app/routes/webhooks.py`

**Step 1: Write Evolution Service**
Implement `create_instance(cnpj)` using the Global API Key.

**Step 2: Create Webhook Endpoint**
Implement POST `/webhooks/payment` to receive marketplace notifications and trigger instance creation.

---

## Phase 3: AI Agent & Context Skills

### Task 4: AI Agent with Tool Calling
**Files:**
- Create: `backend/app/agent/motor.py`

**Step 1: Implement get_pharmacy_on_duty tool**
**Step 2: Setup LangChain Agent with tool-calling capabilities.**

---

## Phase 4: Frontend Admin Panel

### Task 5: Next.js Setup & Dashboard
**Files:**
- Create: `frontend/app/dashboard/page.tsx`
