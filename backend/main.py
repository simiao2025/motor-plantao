from fastapi import FastAPI
from app.routes import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="1.0.0"
)

# Incluir rotas
app.include_router(api_router)

@app.get("/")
async def root():
    return {
        "message": "Motor de Plantão IA API is running",
        "version": "1.0.0",
        "status": "healthy"
    }
