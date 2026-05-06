from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain import hub
from app.agent.tools import tools
from app.core.config import settings

class PharmacyAgent:
    def __init__(self):
        self.llm = self._init_llm()
        # Prompt padrão para tool calling
        self.prompt = hub.pull("hwchase17/openai-functions-agent")
        
        self.agent = create_openai_functions_agent(self.llm, tools, self.prompt)
        self.executor = AgentExecutor(
            agent=self.agent, 
            tools=tools, 
            verbose=True,
            handle_parsing_errors=True
        )

    def _init_llm(self):
        """
        Inicializa o provedor de LLM baseado nas configurações.
        """
        if settings.LLM_PROVIDER.lower() == "groq":
            return ChatGroq(
                api_key=settings.GROQ_API_KEY.get_secret_value(),
                model_name=settings.LLM_MODEL or "llama3-70b-8192",
                temperature=0
            )
        else:
            return ChatOpenAI(
                api_key=settings.OPENAI_API_KEY.get_secret_value(),
                model=settings.LLM_MODEL or "gpt-4o",
                temperature=0
            )

    async def run(self, user_input: str):
        """
        Executa o agente para responder à dúvida do usuário.
        """
        # Aqui podemos injetar o System Prompt detalhado que você mencionou
        system_instructions = (
            "Você é o Motor de Plantão IA, um assistente especializado em farmácias. "
            "Sempre consulte a ferramenta de plantão antes de responder sobre horários ou locais. "
            "Seja cordial, rápido e preciso."
        )
        
        full_input = f"{system_instructions}\n\nUsuário: {user_input}"
        
        response = await self.executor.ainvoke({"input": full_input})
        return response["output"]

pharmacy_agent = PharmacyAgent()
