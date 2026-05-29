import asyncio
import os
from dotenv import load_dotenv

# Load env variables
load_dotenv()

from langchain.agents import create_agent
from langchain_groq import ChatGroq
from langchain.tools import tool

# Simulate the tool locally to bypass the import loop
@tool
def get_duty_pharmacy(city: str):
    """
    Busca a farmácia que está de plantão hoje em uma determinada cidade.
    Passe apenas o nome da cidade (ex: 'Itajaí').
    """
    return f"A farmácia de plantão em {city} hoje é Farmácia São João. Endereço: Av. Principal, 100."

async def main():
    print("Testing create_agent with Groq...")
    llm = ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model_name="llama-3.3-70b-versatile",
        temperature=0
    )
    
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
    - Se o nível for 🔴 *VERMELHO*, sua primeira frase DEVE ser: "Identificamos sinais de alerta crítico. Recomendamos que procure uma Uidade de Pronto Atendimento (UPA) ou Hospital IMEDIATAMENTE."
    - Nunca prescreva medicamentos. Oriente a conversa com o farmacêutico de plantão.
    - Finalize com: "Estas informações foram encaminhadas ao farmacêutico responsável para agilizar seu atendimento."
    """
    
    agent = create_agent(
        model=llm,
        tools=[get_duty_pharmacy],
        system_prompt=system_instructions
    )
    
    print("Agent created successfully!")
    print("Graph nodes:", agent.nodes)
    
    # Try a simple invocation
    print("Invoking agent...")
    res = await agent.ainvoke({
        "messages": [("user", "Qual farmácia está de plantão em Itajaí hoje?")]
    })
    
    print("Response keys:", res.keys())
    print("Last message type:", type(res["messages"][-1]))
    print("Content:")
    print(res["messages"][-1].content)

if __name__ == "__main__":
    asyncio.run(main())
