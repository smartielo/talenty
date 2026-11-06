# Modelo Cloud Firestore — Talenty

## Ambiente configurado

- Projeto: `talenty-3e8cb`.
- App web: `Talenty Web`, ID `1:120782855294:web:94e2073a740064ac6c8c2f`.
- Banco: `(default)`, edição **Standard**, modo nativo.
- Região escolhida pelo grupo: `southamerica-east1` (São Paulo).
- Faturamento: não ativado durante esta configuração; a instância informa `freeTier: true`.
- Authentication: provedor de e-mail/senha habilitado.
- Configuração pública do React: `frontend/.env.local`, ignorado pelo Git.
- Regras e índices: `firebase/firestore.rules` e `firebase/firestore.indexes.json`.

O Firestore não possui um comando equivalente a `CREATE TABLE`: as coleções aparecem quando recebem documentos. O banco foi provisionado, mas o seed não foi aplicado na nuvem. O feed do React ainda apresenta os exemplos locais.

## Arquitetura e segurança

```text
React → Firebase Authentication → Firebase ID token
React → FastAPI com Authorization: Bearer <token> → Firestore via Admin SDK
```

O React não consulta nem escreve no Firestore. As regras negam **todas** as operações dos SDKs clientes, inclusive para usuários autenticados e subcoleções. O Admin SDK usa as permissões IAM da credencial do servidor e não passa pelas Security Rules.

A API precisa verificar o token, carregar o usuário, conferir `ativo` e `papel`, validar campos e autorizar cada operação. As regras publicadas não substituem essas verificações. Os exemplos de transações fornecidos não são uma API completa e não devem receber um UID escolhido pelo cliente: `cliente_uid` deve vir da identidade já verificada.

Os ataques de leitura pública, escrita por outro usuário, remoção de campos, troca de dono, promoção a ADMIN, escrita de dados excessivos e acesso a subcoleções não recebem nenhuma permissão nas regras. Não existe exceção que possa ser ampliada por sobreposição de `match`. Isso não testa nem garante as permissões do Admin SDK ou da API, que precisam de testes próprios.

As regras são um protótipo para esta arquitetura e devem ser revisadas antes de uma divulgação ampla. Não foram adicionados helpers/validadores sem uso: nenhuma criação ou atualização por cliente é permitida. A validação dos documentos é responsabilidade da API.

## Convenções

- Nomes dos campos em português; IDs e vínculos como strings.
- IDs: 1 a 128 caracteres; nunca aceitar `/` em IDs recebidos pela API.
- Datas: timestamps do Firestore em UTC. Novas gravações usam `SERVER_TIMESTAMP`.
- Dinheiro: inteiros em centavos, de 1 a 100.000.000; nunca `float`.
- Comissão: inteiro entre 1000 e 1500 pontos-base (10% a 15%).
- Arredondamento: meio centavo arredonda para cima; `valor_prestador = total - comissao`.
- Texto: limitar pelo tamanho indicado abaixo e rejeitar campos desconhecidos nas entradas da API.
- Campos com `?` são opcionais. Campos anuláveis usam `null` explicitamente.
- `demonstracao?: bool` identifica os documentos do seed; o catálogo real não deve ganhar esse campo a partir de uma entrada pública.
- A API deve usar listas de campos permitidos para alterações; nunca repassar o corpo recebido diretamente para `set`/`update`.

## Coleções

### instituicoes/{id}

| Campo | Tipo / limite |
|---|---|
| nome | string, 2–160 |
| cidade | string, 2–100 |
| estado | string, sigla de UF válida com 2 caracteres |
| ativo | bool |
| criado_em | timestamp imutável |

### usuarios/{uid}

O ID corresponde ao UID do Firebase Authentication. Documento privado: o e-mail não deve ser devolvido em respostas públicas de perfis.

