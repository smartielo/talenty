"""Rotas do MVP: conta, catálogo, anúncios e manifestações de interesse."""
from hashlib import sha256

from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore
from google.api_core.exceptions import AlreadyExists

from .common import documento, filtrar, ler, listar
from .dependencies import banco, usuario
from .schemas import DecisaoInteresse, PerfilAtualizacao, Servico, TelefoneContato

router = APIRouter()


# ---------------------------------------------------------------------------
# Conta e perfil
# ---------------------------------------------------------------------------


@router.get('/auth/me')
def minha_conta(user=Depends(usuario)):
    """Confirma a sessão e devolve somente os dados da própria conta."""
    return user


def perfil_do_usuario(user, db):
    """Monta o resumo exibido na página de perfil.

    As consultas usam limite 100 por serem adequadas ao MVP. Para produção,
    totais devem usar a agregação ``count`` do Firestore, sem baixar registros.
    """
    anuncios = listar(filtrar(db.collection('servicos'), 'prestador_uid', user['uid']), 100)
    interesses = listar(filtrar(db.collection('interesses'), 'cliente_uid', user['uid']), 100)
    return {
        'uid': user['uid'],
        'nome': user.get('nome') or 'Estudante',
        'email': user.get('email') or '',
        'criado_em': user.get('criado_em'),
        'quantidade_anuncios': len(anuncios),
        'quantidade_interesses': len(interesses),
    }


@router.get('/me/perfil')
def meu_perfil(user=Depends(usuario), db=Depends(banco)):
    """Devolve somente o perfil da pessoa identificada pelo token."""
    return perfil_do_usuario(user, db)


@router.patch('/me/perfil')
def atualizar_perfil(body: PerfilAtualizacao, user=Depends(usuario), db=Depends(banco)):
    """Atualiza o nome no Firestore; e-mail e UID continuam imutáveis."""
    ref = documento(db, 'usuarios', user['uid'])
    ref.update({'nome': body.nome, 'atualizado_em': firestore.SERVER_TIMESTAMP})
    return perfil_do_usuario({**user, 'nome': body.nome}, db)


# ---------------------------------------------------------------------------
# Catálogo e representação pública dos anúncios
# ---------------------------------------------------------------------------


@router.get('/catalogo')
def catalogo(db=Depends(banco)):
    """Categorias fixas usadas no formulário de anúncio."""
    return {
        nome: listar(filtrar(db.collection(nome), 'ativo', True), 100)
        for nome in ('categorias', 'tipos_servico')
    }


def anuncio_publico(service):
    """Cria a versão segura de um anúncio que qualquer visitante pode ver.

    A lista permitida é explícita. Assim, mesmo que novos campos privados sejam
    adicionados no Firestore, eles não vazam automaticamente pela API. O campo
    ``telefone_contato`` é propositalmente omitido aqui.
    """
    campos = (
        'id', 'prestador_uid', 'prestador_nome', 'categoria_id',
        'tipo_servico_id', 'titulo', 'descricao', 'preco_centavos',
        'unidade', 'prazo_dias', 'criado_em',
    )
    data = {campo: service.get(campo) for campo in campos}
    data['prestador_nome'] = data.get('prestador_nome') or 'Estudante'
    return data


def interesses_do_anuncio(db, service_id):
    """Lista manifestações ligadas a um anúncio para uso interno do backend."""
    return listar(filtrar(db.collection('interesses'), 'servico_id', service_id), 100)


def anuncio_do_dono(service, db):
    """Acrescenta telefone e contagens somente à visão autenticada do dono."""
    data = anuncio_publico(service)
    interesses = interesses_do_anuncio(db, service['id'])
    data.update({
        'telefone_contato': service.get('telefone_contato'),
        'interessados_quantidade': len(interesses),
        'interessados_pendentes': sum(item.get('status') == 'PENDENTE' for item in interesses),
    })
    return data


@router.get('/servicos')
def servicos(db=Depends(banco)):
    """Lista até 100 anúncios; a pesquisa didática é feita no React."""
    query = filtrar(db.collection('servicos'), 'ativo', True)
    return [anuncio_publico(item) for item in listar(query, 100)]


