from app.routes.admin import router as admin_router
from app.routes.payments import router as payment_router
from app.routes.webhooks import router as webhook_router
from app.routes.crm import router as crm_router
from fastapi import APIRouter

api_router = APIRouter()
api_router.include_router(webhook_router)
api_router.include_router(admin_router)
api_router.include_router(payment_router)
api_router.include_router(crm_router, prefix="/admin")
