import asyncio
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

async def main():
    base_url = os.getenv("EVOLUTION_API_URL", "").rstrip("/")
    global_key = os.getenv("EVOLUTION_GLOBAL_API_KEY", "")
    instance_name = "21345678000101"
    
    print(f"Base URL: {base_url}")
    print(f"Global Key: {global_key}")
    print(f"Instance: {instance_name}")
    
    headers = {
        "apikey": global_key,
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        # Test 1: GET /instance/status
        try:
            url = f"{base_url}/instance/status"
            params = {"name": instance_name}
            res = await client.get(url, params=params, headers=headers)
            print("\n--- Test 1: GET /instance/status ---")
            print(f"Status: {res.status_code}")
            print(f"Headers: {dict(res.headers)}")
            print(f"Content: {res.text}")
        except Exception as e:
            print(f"Test 1 failed: {e}")
            
        # Test 2: GET /instance/connectionState/{instance_name}
        try:
            url = f"{base_url}/instance/connectionState/{instance_name}"
            res = await client.get(url, headers=headers)
            print("\n--- Test 2: GET /instance/connectionState ---")
            print(f"Status: {res.status_code}")
            print(f"Headers: {dict(res.headers)}")
            print(f"Content: {res.text}")
        except Exception as e:
            print(f"Test 2 failed: {e}")

        # Test 3: GET /instance/qr?name=... or GET /instance/connect/...
        try:
            url = f"{base_url}/instance/qr"
            params = {"name": instance_name}
            res = await client.get(url, params=params, headers=headers)
            print("\n--- Test 3: GET /instance/qr ---")
            print(f"Status: {res.status_code}")
            print(f"Content: {res.text}")
        except Exception as e:
            print(f"Test 3 failed: {e}")

        try:
            url = f"{base_url}/instance/connect/{instance_name}"
            res = await client.get(url, headers=headers)
            print("\n--- Test 4: GET /instance/connect ---")
            print(f"Status: {res.status_code}")
            print(f"Content: {res.text}")
        except Exception as e:
            print(f"Test 4 failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
