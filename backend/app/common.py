from fastapi import HTTPException
from google.cloud.firestore_v1.base_query import FieldFilter


def documento(db, colecao, identificador):
    if not identificador or '/' in identificador or len(identificador) > 128:
        raise HTTPException(400, 'Identificador inválido.')
    return db.collection(colecao).document(identificador)


def ler(db, colecao, identificador):
    snapshot = documento(db, colecao, identificador).get()
    if not snapshot.exists:
        raise HTTPException(404, 'Registro não encontrado.')
    return {'id': snapshot.id, **snapshot.to_dict()}


def filtrar(query, campo, valor):
    return query.where(filter=FieldFilter(campo, '==', valor))


def listar(query, limite=50):
    return [{'id': s.id, **s.to_dict()} for s in query.limit(limite).stream()]


def participante(pedido, uid):
    if uid not in (pedido['cliente_uid'], pedido['prestador_uid']):
        raise HTTPException(403, 'Você não participa deste pedido.')
