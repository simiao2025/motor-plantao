from fastapi import APIRouter
from app.routes.webhooks import router as webhook_router
from app.routes.admin import router as admin_router

api_router = APIRouter()
api_router.include_router(webhook_router)
api_router.include_router(admin_router)
