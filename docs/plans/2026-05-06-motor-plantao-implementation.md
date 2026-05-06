# Motor de Plantão IA - Implementation Plan (SDD Version)

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Build a multi-tenant SaaS platform for automated pharmacy duty direction via WhatsApp using Python, FastAPI, and Supabase.

**Architecture:** Spec-Driven (SDD) with FastAPI backend, LangChain agents, and Next.js 15.

**Specs Reference:**
- API: `docs/specs/openapi.yaml`
- DB: `docs/specs/database_spec.md`
- Flows: `docs/specs/flow_spec.md`

---

## Phase 0: Specifications (COMPLETED)
- [x] Task 0.1: OpenAPI Spec
- [x] Task 0.2: Database Spec
- [x] Task 0.3: Flow Spec

---

## Phase 1: Foundation, Security & Database

### Task 1: Project Initialization & Quality Setup
**Files:**
- Modify: `backend/requirements.txt`
- Create: `pyproject.toml` (Ruff config)
- Create: `.env.example`
- Create: `docker-compose.yml`

**Step 1: Configure Ruff for Code Purity**
**Step 2: Setup Docker Compose with Postgres/Redis local (for tests)**

### Task 2: Core Config & Security Middleware
**Files:**
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/security.py`

**Step 1: Implement Hard-fail Env Validation with Pydantic Settings**
**Step 2: Implement JWT & Rate Limiting base**

### Task 3: Supabase Schema Implementation
**Files:**
- Create: `supabase/migrations/20260506000000_initial_schema.sql`

**Step 1: Apply SQL based on `database_spec.md`**

---

## Phase 2: SaaS & Provisioning Logic
(Subsequent tasks follow...)