| Campo | Tipo / limite |
|---|---|
| uid | string, igual ao ID do documento; imutável |
| nome | string, 2–80 |
| email | string, e-mail válido, até 254 |
| papel | enum `USUARIO`, `ADMIN`; cadastro sempre `USUARIO` |
| ativo | bool |
| criado_em | timestamp imutável |
| atualizado_em | timestamp |

Nunca guardar senha, hash de senha, ID token, refresh token ou credenciais neste documento. Nome e e-mail devem ser sincronizados de forma controlada com a identidade autenticada; alterações de e-mail exigem confirmação pelo Authentication. Não permitir que o cliente altere `papel`, `ativo`, `uid` ou datas.

### perfis_prestadores/{uid}

Um usuário pode contratar e prestar serviços. Não há coleção separada de clientes.

| Campo | Tipo / limite |
|---|---|
| usuario_uid | string, igual ao ID; imutável |
| nome_publico | string, 2–80; sem e-mail ou contato privado |
| instituicao_id | string, referência a instituição existente |
| curso | string, 2–120 |
| cidade | string, 2–100 |
| estado | sigla de UF válida |
| bio | string, 0–2000 |
| verificado | bool, começa `false` |
| verificado_por | UID de administrador ou null |
| verificado_em | timestamp ou null |
| criado_em | timestamp imutável |
| atualizado_em | timestamp |

Somente administrador pode conceder ou revogar verificação. A API deve separar o resumo público do perfil de quaisquer dados privados acrescentados no futuro.

### categorias/{id}

`nome` (string 2–80), `slug` (string 2–80, minúsculas, números e hífens), `descricao` (string 0–500), `ativo` (bool). `criado_em?` (timestamp).

IDs iniciais: `sites`, `design`, `textos`, `video`, `monitorias`, `dados`.

### tipos_servico/{id}

`categoria_id` (string; categoria existente), `nome` (string 2–120), `descricao` (string 0–1000), `preco_referencia_centavos` (inteiro positivo), `unidade` (`SERVICO` ou `HORA`), `ativo` (bool), `criado_em?` (timestamp).

### servicos/{id}

| Campo | Tipo / limite |
|---|---|
| prestador_uid | UID de usuário e perfil existentes; imutável |
| categoria_id | string; categoria existente |
| tipo_servico_id | string; tipo pertencente à categoria escolhida |
| titulo | string, 5–160 |
| descricao | string, 20–5000 |
| preco_centavos | inteiro positivo |
| unidade | enum `SERVICO`, `HORA` |
| prazo_dias | inteiro, 1–365 |
| ativo | bool |
| instituicao_id | string; cópia controlada do perfil |
| cidade | string 2–100; cópia controlada do perfil |
| estado | UF; cópia controlada do perfil |
| criado_em | timestamp imutável |
| atualizado_em | timestamp |

O dono pode alterar os campos comerciais permitidos. A API determina `prestador_uid`, datas e localização; não aceita esses campos livremente. Ao alterar localização/instituição do perfil, deve atualizar os anúncios correspondentes em lotes controlados antes de concluir a sincronização. Para o MVP, limite a quantidade de anúncios por prestador e mantenha essa atualização numa transação quando couber nos limites do serviço. Até implementar essa sincronização, não exponha a mudança desses campos do perfil.

### pedidos/{id}

| Campo | Tipo / limite |
|---|---|
| cliente_uid, prestador_uid | UIDs existentes, diferentes e imutáveis |
| servico_id | string; serviço existente e imutável |
| titulo_servico | string 5–160; cópia do título na contratação |
| descricao_solicitacao | string 10–5000 |
| valor_centavos | inteiro positivo; valor acordado |
| status | enum do fluxo abaixo |
| criado_em | timestamp imutável |
| atualizado_em | timestamp |
| entregue_em, concluido_em | timestamp ou null |

