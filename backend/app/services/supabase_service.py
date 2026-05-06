from supabase import create_client, Client
from app.core.config import settings
from datetime import date

class SupabaseService:
    def __init__(self):
        self.client: Client = create_client(
            settings.SUPABASE_URL, 
            settings.SUPABASE_ANON_KEY.get_secret_value()
        )

    async def get_pharmacy_on_duty(self, city_name: str, duty_date: date):
        """
        Busca a farmácia de plantão para uma cidade e data específica.
        """
        # 1. Buscar ID da cidade pelo nome/slug
        city_res = self.client.table("cities").select("id").ilike("name", f"%{city_name}%").execute()
        
        if not city_res.data:
            return None
        
        city_id = city_res.data[0]["id"]

        # 2. Buscar escala de plantão
        schedule_res = self.client.table("duty_schedules") \
            .select("*, pharmacies(*)") \
            .eq("city_id", city_id) \
            .eq("duty_date", duty_date.isoformat()) \
            .execute()

        return schedule_res.data[0] if schedule_res.data else None

    async def log_context(self, pharmacy_id: str, content: str, response: str, resolved: bool = True):
        """
        Salva log de interação para autoalimentação.
        """
        self.client.table("ai_context_logs").insert({
            "pharmacy_id": pharmacy_id,
            "message_content": content,
            "ai_response": response,
            "was_resolved": resolved
        }).execute()

supabase_service = SupabaseService()
