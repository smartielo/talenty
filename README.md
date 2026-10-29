# Talenty – Plataforma de freelas para estudantes

> Projeto acadêmico do 4º semestre de Ciência da Computação – UNISAGRADO (2º semestre de 2026).
>
> **Arquitetura atual escolhida pelo grupo:** React + Vite (local), FastAPI (local), Firebase Authentication e Cloud Firestore (nuvem). **Sem hospedagem pública do site e sem MySQL no sistema.**

**Integrantes:** Gabriel Martielo e João Diniz  
**Entrega de Aplicações Digitais:** 15/11/2026  
**Prática em Banco de Dados:** confirmar com o professor se a entrega anterior foi dispensada ou teve seus requisitos alterados (prazo anteriormente informado: 01/12/2026, Turma A).

> [!IMPORTANT]
> **Pendência acadêmica:** os requisitos recebidos inicialmente exigiam banco relacional, SQL/DML e, em Aplicações Digitais, API própria, controle de acesso e autenticação com hash. A decisão de usar somente Firebase **não significa, por si só, que a substituição do MySQL/SQL foi autorizada pelos professores**. Confirmar expressamente a dispensa ou a mudança de escopo, especialmente em Prática em Banco de Dados, e registrar a orientação recebida.

---

## 1. Problema e solução

Estudantes universitários querem renda extra e portfólio, mas têm dificuldade para encontrar clientes, precificar o trabalho e receber com segurança. Pequenos negócios, autônomos e outros estudantes precisam contratar serviços acessíveis e encontrar prestadores confiáveis.

O **Talenty** conecta esses públicos: universitários anunciam serviços (sites, design, revisão de texto, monitorias), e clientes contratam pela plataforma. A receita prevista é uma comissão de **10% a 15%** por serviço fechado.

### Funcionalidades previstas para o MVP

- Cadastro e login com Firebase Authentication.
- Perfil do prestador como portfólio, com serviços e avaliações.
- Catálogo com categorias, tipos de serviço e preços de referência.
- Busca por faculdade, cidade e categoria (sujeita à modelagem de consultas e índices do Firestore).
- Solicitação de serviço, orçamento e acompanhamento do pedido.
- Pagamento **simulado**, retido e liberado após confirmação da entrega; não há movimentação financeira real.
- Selo de estudante verificado, concedido por um administrador.
- Avaliação do prestador após conclusão do pedido.
- Chat simples dentro do pedido, **prioridade menor** se o prazo ficar apertado.

## 2. Tecnologias

| Camada | Tecnologia | Responsabilidade |
|---|---|---|
| Front-end | React + Vite | Interface no navegador, executada localmente |
| API própria | Python 3.11+ com FastAPI | Rotas HTTP, validação, regras de negócio e permissões |
| Autenticação | Firebase Authentication | Cadastro, login e emissão de ID tokens |
| Banco de dados | Cloud Firestore | Persistência de dados em documentos e coleções |
| Acesso seguro ao Firebase no back-end | Firebase Admin SDK para Python | Verificação de ID tokens e acesso administrativo ao Firestore |
| Documentação da API | Swagger/OpenAPI do FastAPI | Documentação interativa em `/docs` |
| Testes | pytest | Testes de regras, permissões, sucesso e erro |
| Execução | Local (React e FastAPI) | Sem publicação/hospedagem pública obrigatória |

**Atenção:** embora o site e a API rodem no computador, **Firebase Authentication e Cloud Firestore são serviços em nuvem**. Na execução normal, é necessário acesso à internet. Emuladores locais do Firebase podem ser usados para desenvolvimento e testes, mas não substituem automaticamente a configuração real.

## 3. Arquitetura

```text
                    COMPUTADOR LOCAL
┌────────────────────────────────────────────────────┐
│ Navegador                                          │
│ React + Vite (http://localhost:5173)               │
│   │                                                │
│   ├── Cadastro/login ────────────┐                  │
│   │                              │                  │
│   └── HTTP/JSON + ID token ──► FastAPI              │
│                               (localhost:8000)     │
│                                 │                  │
│                          Valida token,              │
│                          permissões e regras        │
└─────────────────────────────────┼──────────────────┘
                                  │
                  FIREBASE (SERVIÇOS EM NUVEM)
          ┌───────────────────────┴────────────────┐
          │ Firebase Authentication ◄── login ────┤
          │ Cloud Firestore ◄── acesso pela API ───┤
          └────────────────────────────────────────┘
```

