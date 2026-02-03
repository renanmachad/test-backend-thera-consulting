# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies
pnpm install

# Development server with hot reload
pnpm start:dev

# Production build and run
pnpm build
pnpm start:prod

# Linting
pnpm lint

# Testing
pnpm test              # Unit tests
pnpm test:watch        # Watch mode
pnpm test:cov          # Coverage report
pnpm test:e2e          # E2E tests

# Run a single test file
pnpm test -- src/product/product.service.spec.ts

# Database operations
pnpm prisma:generate         # Generate Prisma client
pnpm prisma:migrate:dev      # Create and run migrations
pnpm prisma:migrate:deploy   # Deploy migrations (production)
pnpm prisma:studio           # Visual database explorer
```

## Architecture Overview

NestJS REST API for e-commerce order/product management with PostgreSQL.

### Layered Architecture

```
HTTP Request → Controller → Service → Repository → PrismaService → PostgreSQL
```

- **Controllers**: Handle HTTP requests, delegate to services
- **Services**: Business logic, validation, orchestration
- **Repositories**: Data access abstraction (interface-based)
- **PrismaService**: ORM wrapper with connection pooling (PrismaPg adapter)

### Module Structure

```
src/
├── prisma/          # Global database module (PrismaService)
├── product/         # Product domain (CRUD + stock management)
│   ├── repositories/  # IProductRepository interface + implementation
│   ├── dto/           # CreateProductDto, UpdateProductDto
│   └── entities/
└── order/           # Order domain (complex business logic)
    ├── repositories/  # IOrderRepository interface + implementation
    ├── dto/
    └── entities/      # Order entity + OrderStatus enum
```

### Database Schema (Prisma)

Three models: `Product`, `Order`, `OrderProduct` (junction table)

- OrderStatus enum: `PENDENTE | CONCLUIDO | CANCELADO`
- Cascade delete on Order → OrderProduct
- Unique constraint: (orderId, productId) prevents duplicate items

### Key Business Logic (OrderService)

**Order Status Transitions with Stock Management:**
- `PENDENTE` → `CONCLUIDO`: Validates and deducts stock from products
- `CONCLUIDO` → `CANCELADO`: Restores stock to products
- `PENDENTE` → `CANCELADO`: No stock adjustment
- Order deletion is blocked (returns 400) - use CANCELADO status instead

**Order Creation:**
- Batch fetches products (N+1 prevention via `findManyByIds`)
- Validates product existence and stock availability
- Stores `price_at_purchase` for historical accuracy

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Health check |
| POST/GET/PATCH/DELETE | `/product` | Product CRUD |
| POST/GET/PATCH | `/order` | Order CRUD (DELETE blocked) |
| GET | `/api` | Swagger documentation |

## Environment Setup

Requires `DATABASE_URL` environment variable for PostgreSQL connection.

```bash
# Example .env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

## Testing Patterns

Tests are co-located with source files (`*.spec.ts`). Repository pattern enables mocking:

```typescript
// Mock repository in service tests
const mockProductRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  // ...
};
```
