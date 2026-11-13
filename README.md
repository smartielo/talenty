# Talenty

> Projeto acadêmico do 4º semestre de Ciência da Computação - UNISAGRADO (2º semestre de 2026).
>
> **Arquitetura atual escolhida pelo grupo:** React + Vite (local), FastAPI (local), Firebase Authentication e Cloud Firestore (nuvem).

**Integrantes:** Gabriel Martielo e João Diniz  
**Objetivo do MVP:** demonstrar cadastro, login, criação, pesquisa e exclusão de anúncios de serviços.

## Fluxo principal

1. O usuário cria uma conta ou entra com e-mail e senha.
2. O Firebase Authentication confirma a identidade.
3. O usuário publica um anúncio sem precisar preencher um perfil complementar.
4. O feed permite pesquisar por título, descrição ou autor e filtrar por categoria.
5. Em **Meus anúncios**, somente o proprietário pode excluir seu anúncio.

## Como configurar e rodar o projeto

### Pré-requisitos

- Windows com **Python 3.11 ou superior**;
- **Node.js e npm**;
- acesso à internet;
- um projeto Firebase com **Authentication por e-mail/senha** e **Cloud Firestore** ativados.

### 1. Configurar o Firebase

No Firebase Console:

1. ative **Authentication → Sign-in method → Email/Password**;
2. crie o banco em **Firestore Database**;
3. registre um aplicativo Web e copie a configuração pública;
4. em **Configurações do projeto → Contas de serviço**, gere uma nova chave privada.

Salve o JSON privado fora do repositório, por exemplo:

```text
C:\vscode\firebase\credencial-firebase.json
```

Nunca coloque esse JSON em `frontend/`, em uma variável `VITE_` ou no Git.

### 2. Criar o arquivo de ambiente

Na raiz do projeto, copie o modelo:

```powershell
Copy-Item .env.example .env
```

Abra `.env` e preencha o projeto, o caminho da credencial JSON e a configuração pública do aplicativo Web.
O caminho da credencial pode usar `/` no Windows.
Nesta branch, o `.env` deve ficar **na raiz**; não use `backend/.env` ou `.env.local` para essa configuração.

### 3. Iniciar o backend

Em um terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Confirme em <http://127.0.0.1:8000/health>. O resultado esperado é `status: ok`.

### 4. Iniciar o frontend

Em outro terminal, mantenha o backend aberto e execute:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Abra o endereço exibido pelo Vite, normalmente <http://127.0.0.1:5173>.
Se alterar o `.env`, reinicie o backend e o Vite. Os dois processos precisam estar rodando ao mesmo tempo.

Endereços locais:

- interface: `http://127.0.0.1:5173`;
- API: `http://127.0.0.1:8000`;
- documentação interativa: `http://127.0.0.1:8000/docs`.

## Estrutura para estudo

```text
frontend/src/services/auth.js       cadastro, login e logout
frontend/src/services/api.js        chamadas HTTP e envio do token
frontend/src/pages/FeedPage.jsx     listagem, filtro e pesquisa
frontend/src/pages/ServiceFormPage.jsx  criação do anúncio
frontend/src/pages/MyServicesPage.jsx  exclusão do anúncio
backend/app/dependencies.py         validação do token e criação da conta
backend/app/routes.py               catálogo e CRUD reduzido de anúncios
backend/app/schemas.py              validação dos dados recebidos
backend/app/config.py               leitura do .env único
```

## Segurança mantida

- senhas são tratadas apenas pelo Firebase Authentication;
- o navegador envia um Firebase ID token para as rotas protegidas;
- a API obtém o UID do token e nunca confia em um UID enviado pelo formulário;
- campos extras são recusados pelo Pydantic;
- a exclusão confere se o usuário autenticado é dono do anúncio;
- o frontend não acessa o Firestore diretamente.

## Testes

```powershell
cd backend
python -m pytest -q
cd ..\frontend
npm run build
```

O teste de integração real é opcional e só roda quando `TALENTY_LIVE_TEST=1`.

## Documentação acadêmica

Os requisitos do professor estão em `docs/requisitos-documentacao-prof.md`. A documentação completa do MVP é gerada em `docs/documentacao-talenty.docx`, seguindo o modelo institucional e o guia de normalização do UNISAGRADO.
