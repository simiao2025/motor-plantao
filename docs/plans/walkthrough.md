# Motor de Plantão IA - Walkthrough Final (Fase 1-3)

## O que foi construído?

### 1. Especificações (SDD)
Definimos o contrato do sistema antes de escrever qualquer código em `docs/specs/`.
- [openapi.yaml](file:///c:/Projetos/motor-plantao/docs/specs/openapi.yaml)
- [database_spec.md](file:///c:/Projetos/motor-plantao/docs/specs/database_spec.md)
- [flow_spec.md](file:///c:/Projetos/motor-plantao/docs/specs/flow_spec.md)

### 2. Backend & IA
Implementamos a inteligência e a automação do SaaS.
- **Auto-provisionamento**: Serviço que integra com Evolution API Go.
- **Agente LangChain**: Motor que decide quando buscar plantões no banco de dados.
- **Segurança**: Validação estrita de ambiente e RLS no banco de dados.

### 3. Frontend Dashboard
Interface administrativa construída com Next.js 15 e TailwindCSS.
- Tema "Cyber-Medical" de alta fidelidade.
- Layout de Bento Grid para métricas e status.

## Como testar?

1. **Instalar dependências**:
   - Backend: `pip install -r backend/requirements.txt`
   - Frontend: `cd frontend && npm install`

2. **Configurar Ambiente**:
   - Copie o `.env.example` para `.env` e preencha suas chaves.

3. **Rodar o Sistema**:
   - Backend: `uvicorn main:app --reload` (dentro da pasta backend)
   - Frontend: `npm run dev` (dentro da pasta frontend)

## Próximos Passos recomendados:
- Conectar o Agente de IA ao webhook real da Evolution API para processar mensagens de clientes.
- Implementar os gráficos analíticos no dashboard.
