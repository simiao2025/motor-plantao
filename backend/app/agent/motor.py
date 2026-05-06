from langchain_openai import ChatOpenAI
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain import hub
from app.agent.tools import tools
from app.core.config import settings

class PharmacyAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o", 
            api_key=settings.OPENAI_API_KEY.get_secret_value(),
            temperature=0
        )
        # Puxar o prompt padrão do hub ou definir um customizado
        self.prompt = hub.pull("hwchase17/openai-functions-agent")
        
        self.agent = create_openai_functions_agent(self.llm, tools, self.prompt)
        self.executor = AgentExecutor(agent=self.agent, tools=tools, verbose=True)

    async def run(self, user_input: str):
        """
        Executa o agente para responder à dúvida do usuário.
        """
        response = await self.executor.ainvoke({"input": user_input})
        return response["output"]

pharmacy_agent = PharmacyAgent()