Fluxo previsto: `SOLICITADO → ORCADO → ACEITO → PAGO_RETIDO → ENTREGUE → CONCLUIDO`. `CANCELADO` só deve ser habilitado junto com uma política explícita de cancelamento e reembolso simulado. Não implementar um endpoint genérico que permita ao cliente escolher qualquer status.

Somente os dois envolvidos podem consultar o pedido. Cliente solicita, aceita orçamento, paga e aprova; prestador orça e entrega. O valor e o prestador são conferidos no servidor; não confiar no preço enviado pelo navegador.

### pagamentos/{pedido_id}

`pedido_id` (string igual ao ID), `valor_total_centavos`, `valor_comissao_centavos`, `valor_prestador_centavos` (inteiros não negativos; total positivo), `taxa_comissao_pontos_base` (inteiro 1000–1500), `status` (`RETIDO`, `LIBERADO`, `REEMBOLSADO`), `simulado` (literal `true`), `criado_em` (timestamp), `liberado_em` (timestamp ou null).

Total deve coincidir com o pedido e satisfazer `total = comissao + prestador`. Documento único por pedido. O primeiro registro é criado com pré-condição de inexistência. Atualizações são transacionais e autorizadas, sem permitir alteração de valores após retenção.

### avaliacoes/{pedido_id}

`pedido_id`, `cliente_uid`, `prestador_uid` (strings imutáveis), `nota` (inteiro 1–5), `comentario` (string 0–2000), `criado_em` (timestamp imutável).

Só o cliente do pedido concluído pode criar. O ID fixo e a transação impedem duas avaliações do mesmo pedido. A API obtém os participantes do pedido, não do corpo da requisição.

### mensagens/{id}

`pedido_id` (string; pedido existente), `autor_uid` (UID de um envolvido), `texto` (string 1–4000 após remover espaços externos), `criado_em` (timestamp imutável).

Somente os participantes podem consultar ou enviar. Validar o pedido antes de consultar mensagens e não expor alteração de autor ou da data.

## Consultas e índices

Todas as consultas abaixo são feitas na FastAPI com o Admin SDK, com `limit(20)` e paginação por cursor de documento (`start_after`); a API deve validar e limitar os filtros e o tamanho de página.

| Coleção | Filtros de igualdade | Ordenação |
|---|---|---|
| servicos | ativo=true | criado_em DESC |
| servicos | ativo=true, categoria_id | criado_em DESC |
| servicos | ativo=true, categoria_id, cidade | criado_em DESC |
| servicos | ativo=true, instituicao_id | criado_em DESC |
| servicos | prestador_uid | criado_em DESC |
| pedidos | cliente_uid = UID autenticado | criado_em DESC |
| pedidos | prestador_uid = UID autenticado | criado_em DESC |
| avaliacoes | prestador_uid | criado_em DESC |
| mensagens | pedido_id previamente autorizado | criado_em ASC |

O cursor deve preservar a mesma consulta e ordem e não permitir ler outro pedido. Use o ID do documento como desempate, conforme a ordenação do Firestore. Não use offsets para percorrer o feed. Índices podem levar alguns minutos para terminar a construção.

Não há busca arbitrária por substring ou full-text nativa neste modelo. A busca atual do front-end filtra exemplos locais. Para dados reais, comece com os filtros exatos acima; busca por prefixo requer campos normalizados e consultas/índices próprios. Um serviço de busca externo é uma decisão futura, não está instalado nem prometido aqui.

## Seed sem sobrescrever documentos

O script `database/seed.py` gera um plano de **24 documentos**: 3 instituições, 6 categorias, 6 tipos, 3 usuários fictícios, 3 perfis e 3 serviços. Os UIDs `demo_ana`, `demo_pedro` e `demo_lucas` não correspondem a contas reais. Todos os documentos têm `demonstracao: true`; nenhuma conta Authentication ou administrador é criada.

O comando padrão é somente visualização e não exige dependências:

```powershell
python -m database.seed
```

