"""Execute em backend: python -m uvicorn app.main:app --reload"""
import logging
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from google.api_core.exceptions import GoogleAPICallError
from .config import carregar_configuracao
from .routes import router

carregar_configuracao()
app = FastAPI(title='Talenty API', version='1.0.0', description='Firebase Authentication → FastAPI → Firestore')
app.add_middleware(CORSMiddleware,
    allow_origins=[s.strip() for s in os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',') if s.strip()],
    allow_methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], allow_headers=['Authorization', 'Content-Type'])
app.include_router(router)


@app.get('/health')
def health():
    return {'status': 'ok', 'servico': 'Talenty API'}


@app.exception_handler(GoogleAPICallError)
async def banco_error(request: Request, exc: GoogleAPICallError):
    logging.error('Falha no Firestore: %s', type(exc).__name__)
    return JSONResponse(status_code=503, content={'detail': 'Banco indisponível. Tente novamente em instantes.'})
