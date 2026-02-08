from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import predict, analytics
from routers import admin
import uvicorn
import os

app = FastAPI(title="E-Waste Classifier API", description="Backend for running TFLite model inference")

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*" # For hackathon, allow all to avoid issues
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

@app.get("/")
def read_root():
    return {"status": "online", "message": "E-Waste Classifier Backend is Running"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
