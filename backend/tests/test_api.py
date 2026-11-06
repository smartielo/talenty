"""Testes sem rede: autenticação, campos proibidos e transições do pedido."""
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError
from app.main import app
from app.dependencies import usuario, banco, administrador
from app.order_routes import transicao
from app.schemas import Perfil, Servico, Acao, Mensagem, Avaliacao


@pytest.fixture
def client():
    app.dependency_overrides[banco] = lambda: object()
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_health_e_rotas_privadas(client):
    assert client.get('/health').json()['status'] == 'ok'
    for path in ('/auth/me', '/me/servicos', '/pedidos', '/admin/perfis', '/me/salvos'):
        assert client.get(path).status_code == 401


def test_token_invalido(client, monkeypatch):
    def invalid(token):
        raise ValueError('Token inválido')
    monkeypatch.setattr('app.dependencies.verify_id_token', invalid)
    assert client.get('/auth/me', headers={'Authorization': 'Bearer invalido'}).status_code == 401


def test_papel_admin_nao_pode_ser_forjado(client):
    app.dependency_overrides[usuario] = lambda: {'uid': 'cliente', 'papel': 'USUARIO'}
    assert client.get('/admin/perfis').status_code == 403
    assert client.patch('/admin/perfis/outro', json={'verificado': True}).status_code == 403


@pytest.mark.parametrize('extra', [{'papel': 'ADMIN'}, {'verificado': True}, {'usuario_uid': 'outro'}])
def test_perfil_recusa_privilegios(extra):
    with pytest.raises(ValidationError):
        Perfil(nome_publico='Estudante', instituicao_id='usp', curso='Computação', cidade='Bauru', estado='SP', **extra)


@pytest.mark.parametrize('value', [True, 1.5, 0, -1, 100_000_001])
def test_valor_de_servico_inteiro_positivo(value):
    with pytest.raises(ValidationError):
        Servico(titulo='Meu serviço', descricao='Uma descrição suficientemente longa.', categoria_id='sites', tipo_servico_id='sites-basico', preco_centavos=value, prazo_dias=7)


@pytest.mark.parametrize('text', ['', '  ', 'a' * 4001])
def test_mensagem_vazia_ou_grande(text):
    with pytest.raises(ValidationError):
        Mensagem(texto=text)


@pytest.mark.parametrize('nota', [True, 0, 6, 2.5])
def test_nota_invalida(nota):
    with pytest.raises(ValidationError):
        Avaliacao(nota=nota)


def order(status):
    return {'cliente_uid': 'cliente', 'prestador_uid': 'prestador', 'status': status}


@pytest.mark.parametrize('acao,status,uid,proximo', [('ORCAR','SOLICITADO','prestador','ORCADO'), ('ACEITAR','ORCADO','cliente','ACEITO'), ('ENTREGAR','PAGO_RETIDO','prestador','ENTREGUE')])
def test_fluxo_do_pedido(acao,status,uid,proximo):
    assert transicao(order(status), uid, Acao(acao=acao, valor_centavos=10000, entrega='Trabalho entregue.'))['status'] == proximo


def test_terceiro_nao_pode_alterar_pedido():
    with pytest.raises(HTTPException) as exc:
        transicao(order('SOLICITADO'), 'invasor', Acao(acao='CANCELAR'))
    assert exc.value.status_code == 403


def test_cliente_nao_pode_orcar():
    with pytest.raises(HTTPException) as exc:
        transicao(order('SOLICITADO'), 'cliente', Acao(acao='ORCAR', valor_centavos=10000))
    assert exc.value.status_code == 403


@pytest.mark.parametrize('status', ['PAGO_RETIDO','ENTREGUE','CONCLUIDO','CANCELADO'])
def test_nao_cancela_apos_pagamento(status):
    with pytest.raises(HTTPException) as exc:
        transicao(order(status), 'cliente', Acao(acao='CANCELAR'))
    assert exc.value.status_code == 409


def test_nao_pula_etapas():
    with pytest.raises(HTTPException):
        transicao(order('SOLICITADO'), 'cliente', Acao(acao='ACEITAR'))


def test_entrega_precisa_de_descricao():
    with pytest.raises(HTTPException):
        transicao(order('PAGO_RETIDO'), 'prestador', Acao(acao='ENTREGAR'))
