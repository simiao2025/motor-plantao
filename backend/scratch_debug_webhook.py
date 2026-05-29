import os
import sys
from dotenv import load_dotenv

# Garantir que as variáveis de ambiente sejam lidas
load_dotenv()

# Ajustar PYTHONPATH para importar a estrutura do app
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from fastapi.testclient import TestClient
from main import app
from app.core.config import settings

client = TestClient(app)

def test_whatsapp_webhook():
    print("================================================================")
    print("=== INICIANDO VALIDAÇÃO DE SEGURANÇA DO WEBHOOK DO WHATSAPP  ===")
    print("================================================================")
    
    global_key = settings.EVOLUTION_GLOBAL_API_KEY.get_secret_value()
    print(f"   * Chave global configurada (EVOLUTION_GLOBAL_API_KEY): {global_key}")
    
    # 1. Testar sem header 'apikey'
    print("\n[Passo 1] Enviando requisição sem o cabeçalho 'apikey'...")
    res1 = client.post("/webhooks/whatsapp", json={"event": "messages.upsert"})
    print(f"   * Status Code: {res1.status_code}")
    print(f"   * Response: {res1.text}")
    if res1.status_code == 403:
        print("[+] SUCESSO: Acesso negado com status 403 Forbidden (esperado).")
    else:
        print("[-] FALHA: O endpoint permitiu acesso sem cabeçalho apikey!")
        return False
        
    # 2. Testar com 'apikey' inválida
    print("\n[Passo 2] Enviando requisição com 'apikey' inválida...")
    res2 = client.post("/webhooks/whatsapp", headers={"apikey": "chave-fake-1234"}, json={"event": "messages.upsert"})
    print(f"   * Status Code: {res2.status_code}")
    print(f"   * Response: {res2.text}")
    if res2.status_code == 403:
        print("[+] SUCESSO: Acesso negado com status 403 Forbidden (esperado).")
    else:
        print("[-] FALHA: O endpoint permitiu acesso com apikey inválida!")
        return False
        
    # 3. Testar com 'apikey' correta e evento inválido
    print("\n[Passo 3] Enviando requisição com 'apikey' CORRETA, mas evento irrelevante...")
    res3 = client.post("/webhooks/whatsapp", headers={"apikey": global_key}, json={"event": "connection.update"})
    print(f"   * Status Code: {res3.status_code}")
    print(f"   * Response: {res3.json()}")
    if res3.status_code == 200 and res3.json().get("status") == "ignored":
        print("[+] SUCESSO: Acesso liberado (200 OK) e evento ignorado corretamente.")
    else:
        print("[-] FALHA: Endpoint falhou ao gerenciar evento ignorado com chave correta.")
        return False
        
    print("\n================================================================")
    print("=== TODOS OS TESTES DE SEGURANÇA DO WEBHOOK PASSARAM COM EXCELÊNCIA! ===")
    print("================================================================")
    return True

if __name__ == "__main__":
    test_whatsapp_webhook()