### Princípios

1. O **front-end usa o SDK do Firebase somente para autenticação**; não faz leitura ou escrita direta no Firestore.
2. O front-end envia o **Firebase ID token** no cabeçalho `Authorization: Bearer <token>` para as rotas protegidas.
3. A **FastAPI verifica o token** pelo Firebase Admin SDK, identifica o usuário e aplica as permissões.
4. A **FastAPI é a única camada da aplicação que acessa os dados do Firestore**, usando o Admin SDK. As regras de negócio ficam no servidor.
5. O SDK administrativo contorna as regras de segurança de cliente do Firestore; por isso, a API deve validar **todas** as permissões e entradas. Recomenda-se bloquear acesso direto de clientes às coleções pelas Firestore Security Rules.
6. Credenciais administrativas do Firebase ficam **somente no back-end**, fora do repositório. Nunca são enviadas ao navegador.
7. Não há driver SQL, MySQL ou consultas SQL na arquitetura atual.

### Organização de pastas planejada

```text
talenty/
├── backend/
│   ├── app/
│   │   ├── main.py                 # Inicialização do FastAPI
│   │   ├── config.py               # Leitura de configurações
│   │   ├── firebase.py             # Inicialização do Firebase Admin
│   │   ├── dependencies.py         # Verificação de token e permissões
│   │   ├── routers/                # Endpoints HTTP
│   │   ├── services/               # Regras de negócio
│   │   ├── repositories/           # Operações com o Firestore
│   │   └── schemas/                # Validação de entrada e saída
│   ├── tests/                      # Testes com pytest
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   ├── services/               # Chamadas HTTP à API
│   │   └── firebase/               # Configuração do SDK cliente de Auth
│   ├── package.json
│   └── .env.example
├── firebase/
│   └── firestore.rules             # Política planejada: sem acesso direto a dados
├── docs/                          # Arquitetura, testes e relatório
└── README.md
```

*Estrutura planejada: os diretórios e arquivos ainda precisam ser implementados.*

## 4. Modelagem de dados no Cloud Firestore

O Firestore é **NoSQL orientado a documentos**. Não possui tabelas, chaves estrangeiras ou restrições SQL iguais às do MySQL. A API deverá assegurar a integridade dos vínculos entre documentos.

### Coleções propostas

| Coleção | Dados principais | Observações |
|---|---|---|
| `instituicoes` | nome, cidade | Referência para o perfil do prestador |
| `usuarios` | uid, nome, email, papel | ID relacionado ao UID do Firebase Authentication; sem senha no Firestore |
| `perfis_prestadores` | usuario_uid, instituicao_id, curso, bio, verificado | Um perfil por usuário |
| `categorias` | nome, descricao | Catálogo administrado pelo admin |
| `tipos_servico` | categoria_id, nome, preco_referencia | Modelo para anúncios |
| `servicos` | prestador_uid, tipo_servico_id, titulo, descricao, preco | Anúncios publicados |
| `pedidos` | cliente_uid, prestador_uid, servico_id, status, valor | Processo da contratação |
| `pagamentos` | pedido_id, valor_total, valor_comissao, valor_prestador, status | Simulação; no máximo um por pedido |
| `avaliacoes` | pedido_id, cliente_uid, nota, comentario | No máximo uma por pedido concluído |
| `mensagens` | pedido_id, autor_uid, texto, criado_em | Chat simples, se incluído no MVP |

**IDs e vínculos:** `usuarios/{uid}` usa o UID do Authentication. As demais coleções usam IDs de documentos, com referências por campos como `pedido_id` e `servico_id`. Para garantir unicidade de pagamento e avaliação, a implementação poderá adotar o **ID do pedido como ID do documento** (`pagamentos/{pedido_id}`, `avaliacoes/{pedido_id}`), com validação na API.