Para usar o emulador, instale as dependências Python em um ambiente virtual e um Java compatível com a versão atual do emulador. Java não foi encontrado neste computador durante esta configuração; nenhum emulador foi iniciado.

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
npx.cmd -y firebase-tools@latest emulators:start --only firestore --project demo-talenty
```

Em outro terminal na raiz:

```powershell
$env:FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
backend/.venv/Scripts/python.exe -m database.seed --apply
```

O SDK usa credenciais anônimas apenas para o emulador. Cada documento é gravado com `create`, nunca `set`: se já existir, é preservado. Interrupções podem deixar parte do seed gravada; executar novamente completa os documentos restantes sem sobrescrever os anteriores.

Para gravar somente o catálogo na nuvem, primeiro visualize o plano e configure uma credencial administrativa com os privilégios necessários. Não use a senha da conta Google e não copie tokens da CLI.

```powershell
# Credencial privada fora do repositório; use o caminho real do seu computador.
$env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\caminho-privado\firebase-admin.json'
backend/.venv/Scripts/python.exe -m database.seed --production --project talenty-3e8cb --catalog-only
# Só execute a linha seguinte quando quiser gravar esse catálogo no projeto real:
backend/.venv/Scripts/python.exe -m database.seed --production --project talenty-3e8cb --catalog-only --apply
```

`--catalog-only` planeja 15 documentos. Sem essa opção, a execução explícita em produção também inclui os perfis fictícios identificados acima. Esse seed não foi executado na nuvem nesta etapa.

## Backend e transações

`backend/app/firebase.py` inicializa o Firebase Admin SDK com Application Default Credentials e o projeto definido em `backend/.env`. A credencial da CLI/MCP não é automaticamente uma credencial do Admin SDK. Nenhuma chave administrativa foi criada ou adicionada ao repositório.

Copie `backend/.env.example` para `backend/.env`, preencha o caminho da credencial e instale `backend/requirements.txt`. O arquivo de exemplo já aponta para `talenty-3e8cb` e `(default)`. A configuração local não inicia uma API automaticamente.

Em `backend/app/services/pedidos.py`:

- `registrar_pagamento_simulado`: exige pedido ACEITO e ausência de pagamento; cria o pagamento e retém o valor na mesma transação.
- `aprovar_entrega`: exige cliente do pedido, status ENTREGUE, pagamento RETIDO e valores consistentes; conclui e libera na mesma transação.
- `criar_avaliacao`: exige cliente, pedido CONCLUIDO, nota válida e ausência de avaliação; usa o ID do pedido para unicidade.

Todas as leituras da transação precedem as escritas. A função decorada pode ser repetida pelo SDK em caso de disputa: não enviar e-mails, cobrar valores ou alterar estado externo dentro dela. Os exemplos assumem que as referências e documentos foram validados na criação pela API. O fluxo completo de endpoints, alterações de perfil e cancelamentos ainda precisa ser implementado.

## Publicação e validação

```powershell
npx.cmd -y firebase-tools@latest deploy --only firestore --project talenty-3e8cb
npx.cmd -y firebase-tools@latest deploy --only auth --project talenty-3e8cb
python -m unittest discover -s database/tests -v
```

Testes unitários cobrem valores monetários, arredondamento, permissões básicas, limites de avaliação, referências do seed e proteção contra gravação acidental em produção. Eles não comprovam concorrência ou atomicidade no serviço real. Falta executar testes de integração com emulador/credencial de desenvolvimento e validar o primeiro cadastro/login e a recuperação de senha com um e-mail do grupo.

O conjunto de regras foi compilado pelo Firebase durante a publicação. O backend continua pendente de integração: regras fechadas são intencionais, não devem ser abertas para fazer o feed acessar dados diretamente.

Referências oficiais: [transações](https://firebase.google.com/docs/firestore/manage-data/transactions), [emulador](https://firebase.google.com/docs/emulator-suite/connect_firestore), [Admin SDK](https://firebase.google.com/docs/admin/setup).
