"""Exemplos executáveis de transações. A API deve fornecer o UID já verificado."""


class RegraNegocioError(ValueError):
    pass


def dividir_pagamento(valor_centavos: int, taxa_pontos_base: int) -> dict:
    if type(valor_centavos) is not int or not 1 <= valor_centavos <= 100_000_000:
        raise RegraNegocioError('Valor deve ser um inteiro positivo em centavos, até 100.000.000.')
    if type(taxa_pontos_base) is not int or not 1000 <= taxa_pontos_base <= 1500:
        raise RegraNegocioError('Taxa deve estar entre 1000 e 1500 pontos-base.')
    comissao = (valor_centavos * taxa_pontos_base + 5000) // 10000
    return {'valor_total_centavos': valor_centavos, 'taxa_comissao_pontos_base': taxa_pontos_base,
            'valor_comissao_centavos': comissao, 'valor_prestador_centavos': valor_centavos - comissao}


def validar_cliente(pedido: dict, cliente_uid: str):
    if not cliente_uid or pedido.get('cliente_uid') != cliente_uid:
        raise RegraNegocioError('Somente o cliente do pedido pode executar esta ação.')
    if pedido.get('cliente_uid') == pedido.get('prestador_uid'):
        raise RegraNegocioError('Não é permitido contratar o próprio serviço.')


def validar_avaliacao(nota: int, comentario: str):
    if type(nota) is not int or not 1 <= nota <= 5:
        raise RegraNegocioError('Nota deve ser um inteiro de 1 a 5.')
    if not isinstance(comentario, str) or len(comentario) > 2000:
        raise RegraNegocioError('Comentário deve ter no máximo 2000 caracteres.')


def _documento(db, colecao, documento_id):
    if not isinstance(documento_id, str) or not documento_id or '/' in documento_id or len(documento_id) > 128:
        raise RegraNegocioError('ID inválido.')
    return db.collection(colecao).document(documento_id)


def _executar(db, operacao):
    from firebase_admin import firestore
    return firestore.transactional(operacao)(db.transaction())


def _ler(ref, transaction):
    snapshot = ref.get(transaction=transaction)
    return snapshot.to_dict() if snapshot.exists else None


def registrar_pagamento_simulado(db, pedido_id: str, cliente_uid: str, taxa_pontos_base: int = 1000):
    from firebase_admin import firestore
    pedido_ref = _documento(db, 'pedidos', pedido_id)
    pagamento_ref = _documento(db, 'pagamentos', pedido_id)

    def operacao(transaction):
        pedido = _ler(pedido_ref, transaction)
        pagamento = _ler(pagamento_ref, transaction)
        if not pedido:
            raise RegraNegocioError('Pedido não encontrado.')
        validar_cliente(pedido, cliente_uid)
        if pedido.get('status') != 'ACEITO' or pagamento:
            raise RegraNegocioError('Pedido deve estar aceito e ainda não pode ter pagamento.')
        valores = dividir_pagamento(pedido['valor_centavos'], taxa_pontos_base)
        transaction.create(pagamento_ref, {**valores, 'pedido_id': pedido_id, 'status': 'RETIDO',
                           'simulado': True, 'criado_em': firestore.SERVER_TIMESTAMP, 'liberado_em': None})
        transaction.update(pedido_ref, {'status': 'PAGO_RETIDO', 'atualizado_em': firestore.SERVER_TIMESTAMP})
        return valores

    return _executar(db, operacao)


def aprovar_entrega(db, pedido_id: str, cliente_uid: str):
    from firebase_admin import firestore
    pedido_ref = _documento(db, 'pedidos', pedido_id)
    pagamento_ref = _documento(db, 'pagamentos', pedido_id)

    def operacao(transaction):
        pedido = _ler(pedido_ref, transaction)
        pagamento = _ler(pagamento_ref, transaction)
        if not pedido or not pagamento:
            raise RegraNegocioError('Pedido ou pagamento não encontrado.')
        validar_cliente(pedido, cliente_uid)
        if pedido.get('status') != 'ENTREGUE' or pagamento.get('status') != 'RETIDO' or pagamento.get('simulado') is not True:
            raise RegraNegocioError('É necessária uma entrega com pagamento simulado retido.')
        valores = dividir_pagamento(pedido['valor_centavos'], pagamento['taxa_comissao_pontos_base'])
        if any(pagamento.get(campo) != valor for campo, valor in valores.items()) or pagamento.get('pedido_id') != pedido_id:
            raise RegraNegocioError('Valores ou vínculo do pagamento inconsistentes.')
        transaction.update(pedido_ref, {'status': 'CONCLUIDO', 'concluido_em': firestore.SERVER_TIMESTAMP,
                                       'atualizado_em': firestore.SERVER_TIMESTAMP})
        transaction.update(pagamento_ref, {'status': 'LIBERADO', 'liberado_em': firestore.SERVER_TIMESTAMP})

    return _executar(db, operacao)


def criar_avaliacao(db, pedido_id: str, cliente_uid: str, nota: int, comentario: str = ''):
    from firebase_admin import firestore
    validar_avaliacao(nota, comentario)
    pedido_ref = _documento(db, 'pedidos', pedido_id)
    avaliacao_ref = _documento(db, 'avaliacoes', pedido_id)

    def operacao(transaction):
        pedido = _ler(pedido_ref, transaction)
        avaliacao = _ler(avaliacao_ref, transaction)
        if not pedido:
            raise RegraNegocioError('Pedido não encontrado.')
        validar_cliente(pedido, cliente_uid)
        if pedido.get('status') != 'CONCLUIDO' or avaliacao:
            raise RegraNegocioError('A avaliação é única e exige um pedido concluído.')
        transaction.create(avaliacao_ref, {'pedido_id': pedido_id, 'cliente_uid': cliente_uid,
                           'prestador_uid': pedido['prestador_uid'], 'nota': nota,
                           'comentario': comentario.strip(), 'criado_em': firestore.SERVER_TIMESTAMP})

    return _executar(db, operacao)
