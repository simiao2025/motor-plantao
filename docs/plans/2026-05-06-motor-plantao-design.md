# Design Document: Motor de Plantão IA (SaaS)

## 1. Visão Geral
O **Motor de Plantão** é uma plataforma SaaS baseada em Inteligência Artificial projetada para automatizar o direcionamento de clientes às farmácias de plantão via WhatsApp. O sistema utiliza a **Evolution API v2 (Go)** para gerenciamento de instâncias e o **Supabase** como backend multitenant.

## 2. Fluxo do Usuário (SaaS Onboarding)
1. **Aquisição**: Compra via Landing Page / Marketplace.
2. **Ativação**: Marketplace envia Webhook -> Backend Python cria conta no Supabase Auth -> Dispara e-mail de boas-vindas.
3. **Onboarding**: Usuário redefine senha -> Preenche cadastro da farmácia (CNPJ, Cidade, Endereço).
4. **Provisionamento**: Ao salvar, o sistema chama a API Global da Evolution Go para criar uma instância nomeada com o CNPJ.
5. **Conexão**: O usuário escaneia o QR Code no painel administrativo para ativar o bot.

## 3. Arquitetura Técnica (Padrão 2026)

### Backend (Python / FastAPI)
- **Motor**: FastAPI com Pydantic v2.
- **IA**: LangChain + GPT-4o com Tool Calling.
- **Automação**: Integração com Evolution Go API.
- **Segurança**: Zero Trust, OAuth2, AES-256-GCM para dados sensíveis.

### Frontend (Next.js 15+ / React 19)
- **UI**: Shadcn/UI com paleta "Cyber-Medical" (Verde Esmeralda + Slate Profundo).
- **Segurança**: Autenticação via Passkeys (WebAuthn) integrada ao Supabase.
- **Dashboards**: Gráficos analíticos em tempo real (Heatmaps de consultas, Resolutividade de IA).

### Banco de Dados (Supabase / PostgreSQL)
- **RLS (Row Level Security)**: Isolamento total entre farmácias.
- **Tabelas**: `profiles`, `pharmacies`, `cities`, `duty_schedules`, `ai_context_memory`.

## 4. Funcionalidades Inovadoras: Context Skills & Autoalimentação
- **Context Skills**: O agente terá a capacidade de ler o "contexto local" da farmácia (promoções, convênios, estoque informado) e usar isso para enriquecer as respostas.
- **Autoalimentação (Self-Feeding Knowledge)**: 
    - O sistema monitora perguntas recorrentes que a IA não soube responder.
    - O admin recebe uma notificação para "Validar Conhecimento".
    - Uma vez validado, o dado entra automaticamente na base RAG (Retrieval-Augmented Generation) do agente.

## 5. Menus do Painel Admin
- **Dashboard Principal**: Métricas de conversão e heatmaps.
- **Calendário de Plantões**: Gestão de datas de serviço.
- **Agente IA**: Configuração de persona e treinamento (Context Skills).
- **Conectar WhatsApp**: Gerenciamento de instância e QR Code.
- **Configurações**: Dados da farmácia e segurança.

## 6. Plano de Segurança Cibernética
- Proteção contra **Prompt Injection**.
- Validação estrita de Webhooks.
- Logs de auditoria para todas as ações administrativas.
- Rate limiting por instância de farmácia.
