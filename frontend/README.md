# Interface Talenty

React + Vite e CSS, com Firebase Authentication para sessão e FastAPI para todos os dados. O feed usa anúncios reais do Firestore, sem substituição automática por dados fictícios quando a API falha.

## Rodar

Em um terminal na raiz:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Abra o endereço indicado pelo Vite, normalmente http://127.0.0.1:5173. Em outro terminal, inicie [o backend](../backend/README.md). Neste computador, `frontend/.env.local` já contém a configuração pública Firebase e `VITE_API_URL`. Para outro computador, copie `.env.example` para `.env.local` e preencha. Reinicie o Vite depois de alterar esse arquivo.

`npm.cmd run build` gera a versão de produção. Para parar o terminal, use `Ctrl+C`.

## Páginas

| Caminho | Função |
|---|---|
| `/` | Apresentação |
| `/login`, `/cadastro` | Mesma página, alternando o formulário |
| `/esqueci-minha-senha` | Link de recuperação pelo Firebase |
| `/home` | Feed público com categoria, busca e paginação |
| `/home?aba=salvos` | Favoritos da conta |
| `/perfil` | Editar nome público, curso, instituição, cidade e biografia |
| `/prestadores/{uid}` | Perfil público e anúncios ativos |
| `/servicos/novo` | Publicar após completar o perfil |
| `/servicos/{id}` | Detalhes e solicitação de orçamento |
| `/servicos/{id}/editar` | Editar ou pausar um anúncio próprio |
| `/meus-servicos` | Anúncios ativos e pausados |
| `/pedidos` | Pedidos como cliente ou prestador |
| `/pedidos/{id}` | Etapas, pagamento simulado, entrega, avaliação e conversa |
| `/mensagens` | Escolher um pedido para conversar |
| `/admin` | Conferir e conceder/remover o selo estudantil |
| Outros caminhos | 404 |

Favoritos são privados e ficam no banco, associados à conta. A pesquisa filtra título, descrição e nome público entre os anúncios já carregados; o botão “Carregar mais” amplia a lista. Mensagens e pedidos têm atualização manual. A interface indica carregamento, erro e ausência de resultados. Uma pessoa pode contratar e prestar serviços usando a mesma conta.

## Como estudar o código

1. `src/main.jsx` escolhe a página pelo caminho. Usamos links comuns, sem dependência de roteador.
2. `src/contexts/AuthContext.jsx` acompanha a sessão Firebase.
3. `src/services/auth.js` faz login, cadastro, saída e recuperação.
4. `src/services/api.js` chama a FastAPI e envia o ID token nas rotas protegidas.
5. `src/hooks/useApi.js` reúne carregamento e erro de consultas simples.
6. `src/components/AppLayout.jsx` compartilha cabeçalho, menu e proteção visual das páginas. A proteção efetiva dos dados é feita pela API.
7. Cada arquivo em `src/pages/` contém o fluxo da própria página. `ServiceCard.jsx` é o anúncio do feed.
8. `Feed.css` define a grade compartilhada; `Workspace.css` define formulários, cards e estados das páginas internas.

Nenhum componente lê ou escreve diretamente no Firestore. O Firebase SDK gerencia a sessão; a aplicação não armazena senhas ou tokens manualmente. Credenciais administrativas nunca devem ficar nesta pasta ou em variáveis `VITE_`.

## Roteiro para testar com duas contas

1. Na primeira conta, complete `/perfil`, publique um serviço e confira o feed.
2. Em outro navegador ou janela anônima, entre com a segunda conta e solicite o serviço.
3. Na primeira conta, abra “Meus pedidos → Recebi pedidos” e envie o orçamento.
4. Na segunda, aceite e simule o pagamento.
5. Na primeira, registre a entrega; na segunda, aprove e avalie.
6. Troque mensagens e use “Atualizar mensagens”. Teste os favoritos e pause/reative o anúncio.

Não há cobrança real. O backend já foi validado com contas temporárias no Firebase real. O build e as telas públicas/proteções foram conferidos no Chrome em 1440, 1024, 768, 390 e 320 px, sem iniciar um servidor local para a verificação. As páginas autenticadas também foram conferidas em 1440, 390 e 320 px com sessão de teste e respostas simuladas da API no navegador, incluindo o envio de perfil e mensagem. Essa verificação visual é separada do teste da API com o Firebase real.
