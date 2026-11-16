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


def entrar_com_token(uid, firebase, api_key):
    custom = auth.create_custom_token(uid, app=firebase).decode()
    response = httpx.post(
        f'https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={api_key}',
        json={'token': custom, 'returnSecureToken': True},
        timeout=30,
    )
    response.raise_for_status()
    return {'Authorization': f"Bearer {response.json()['idToken']}"}


def test_fluxo_completo_de_interesse_e_contato():
    config = dotenv_values(Path(__file__).resolve().parents[2] / '.env')
    firebase = get_firebase_app()
    db = get_firestore()
    suffix = uuid.uuid4().hex[:12]
    owner_uid = 'teste-dono-' + suffix
    client_uid = 'teste-cliente-' + suffix
    service_id = None
    interest_id = None
    created_users = []
    try:
        auth.create_user(uid=owner_uid, display_name='Anunciante temporário', app=firebase)
        created_users.append(owner_uid)
        auth.create_user(uid=client_uid, display_name='Cliente temporário', app=firebase)
        created_users.append(client_uid)
        owner_headers = entrar_com_token(owner_uid, firebase, config['VITE_FIREBASE_API_KEY'])
        client_headers = entrar_com_token(client_uid, firebase, config['VITE_FIREBASE_API_KEY'])

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
                'telefone_contato': '(14) 99999-9999',
            }
            created = client.post('/servicos', headers=owner_headers, json=body)
            assert created.status_code == 201
            service_id = created.json()['id']
            assert 'telefone_contato' not in created.json()
            assert service_id in [item['id'] for item in client.get('/servicos').json()]

            interest = client.post(
                f'/servicos/{service_id}/interesses',
                headers=client_headers,
            )
            assert interest.status_code == 201
            assert interest.json()['status'] == 'PENDENTE'
            assert 'telefone_contato' not in interest.json()
            interest_id = interest.json()['id']

            owner_services = client.get('/me/servicos', headers=owner_headers).json()
            owner_service = next(item for item in owner_services if item['id'] == service_id)
            assert owner_service['interessados_quantidade'] == 1
            assert owner_service['interessados_pendentes'] == 1

            decision = client.patch(
                f'/me/servicos/{service_id}/interesses/{interest_id}',
                headers=owner_headers,
                json={'status': 'ACEITO'},
            )
            assert decision.status_code == 200

            accepted = client.get('/me/interesses', headers=client_headers).json()[0]
            assert accepted['status'] == 'ACEITO'
            assert accepted['telefone_contato'] == '5514999999999'
            assert accepted['whatsapp_url'] == 'https://wa.me/5514999999999'

            assert client.delete(f'/servicos/{service_id}', headers=owner_headers).status_code == 204
            service_id = None
            interest_id = None
    finally:
        if interest_id:
            db.collection('interesses').document(interest_id).delete()
        if service_id:
            db.collection('servicos').document(service_id).delete()
        for uid in (owner_uid, client_uid):
            db.collection('usuarios').document(uid).delete()
        for uid in created_users:
            auth.delete_user(uid, app=firebase)
