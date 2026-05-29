import asyncio
import os
import secrets
import sys
from dotenv import load_dotenv

# Garantir que as variáveis de ambiente sejam lidas
load_dotenv()

# Ajustar PYTHONPATH para importar a estrutura do app
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from app.services.supabase_service import supabase_service
from app.core.config import settings

async def test_auth_security():
    print("================================================================")
    print("=== INICIANDO VALIDAÇÃO DE SEGURANÇA E CRIPTOGRAFIA DE SENHAS ===")
    print("================================================================")
    
    test_email = f"test_{secrets.token_hex(4)}@example.com"
    test_password = "SenhaSuperSecreta123!@#"
    test_name = "Farmacia Teste Onboarding"
    test_token = secrets.token_urlsafe(32)
    
    # 1. Testar salvamento seguro da senha
    print(f"\n[Passo 1] Salvando cadastro pendente seguro para {test_email}...")
    pending_res = await supabase_service.save_pending_confirmation(
        name=test_name,
        email=test_email,
        password_plain=test_password,
        token=test_token
    )
    
    if not pending_res:
        print("[-] FALHA: Não foi possível salvar cadastro pendente.")
        return False
    print("[+] SUCESSO: Cadastro pendente salvo no banco de dados.")
    
    # 2. Verificar se está criptografado no banco
    print("\n[Passo 2] Verificando se a senha foi armazenada como ciphertext no banco de dados...")
    raw_res = supabase_service.client.table("pending_confirmations").select("*").eq("email", test_email).execute()
    if not raw_res.data:
        print("[-] FALHA: O registro pendente não foi localizado no banco.")
        return False
        
    stored_password = raw_res.data[0]["password"]
    print(f"   * Senha original fornecida pelo usuário: {test_password}")
    print(f"   * Senha de fato gravada na tabela: {stored_password}")
    
    if stored_password == test_password:
        print("[-] ALERTA CRÍTICO: Vulnerabilidade detectada! A senha está em texto plano.")
        return False
    print("[+] SUCESSO: Senha armazenada de forma criptografada (Fernet Ciphertext).")
    
    # 3. Testar a descriptografia determinística via Fernet derivado de SECRET_KEY
    print("\n[Passo 3] Testando decriptação determinística via Fernet no backend...")
    try:
        fernet = supabase_service._get_fernet()
        decrypted = fernet.decrypt(stored_password.encode()).decode()
        print(f"   * Senha decriptada: {decrypted}")
        if decrypted == test_password:
            print("[+] SUCESSO: Descriptografia determinística íntegra e sem vazamentos.")
        else:
            print("[-] FALHA: A senha decriptada não confere com a original.")
            return False
    except Exception as e:
        print(f"[-] FALHA ao tentar decriptar: {str(e)}")
        return False
        
    # 4. Testar a confirmação de e-mail e criação de usuário e farmácia
    print("\n[Passo 4] Simulando fluxo do clique de ativação (/auth/confirm-email)...")
    pending_by_token = await supabase_service.get_pending_confirmation_by_token(test_token)
    if not pending_by_token:
        print("[-] FALHA: Não foi possível recuperar a pendência pelo token.")
        return False
    print("[+] SUCESSO: Pendência resgatada pelo token único com sucesso.")
    
    print("   * Criando usuário real e farmácia provisória no Supabase...")
    user_id = await supabase_service.create_user_after_confirmation(
        name=pending_by_token["name"],
        email=pending_by_token["email"],
        password_plain=pending_by_token["password"]
    )
    
    if not user_id:
        print("[-] FALHA: Erro ao criar usuário no Supabase Auth ou criar farmácia provisória.")
        return False
    print(f"[+] SUCESSO: Usuário criado no Supabase Auth com ID: {user_id}")
    
    # 5. Confirmar se a farmácia provisória foi criada
    pharmacy_res = supabase_service.client.table("pharmacies").select("*").eq("owner_id", user_id).execute()
    if not pharmacy_res.data:
        print("[-] FALHA: Farmácia provisória não vinculada ao proprietário.")
        return False
    pharmacy_id = pharmacy_res.data[0]["id"]
    print(f"[+] SUCESSO: Farmácia provisória vinculada com ID: {pharmacy_id}")
    
    # 6. Limpeza e Rollback do banco
    print("\n[Passo 5] Removendo registros temporários de teste...")
    del_res = await supabase_service.delete_pending_confirmation(test_email)
    if del_res:
        print("[+] Pendência excluída da tabela pending_confirmations.")
    
    # Deleta a farmácia de teste
    supabase_service.client.table("pharmacies").delete().eq("id", pharmacy_id).execute()
    print("[+] Farmácia de teste deletada.")
    
    # Deleta o usuário de teste
    try:
        supabase_service.client.auth.admin.delete_user(user_id)
        print("[+] Usuário de teste deletado do Supabase Auth.")
    except Exception as del_e:
        print(f"[-] Erro ao deletar usuário de teste: {str(del_e)}")
        
    print("\n================================================================")
    print("=== TODOS OS TESTES DE SEGURANÇA PASSARAM COM EXCELÊNCIA! ===")
    print("================================================================")
    return True

if __name__ == "__main__":
    asyncio.run(test_auth_security())