Não há coleção `clientes`: um mesmo usuário pode contratar serviços e ser prestador. O campo `papel` diferencia usuários comuns e administradores; ser prestador depende do perfil associado.

### Integridade e consultas

- Vínculos entre documentos e exclusões são conferidos pela API, pois o Firestore não aplica `FOREIGN KEY`.
- O usuário não pode contratar seu próprio serviço.
- Nota de avaliação entre **1 e 5**, e somente após o pedido estar concluído.
- Uma avaliação e um pagamento, no máximo, por pedido.
- Os valores do pagamento devem satisfazer `valor_total = valor_comissao + valor_prestador`, com regra consistente de arredondamento monetário.
- Operações que precisam ser atômicas usam **transações do Firestore**.
- Consultas combinadas por cidade, instituição e categoria podem exigir **índices compostos** e ajustes no modelo; essa busca deve ser testada com dados reais de exemplo.
- Os scripts SQL anteriores ficam **fora do desenvolvimento atual**. Caso o professor exija novamente SQL ou DML, será necessário um plano separado.

## 5. Regras de negócio

### Fluxo do pedido

```text
SOLICITADO → ORCADO → ACEITO → PAGO_RETIDO → ENTREGUE → CONCLUIDO
                                                          
CANCELADO: somente nas situações previstas pela regra de cancelamento.
```

A API permitirá apenas transições coerentes e autorizadas para cada participante.

### Pagamento simulado

- Não existe integração com banco, carteira ou gateway de pagamento real.
- A comissão é configurada entre **10% e 15%** do valor do serviço.
- No pagamento são registrados valor total, comissão e valor do prestador.
- Quando o cliente confirma a entrega, **concluir o pedido e liberar o pagamento simulado devem ocorrer na mesma transação do Firestore**. Se falhar, nenhuma das duas alterações deve ser efetivada.

### Controle de acesso

- Apenas o dono pode editar ou excluir o próprio serviço.
- Somente cliente e prestador envolvidos podem visualizar o pedido e as mensagens.
- Somente o cliente autorizado pode avaliar o pedido concluído.
- Apenas administradores gerenciam catálogo e concedem selo de verificação.
- O papel `ADMIN` nunca pode ser concedido pelo próprio usuário durante o cadastro.

## 6. Autenticação e autorização

1. **Cadastro e login:** realizados com Firebase Authentication no front-end.
2. **Token:** após o login, o front-end obtém um Firebase ID token.
3. **API:** em chamadas protegidas, envia `Authorization: Bearer <token>`.
4. **Verificação:** o back-end valida o ID token com o Firebase Admin SDK e identifica o UID.
5. **Autorização:** a API consulta e valida o perfil/papel do usuário no Firestore antes de permitir operações restritas.
6. **Senha:** gerenciada pelo Firebase Authentication; **não é gravada no Firestore nem manipulada diretamente pela nossa API**.

**Nota:** o Firebase Authentication substitui a implementação própria de hash com bcrypt/JWT prevista anteriormente. Confirmar que essa substituição é aceita na avaliação de Aplicações Digitais.

### Segurança

- Tokens inválidos ou ausentes: `401 Unauthorized`.
- Usuário autenticado sem permissão: `403 Forbidden`.
- Dados inválidos: `400` ou `422`, conforme a validação.
- Recurso inexistente: `404 Not Found`.
- Conflitos de estado ou duplicidade: `409 Conflict`, quando apropriado.
- CORS limitado ao endereço local do front-end em desenvolvimento.
- Arquivos `.env`, credenciais administrativas e contas de serviço fora do Git (usar `.gitignore`).
- Variáveis `VITE_` são expostas no navegador: **nunca colocar nelas chaves privadas ou credenciais administrativas**. A configuração pública do SDK cliente do Firebase não equivale a uma chave secreta de servidor.
- Negar o acesso direto do SDK cliente ao Firestore; acesso administrativo exclusivo pela API.

## 7. Integrações externas

