# Talenty

> Projeto acadêmico do 4º semestre de Ciência da Computação - UNISAGRADO (2º semestre de 2026).
>
> **Arquitetura atual escolhida pelo grupo:** React + Vite (local), FastAPI (local), Firebase Authentication e Cloud Firestore (nuvem).

**Integrantes:** Gabriel Martielo e João Diniz  
**Objetivo do MVP:** demonstrar cadastro, login, criação e pesquisa de anúncios, interesse de clientes e liberação segura do contato.

## Fluxo principal

1. O usuário cria uma conta ou entra com e-mail e senha.
2. O Firebase Authentication confirma a identidade.
3. O usuário publica um anúncio sem precisar preencher um perfil complementar.
4. O feed permite pesquisar por título, descrição ou autor e filtrar por categoria.
5. O cliente demonstra interesse sem visualizar o telefone do anunciante.
6. Em **Meus anúncios**, o proprietário vê a quantidade de interessados e aceita ou recusa cada pessoa.
7. Somente após o aceite, o cliente recebe um botão para conversar com o anunciante pelo WhatsApp.

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
frontend/src/pages/InterestsPage.jsx   acompanhamento dos interesses e WhatsApp
frontend/src/pages/ProfilePage.jsx     perfil e indicadores da conta
backend/app/dependencies.py         validação do token e criação da conta
backend/app/routes.py               catálogo, anúncios, perfil e interesses
backend/app/schemas.py              validação dos dados recebidos
backend/app/config.py               leitura do .env único
```

## Roteiro técnico para apresentação

Use esta sequência para explicar o projeto sem precisar decorar cada arquivo:

1. **React/Vite:** renderiza as páginas, mantém os estados da interface e chama a API.
2. **Firebase Authentication:** realiza cadastro/login e entrega um ID token assinado.
3. **FastAPI:** recebe o token no cabeçalho `Authorization`, identifica o usuário e aplica as regras de negócio.
4. **Cloud Firestore:** armazena usuários, catálogo, anúncios e manifestações de interesse.
5. **Privacidade:** a versão pública do anúncio nunca contém o telefone; essa filtragem acontece no backend.
6. **Aceite:** o anunciante muda o interesse para `ACEITO`; somente então a API inclui `whatsapp_url` na resposta daquele cliente.
7. **Autorização:** criar, aceitar, recusar ou excluir exige token, e o backend compara o UID autenticado com o dono do registro.

Fluxo resumido:

```text
Navegador -> Firebase Authentication -> ID token
Navegador -> FastAPI + ID token -> validação -> Firestore
Firestore -> FastAPI filtra dados privados -> Navegador
```

### Limite de 100 registros

O uso de `listar(query, 100)` limita apenas uma consulta para proteger o MVP de leituras muito grandes. O Firestore pode armazenar mais registros, mas a interface atual mostra no máximo 100 por listagem. A evolução planejada é usar paginação com cursor e contagens agregadas.

## Segurança mantida

- senhas são tratadas apenas pelo Firebase Authentication;
- o navegador envia um Firebase ID token para as rotas protegidas;
- a API obtém o UID do token e nunca confia em um UID enviado pelo formulário;
- campos extras são recusados pelo Pydantic;
- a exclusão confere se o usuário autenticado é dono do anúncio;
- o telefone nunca é incluído nas respostas públicas de anúncios;
- somente o cliente aceito recebe o telefone e o link do WhatsApp;
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
