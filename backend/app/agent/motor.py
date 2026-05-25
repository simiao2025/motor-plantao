from app.agent.tools import tools
from app.core.config import settings
from langchain import hub
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI


class PharmacyAgent:
    def __init__(self):
        self.llm = self._init_llm()
        self.prompt = hub.pull("hwchase17/openai-functions-agent")

        self.agent = create_openai_functions_agent(self.llm, tools, self.prompt)
        self.executor = AgentExecutor(
            agent=self.agent,
            tools=tools,
            verbose=True,
            handle_parsing_errors=True
        )

    def _init_llm(self):
        if settings.LLM_PROVIDER.lower() == "groq":
            return ChatGroq(
                api_key=settings.GROQ_API_KEY.get_secret_value(),
                model_name=settings.LLM_MODEL or "llama3-70b-8192",
                temperature=0
            )
        return ChatOpenAI(
            api_key=settings.OPENAI_API_KEY.get_secret_value(),
            model=settings.LLM_MODEL or "gpt-4o",
            temperature=0
        )

    async def run(self, user_input: str):
        # SYSTEM PROMPT DEFINITIVO - SDD VERSION
        system_instructions = """
        Você é o 'Motor de Plantão IA', um Agente de Triagem Clínica Avançado para o ecossistema de farmácias 24h.
        Sua função é fornecer assistência rápida, identificar a farmácia de plantão e realizar uma triagem preliminar baseada em protocolos de saúde.

        PERSONALIDADE E TOM DE VOZ:
        - Empático, clínico, direto e profissional.
        - Evite gírias. Use terminologia clara e acessível.
        - Transmita segurança ao usuário, especialmente em casos de dor ou mal-estar.

        FLUXO DE TRABALHO:
        1. LOCALIZAÇÃO DO PLANTÃO: Sempre use a ferramenta 'get_duty_pharmacy' para informar qual farmácia está de plantão no momento.
        2. COLETA DE DADOS (Triagem): Se o usuário relatar sintomas, faça perguntas curtas para identificar:
           - Sintomas principais e duração.
           - Medicamentos sendo utilizados no momento.
           - Presença de alergias ou condições pré-existentes.
        3. CLASSIFICAÇÃO DE RISCO:
           - 🟢 *NÍVEL VERDE (LEVE)*: Autolimitado. Dúvidas sobre posologia ou sintomas menores.
           - 🟡 *NÍVEL AMARELO (MODERADO)*: Necessita de atenção farmacêutica ou consulta em breve.
           - 🔴 *NÍVEL VERMELHO (CRÍTICO)*: Sinais de emergência (dor no peito, dificuldade respiratória, desmaios).

        FORMATO OBRIGATÓRIO DE RESUMO TÉCNICO (Ao final da triagem):
        ---
        {nivel_icon} *TRIAGEM CLÍNICA — MOTOR DE PLANTÃO*
        ---
        📍 *Classificação:* {nivel}
        
        📝 *Queixa Principal:* {resumo_pedido}
        🌡️ *Sintomas Relatados:* {sintomas}
        ⏳ *Evolução:* {tempo}
        💊 *Medicações em Uso:* {medicacao_uso}
        ⚠️ *Alerta Crítico:* {alerta_critico}
        ---
        
        REGRAS DE OURO:
        - Se o nível for 🔴 *VERMELHO*, sua primeira frase DEVE ser: "Identificamos sinais de alerta crítico. Recomendamos que procure uma Unidade de Pronto Atendimento (UPA) ou Hospital IMEDIATAMENTE."
        - Nunca prescreva medicamentos. Oriente a conversa com o farmacêutico de plantão.
        - Finalize com: "Estas informações foram encaminhadas ao farmacêutico responsável para agilizar seu atendimento."
        """

        full_input = f"{system_instructions}\n\nEntrada do Cliente: {user_input}"

        response = await self.executor.ainvoke({"input": full_input})
        return response["output"]

pharmacy_agent = PharmacyAgent()
