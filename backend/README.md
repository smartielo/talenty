# API Talenty

API FastAPI do MVP. Ela verifica o Firebase ID token e usa o Firebase Admin SDK para acessar o Cloud Firestore.

## Arquivos principais

1. `app/config.py`: lê o `.env` único da raiz.
2. `app/main.py`: cria a API e configura o CORS.
3. `app/dependencies.py`: autentica o usuário e cria `usuarios/{uid}` no primeiro acesso.
4. `app/schemas.py`: aceita apenas os campos do anúncio.
5. `app/routes.py`: contém catálogo, listagem, criação e exclusão.

## Rotas

| Método e caminho | Função | Acesso |
|---|---|---|
| `GET /health` | verificar a API | público |
| `GET /catalogo` | listar categorias e tipos | público |
| `GET /servicos` | listar anúncios | público |
| `GET /servicos/{id}` | detalhar anúncio | público |
| `GET /auth/me` | confirmar a conta | autenticado |
| `GET /me/servicos` | listar anúncios próprios | autenticado |
| `POST /servicos` | criar anúncio | autenticado |
| `DELETE /servicos/{id}` | excluir anúncio próprio | autenticado |

## Executar e testar

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
.\.venv\Scripts\python.exe -m pytest -q
```

A configuração fica em `.env` na raiz do projeto (`../.env` a partir desta pasta). O arquivo
`GOOGLE_APPLICATION_CREDENTIALS` deve apontar para a chave privada JSON do Firebase Admin,
preferencialmente fora do repositório. Consulte o README da raiz para o passo a passo completo.
