# Database Specification: Motor de Plantão

## 1. Schema Relacional (ERD)

### Tabela: `cities`
Armazena as cidades cobertas pelo serviço.
- `id`: UUID (PK, Default: gen_random_uuid())
- `name`: TEXT (NOT NULL)
- `state`: CHAR(2) (NOT NULL)
- `slug`: TEXT (UNIQUE, NOT NULL) - *Para buscas amigáveis por IA*

### Tabela: `pharmacies` (Multi-tenant)
Cadastro central da farmácia e sua respectiva instância.
- `id`: UUID (PK)
- `owner_id`: UUID (FK -> auth.users, NOT NULL)
- `cnpj`: VARCHAR(14) (UNIQUE, NOT NULL)
- `name`: TEXT (NOT NULL)
- `address`: TEXT (NOT NULL)
- `city_id`: UUID (FK -> cities.id, NOT NULL)
- `instance_name`: TEXT (UNIQUE) - *Igual ao CNPJ*
- `evolution_apikey`: TEXT (Criptografado AES-256)
- `created_at`: TIMESTAMPTZ (Default: NOW())

### Tabela: `duty_schedules`
A escala de plantão de cada cidade.
- `id`: UUID (PK)
- `city_id`: UUID (FK -> cities.id, NOT NULL)
- `pharmacy_id`: UUID (FK -> pharmacies.id, NOT NULL)
- `duty_date`: DATE (NOT NULL)
- **Constraint**: `UNIQUE(city_id, duty_date)` - *Apenas uma farmácia por dia por cidade*

### Tabela: `ai_context_logs`
Base para "Context Skills" e "Autoalimentação".
- `id`: UUID (PK)
- `pharmacy_id`: UUID (FK -> pharmacies.id)
- `message_content`: TEXT
- `ai_response`: TEXT
- `was_resolved`: BOOLEAN (Default: TRUE)
- `feedback_score`: INTEGER (1-5, NULL)

---

## 2. Row Level Security (RLS)

- **Policies para `pharmacies`**:
    - `SELECT/UPDATE`: `auth.uid() = owner_id`
    - `INSERT`: Aberto apenas via Service Role (Backend)
- **Policies para `duty_schedules`**:
    - `SELECT`: Público (Agente de IA precisa ler para qualquer cidade)
    - `INSERT/UPDATE/DELETE`: Apenas se a farmácia pertencer ao usuário logado ou via Service Role.

## 3. Estratégia de Indexação
- Index em `duty_schedules(city_id, duty_date)` para consultas rápidas do agente.
- Index em `pharmacies(cnpj)` e `pharmacies(instance_name)`.
