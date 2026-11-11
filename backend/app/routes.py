"""Rotas do MVP: conta, catálogo e anúncios."""
from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore

from .common import documento, filtrar, ler, listar
from .dependencies import banco, usuario
from .schemas import Servico

router = APIRouter()


@router.get('/auth/me')
def minha_conta(user=Depends(usuario)):
    """Confirma a sessão e devolve somente os dados da própria conta."""
    return user


@router.get('/catalogo')
def catalogo(db=Depends(banco)):
    """Categorias fixas usadas no formulário de anúncio."""
    return {
        nome: listar(filtrar(db.collection(nome), 'ativo', True), 100)
        for nome in ('categorias', 'tipos_servico')
    }


def anuncio_publico(service):
    """Evita devolver campos internos que possam ser adicionados ao Firestore."""
    campos = (
        'id', 'prestador_uid', 'prestador_nome', 'categoria_id',
        'tipo_servico_id', 'titulo', 'descricao', 'preco_centavos',
        'unidade', 'prazo_dias', 'criado_em',
    )
    data = {campo: service.get(campo) for campo in campos}
    data['prestador_nome'] = data.get('prestador_nome') or 'Estudante'
    return data


@router.get('/servicos')
def servicos(db=Depends(banco)):
    """Lista até 100 anúncios; a pesquisa didática é feita no React."""
    query = filtrar(db.collection('servicos'), 'ativo', True)
    return [anuncio_publico(item) for item in listar(query, 100)]


@router.get('/servicos/{service_id}')
def servico(service_id: str, db=Depends(banco)):
    item = ler(db, 'servicos', service_id)
    if not item.get('ativo'):
        raise HTTPException(404, 'Anúncio indisponível.')
    return anuncio_publico(item)


@router.get('/me/servicos')
def meus_servicos(user=Depends(usuario), db=Depends(banco)):
    query = filtrar(db.collection('servicos'), 'prestador_uid', user['uid'])
    return [anuncio_publico(item) for item in listar(query, 100)]


def dados_servico(body: Servico, user, db):
    """Valida o catálogo e completa os campos controlados pelo servidor."""
    category = ler(db, 'categorias', body.categoria_id)
    kind = ler(db, 'tipos_servico', body.tipo_servico_id)
    if not category.get('ativo') or not kind.get('ativo'):
        raise HTTPException(400, 'Categoria ou tipo indisponível.')
    if kind['categoria_id'] != body.categoria_id:
        raise HTTPException(400, 'O tipo não pertence à categoria escolhida.')
    return {
        **body.model_dump(),
        'prestador_uid': user['uid'],
        'prestador_nome': user.get('nome') or 'Estudante',
        'unidade': kind['unidade'],
        'ativo': True,
        'atualizado_em': firestore.SERVER_TIMESTAMP,
    }


@router.post('/servicos', status_code=201)
def publicar(body: Servico, user=Depends(usuario), db=Depends(banco)):
    ref = db.collection('servicos').document()
    ref.create({
        **dados_servico(body, user, db),
        'criado_em': firestore.SERVER_TIMESTAMP,
    })
    return anuncio_publico(ler(db, 'servicos', ref.id))


@router.delete('/servicos/{service_id}', status_code=204)
def excluir(service_id: str, user=Depends(usuario), db=Depends(banco)):
    item = ler(db, 'servicos', service_id)
    if item['prestador_uid'] != user['uid']:
        raise HTTPException(403, 'Este anúncio pertence a outra pessoa.')
    # A checagem de propriedade acontece antes da exclusão definitiva.
    documento(db, 'servicos', service_id).delete()
