"""Execute em backend: python -m uvicorn app.main:app --reload"""
import logging
import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from google.api_core.exceptions import GoogleAPICallError
from .routes import router
from .order_routes import router as pedidos_router
from .services.pedidos import RegraNegocioError

load_dotenv(Path(__file__).resolve().parents[1] / '.env')
app = FastAPI(title='Talenty API', version='1.0.0', description='Firebase Authentication → FastAPI → Firestore')
app.add_middleware(CORSMiddleware,
    allow_origins=[s.strip() for s in os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',') if s.strip()],
    allow_methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], allow_headers=['Authorization', 'Content-Type'])
app.include_router(router)
app.include_router(pedidos_router)


@app.get('/health')
def health():
    return {'status': 'ok', 'servico': 'Talenty API'}


@app.exception_handler(RegraNegocioError)
async def regra_error(request: Request, exc: RegraNegocioError):
    return JSONResponse(status_code=409, content={'detail': str(exc)})


@app.exception_handler(GoogleAPICallError)
async def banco_error(request: Request, exc: GoogleAPICallError):
    logging.error('Falha no Firestore: %s', type(exc).__name__)
    return JSONResponse(status_code=503, content={'detail': 'Banco indisponível. Tente novamente em instantes.'})