@router.get('/servicos/{service_id}')
def servico(service_id: str, db=Depends(banco)):
    """Busca um anúncio público pelo ID, sem expor o contato privado."""
    item = ler(db, 'servicos', service_id)
    if not item.get('ativo'):
        raise HTTPException(404, 'Anúncio indisponível.')
    return anuncio_publico(item)


# ---------------------------------------------------------------------------
# Criação e gerenciamento dos anúncios do usuário
# ---------------------------------------------------------------------------


@router.get('/me/servicos')
def meus_servicos(user=Depends(usuario), db=Depends(banco)):
    """Lista anúncios próprios com as contagens de pessoas interessadas."""
    query = filtrar(db.collection('servicos'), 'prestador_uid', user['uid'])
    return [anuncio_do_dono(item, db) for item in listar(query, 100)]


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
        # O proprietário vem do token validado, nunca do JSON do formulário.
        'prestador_uid': user['uid'],
        'prestador_nome': user.get('nome') or 'Estudante',
        'unidade': kind['unidade'],
        'ativo': True,
        'atualizado_em': firestore.SERVER_TIMESTAMP,
    }


@router.post('/servicos', status_code=201)
def publicar(body: Servico, user=Depends(usuario), db=Depends(banco)):
    """Cria um anúncio e deixa timestamps/identidade sob controle do servidor."""
    ref = db.collection('servicos').document()
    ref.create({
        **dados_servico(body, user, db),
        'criado_em': firestore.SERVER_TIMESTAMP,
    })
    return anuncio_publico(ler(db, 'servicos', ref.id))


@router.patch('/servicos/{service_id}/telefone')
def atualizar_telefone(service_id: str, body: TelefoneContato,
                       user=Depends(usuario), db=Depends(banco)):
    """Permite completar o WhatsApp de anúncios criados antes desse recurso."""
    item = ler(db, 'servicos', service_id)
    if item['prestador_uid'] != user['uid']:
        raise HTTPException(403, 'Este anúncio pertence a outra pessoa.')
    documento(db, 'servicos', service_id).update({
        'telefone_contato': body.telefone_contato,
        'atualizado_em': firestore.SERVER_TIMESTAMP,
    })
    return anuncio_do_dono(ler(db, 'servicos', service_id), db)


def id_interesse(service_id, uid):
    """Gera um ID estável para existir no máximo um interesse por cliente/anúncio."""
    return sha256(f'{service_id}:{uid}'.encode()).hexdigest()


def interesse_para_cliente(item, service):
    """Monta a visão do cliente e aplica a regra de privacidade do telefone.

    Enquanto o status não for ACEITO, nem o número nem a URL do WhatsApp são
    inseridos na resposta. A proteção acontece no backend, não apenas na tela.
    """
    data = {
        'id': item['id'],
        'servico_id': item['servico_id'],
        'servico_titulo': service.get('titulo') or 'Anúncio removido',
        'prestador_nome': service.get('prestador_nome') or 'Estudante',
        'status': item.get('status', 'PENDENTE'),
        'criado_em': item.get('criado_em'),
        'atualizado_em': item.get('atualizado_em'),
    }
    telefone = service.get('telefone_contato')
    if data['status'] == 'ACEITO' and telefone:
        data['telefone_contato'] = telefone
        data['whatsapp_url'] = f'https://wa.me/{telefone}'
    return data


# ---------------------------------------------------------------------------
# Fluxo de interesse e liberação do WhatsApp
# ---------------------------------------------------------------------------


