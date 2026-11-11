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

## Executar

Copie `.env.example` para `.env` na raiz e preencha as configurações. As variáveis públicas do frontend e o caminho da credencial privada do backend ficam centralizados nesse arquivo. O JSON do Firebase Admin permanece separado e nunca deve ser versionado.

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Frontend, em outro terminal:

```powershell
cd frontend
npm install
npm run dev
```

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
