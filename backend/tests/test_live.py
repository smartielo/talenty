"""Integração opcional: cria um anúncio temporário e sempre tenta removê-lo."""
import os
import uuid
from pathlib import Path

import httpx
import pytest
from dotenv import dotenv_values
from fastapi.testclient import TestClient
from firebase_admin import auth

from app.firebase import get_firebase_app, get_firestore
from app.main import app

pytestmark = pytest.mark.skipif(
    os.getenv('TALENTY_LIVE_TEST') != '1',
    reason='Integração real é opt-in',
)


def test_criar_listar_e_excluir_anuncio():
    config = dotenv_values(Path(__file__).resolve().parents[2] / '.env')
    firebase = get_firebase_app()
    db = get_firestore()
    uid = 'teste-mvp-' + uuid.uuid4().hex[:12]
    service_id = None
    auth.create_user(uid=uid, display_name='Teste temporário', app=firebase)
    try:
        custom = auth.create_custom_token(uid, app=firebase).decode()
        response = httpx.post(
            f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={config['VITE_FIREBASE_API_KEY']}",
            json={'token': custom, 'returnSecureToken': True},
            timeout=30,
        )
        headers = {'Authorization': f"Bearer {response.json()['idToken']}"}
        with TestClient(app) as client:
            catalog = client.get('/catalogo').json()
            kind = catalog['tipos_servico'][0]
            body = {
                'titulo': 'Anúncio temporário do teste',
                'descricao': 'Este registro existe apenas durante o teste de integração.',
                'categoria_id': kind['categoria_id'],
                'tipo_servico_id': kind['id'],
                'preco_centavos': 5000,
                'prazo_dias': 3,
            }
            created = client.post('/servicos', headers=headers, json=body)
            assert created.status_code == 201
            service_id = created.json()['id']
            assert service_id in [item['id'] for item in client.get('/servicos').json()]
            assert client.delete(f'/servicos/{service_id}', headers=headers).status_code == 204
            service_id = None
    finally:
        if service_id:
            db.collection('servicos').document(service_id).delete()
        db.collection('usuarios').document(uid).delete()
        auth.delete_user(uid, app=firebase)