- **Firebase Authentication:** autenticação dos usuários.
- **Cloud Firestore:** armazenamento dos dados da plataforma.
- **Firebase Admin SDK:** acesso seguro do back-end e verificação de tokens.
- **Pagamento:** simulado internamente, sem transações financeiras reais.
- **WhatsApp:** não faz parte do escopo obrigatório do MVP; considerar apenas depois de concluir as funções principais.

## 8. Endpoints planejados

Swagger/OpenAPI: **http://localhost:8000/docs**, após iniciar o back-end.

| Recurso | Endpoints planejados | Acesso |
|---|---|---|
| Autenticação | Cadastro/login no Firebase Authentication; `GET /auth/me` na API | Login pelo SDK; `/auth/me` autenticado |
| Categorias | `GET /categorias`, `POST /categorias`, `PUT /categorias/{id}`, `DELETE /categorias/{id}` | Leitura pública; alterações por admin |
| Tipos de serviço | `GET /tipos-servico`, `POST /tipos-servico`, `PUT /tipos-servico/{id}`, `DELETE /tipos-servico/{id}` | Leitura pública; alterações por admin |
| Serviços | `GET /servicos`, `GET /servicos/{id}`, `POST /servicos`, `PUT /servicos/{id}`, `DELETE /servicos/{id}` | Leitura pública; escrita pelo dono |
| Prestadores | `GET /prestadores/{id}`, `POST /prestadores`, `PATCH /prestadores/{id}/verificar` | Verificação somente por admin |
| Pedidos | `POST /pedidos`, `GET /pedidos`, `GET /pedidos/{id}`, `PATCH /pedidos/{id}/status` | Somente envolvidos |
| Pagamento simulado | `POST /pedidos/{id}/pagamento`, `POST /pedidos/{id}/liberar` | Conforme regra de negócio |
| Avaliações | `POST /pedidos/{id}/avaliacao` | Cliente autorizado |
| Mensagens | `GET /pedidos/{id}/mensagens`, `POST /pedidos/{id}/mensagens` | Somente envolvidos; opcional no fim |

A API oferece métodos **GET, POST, PUT/PATCH e DELETE**, com validação, tratamento de erros e códigos HTTP adequados. O login/cadastro ocorre no Firebase; portanto, os endpoints antigos `POST /auth/cadastro` e `POST /auth/login` não são necessários nesta proposta.

## 9. Testes automatizados

Os testes serão escritos em **pytest**, em `backend/tests/`, para cobrir:

- Cálculo da comissão, arredondamento e divisão do valor.
- Transições de status válidas e inválidas.
- Tentativa de contratar o próprio serviço.
- Avaliação fora de 1–5, avaliação duplicada e avaliação de pedido não concluído.
- Acesso sem token, com token inválido e sem permissão.
- Restrição de edição de serviço, acesso a pedido e acesso ao chat.
- Conclusão e liberação do pagamento na mesma transação.
- Erros de documentos inexistentes e entradas inválidas.

Testes unitários de regras podem usar simulações (*mocks*) do Firestore, sem depender da nuvem. Testes de integração podem utilizar emuladores do Firebase quando configurados.

Com o ambiente configurado:

```bash
# Executar os testes a partir da pasta do back-end
cd backend
pytest
```

## 10. Instalação e execução local (planejada)

### Pré-requisitos

- Python 3.11 ou superior.
- Node.js e npm compatíveis com a versão escolhida do Vite.
- Projeto Firebase criado e configurado pelo grupo.
- Firebase Authentication com provedor de e-mail/senha ativado.
- Banco Cloud Firestore criado no projeto Firebase.
- Credenciais do Firebase Admin SDK disponíveis **somente para o back-end**.
- Internet para usar os serviços do Firebase na nuvem.

### Passo 1 – Configurar o Firebase

1. Criar o projeto no Console do Firebase.
2. Ativar **Authentication → Sign-in method → Email/Password**.
3. Criar o **Cloud Firestore** e revisar as regras de segurança.
4. Registrar uma aplicação web para obter a configuração pública usada pelo React.
5. Configurar a credencial administrativa para o FastAPI por variável de ambiente (sem colocar o arquivo privado no Git).
6. Adicionar `localhost` aos domínios autorizados do Authentication, se necessário para o ambiente de desenvolvimento.

