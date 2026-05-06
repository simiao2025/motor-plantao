from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, constr
from app.services.evolution_service import evolution_service
from app.core.security import settings
import logging

router = APIRouter(prefix="/admin", tags=["Admin"])

class PharmacyRegistration(BaseModel):
    cnpj: str # Validação estrita via Pydantic
    name: str
    city_id: str
    address: str

@router.post("/pharmacy/registration")
async def register_pharmacy(data: PharmacyRegistration):
    """
    Salva os dados da farmácia e provisiona a instância no Evolution Go.
    """
    logging.info(f"Registrando farmácia: {data.name} (CNPJ: {data.cnpj})")
    
    # 1. TODO: Salvar no Supabase via supabase_service
    
    # 2. Provisionar Instância na Evolution Go usando o CNPJ
    try:
        evolution_res = await evolution_service.create_instance(data.cnpj)
        return {
            "status": "success",
            "message": "Pharmacy registered and instance provisioned",
            "evolution_data": evolution_res
        }
    except Exception as e:
        logging.error(f"Erro ao provisionar instância: {str(e)}")
        raise HTTPException(status_code=500, detail="Error provisioning WhatsApp instance")
