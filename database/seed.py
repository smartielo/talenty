"""Seed idempotente: python -m database.seed. Sem --apply, apenas mostra o plano."""
import argparse
import json
import os
from collections import Counter
from datetime import datetime, timezone


def criar_dados():
    now = datetime.now(timezone.utc)
    records = []
    def add(collection, document_id, **data):
        records.append((collection, document_id, {**data, 'demonstracao': True, 'criado_em': now}))

    categories = [
        ('sites', 'Sites', 'Criação de sites e portfólios', 14900, 'SERVICO'),
        ('design', 'Design', 'Identidade visual e peças gráficas', 7900, 'SERVICO'),
        ('textos', 'Textos', 'Revisão e formatação de textos', 4900, 'SERVICO'),
        ('video', 'Vídeo & Reels', 'Edição de vídeos curtos', 9900, 'SERVICO'),
        ('monitorias', 'Monitorias', 'Aulas de apoio aos estudos', 3900, 'HORA'),
        ('dados', 'Planilhas & Dados', 'Organização e análise de dados', 6900, 'SERVICO'),
    ]
    for category_id, name, description, price, unit in categories:
        add('categorias', category_id, nome=name, slug=category_id, descricao=description, ativo=True)
        add('tipos_servico', f'{category_id}-basico', categoria_id=category_id, nome=f'{name} básico',
            descricao=description, preco_referencia_centavos=price, unidade=unit, ativo=True)

    return records


def aplicar_dados(db, records):
    from google.api_core.exceptions import AlreadyExists
    result = Counter()
    for collection, document_id, data in records:
        try:
            # create falha se o documento existe. Nunca usar set() para este seed.
            db.collection(collection).document(document_id).create(data)
            result['criados'] += 1
        except AlreadyExists:
            result['preservados'] += 1
    return dict(result)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true', help='Gravar o plano; o padrão é somente visualizar.')
    parser.add_argument('--production', action='store_true', help='Permitir gravação no projeto real informado.')
    parser.add_argument('--project', help='Obrigatório ao usar --production.')
    args = parser.parse_args(argv)
    if args.production and not args.project:
        parser.error('--production exige --project explícito.')
    project = args.project or 'demo-talenty'
    if not args.production and not project.startswith('demo-'):
        parser.error('No emulador, use um projeto demo- para evitar confusão com dados reais.')
    if args.production and os.environ.get('FIRESTORE_EMULATOR_HOST'):
        parser.error('Remova FIRESTORE_EMULATOR_HOST antes de escolher --production.')
    if args.apply and not args.production and not os.environ.get('FIRESTORE_EMULATOR_HOST'):
        parser.error('Defina FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 para gravar no emulador.')
    records = criar_dados()
    print(json.dumps({'projeto': project, 'destino': 'nuvem' if args.production else 'emulador',
                      'modo': 'gravar' if args.apply else 'somente plano',
                      'documentos': dict(Counter(record[0] for record in records)),
                      'contas_auth_criadas': 0}, ensure_ascii=False, indent=2))
    if not args.apply:
        return
    import firebase_admin
    from firebase_admin import firestore
    from google.auth.credentials import AnonymousCredentials
    from google.cloud.firestore import Client
    if args.production:
        app = firebase_admin.initialize_app(options={'projectId': project}, name='talenty-seed')
        db = firestore.client(app=app)
    else:
        db = Client(project=project, credentials=AnonymousCredentials())
    server_records = [(collection, document_id, {field: firestore.SERVER_TIMESTAMP if field in {'criado_em', 'atualizado_em'} else value for field, value in data.items()}) for collection, document_id, data in records]
    print(json.dumps(aplicar_dados(db, server_records), ensure_ascii=False))


if __name__ == '__main__':
    main()
