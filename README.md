# E-commerce API - Backend

API REST para gerenciamento de produtos e pedidos de e-commerce, construída com NestJS, PostgreSQL e Prisma.

## 📋 Pré-requisitos

- Node.js 20+ 
- pnpm (gerenciador de pacotes)
- Docker e Docker Compose (para execução via containers)
- PostgreSQL (se executar localmente sem Docker)

## 🚀 Execução Local

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce?schema=public"
API_KEY="your-secure-api-key-here"
PORT=3000
```

### 3. Gerar Prisma Client

```bash
pnpm prisma:generate
```

### 4. Executar migrations

```bash
# Criar e aplicar migrations
pnpm prisma:migrate:dev

# Ou apenas aplicar migrations existentes
pnpm prisma:migrate:deploy
```

### 5. Iniciar aplicação

```bash
# Modo desenvolvimento (com hot reload)
pnpm start:dev

# Modo produção
pnpm build
pnpm start:prod
```

A aplicação estará disponível em `http://localhost:3000`

## 🐳 Execução com Docker Compose

### Iniciar todos os serviços (PostgreSQL + Aplicação)

```bash
docker-compose up -d
```

### Ver logs da aplicação

```bash
docker-compose logs -f app
```

### Parar todos os serviços

```bash
docker-compose down
```

### Parar e remover volumes (limpar banco de dados)

```bash
docker-compose down -v
```

## 🧪 Executar Testes

### Localmente

```bash
# Testes unitários
pnpm test

# Testes em modo watch
pnpm test:watch

# Testes com cobertura
pnpm test:cov

# Testes E2E
pnpm test:e2e
```

### Via Docker Compose

```bash
docker-compose --profile test up test
```

## 📦 Build da Imagem Docker

### Construir imagem

```bash
docker build -t test-backend-thera-consulting .
```

### Executar container manualmente

```bash
# Iniciar PostgreSQL primeiro
docker-compose up -d postgres-thera-consulting

# Executar aplicação
docker run -d \
  --name test-backend-app \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/ecommerce?schema=public" \
  -e API_KEY="your-secure-api-key-here" \
  -e PORT=3000 \
  test-backend-thera-consulting
```

## 🗄️ Migrations do Prisma

### Criar nova migration

```bash
pnpm prisma:migrate:dev --name nome_da_migration
```

### Aplicar migrations em produção

```bash
pnpm prisma:migrate:deploy
```

### Abrir Prisma Studio (interface visual do banco)

```bash
pnpm prisma:studio
```

### Resetar banco de dados (cuidado: apaga todos os dados)

```bash
pnpm prisma:migrate:reset
```

## 📚 Documentação da API

Após iniciar a aplicação, acesse a documentação Swagger em:

```
http://localhost:3000/api
```

## 🔐 Autenticação

A API utiliza autenticação via API Key. Envie a chave em um dos seguintes formatos:

- Header: `Authorization: Bearer <API_KEY>`
- Header: `X-API-Key: <API_KEY>`

## 🏗️ Estrutura do Projeto

```
src/
├── common/          # Código compartilhado (guards, decorators, helpers)
├── product/         # Módulo de produtos
├── order/           # Módulo de pedidos
├── prisma/          # Serviço Prisma
└── main.ts          # Arquivo principal
```

## 📝 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `pnpm start:dev` | Inicia em modo desenvolvimento |
| `pnpm build` | Compila o projeto |
| `pnpm start:prod` | Inicia em modo produção |
| `pnpm test` | Executa testes unitários |
| `pnpm test:cov` | Executa testes com cobertura |
| `pnpm lint` | Executa linter |
| `pnpm prisma:generate` | Gera Prisma Client |
| `pnpm prisma:migrate:dev` | Cria e aplica migrations |
| `pnpm prisma:migrate:deploy` | Aplica migrations (produção) |
| `pnpm prisma:studio` | Abre Prisma Studio |

## 🔧 Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `DATABASE_URL` | URL de conexão com PostgreSQL | postgresql://postgres:postgres@localhost:5432/ecommerce?schema=public |
| `API_KEY` | Chave de autenticação da API | - |
| `PORT` | Porta da aplicação | 3000 |
| `NODE_ENV` | Ambiente de execução | development |

## 📄 Licença

Este projeto é privado e não possui licença pública.
