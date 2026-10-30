# Interface Talenty

Interface em React + Vite e CSS, com página de apresentação, acesso por conta, recuperação de senha, feed de serviços e página 404. As telas e o feed de demonstração abrem sem configurar o Firebase.

## Execução local

Instale Node.js 22.12+ e execute:

```powershell
cd frontend
npm install
npm run dev
```

Abra o endereço exibido pelo Vite (normalmente http://127.0.0.1:5173). Para gerar a versão de produção: `npm run build`. Para conferir o resultado: `npm run preview`.

Neste ambiente, um Node portátil foi baixado para `.tools/` (ignorado pelo Git). Sem instalar o Node no sistema, também é possível iniciar a partir da raiz do repositório:

```powershell
$env:Path = "$PWD\.tools\node-v22.16.0-win-x64;$env:Path"
cd frontend
npm run dev
```

Validação realizada: build de produção, layouts em 1440, 1024, 768, 390 e 320 px no Chrome, menu móvel, filtro de monitorias, abertura de diálogo, fechamento por Escape e carregamento das imagens. A busca também foi conferida com termos sem acento e sem resultados.

## Organização

- `src/App.jsx`: composição da página e mensagens sobre funcionalidades futuras.
- `src/pages/`: login/cadastro, recuperação de senha, feed e 404, com seus estilos.
- `src/components/auth/`: layout compartilhado, formulários de login/cadastro e campo de senha.
- `src/components/feed/`: navegação, cards de serviços e artes dos anúncios feitas em CSS.
- `src/contexts/AuthContext.jsx`: acompanha a sessão do Firebase Authentication.
- `src/services/auth.js`: inicialização do SDK, login, cadastro, saída e recuperação de senha.
- `src/data/categories.js`: categorias, referências de preço e normalização da busca.
- `src/data/feed.js`: perfis e anúncios ilustrativos do feed.
- `src/styles.css`: estilos, cores do design e adaptações para celular e tablet.
- `public/images/`: imagens do design armazenadas localmente.

A busca filtra categorias por nome e palavras-chave, ignorando acentos. O menu móvel, os links internos e os diálogos funcionam com teclado. Os diálogos usam o elemento nativo `dialog`, com foco gerenciado pelo navegador e fechamento por Escape. A fonte DM Sans vem do Google Fonts; há fallback para sans-serif.

## Páginas e navegação

| Endereço | Tela |
|---|---|
| `/` | Apresentação da Talenty |
| `/login` | Login; alterna para cadastro na mesma estrutura |
| `/cadastro` | Mesma tela, iniciando com o formulário de cadastro |
| `/esqueci-minha-senha` | Solicitação de link de recuperação de senha |
| `/home` | Feed de demonstração acessível também a visitantes |
| `/home?categoria=monitorias` | Feed filtrado por categoria |
| `/home?aba=salvos` | Serviços salvos neste navegador |
| Qualquer outro caminho | Página 404 |

O feed tem busca por serviço, pessoa, curso, faculdade e cidade; filtros de categoria e autor; ordenação por preço, curtidas ou data; e curtidas/favoritos locais. Curtidas e favoritos permanecem neste navegador, inclusive para visitantes, e não são sincronizados com contas. Sem armazenamento local disponível, as ações continuam funcionando durante a visita. Menu lateral no desktop e barra de navegação inferior no celular.

Os perfis, depoimentos, preços, avaliações e números do feed são ilustrativos, mesmo quando há uma conta conectada. Anúncios, contratação, pedidos, chat e notificações dependem da integração com a FastAPI e o Firestore; as telas indicam esse estado. Pagamentos serão simulados, conforme o README principal. O CNPJ fictício do export foi removido.

## Ativar login, cadastro e recuperação de senha

1. No projeto Firebase do grupo, registre um aplicativo web e ative **Authentication → Sign-in method → E-mail/senha**.
2. Copie `frontend/.env.example` para `frontend/.env.local` e preencha os quatro campos `VITE_FIREBASE_*` com a configuração pública do aplicativo web.
3. Reinicie o Vite para carregar as variáveis. Cadastre uma conta de teste pela interface e confira a criação em **Authentication → Users**.
4. Teste login, saída, a opção “Lembrar de mim” e a recuperação de senha. Confira os modelos de e-mail e os domínios autorizados nas configurações de Authentication.

O SDK é carregado somente quando os quatro campos de configuração existem. Sem eles, a interface informa a indisponibilidade e permite explorar a demonstração. Nenhum e-mail é enviado e nenhuma conta fictícia é criada nesse modo. A confirmação de recuperação só aparece após o Firebase aceitar a solicitação, com mensagem que não revela se uma conta existe.

O cadastro cria a identidade no Firebase Authentication e salva o nome de exibição. O perfil de prestador, a instituição e a verificação continuam sendo responsabilidade da API. Não há leitura ou escrita direta no Firestore. Senhas não são gravadas em `localStorage` pelo código da aplicação; a sessão é gerenciada pelo SDK do Firebase. Não coloque credenciais administrativas em variáveis `VITE_`.

Implementação baseada na documentação oficial de [autenticação por e-mail e senha](https://firebase.google.com/docs/auth/web/password-auth) e [gerenciamento de usuários e recuperação de senha](https://firebase.google.com/docs/auth/web/manage-users).

## Validação das novas telas

Build de produção aprovado. As telas de login, cadastro, recuperação, feed e 404 foram verificadas no Chrome em 1440, 1024, 768, 390 e 320 px. Foram conferidos: troca de formulário, exibição da senha, confirmação de senhas diferentes, estado sem Firebase configurado, busca sem acentos, categorias, favoritos/curtidas após recarregar, navegação móvel e fechamento de modal por Escape. A verificação usou interceptação de arquivos do build no navegador, sem iniciar um servidor local.

O fluxo com contas reais e o envio de e-mail precisam ser validados com a configuração Firebase do grupo; não foram executados contra um projeto em nuvem nesta etapa.

As imagens são as referências fornecidas no export do design, copiadas para arquivos locais. Confirmar direitos de uso antes de qualquer publicação fora da apresentação acadêmica.
