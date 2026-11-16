"""Entradas aceitas pela API; dados extras são sempre recusados."""
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Entrada(BaseModel):
    """Base dos formulários: remove espaços e rejeita campos inesperados.

    ``extra='forbid'`` impede que o cliente tente definir campos controlados
    pelo servidor, como ``prestador_uid``, ``ativo`` ou o status do interesse.
    """
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)


class Servico(Entrada):
    """Campos que o usuário pode enviar ao criar um anúncio."""
    titulo: str = Field(min_length=5, max_length=120)
    descricao: str = Field(min_length=20, max_length=5000)
    categoria_id: str = Field(min_length=1, max_length=128, pattern=r'^[^/]+$')
    tipo_servico_id: str = Field(min_length=1, max_length=128, pattern=r'^[^/]+$')
    preco_centavos: int = Field(strict=True, ge=1, le=100_000_000)
    prazo_dias: int = Field(strict=True, ge=1, le=365)
    telefone_contato: str = Field(min_length=10, max_length=20)

    @field_validator('telefone_contato', mode='before')
    @classmethod
    def normalizar_telefone(cls, value):
        """Transforma formatos como (14) 99999-9999 no padrão do WhatsApp.

        O valor salvo contém apenas números e inclui o DDI 55. Essa
        normalização permite montar com segurança ``https://wa.me/<numero>``.
        """
        if not isinstance(value, str):
            raise ValueError('Informe um telefone válido.')
        digits = ''.join(character for character in value if character.isdigit())
        if len(digits) in (10, 11):
            return f'55{digits}'
        if len(digits) in (12, 13) and digits.startswith('55'):
            return digits
        raise ValueError('Informe um celular brasileiro com DDD.')


class TelefoneContato(Entrada):
    """Formulário reduzido usado para completar anúncios antigos."""
    telefone_contato: str = Field(min_length=10, max_length=20)

    _normalizar_telefone = field_validator('telefone_contato', mode='before')(
        Servico.normalizar_telefone.__func__
    )


class PerfilAtualizacao(Entrada):
    """No perfil, apenas o nome pode ser alterado pelo usuário."""
    nome: str = Field(min_length=2, max_length=80)


class DecisaoInteresse(Entrada):
    """O anunciante só pode levar um interesse a um estado final conhecido."""
    status: Literal['ACEITO', 'RECUSADO']
