"""A identidade vem do Firebase, nunca de um UID enviado no formulário."""
import logging
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.api_core.exceptions import AlreadyExists
from firebase_admin import firestore, auth
from .firebase import get_firestore, verify_id_token

bearer = HTTPBearer(auto_error=False)


def banco():
    try:
        return get_firestore()
    except Exception:
        logging.exception('Não foi possível inicializar o Firebase Admin')
        raise HTTPException(503, 'Banco indisponível. Confira a configuração do backend.')


def usuario(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db=Depends(banco)):
    if not credentials or credentials.scheme.lower() != 'bearer':
        raise HTTPException(401, 'Entre na sua conta para continuar.', headers={'WWW-Authenticate': 'Bearer'})
    try:
        claims = verify_id_token(credentials.credentials)
    except (auth.InvalidIdTokenError, auth.ExpiredIdTokenError, auth.RevokedIdTokenError, auth.UserDisabledError, ValueError):
        raise HTTPException(401, 'Sua sessão expirou. Entre novamente.', headers={'WWW-Authenticate': 'Bearer'})
    except Exception:
        logging.exception('Falha ao verificar o token Firebase')
        raise HTTPException(503, 'Autenticação indisponível no momento.')
    uid = claims['uid']
    ref = db.collection('usuarios').document(uid)
    snapshot = ref.get()
    if not snapshot.exists:
        data = {'uid': uid, 'nome': claims.get('name', 'Estudante'), 'email': claims.get('email', ''),
                'papel': 'USUARIO', 'ativo': True, 'criado_em': firestore.SERVER_TIMESTAMP,
                'atualizado_em': firestore.SERVER_TIMESTAMP}
        try:
            ref.create(data)
        except AlreadyExists:
            pass
        snapshot = ref.get()
    data = snapshot.to_dict()
    if not data.get('ativo'):
        raise HTTPException(403, 'Conta desativada.')
    return {**data, 'uid': uid}


def administrador(user=Depends(usuario)):
    if user.get('papel') != 'ADMIN':
        raise HTTPException(403, 'Acesso exclusivo da administração.')
    return user