### Passo 2 – Back-end FastAPI

No terminal, na pasta `backend/`:

```bash
# Criar o ambiente virtual Python
python -m venv venv

# Ativar o ambiente no Windows PowerShell
.\venv\Scripts\Activate.ps1

# Instalar dependências definidas pelo projeto
pip install -r requirements.txt

# Copiar o arquivo de exemplo e preencher as variáveis locais
copy .env.example .env

# Iniciar a API local
uvicorn app.main:app --reload
```

Variáveis de ambiente previstas para `backend/.env.example`:

```dotenv
# ID público do projeto Firebase
FIREBASE_PROJECT_ID=seu-projeto-firebase

# Caminho local para a credencial administrativa (fora do repositório)
GOOGLE_APPLICATION_CREDENTIALS=caminho/seguro/para/credencial.json

# Origem autorizada da interface local
CORS_ORIGINS=http://localhost:5173
```

> `GOOGLE_APPLICATION_CREDENTIALS` aponta para um arquivo de credenciais **privado**. O caminho de exemplo é ilustrativo e precisa ser substituído no `.env` local. O arquivo JSON não deve ser versionado ou copiado para `frontend/`.

Quando implementada, a API estará em `http://localhost:8000`, com Swagger em `http://localhost:8000/docs`.

### Passo 3 – Front-end React

Em outro terminal:

```bash
# Entrar na pasta do front-end
cd frontend

# Instalar dependências
npm install

# Copiar a configuração de exemplo
copy .env.example .env

# Iniciar o Vite
npm run dev
```

Configuração prevista para `frontend/.env.example`:

```dotenv
# Endereço da API executada no computador
VITE_API_URL=http://localhost:8000

# Configurações públicas do aplicativo web registradas no Firebase
VITE_FIREBASE_API_KEY=chave-publica-do-app-web
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-firebase
VITE_FIREBASE_APP_ID=id-publico-do-app-web
```

A interface deverá abrir em **http://localhost:5173** (ou na porta indicada pelo Vite). O exemplo acima é um planejamento: os arquivos de configuração e o código ainda precisam ser criados.

### Primeiro acesso

- Criar um usuário pela interface de cadastro do Firebase Authentication.
- A API deverá criar ou sincronizar seu documento `usuarios/{uid}` sem aceitar que o usuário escolha papel `ADMIN`.
- Para testar funcionalidades administrativas, o grupo deverá estabelecer um administrador por procedimento seguro e controlado no back-end/console, documentando o processo. **Nunca expor uma rota pública para tornar uma conta administradora.**

## 11. Plano de desenvolvimento e validação

| Etapa | Entrega | Como verificar |
|---|---|---|
| 1 | Configurar Firebase, FastAPI e React local | Front abre; API responde; Firebase conecta |
| 2 | Cadastro, login e verificação do ID token | Usuário acessa rota protegida; visitante recebe 401 |
| 3 | Perfis, categorias e serviços | CRUD via API e dados no Firestore; permissões testadas |
| 4 | Pedidos e transições de status | Fluxo correto; auto-contratação bloqueada |
| 5 | Pagamento simulado e transação de conclusão | Comissão correta; conclusão/liberação atômicas |
| 6 | Avaliações e selo de verificação | Avaliação apenas após conclusão; selo só pelo admin |
| 7 | Front-end integrado, testes e documentação | Navegação completa e `pytest` executado |
| 8 (se couber) | Chat simples entre participantes | Participantes acessam; terceiros não acessam |

**Prioridade para 15/11/2026:** autenticação, catálogo/serviços, pedidos, pagamento simulado, avaliação, admin, testes e documentação. Em caso de atraso, reduzir primeiro chat e notificações externas, sem eliminar os requisitos essenciais da disciplina.

### Situação atual (29/10/2026)

