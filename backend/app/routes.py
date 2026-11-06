"""Rotas de perfil, catálogo e anúncios. As consultas são feitas apenas no servidor."""
from fastapi import APIRouter, Depends, HTTPException, Query
from firebase_admin import firestore
from .dependencies import banco, usuario, administrador
from .common import documento, ler, filtrar, listar
from .schemas import Perfil, Servico, Verificacao

router = APIRouter()


@router.get('/auth/me')
def minha_conta(user=Depends(usuario), db=Depends(banco)):
    profile = documento(db, 'perfis_prestadores', user['uid']).get()
    return {'usuario': user, 'perfil': profile.to_dict() if profile.exists else None}


@router.get('/catalogo')
def catalogo(db=Depends(banco)):
    return {name: listar(filtrar(db.collection(name), 'ativo', True), 100)
            for name in ('instituicoes', 'categorias', 'tipos_servico')}


@router.put('/me/perfil')
def salvar_perfil(body: Perfil, user=Depends(usuario), db=Depends(banco)):
    institution = ler(db, 'instituicoes', body.instituicao_id)
    if not institution.get('ativo'):
        raise HTTPException(400, 'Instituição indisponível.')
    ref = documento(db, 'perfis_prestadores', user['uid'])
    # Transação evita perder a verificação se o administrador editar ao mesmo tempo.
    @firestore.transactional
    def salvar(tx):
        existing = ref.get(transaction=tx)
        data = body.model_dump()
        data.update(usuario_uid=user['uid'], atualizado_em=firestore.SERVER_TIMESTAMP)
        if not existing.exists:
            data.update(criado_em=firestore.SERVER_TIMESTAMP, verificado=False, verificado_por=None, verificado_em=None)
        elif existing.to_dict().get('instituicao_id') != body.instituicao_id or existing.to_dict().get('curso') != body.curso:
            data.update(verificado=False, verificado_por=None, verificado_em=None)
        tx.set(ref, data, merge=True)
    salvar(db.transaction())
    return ler(db, 'perfis_prestadores', user['uid'])


@router.get('/prestadores/{uid}')
def perfil_publico(uid: str, db=Depends(banco)):
    profile = ler(db, 'perfis_prestadores', uid)
    # Nunca incluir o documento privado usuarios (contém e-mail e papel).
    return {k: profile.get(k) for k in ('id', 'usuario_uid', 'nome_publico', 'instituicao_id', 'curso', 'cidade', 'estado', 'bio', 'verificado')}


def anuncio_publico(db, service):
    profile = documento(db, 'perfis_prestadores', service['prestador_uid']).get()
    data = profile.to_dict() if profile.exists else {}
    return {**service, 'prestador': {k: data.get(k) for k in ('nome_publico', 'curso', 'cidade', 'estado', 'bio', 'verificado')}}


@router.get('/servicos')
def servicos(categoria: str | None = None, prestador: str | None = None,
             depois: str | None = None, limite: int = Query(12, ge=1, le=30), db=Depends(banco)):
    query = filtrar(db.collection('servicos'), 'ativo', True)
    if categoria:
        query = filtrar(query, 'categoria_id', categoria)
    # Filtrar por prestador em uma rota própria evita criar índices para todas as combinações.
    if prestador:
        raise HTTPException(400, 'Use /prestadores/{uid}/servicos para consultar um prestador.')
    query = query.order_by('criado_em', direction='DESCENDING').order_by('__name__', direction='DESCENDING')
    if depois:
        cursor = documento(db, 'servicos', depois).get()
        if not cursor.exists:
            raise HTTPException(400, 'Página inválida.')
        query = query.start_after(cursor)
    rows = listar(query, limite + 1)
    return {'itens': [anuncio_publico(db, s) for s in rows[:limite]],
            'proximo': rows[limite - 1]['id'] if len(rows) > limite else None}


@router.get('/prestadores/{uid}/servicos')
def servicos_prestador(uid: str, db=Depends(banco)):
    rows = listar(filtrar(db.collection('servicos'), 'prestador_uid', uid).order_by('criado_em', direction='DESCENDING'), 100)
    return [anuncio_publico(db, s) for s in rows if s.get('ativo')]


@router.get('/prestadores/{uid}/avaliacoes')
def avaliacoes_publicas(uid: str, db=Depends(banco)):
    documento(db, 'perfis_prestadores', uid)  # valida o identificador
    rows = listar(filtrar(db.collection('avaliacoes'), 'prestador_uid', uid).order_by('criado_em', direction='DESCENDING'), 20)
    return [{k: r.get(k) for k in ('id', 'nota', 'comentario', 'criado_em')} for r in rows]


