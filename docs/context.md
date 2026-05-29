# Project Context: Motor de Plantão

## Business Rules
- The system directs users to the pharmacy on duty based on city and date.
- Multi-tenant architecture: each pharmacy manages its own data.
- Automation with Evolution Go for WhatsApp instances.

## Tech Stack
- Backend: Python 3.13 / FastAPI
- DB: Supabase (PostgreSQL)
- AI: LangChain (GPT-4o)
- Frontend: Next.js 15

## Evolution API v3 (Go) - Regras Estritas
- O payload de `/instance/create` deve OBRIGATORIAMENTE conter a chave `name` (e NÃO `instanceName`).
- O envio de campos legados (como `integration: WHATSAPP-BAILEYS` ou `instanceName`) causará HTTP 500 Internal Server Error.
- Exemplo seguro e validado de criação de instância: `{"name": "id", "token": "token", "qrcode": true}`.
