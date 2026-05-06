from fastapi import FastAPI

app = FastAPI(title="Motor de Plantão IA")

@app.get("/")
async def root():
    return {"message": "Motor de Plantão IA API is running"}
