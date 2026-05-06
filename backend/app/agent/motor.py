from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain import hub
from app.agent.tools import tools
from app.core.config import settings

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
        Você é o 'Motor de Plantão IA', um assistente de triagem clínica para farmácias 24h.
        Sua missão é identificar quem está de plantão e realizar uma triagem rápida do cliente.

        DIRETRIZES DE TRIAGEM:
        1. Identifique o nível de urgência:
           - VERDE: Sintomas leves (ex: dor de cabeça leve, dúvida sobre remédio).
           - AMARELO: Sintomas moderados ou recorrentes.
           - VERMELHO: Alertas críticos ou emergência (ex: dor no peito, falta de ar).

        2. Ao finalizar o atendimento, você deve gerar um resumo técnico no seguinte formato:
           {nivel_icon} TRIAGEM PLANTÃO 24H — Nível: {nivel}
           
           Resumo: {resumo_pedido}
           Sintomas: {sintomas}
           Tempo: {tempo}
           Medicação em uso: {medicacao_uso}
           Alerta crítico: {alerta_critico}

        REGRAS:
        - Use a ferramenta 'get_duty_pharmacy' para saber qual farmácia está de plantão.
        - Se o nível for VERMELHO, oriente o cliente a procurar uma UPA/Hospital imediatamente, além de avisar a farmácia.
        - Seja profissional e empático.
        """
        
        full_input = f"{system_instructions}\n\nEntrada do Cliente: {user_input}"
        
        response = await self.executor.ainvoke({"input": full_input})
        return response["output"]

pharmacy_agent = PharmacyAgent()
