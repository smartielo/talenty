"""Integração opcional com o Firebase real. Cria dados isolados e os remove no finally.

Execute com TALENTY_LIVE_TEST=1; exige a credencial Admin e a chave PÚBLICA web.
Não inicia servidores HTTP, não altera contas existentes e não faz pagamentos reais.
"""
import os
import uuid
from pathlib import Path
import pytest
import httpx
from dotenv import dotenv_values
from fastapi.testclient import TestClient
from firebase_admin import auth
from app.main import app
from app.firebase import get_firestore, get_firebase_app

pytestmark = pytest.mark.skipif(os.getenv('TALENTY_LIVE_TEST') != '1', reason='Integração real é opt-in')


def test_fluxo_real_e_permissoes():
    db = get_firestore()
    firebase = get_firebase_app()
    key = dotenv_values(Path(__file__).resolve().parents[2] / 'frontend/.env.local')['VITE_FIREBASE_API_KEY']
    prefix = 'teste-api-' + uuid.uuid4().hex[:12]
    uids = [prefix + suffix for suffix in ('-cliente', '-prestador', '-terceiro')]
    created_users = []
    service_id = pedido_id = None
    def token(uid):
        custom = auth.create_custom_token(uid, app=firebase).decode()
        response = httpx.post(f'https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={key}',
            json={'token': custom, 'returnSecureToken': True}, timeout=30)
        assert response.status_code == 200, f'Falha na troca do token: HTTP {response.status_code}'
        return {'Authorization': f'Bearer {response.json()["idToken"]}'}
    try:
        for uid in uids:
            auth.create_user(uid=uid, display_name='Teste API (temporário)', app=firebase)
            created_users.append(uid)
        customer, provider, other = map(token, uids)
        with TestClient(app) as c:
            def call(method, path, headers, expected=200, **kwargs):
                response = getattr(c, method)(path, headers=headers, **kwargs)
                assert response.status_code == expected, f'{method} {path}: {response.status_code} {response.text[:300]}'
                return response.json()
            for headers in (customer, provider, other):
                assert call('get','/auth/me',headers)['usuario']['papel'] == 'USUARIO'
            profile = {'nome_publico': 'Teste API temporário', 'instituicao_id': '', 'curso': 'Computação', 'cidade': 'Bauru', 'estado': 'SP', 'bio': 'Perfil temporário de teste.'}
            # Usa IDs reais do catálogo, sem depender da grafia do nome.
            catalog = c.get('/catalogo').json()
            profile['instituicao_id'] = catalog['instituicoes'][0]['id']
            call('put','/me/perfil',provider,json=profile)
            call('put','/me/perfil',provider,422,json={**profile,'verificado':True})
            public = call('get',f'/prestadores/{uids[1]}',{})
            assert 'email' not in public and 'papel' not in public and public['verificado'] is False
            kind = catalog['tipos_servico'][0]
            body = {'titulo':'Serviço temporário de integração', 'descricao':'Anúncio temporário criado pelo teste e removido ao terminar.', 'categoria_id':kind['categoria_id'], 'tipo_servico_id':kind['id'], 'preco_centavos':12345, 'prazo_dias':7}
            service_id = call('post','/servicos',provider,201,json=body)['id']
            assert service_id in [s['id'] for s in c.get(f'/servicos?categoria={kind["categoria_id"]}').json()['itens']]
            call('put',f'/servicos/{service_id}',other,403,json=body)
            call('post','/pedidos',provider,400,json={'servico_id':service_id,'descricao_solicitacao':'Tentativa de autocontratação.'})
            call('put',f'/me/salvos/{service_id}',customer)
            assert service_id in [s['id'] for s in call('get','/me/salvos',customer)]
            call('delete',f'/me/salvos/{service_id}',customer)
            pedido_id = call('post','/pedidos',customer,201,json={'servico_id':service_id,'descricao_solicitacao':'Preciso testar o fluxo completo do projeto.'})['id']
            for path in (f'/pedidos/{pedido_id}',f'/pedidos/{pedido_id}/mensagens'):
                call('get',path,other,403)
            call('post',f'/pedidos/{pedido_id}/mensagens',other,403,json={'texto':'Não permitido'})
            call('post',f'/pedidos/{pedido_id}/mensagens',customer,201,json={'texto':'Vamos combinar o projeto.'})
            assert len(call('get',f'/pedidos/{pedido_id}/mensagens',provider)['itens']) == 1
            call('post',f'/pedidos/{pedido_id}/acoes',customer,403,json={'acao':'ORCAR','valor_centavos':12345})
            call('post',f'/pedidos/{pedido_id}/acoes',provider,json={'acao':'ORCAR','valor_centavos':12345})
            call('post',f'/pedidos/{pedido_id}/acoes',customer,json={'acao':'ACEITAR'})
            call('post',f'/pedidos/{pedido_id}/acoes',other,409,json={'acao':'PAGAR'})
            call('post',f'/pedidos/{pedido_id}/acoes',customer,json={'acao':'PAGAR'})
            call('post',f'/pedidos/{pedido_id}/acoes',customer,409,json={'acao':'PAGAR'})
            call('post',f'/pedidos/{pedido_id}/acoes',customer,409,json={'acao':'CANCELAR'})
            call('post',f'/pedidos/{pedido_id}/acoes',provider,json={'acao':'ENTREGAR','entrega':'Entrega temporária para teste.'})
            result = call('post',f'/pedidos/{pedido_id}/acoes',customer,json={'acao':'APROVAR'})
            assert result['status'] == 'CONCLUIDO' and result['pagamento']['status'] == 'LIBERADO'
            assert result['pagamento']['valor_comissao_centavos'] == 1235
            call('post',f'/pedidos/{pedido_id}/avaliacao',provider,409,json={'nota':5,'comentario':'Não permitido'})
            call('post',f'/pedidos/{pedido_id}/avaliacao',customer,201,json={'nota':5,'comentario':'Teste de avaliação.'})
            reviews = call('get',f'/prestadores/{uids[1]}/avaliacoes',{})
            assert reviews[0]['nota'] == 5 and 'cliente_uid' not in reviews[0]
            call('post',f'/pedidos/{pedido_id}/avaliacao',customer,409,json={'nota':4,'comentario':'Duplicada'})
            call('get','/admin/perfis',customer,403)
            db.collection('usuarios').document(uids[2]).update({'papel':'ADMIN'})
            call('patch',f'/admin/perfis/{uids[1]}',other,json={'verificado':True})
            assert call('get',f'/prestadores/{uids[1]}',{})['verificado'] is True
            db.collection('usuarios').document(uids[0]).update({'ativo':False})
            call('get','/pedidos',customer,403)
            call('delete',f'/servicos/{service_id}',other,403)
            call('delete',f'/servicos/{service_id}',provider)
            call('get',f'/servicos/{service_id}',{},404)
            assert call('get','/me/servicos',provider)[0]['ativo'] is False
    finally:
        if pedido_id:
            from google.cloud.firestore_v1.base_query import FieldFilter
            for s in db.collection('mensagens').where(filter=FieldFilter('pedido_id','==',pedido_id)).stream():
                s.reference.delete()
            for collection in ('pedidos','pagamentos','avaliacoes'):
                db.collection(collection).document(pedido_id).delete()
        if service_id:
            db.collection('servicos').document(service_id).delete()
            db.collection('usuarios').document(uids[0]).collection('salvos').document(service_id).delete()
        for uid in created_users:
            for collection in ('usuarios','perfis_prestadores'):
                db.collection(collection).document(uid).delete()
            auth.delete_user(uid,app=firebase)
