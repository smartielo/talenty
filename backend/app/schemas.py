"""Os campos aceitos pela API. Campos extras são recusados, inclusive papel e UID."""
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class Entrada(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)


class Perfil(Entrada):
    nome_publico: str = Field(min_length=2, max_length=80)
    instituicao_id: str = Field(min_length=1, max_length=128, pattern=r'^[^/]+$')
    curso: str = Field(min_length=2, max_length=100)
    cidade: str = Field(min_length=2, max_length=100)
    estado: str = Field(pattern=r'^[A-Z]{2}$')
    bio: str = Field(default='', max_length=2000)


class Servico(Entrada):
    titulo: str = Field(min_length=5, max_length=120)
    descricao: str = Field(min_length=20, max_length=5000)
    categoria_id: str = Field(min_length=1, max_length=128, pattern=r'^[^/]+$')
    tipo_servico_id: str = Field(min_length=1, max_length=128, pattern=r'^[^/]+$')
    preco_centavos: int = Field(strict=True, ge=1, le=100_000_000)
    prazo_dias: int = Field(strict=True, ge=1, le=365)
    ativo: bool = True


class Solicitar(Entrada):
    servico_id: str = Field(min_length=1, max_length=128, pattern=r'^[^/]+$')
    descricao_solicitacao: str = Field(min_length=10, max_length=4000)


class Acao(Entrada):
    acao: Literal['ORCAR', 'ACEITAR', 'PAGAR', 'ENTREGAR', 'APROVAR', 'CANCELAR']
    valor_centavos: int | None = Field(default=None, strict=True, ge=1, le=100_000_000)
    entrega: str = Field(default='', max_length=4000)


class Mensagem(Entrada):
    texto: str = Field(min_length=1, max_length=4000)


class Avaliacao(Entrada):
    nota: int = Field(strict=True, ge=1, le=5)
    comentario: str = Field(default='', max_length=2000)


class Verificacao(Entrada):
    verificado: bool
