# Interface Talenty

Interface React + Vite do MVP. O Firebase SDK cuida da sessão e a FastAPI cuida dos dados.

## Páginas

| Caminho | Função |
|---|---|
| `/` | apresentação do projeto |
| `/login` e `/cadastro` | autenticação |
| `/home` | anúncios, pesquisa e categorias |
| `/servicos/novo` | criação de anúncio |
| `/servicos/{id}` | detalhes do anúncio |
| `/meus-servicos` | anúncios próprios e exclusão |
| `/meus-interesses` | interesses enviados e contatos liberados |
| `/perfil` | dados e indicadores da conta |

## Executar

```powershell
cd frontend
npm install
npm run dev
```

O Vite lê o `.env` da raiz por meio de `envDir: '..'`. Apenas variáveis iniciadas por `VITE_` são expostas ao navegador. Nunca coloque a credencial do Firebase Admin em uma variável `VITE_`.

## Ordem de leitura

1. `src/main.jsx` escolhe a página pelo caminho.
2. `src/contexts/AuthContext.jsx` acompanha a sessão.
3. `src/services/auth.js` faz cadastro, login e logout.
4. `src/services/api.js` chama a API e adiciona o token.
5. `src/pages/FeedPage.jsx` implementa pesquisa e filtro.
6. `src/pages/ServiceFormPage.jsx` cria anúncios com WhatsApp protegido.
7. `src/pages/MyServicesPage.jsx` gerencia anúncios e aceita interessados.
8. `src/pages/InterestsPage.jsx` libera o WhatsApp somente após o aceite.
