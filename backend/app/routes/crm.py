import logging

from app.routes.admin import get_current_user
from app.services.supabase_service import supabase_service
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/crm", tags=["CRM"])

class StageUpdate(BaseModel):
    status: str

class DealValueUpdate(BaseModel):
    value: float

class NoteCreate(BaseModel):
    description: str

@router.get("/board")
async def get_board(user_id: str = Depends(get_current_user)):
    try:
        res = await supabase_service.get_crm_board(user_id)
        return res
    except Exception as e:
        logging.error(f"Erro no endpoint get_board: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar quadro CRM: {str(e)}")

@router.put("/deals/{deal_id}/stage")
async def update_stage(deal_id: str, data: StageUpdate, user_id: str = Depends(get_current_user)):
    try:
        res = await supabase_service.update_deal_stage(deal_id, data.status, user_id)
        if not res:
            raise HTTPException(status_code=404, detail="Negócio não encontrado ou erro ao alterar estágio.")
        return res
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Erro no endpoint update_stage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno ao atualizar estágio: {str(e)}")

@router.get("/patients/{patient_id}/history")
async def get_history(patient_id: str, user_id: str = Depends(get_current_user)):
    try:
        res = await supabase_service.get_patient_history(patient_id, user_id)
        if not res:
            raise HTTPException(status_code=404, detail="Paciente não encontrado.")
        return res
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Erro no endpoint get_history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno ao obter histórico: {str(e)}")

@router.put("/deals/{deal_id}/value")
async def update_value(deal_id: str, data: DealValueUpdate, user_id: str = Depends(get_current_user)):
    try:
        res = await supabase_service.update_deal_value(deal_id, data.value, user_id)
        if not res:
            raise HTTPException(status_code=404, detail="Negócio não encontrado ou erro ao atualizar valor.")
        return res
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Erro no endpoint update_value: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno ao atualizar valor: {str(e)}")

@router.post("/patients/{patient_id}/notes")
async def add_note(patient_id: str, data: NoteCreate, user_id: str = Depends(get_current_user)):
    try:
        res = await supabase_service.add_patient_note(patient_id, data.description, user_id)
        if not res:
            raise HTTPException(status_code=404, detail="Paciente não encontrado ou erro ao gravar nota.")
        return res
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Erro no endpoint add_note: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno ao gravar nota: {str(e)}")
