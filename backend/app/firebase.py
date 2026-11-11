"""Inicialização do Admin SDK. Não reutiliza nem extrai tokens da Firebase CLI."""
import os
from functools import lru_cache
from .config import carregar_configuracao


@lru_cache
def get_firebase_app():
    import firebase_admin

    carregar_configuracao()
    project = os.environ.get('FIREBASE_PROJECT_ID')
    if not project:
        raise RuntimeError('Defina FIREBASE_PROJECT_ID no backend/.env.')
    try:
        return firebase_admin.get_app('talenty-backend')
    except ValueError:
        return firebase_admin.initialize_app(options={'projectId': project}, name='talenty-backend')


def get_firestore():
    from firebase_admin import firestore
    app = get_firebase_app()
    return firestore.client(app=app, database_id=os.environ.get('FIRESTORE_DATABASE_ID', '(default)'))


def verify_id_token(token: str):
    from firebase_admin import auth
    app = get_firebase_app()
    # No emulador, não há sessão/revogação real a consultar.
    return auth.verify_id_token(token, app=app, check_revoked=not bool(os.environ.get('FIREBASE_AUTH_EMULATOR_HOST')))
