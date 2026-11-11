"""Campos aceitos na criação de um anúncio; dados extras são recusados."""
from pydantic import BaseModel, ConfigDict, Field


class Entrada(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)


class Servico(Entrada):
    titulo: str = Field(min_length=5, max_length=120)
    descricao: str = Field(min_length=20, max_length=5000)
    categoria_id: str = Field(min_length=1, max_length=128, pattern=r'^[^/]+$')
    tipo_servico_id: str = Field(min_length=1, max_length=128, pattern=r'^[^/]+$')
    preco_centavos: int = Field(strict=True, ge=1, le=100_000_000)
    prazo_dias: int = Field(strict=True, ge=1, le=365)
