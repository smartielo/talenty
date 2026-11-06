# API Talenty

API simples com FastAPI: recebe o ID token do Firebase Authentication, verifica a identidade e acessa o Cloud Firestore com o Admin SDK. O React não acessa o banco diretamente.

## Rodar neste computador

O ambiente `.venv`, as dependências e `backend/.env` já foram preparados. A credencial privada está em `backend/credencial.json`, ignorada pelo Git. Execute a partir da raiz, em um terminal separado do frontend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Abra [Swagger](http://127.0.0.1:8000/docs) ou [saúde da API](http://127.0.0.1:8000/health). Pare com `Ctrl+C`. O endpoint de saúde confirma que a API iniciou; `/catalogo` também consulta o banco.

Para outro computador, na raiz do projeto:

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
Copy-Item backend/.env.example backend/.env
```

Preencha o `.env` com o projeto e um caminho absoluto para a credencial Admin (use `/` no caminho). Não copie a configuração local por cima de um `.env` já preenchido. A chave precisa pertencer ao projeto e ter permissão para Firestore e Firebase Authentication. O login da CLI Firebase não substitui essa credencial. Nunca coloque a chave no frontend, em `public/` ou em variáveis `VITE_`.

## Como estudar

Leia nesta ordem:

1. `app/main.py`: cria a API, configura CORS e registra as rotas.
2. `app/dependencies.py`: verifica o token e cria `usuarios/{uid}` no primeiro acesso, sempre com papel `USUARIO`.
3. `app/schemas.py`: define os campos aceitos; campos extras e valores inválidos são recusados.
4. `app/routes.py`: perfil, catálogo, serviços, favoritos e administração.
5. `app/order_routes.py`: solicitação, etapas, conversa e avaliação do pedido.
6. `app/services/pedidos.py`: transações do pagamento e da conclusão.

As consultas ficam nas próprias rotas. `common.py` contém apenas operações pequenas usadas por mais de uma rota. Não há ORM ou senha armazenada pela API.

## Rotas implementadas

| Recurso | Rotas | Permissão |
|---|---|---|
| Saúde | `GET /health` | Público |
| Catálogo | `GET /catalogo` | Público |
| Conta | `GET /auth/me`, `PUT /me/perfil` | Conta autenticada |
| Perfil público | `GET /prestadores/{uid}`, `GET /prestadores/{uid}/servicos`, `GET /prestadores/{uid}/avaliacoes` | Público, sem e-mail; 20 avaliações recentes |
| Serviços | `GET /servicos`, `GET /servicos/{id}` | Público, somente ativos |
| Meus anúncios | `GET /me/servicos`, `POST /servicos`, `PUT /servicos/{id}`, `DELETE /servicos/{id}` | Somente o dono altera |
| Favoritos | `GET /me/salvos`, `PUT /me/salvos/{id}`, `DELETE /me/salvos/{id}` | Privados por conta |
| Pedidos | `POST /pedidos`, `GET /pedidos?papel=cliente`, `GET /pedidos?papel=prestador`, `GET /pedidos/{id}` | Somente participantes |
| Etapas | `POST /pedidos/{id}/acoes` | Papel e etapa validados no servidor |
| Conversa | `GET /pedidos/{id}/mensagens`, `POST /pedidos/{id}/mensagens` | Somente participantes |
| Avaliação | `POST /pedidos/{id}/avaliacao` | Cliente, após conclusão, uma vez |
| Verificação | `GET /admin/perfis`, `PATCH /admin/perfis/{uid}` | Papel `ADMIN` |

O `DELETE` de serviço é uma exclusão lógica: marca `ativo=false`, preservando o histórico. O dono pode reativar pela edição. Não é possível contratar um anúncio pausado ou o próprio serviço.

Serviços: até 30 itens por página (`limite`, padrão 12), `categoria` opcional e cursor `depois`. Pedidos: 20 por página e cursor `depois`. Mensagens: 50 por página, em ordem cronológica, com cursor `depois`. A resposta destas listas tem `itens` e `proximo` (ID para a próxima página ou `null`). As listas pequenas de catálogo, serviços de um prestador, favoritos, meus serviços e administração são limitadas a 100 documentos neste MVP.

## Etapas do pedido

```text
SOLICITADO → ORCADO → ACEITO → PAGO_RETIDO → ENTREGUE → CONCLUIDO
```

O corpo de `/acoes` usa `acao`:

| Ação | Quem | Dados adicionais |
|---|---|---|
| `ORCAR` | Prestador | `valor_centavos`: inteiro positivo, valor total |
| `ACEITAR` | Cliente | — |
| `PAGAR` | Cliente | —; pagamento exclusivamente simulado |
| `ENTREGAR` | Prestador | `entrega`: descrição ou link em texto |
| `APROVAR` | Cliente | —; conclui e libera na mesma transação |
| `CANCELAR` | Qualquer participante | Apenas antes do pagamento |

Exemplo: `{"acao":"ORCAR","valor_centavos":12500}` representa R$ 125,00. A API usa comissão fixa de 10%, arredondada em centavos. Não há gateway, cartão, cobrança ou transferência real. Nesta versão não há reembolso/disputa depois do pagamento simulado.

## Catálogo e administrador

O projeto real já recebeu 3 instituições, 6 categorias e 6 tipos de serviço. O seed não cria contas ou administradores. Para outro projeto, veja `database/seed.py` e [o modelo](../docs/firestore-modelo.md). O catálogo é mantido pelo responsável no console/seed; esta versão não tem tela de edição do catálogo.

Para o primeiro administrador: crie uma conta pela interface e acesse `/perfil` para gerar `usuarios/{uid}`. Um responsável pelo projeto deve mudar **apenas nessa conta** o campo `papel` para `ADMIN` no console Firestore. Recarregue a interface e acesse `/admin`. Não existe rota pública para conceder esse papel. A verificação exige conferência do vínculo pelos responsáveis; não há upload de comprovante nesta versão. Trocar instituição ou curso remove o selo até nova verificação.

## Testes

```powershell
# A partir de backend/
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m pytest -q
```

São 29 testes locais, sem rede; o teste de integração é pulado por padrão. Os testes antigos de domínio/seed também podem ser executados na raiz: `python -m unittest discover -s database/tests -v`.

Integração real opcional (usa `backend/.env` e a configuração pública em `frontend/.env.local`):

```powershell
$env:TALENTY_LIVE_TEST = '1'
.\.venv\Scripts\python.exe -m pytest tests/test_live.py -q
Remove-Item Env:TALENTY_LIVE_TEST
```

O teste cria três contas temporárias e dados isolados, testa autorização, orçamento, pagamento, entrega, aprovação, conversa, favoritos e avaliação, e os remove em `finally`. Não modifica contas existentes. Esse teste foi executado com sucesso no projeto real; nenhum servidor HTTP é iniciado por ele.

## Limites atuais

Sem upload de arquivos, notificações externas, curtidas, pagamento real ou atualização automática do chat. A conversa usa atualização manual. A busca de texto é feita no frontend entre os anúncios carregados; não é uma pesquisa de texto completo no Firestore. O projeto continua sem faturamento habilitado. As regras publicadas negam acesso direto do cliente ao banco; as permissões da API continuam obrigatórias porque o Admin SDK ignora essas regras.