@router.post('/servicos/{service_id}/interesses', status_code=201)
def demonstrar_interesse(service_id: str, user=Depends(usuario), db=Depends(banco)):
    """Registra a intenção de um cliente sem revelar o telefone do anunciante."""
    service = ler(db, 'servicos', service_id)
    if not service.get('ativo'):
        raise HTTPException(404, 'Anúncio indisponível.')
    if service['prestador_uid'] == user['uid']:
        raise HTTPException(400, 'Você não pode demonstrar interesse no próprio anúncio.')
    if not service.get('telefone_contato'):
        raise HTTPException(409, 'O anunciante ainda precisa adicionar um telefone de contato.')

    ref = documento(db, 'interesses', id_interesse(service_id, user['uid']))
    data = {
        'servico_id': service_id,
        'prestador_uid': service['prestador_uid'],
        'cliente_uid': user['uid'],
        'cliente_nome': user.get('nome') or 'Estudante',
        'cliente_email': user.get('email') or '',
        'status': 'PENDENTE',
        'criado_em': firestore.SERVER_TIMESTAMP,
        'atualizado_em': firestore.SERVER_TIMESTAMP,
    }
    try:
        # ``create`` falha se o ID já existir. Como o ID é determinístico, isso
        # torna o endpoint idempotente e evita cliques duplicados.
        ref.create(data)
    except AlreadyExists:
        pass
    return interesse_para_cliente(ler(db, 'interesses', ref.id), service)


@router.get('/servicos/{service_id}/meu-interesse')
def meu_interesse(service_id: str, user=Depends(usuario), db=Depends(banco)):
    """Consulta o estado do interesse do usuário no anúncio aberto."""
    service = ler(db, 'servicos', service_id)
    snapshot = documento(db, 'interesses', id_interesse(service_id, user['uid'])).get()
    if not snapshot.exists:
        return None
    return interesse_para_cliente({'id': snapshot.id, **snapshot.to_dict()}, service)


@router.get('/me/interesses')
def meus_interesses(user=Depends(usuario), db=Depends(banco)):
    """Alimenta a página que acompanha interesses pendentes, aceitos e recusados."""
    items = listar(filtrar(db.collection('interesses'), 'cliente_uid', user['uid']), 100)
    result = []
    for item in items:
        snapshot = documento(db, 'servicos', item['servico_id']).get()
        service = {'id': item['servico_id'], 'titulo': 'Anúncio removido'}
        if snapshot.exists:
            service.update(snapshot.to_dict())
        result.append(interesse_para_cliente(item, service))
    return result


@router.get('/me/servicos/{service_id}/interesses')
def interessados(service_id: str, user=Depends(usuario), db=Depends(banco)):
    """Mostra ao dono as pessoas interessadas, após validar a propriedade."""
    service = ler(db, 'servicos', service_id)
    if service['prestador_uid'] != user['uid']:
        raise HTTPException(403, 'Este anúncio pertence a outra pessoa.')
    return [{
        'id': item['id'],
        'cliente_nome': item.get('cliente_nome') or 'Estudante',
        'cliente_email': item.get('cliente_email') or '',
        'status': item.get('status', 'PENDENTE'),
        'criado_em': item.get('criado_em'),
    } for item in interesses_do_anuncio(db, service_id)]


@router.patch('/me/servicos/{service_id}/interesses/{interest_id}')
def decidir_interesse(service_id: str, interest_id: str, body: DecisaoInteresse,
                      user=Depends(usuario), db=Depends(banco)):
    """Aceita ou recusa uma pessoa; ACEITO libera o contato na próxima consulta."""
    service = ler(db, 'servicos', service_id)
    if service['prestador_uid'] != user['uid']:
        raise HTTPException(403, 'Este anúncio pertence a outra pessoa.')
    interest = ler(db, 'interesses', interest_id)
    if interest['servico_id'] != service_id or interest['prestador_uid'] != user['uid']:
        raise HTTPException(404, 'Interesse não encontrado para este anúncio.')
    documento(db, 'interesses', interest_id).update({
        'status': body.status,
        'atualizado_em': firestore.SERVER_TIMESTAMP,
    })
    return {'id': interest_id, 'status': body.status}


@router.delete('/servicos/{service_id}', status_code=204)
def excluir(service_id: str, user=Depends(usuario), db=Depends(banco)):
    """Exclui o anúncio e remove interesses associados para minimizar dados pessoais."""
    item = ler(db, 'servicos', service_id)
    if item['prestador_uid'] != user['uid']:
        raise HTTPException(403, 'Este anúncio pertence a outra pessoa.')
    for interest in interesses_do_anuncio(db, service_id):
        documento(db, 'interesses', interest['id']).delete()
    # A checagem de propriedade acontece antes da exclusão definitiva.
    documento(db, 'servicos', service_id).delete()
