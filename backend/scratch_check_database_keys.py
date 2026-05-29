import asyncio
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

async def main():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase = create_client(url, key)
    
    res = supabase.table("pharmacies").select("*").eq("instance_name", "01234567000101").execute()
    if res.data:
        print("Pharmacy found:")
        for k, v in res.data[0].items():
            if k in ["id", "instance_name", "evolution_apikey", "cnpj", "name", "whatsapp_channel"]:
                print(f"  {k}: {v}")
    else:
        print("No pharmacy found with instance_name = 01234567000101")
        
    res_all = supabase.table("pharmacies").select("id, name, instance_name, evolution_apikey").limit(5).execute()
    print("\nAll pharmacies in DB:")
    for row in res_all.data:
        print(f"  id: {row['id']}, name: {row['name']}, instance_name: {row['instance_name']}, evolution_apikey: {row['evolution_apikey']}")

if __name__ == "__main__":
    asyncio.run(main())
