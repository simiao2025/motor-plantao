import asyncio
from datetime import date

from app.services.supabase_service import supabase_service
from langchain.tools import tool


@tool
def get_duty_pharmacy(city: str):
    """
    Busca a farmácia que está de plantão hoje em uma determinada cidade.
    Passe apenas o nome da cidade (ex: 'Itajaí').
    """
    today = date.today()
    # Como LangChain tools são tipicamente síncronas mas nosso serviço é async
    # Usamos o loop de eventos para rodar a busca
    loop = asyncio.get_event_loop()
    result = loop.run_until_complete(supabase_service.get_pharmacy_on_duty(city, today))

    if not result:
        return f"Não encontrei escala de plantão para {city} na data de hoje ({today})."

    pharmacy = result["pharmacies"]
    return f"A farmácia de plantão em {city} hoje é {pharmacy['name']}. Endereço: {pharmacy['address']}."

tools = [get_duty_pharmacy]
