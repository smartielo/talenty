"""Testes locais do MVP, sem conexão com o Firebase."""
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.dependencies import banco
from app.main import app
from app.routes import anuncio_publico, interesse_para_cliente
from app.schemas import DecisaoInteresse, Servico


def servico_valido(**changes):
    data = {
        'titulo': 'Revisão de trabalho acadêmico',
        'descricao': 'Faço revisão ortográfica e formatação do documento.',
        'categoria_id': 'textos',
        'tipo_servico_id': 'textos-basico',
        'preco_centavos': 8000,
        'prazo_dias': 5,
        'telefone_contato': '(14) 99999-9999',
    }
    data.update(changes)
    return data


@pytest.fixture
def client():
    app.dependency_overrides[banco] = lambda: object()
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_health(client):
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json()['status'] == 'ok'


@pytest.mark.parametrize('path', ['/auth/me', '/me/perfil', '/me/servicos', '/me/interesses'])
def test_rotas_privadas_exigem_login(client, path):
    assert client.get(path).status_code == 401


def test_anuncio_valido():
    service = Servico(**servico_valido())
    assert service.preco_centavos == 8000
    assert service.telefone_contato == '5514999999999'


@pytest.mark.parametrize('extra', [{'prestador_uid': 'outro'}, {'ativo': False}])
def test_cliente_nao_define_campos_do_servidor(extra):
    with pytest.raises(ValidationError):
        Servico(**servico_valido(**extra))


@pytest.mark.parametrize('value', [True, 1.5, 0, -1, 100_000_001])
def test_preco_precisa_ser_inteiro_positivo(value):
    with pytest.raises(ValidationError):
        Servico(**servico_valido(preco_centavos=value))


@pytest.mark.parametrize('value', ['123', '441199999999', '0011999999999', 'telefone'])
def test_telefone_precisa_ser_celular_brasileiro(value):
    with pytest.raises(ValidationError):
        Servico(**servico_valido(telefone_contato=value))


def test_resposta_publica_nao_expoe_telefone():
    public = anuncio_publico({
        'id': 'servico-1',
        'titulo': 'Aula particular',
        'telefone_contato': '5514999999999',
    })
    assert 'telefone_contato' not in public


def test_telefone_so_e_liberado_apos_aceite():
    service = {'titulo': 'Aula particular', 'telefone_contato': '5514999999999'}
    interest = {'id': 'i1', 'servico_id': 's1', 'status': 'PENDENTE'}
    assert 'telefone_contato' not in interesse_para_cliente(interest, service)
    accepted = interesse_para_cliente({**interest, 'status': 'ACEITO'}, service)
    assert accepted['telefone_contato'] == '5514999999999'
    assert accepted['whatsapp_url'] == 'https://wa.me/5514999999999'


def test_decisao_aceita_somente_estados_finais():
    assert DecisaoInteresse(status='ACEITO').status == 'ACEITO'
    with pytest.raises(ValidationError):
        DecisaoInteresse(status='PENDENTE')
