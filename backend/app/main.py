from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import router


app = FastAPI(
    title="Wealth Avatar MVP",
    version="0.1.0",
)

origins = [
    "http://localhost:3000",          # If you are testing your frontend locally
    "http://localhost:5173",          # Common for Vite
    "https://wealth-avatar-2y1w-6h2seez8n-d-s-projects987.vercel.app/",  # Replace with your actual live frontend URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
