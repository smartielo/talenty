"""Pequenos helpers que padronizam o acesso do backend ao Cloud Firestore.

Centralizar essas operações evita repetir validação de IDs, conversão de
snapshots e limites de leitura em todas as rotas.
"""
from fastapi import HTTPException
from google.cloud.firestore_v1.base_query import FieldFilter


def documento(db, colecao, identificador):
    """Monta uma referência segura para um documento do Firestore.

    A barra é recusada porque poderia transformar um ID em um caminho para
    outra coleção/documento. A API nunca usa um caminho fornecido livremente.
    """
    if not identificador or '/' in identificador or len(identificador) > 128:
        raise HTTPException(400, 'Identificador inválido.')
    return db.collection(colecao).document(identificador)


def ler(db, colecao, identificador):
    """Lê um documento e inclui seu ID no dicionário devolvido ao chamador."""
    snapshot = documento(db, colecao, identificador).get()
    if not snapshot.exists:
        raise HTTPException(404, 'Registro não encontrado.')
    return {'id': snapshot.id, **snapshot.to_dict()}


def filtrar(query, campo, valor):
    """Aplica um filtro de igualdade usando a API atual do Firestore."""
    return query.where(filter=FieldFilter(campo, '==', valor))


def listar(query, limite=50):
    """Executa uma consulta com limite de segurança.

    Esse limite controla quantos registros são carregados por requisição; ele
    não limita a quantidade que o banco pode armazenar. Em uma versão maior,
    este helper deve evoluir para paginação com cursor.
    """
    return [{'id': s.id, **s.to_dict()} for s in query.limit(limite).stream()]
