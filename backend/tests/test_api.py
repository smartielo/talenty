"""Testes locais do MVP, sem conexão com o Firebase."""
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.dependencies import banco
from app.main import app
from app.schemas import Servico


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


@pytest.mark.parametrize('path', ['/auth/me', '/me/servicos'])
def test_rotas_privadas_exigem_login(client, path):
    assert client.get(path).status_code == 401


def test_anuncio_valido():
    service = Servico(
        titulo='Revisão de trabalho acadêmico',
        descricao='Faço revisão ortográfica e formatação do documento.',
        categoria_id='textos',
        tipo_servico_id='textos-basico',
        preco_centavos=8000,
        prazo_dias=5,
    )
    assert service.preco_centavos == 8000


@pytest.mark.parametrize('extra', [{'prestador_uid': 'outro'}, {'ativo': False}])
def test_cliente_nao_define_campos_do_servidor(extra):
    with pytest.raises(ValidationError):
        Servico(
            titulo='Revisão de trabalho acadêmico',
            descricao='Faço revisão ortográfica e formatação do documento.',
            categoria_id='textos',
            tipo_servico_id='textos-basico',
            preco_centavos=8000,
            prazo_dias=5,
            **extra,
        )


@pytest.mark.parametrize('value', [True, 1.5, 0, -1, 100_000_001])
def test_preco_precisa_ser_inteiro_positivo(value):
    with pytest.raises(ValidationError):
        Servico(
            titulo='Revisão de trabalho acadêmico',
            descricao='Faço revisão ortográfica e formatação do documento.',
            categoria_id='textos',
            tipo_servico_id='textos-basico',
            preco_centavos=value,
            prazo_dias=5,
        )