@router.get('/me/servicos')
def meus_servicos(user=Depends(usuario), db=Depends(banco)):
    return listar(filtrar(db.collection('servicos'), 'prestador_uid', user['uid']).order_by('criado_em', direction='DESCENDING'), 100)


@router.get('/servicos/{service_id}')
def servico(service_id: str, db=Depends(banco)):
    service = ler(db, 'servicos', service_id)
    if not service.get('ativo'):
        raise HTTPException(404, 'Serviço indisponível.')
    return anuncio_publico(db, service)


def dados_servico(body, user, db):
    profile = ler(db, 'perfis_prestadores', user['uid'])
    category = ler(db, 'categorias', body.categoria_id)
    kind = ler(db, 'tipos_servico', body.tipo_servico_id)
    if not category.get('ativo') or not kind.get('ativo') or kind['categoria_id'] != body.categoria_id:
        raise HTTPException(400, 'Tipo de serviço incompatível com a categoria.')
    return {**body.model_dump(), 'unidade': kind['unidade'], 'prestador_uid': user['uid'],
            **{k: profile[k] for k in ('instituicao_id', 'cidade', 'estado')}, 'atualizado_em': firestore.SERVER_TIMESTAMP}


@router.post('/servicos', status_code=201)
def publicar(body: Servico, user=Depends(usuario), db=Depends(banco)):
    data = dados_servico(body, user, db)
    ref = db.collection('servicos').document()
    ref.create({**data, 'criado_em': firestore.SERVER_TIMESTAMP})
    return ler(db, 'servicos', ref.id)


@router.put('/servicos/{service_id}')
def editar(service_id: str, body: Servico, user=Depends(usuario), db=Depends(banco)):
    existing = ler(db, 'servicos', service_id)
    if existing['prestador_uid'] != user['uid']:
        raise HTTPException(403, 'Este anúncio pertence a outra pessoa.')
    documento(db, 'servicos', service_id).update(dados_servico(body, user, db))
    return ler(db, 'servicos', service_id)


@router.delete('/servicos/{service_id}')
def pausar(service_id: str, user=Depends(usuario), db=Depends(banco)):
    existing = ler(db, 'servicos', service_id)
    if existing['prestador_uid'] != user['uid']:
        raise HTTPException(403, 'Este anúncio pertence a outra pessoa.')
    # Exclusão lógica: pedidos antigos continuam com seu histórico e referência.
    documento(db, 'servicos', service_id).update({'ativo': False, 'atualizado_em': firestore.SERVER_TIMESTAMP})
    return {'ativo': False}


@router.get('/me/salvos')
def salvos(user=Depends(usuario), db=Depends(banco)):
    refs = db.collection('usuarios').document(user['uid']).collection('salvos').limit(100).stream()
    result = []
    for saved in refs:
        snapshot = documento(db, 'servicos', saved.id).get()
        if snapshot.exists and snapshot.to_dict().get('ativo'):
            result.append(anuncio_publico(db, {'id': snapshot.id, **snapshot.to_dict()}))
    return result


@router.put('/me/salvos/{service_id}')
def salvar(service_id: str, user=Depends(usuario), db=Depends(banco)):
    service = ler(db, 'servicos', service_id)
    if not service.get('ativo'):
        raise HTTPException(404, 'Serviço indisponível.')
    db.collection('usuarios').document(user['uid']).collection('salvos').document(service_id).set({'criado_em': firestore.SERVER_TIMESTAMP})
    return {'salvo': True}


@router.delete('/me/salvos/{service_id}')
def remover_salvo(service_id: str, user=Depends(usuario), db=Depends(banco)):
    documento(db, 'servicos', service_id)  # valida o ID antes de montar o caminho
    db.collection('usuarios').document(user['uid']).collection('salvos').document(service_id).delete()
    return {'salvo': False}


@router.get('/admin/perfis')
def perfis_admin(user=Depends(administrador), db=Depends(banco)):
    return listar(db.collection('perfis_prestadores').order_by('atualizado_em', direction='DESCENDING'), 100)


@router.patch('/admin/perfis/{uid}')
def verificar(uid: str, body: Verificacao, user=Depends(administrador), db=Depends(banco)):
    ler(db, 'perfis_prestadores', uid)
    documento(db, 'perfis_prestadores', uid).update({'verificado': body.verificado,
        'verificado_por': user['uid'] if body.verificado else None,
        'verificado_em': firestore.SERVER_TIMESTAMP if body.verificado else None})
    return {'verificado': body.verificado}
