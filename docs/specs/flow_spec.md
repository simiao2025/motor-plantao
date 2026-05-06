# Flow Specification: Motor de Plantão

## 1. Fluxo de Onboarding e Provisionamento (CNPJ)

```mermaid
sequenceDiagram
    participant M as Marketplace
    participant B as Backend (Python/FastAPI)
    participant S as Supabase (Auth/DB)
    participant E as Evolution Go API

    M->>B: Webhook (Pagamento Aprovado)
    B->>S: Criar Usuário (Auth)
    B->>S: Criar Perfil Inicial
    B-->>M: HTTP 200 OK
    S-->>B: Confirmação
    B->>B: Enviar E-mail Boas-vindas

    Note over B, E: Após primeiro acesso e preenchimento do CNPJ
    B->>S: Salvar Dados Farmácia (CNPJ)
    B->>E: POST /instance/create (instanceName = CNPJ)
    E-->>B: Instância Criada (Success)
    B->>S: Atualizar status de ativação
```

## 2. Fluxo do Agente de IA (Atendimento)

```mermaid
sequenceDiagram
    participant C as Cliente (WhatsApp)
    participant E as Evolution Go API
    participant B as Backend (IA Agent)
    participant S as Supabase

    C->>E: "Quem está de plantão em Itajaí hoje?"
    E->>B: Webhook (Message Received)
    B->>B: Identificar Instância/Cidade
    B->>S: SELECT from duty_schedules WHERE city='Itajaí' AND date=TODAY
    S-->>B: Farmácia São João (Endereço, Tel)
    B->>B: Gerar resposta humanizada com IA
    B->>E: POST /message/sendText
    E->>C: "Hoje o plantão é na Farmácia São João..."
```

## 3. Fluxo de Autoalimentação (Context Skills)

1. IA detecta pergunta sobre "Convênio X".
2. IA não encontra na base -> Responde "Não tenho essa info, vou verificar".
3. IA salva log em `ai_context_logs` com `was_resolved = FALSE`.
4. Dashboard Admin sinaliza: "Nova dúvida recorrente sobre Convênios".
5. Admin valida a resposta -> Sistema atualiza a base de conhecimento.
