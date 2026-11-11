# Modelo Cloud Firestore do MVP Talenty

O React não acessa o Firestore diretamente. O fluxo é:

```text
React -> Firebase Authentication -> Firebase ID token
React -> FastAPI -> Firebase Admin SDK -> Cloud Firestore
```

## Coleções usadas

### usuarios/{uid}

Criada pela API no primeiro acesso autenticado.

| Campo | Tipo | Regra |
|---|---|---|
| `uid` | string | igual ao ID do documento |
| `nome` | string | copiado da conta Firebase |
| `email` | string | privado; não aparece nos anúncios |
| `papel` | string | sempre `USUARIO` no cadastro |
| `ativo` | boolean | bloqueia conta quando `false` |
| `criado_em` | timestamp | definido pelo servidor |
| `atualizado_em` | timestamp | definido pelo servidor |

Senhas e tokens nunca são armazenados nessa coleção.

### categorias/{id}

| Campo | Tipo |
|---|---|
| `nome` | string |
| `slug` | string |
| `descricao` | string |
| `ativo` | boolean |

### tipos_servico/{id}

| Campo | Tipo |
|---|---|
| `categoria_id` | string |
| `nome` | string |
| `descricao` | string |
| `preco_referencia_centavos` | inteiro |
| `unidade` | `SERVICO` ou `HORA` |
| `ativo` | boolean |

### servicos/{id}

| Campo | Tipo | Origem |
|---|---|---|
| `prestador_uid` | string | token autenticado |
| `prestador_nome` | string | conta autenticada |
| `categoria_id` | string | formulário validado |
| `tipo_servico_id` | string | formulário validado |
| `titulo` | string de 5 a 120 caracteres | formulário |
| `descricao` | string de 20 a 5000 caracteres | formulário |
| `preco_centavos` | inteiro positivo | formulário |
| `unidade` | `SERVICO` ou `HORA` | tipo do catálogo |
| `prazo_dias` | inteiro de 1 a 365 | formulário |
| `ativo` | boolean | servidor |
| `criado_em` | timestamp | servidor |
| `atualizado_em` | timestamp | servidor |

## Relacionamentos

```text
usuarios 1 ---- N servicos
categorias 1 -- N tipos_servico
categorias 1 -- N servicos
tipos_servico 1 -- N servicos
```

O Firestore não cria chaves estrangeiras. A API verifica a existência e a compatibilidade da categoria e do tipo antes de criar o anúncio.

## Exclusão

O anúncio é excluído definitivamente somente depois que a API compara `prestador_uid` com o UID do token. Como o MVP não possui pedidos nem histórico de contratação, não há dependência que exija exclusão lógica.
