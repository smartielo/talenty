"""O pedido é a ligação entre cliente, prestador, pagamento simulado e conversa."""
from fastapi import APIRouter, Depends, HTTPException, Query
from firebase_admin import firestore
from .dependencies import banco, usuario
from .common import documento, ler, listar, filtrar, participante
from .schemas import Solicitar, Acao, Mensagem, Avaliacao
from .services.pedidos import registrar_pagamento_simulado, aprovar_entrega, criar_avaliacao

router = APIRouter()


def transicao(pedido, uid, body):
    """Função pura: fácil de estudar e testar sem conectar ao Firebase."""
    participante(pedido, uid)
    status = pedido['status']
    if body.acao == 'CANCELAR':
        if status not in ('SOLICITADO', 'ORCADO', 'ACEITO'):
            raise HTTPException(409, 'O pedido não pode mais ser cancelado.')
        return {'status': 'CANCELADO'}
    regras = {'ORCAR': ('prestador_uid', 'SOLICITADO', 'ORCADO'),
              'ACEITAR': ('cliente_uid', 'ORCADO', 'ACEITO'),
              'ENTREGAR': ('prestador_uid', 'PAGO_RETIDO', 'ENTREGUE')}
    if body.acao not in regras:
        raise HTTPException(400, 'Ação inválida para esta operação.')
    papel, esperado, proximo = regras[body.acao]
    if pedido[papel] != uid:
        raise HTTPException(403, 'Você não pode executar esta ação.')
    if status != esperado:
        raise HTTPException(409, 'O pedido mudou de etapa. Atualize a página.')
    data = {'status': proximo}
    if body.acao == 'ORCAR':
        if body.valor_centavos is None:
            raise HTTPException(422, 'Informe o valor do orçamento.')
        data['valor_centavos'] = body.valor_centavos
    if body.acao == 'ENTREGAR':
        if not body.entrega.strip():
            raise HTTPException(422, 'Descreva a entrega ou informe o link do trabalho.')
        data['descricao_entrega'] = body.entrega.strip()
    return data


@router.post('/pedidos', status_code=201)
def solicitar(body: Solicitar, user=Depends(usuario), db=Depends(banco)):
    ref = db.collection('pedidos').document()
    service_ref = documento(db, 'servicos', body.servico_id)
    @firestore.transactional
    def criar(tx):
        snapshot = service_ref.get(transaction=tx)
        if not snapshot.exists or not snapshot.to_dict().get('ativo'):
            raise HTTPException(404, 'Serviço indisponível.')
        service = snapshot.to_dict()
        if service['prestador_uid'] == user['uid']:
            raise HTTPException(400, 'Você não pode contratar seu próprio serviço.')
        provider = documento(db, 'usuarios', service['prestador_uid']).get(transaction=tx)
        if not provider.exists or not provider.to_dict().get('ativo'):
            raise HTTPException(400, 'Prestador indisponível.')
        tx.create(ref, {'servico_id': body.servico_id, 'cliente_uid': user['uid'],
            'prestador_uid': service['prestador_uid'], 'titulo_servico': service['titulo'],
            'descricao_solicitacao': body.descricao_solicitacao, 'valor_centavos': service['preco_centavos'],
            'status': 'SOLICITADO', 'criado_em': firestore.SERVER_TIMESTAMP,
            'atualizado_em': firestore.SERVER_TIMESTAMP, 'concluido_em': None, 'entregue_em': None})
    criar(db.transaction())
    return ler(db, 'pedidos', ref.id)


@router.get('/pedidos')
def pedidos(papel: str = Query('cliente', pattern='^(cliente|prestador)$'), depois: str | None = None,
            user=Depends(usuario), db=Depends(banco)):
    query = filtrar(db.collection('pedidos'), f'{papel}_uid', user['uid']).order_by('criado_em', direction='DESCENDING')
    if depois:
        cursor = documento(db, 'pedidos', depois).get()
        if not cursor.exists or cursor.to_dict().get(f'{papel}_uid') != user['uid']:
            raise HTTPException(400, 'Página inválida.')
        query = query.start_after(cursor)
    rows = listar(query, 21)
    return {'itens': rows[:20], 'proximo': rows[19]['id'] if len(rows) > 20 else None}


@router.get('/pedidos/{pedido_id}')
def pedido(pedido_id: str, user=Depends(usuario), db=Depends(banco)):
    data = ler(db, 'pedidos', pedido_id)
    participante(data, user['uid'])
    for name, collection in [('pagamento', 'pagamentos'), ('avaliacao', 'avaliacoes')]:
        snapshot = documento(db, collection, pedido_id).get()
        data[name] = snapshot.to_dict() if snapshot.exists else None
    return data


@router.post('/pedidos/{pedido_id}/acoes')
def executar_acao(pedido_id: str, body: Acao, user=Depends(usuario), db=Depends(banco)):
    # Pagamento e liberação têm suas próprias transações, incluindo o documento financeiro.
    if body.acao == 'PAGAR':
        registrar_pagamento_simulado(db, pedido_id, user['uid'])
    elif body.acao == 'APROVAR':
        aprovar_entrega(db, pedido_id, user['uid'])
    else:
        ref = documento(db, 'pedidos', pedido_id)
        @firestore.transactional
        def mudar(tx):
            snapshot = ref.get(transaction=tx)
            if not snapshot.exists:
                raise HTTPException(404, 'Pedido não encontrado.')
            data = transicao(snapshot.to_dict(), user['uid'], body)
            data['atualizado_em'] = firestore.SERVER_TIMESTAMP
            if body.acao == 'ENTREGAR':
                data['entregue_em'] = firestore.SERVER_TIMESTAMP
            tx.update(ref, data)
        mudar(db.transaction())
    return pedido(pedido_id, user, db)


@router.get('/pedidos/{pedido_id}/mensagens')
def mensagens(pedido_id: str, depois: str | None = None, user=Depends(usuario), db=Depends(banco)):
    participante(ler(db, 'pedidos', pedido_id), user['uid'])
    query = filtrar(db.collection('mensagens'), 'pedido_id', pedido_id).order_by('criado_em')
    if depois:
        cursor = documento(db, 'mensagens', depois).get()
        if not cursor.exists or cursor.to_dict().get('pedido_id') != pedido_id:
            raise HTTPException(400, 'Página inválida.')
        query = query.start_after(cursor)
    rows = listar(query, 51)
    return {'itens': rows[:50], 'proximo': rows[49]['id'] if len(rows) > 50 else None}


@router.post('/pedidos/{pedido_id}/mensagens', status_code=201)
def enviar(pedido_id: str, body: Mensagem, user=Depends(usuario), db=Depends(banco)):
    participante(ler(db, 'pedidos', pedido_id), user['uid'])
    ref = db.collection('mensagens').document()
    ref.create({'pedido_id': pedido_id, 'autor_uid': user['uid'], 'texto': body.texto, 'criado_em': firestore.SERVER_TIMESTAMP})
    return ler(db, 'mensagens', ref.id)


@router.post('/pedidos/{pedido_id}/avaliacao', status_code=201)
def avaliar(pedido_id: str, body: Avaliacao, user=Depends(usuario), db=Depends(banco)):
    criar_avaliacao(db, pedido_id, user['uid'], body.nota, body.comentario)
    return ler(db, 'avaliacoes', pedido_id)
