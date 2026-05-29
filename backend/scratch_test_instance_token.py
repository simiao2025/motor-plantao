import asyncio
import httpx

async def main():
    base_url = "https://evolution-api.brasilonthebox.shop"
    instance_name = "01234567000101"
    
    # Instance token
    instance_token = "abcslirm-secret-"
    global_token = "abcslirm2026"
    
    async with httpx.AsyncClient() as client:
        # Test A: /instance/status with global token
        print("\n--- Test A: /instance/status with global token ---")
        try:
            res = await client.get(
                f"{base_url}/instance/status", 
                params={"name": instance_name}, 
                headers={"apikey": global_token}
            )
            print(f"Status: {res.status_code}, Body: {res.text}")
        except Exception as e:
            print(f"Failed: {e}")
            
        # Test B: /instance/status with instance token
        print("\n--- Test B: /instance/status with instance token ---")
        try:
            res = await client.get(
                f"{base_url}/instance/status", 
                params={"name": instance_name}, 
                headers={"apikey": instance_token}
            )
            print(f"Status: {res.status_code}, Body: {res.text}")
        except Exception as e:
            print(f"Failed: {e}")

        # Test C: /instance/qr with instance token
        print("\n--- Test C: /instance/qr with instance token ---")
        try:
            res = await client.get(
                f"{base_url}/instance/qr", 
                params={"name": instance_name}, 
                headers={"apikey": instance_token}
            )
            print(f"Status: {res.status_code}, Body: {res.text}")
        except Exception as e:
            print(f"Failed: {e}")

        # Test D: Try "ApiKey" header in lowercase or uppercase
        print("\n--- Test D: /instance/status with ApiKey header (global) ---")
        try:
            res = await client.get(
                f"{base_url}/instance/status", 
                params={"name": instance_name}, 
                headers={"ApiKey": global_token}
            )
            print(f"Status: {res.status_code}, Body: {res.text}")
        except Exception as e:
            print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