- [x] Ideia, objetivos e regras gerais do Talenty definidos.
- [x] Arquitetura **escolhida**: Firebase Authentication + Firestore + FastAPI + React local.
- [x] README atualizado para a arquitetura escolhida.
- [ ] Confirmar com os professores a alteração/dispensa dos requisitos de SQL e da autenticação própria.
- [ ] Criar e configurar o projeto no Firebase.
- [ ] Implementar API FastAPI, Firebase Admin SDK e validações.
- [ ] Implementar telas em React e integração com Authentication/API.
- [ ] Criar coleções e índices necessários no Firestore.
- [ ] Implementar testes automatizados e testar fluxo completo.
- [ ] Documentar resultados, capturas, endpoints e evidências de testes.

Os scripts e a modelagem SQL produzidos anteriormente **não fazem parte da implementação atual** e não devem ser apresentados como recursos em execução no Firebase.

## 12. Pontos acadêmicos a confirmar

As exigências conhecidas anteriormente para Aplicações Digitais incluíam API própria, CRUD, rotas protegidas, testes e banco relacional. Para Prática em Banco de Dados, incluíam modelagem relacional e comandos `INSERT`, `UPDATE`, `DELETE`, com comprovação de transação em SQL.

**Confirmar antes da entrega:**

1. **Prática em Banco de Dados:** a disciplina deixou de exigir a entrega ou autorizou formalmente uma entrega usando Firestore sem SQL? Em caso afirmativo, qual será o formato exigido?
2. **Aplicações Digitais:** o professor aceita Firestore no lugar de banco relacional?
3. **Autenticação:** o Firebase Authentication substitui satisfatoriamente a implementação própria de hash de senha e JWT? A API continuará validando tokens e controlando permissões.
4. **Acesso ao banco:** a proposta manterá o Firestore acessível somente pela API para as operações de dados, conforme o requisito de arquitetura original.
5. **Execução local:** confirmar apenas se a apresentação exige rede/internet ou se será necessário preparar os emuladores do Firebase como alternativa.

**Decisão do grupo:** seguir com Firebase para tudo, **sem MySQL nem scripts SQL no sistema**. **Status acadêmico:** confirmação dos professores ainda não documentada neste README.

## 13. Declaração de uso de Inteligência Artificial

> Rascunho a ser revisado pelos integrantes antes da entrega. Registrar ferramentas, modelos exatos e contribuições conforme realmente utilizadas.

**Ferramentas identificadas até aqui:** Claude (Anthropic; modelo exato a conferir) e ChatGPT (OpenAI; modelo exato a conferir para cada uso).

**Atividades com apoio de IA:**

- Discussão da ideia do Talenty e do escopo do MVP.
- Análise inicial dos requisitos das disciplinas.
- Proposta inicial de modelagem SQL e scripts de banco.
- Sugestões para arquitetura, organização das pastas, endpoints e testes.
- Revisão deste README após a decisão de executar a interface e a API localmente e centralizar autenticação e dados no Firebase.

**Limitações, mudanças e correções observadas:**

- Houve uma proposta inicial com MySQL, JWT próprio e bcrypt; o grupo decidiu migrar o sistema para Firebase Authentication e Cloud Firestore. O conteúdo do README foi ajustado, mas a migração ainda precisará ser implementada e validada.
- Os scripts SQL anteriores foram testados em MariaDB 10.11, não em MySQL 8; agora estão fora do escopo de implementação escolhido.
- Os hashes de senha dos dados SQL de exemplo eram fictícios e não serviam para login real; esses dados não serão usados na autenticação Firebase.
- Uma resposta anterior da IA confundiu a ordem de datas de entrega das disciplinas; o grupo corrigiu a informação.
- A compatibilidade acadêmica da nova arquitetura com exigências anteriores **ainda deve ser confirmada pelos professores**.

**A completar no fim:** dificuldades técnicas, erros reais apresentados pela IA, o que os integrantes corrigiram manualmente, evidências dos testes e avaliação da contribuição da IA.

Os dois integrantes são responsáveis por revisar, compreender e saber explicar qualquer parte do projeto na entrevista técnica individual.
