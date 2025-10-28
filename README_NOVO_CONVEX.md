# Novo Projeto Convex (Banco de Usuários)

Este diretório adiciona um novo projeto Convex focado em gestão de usuários, separado do `convex/` atual.

## Estrutura

- `convex_new/schema.ts`: schema com tabelas `users` e `validUsers` (e tabelas de auth).
- `convex_new/auth.ts`: configuração básica do Convex Auth (Password provider).
- `convex_new/userManagement.ts`: queries/mutations para criar, listar e atualizar usuários.
- `convex_new/tsconfig.json`: configuração TypeScript para funções Convex.

## Como inicializar um novo deployment Convex

1. Faça login no Convex (se necessário):
   - `npx convex login`
2. Inicialize um novo projeto apontando para este diretório:
   - Mova/renomeie temporariamente `convex_new` para `convex` (ou use um repo separado) e rode:
   - `npx convex init`
3. Gere os tipos e verifique o schema:
   - `npx convex dev --once`

> Observação: o CLI procura por um diretório chamado `convex/`. Por isso, a maneira mais simples é renomear `convex_new` para `convex` quando quiser usar este novo backend (ou manter um segundo repo somente para o novo projeto).

## Conectar o frontend

Atualize a URL do Convex no frontend para apontar ao novo deployment:

- Crie um arquivo `.env.local` na raiz com:
  - `VITE_CONVEX_URL="https://<sua-deployment-id>.convex.cloud"`
- O frontend já usa `VITE_CONVEX_URL` em `src/main.tsx`.

## Rotas disponíveis

Funções em `convex_new/userManagement.ts`:

- `listUsers` (query)
- `getUserByEmail` (query)
- `createUser` (mutation)
- `setRole` (mutation)
- `deactivateUser` (mutation)

Você pode importar pelo cliente gerado `api` após rodar `convex dev --once`.

## Próximos passos

- Adicionar provedores de autenticação adicionais (Google, Anonymous, etc.) em `auth.ts` se necessário.
- Criar índices adicionais ou relacionamentos conforme o escopo crescer (ex.: equipes, permissões, logs).