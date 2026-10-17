# Welcome to Prisma ORM!

Prisma ORM lets you query your database in simple, easy-to-read TypeScript. Define what your data looks like, and Prisma ORM gives you a fully typed client — with autocomplete for every table, column, and relation.

This project is set up for PostgreSQL. Prisma ORM also supports other databases.

## Requirements

- **PostgreSQL 15 or newer.** Older servers are not supported. Run `SELECT version()` against your server to verify.
- The CLI never connects to your database without explicit consent. Pass `--probe-db` to `npx prisma orm init` if you want `init` to verify the server version itself.

## Your data contract

Your data contract is the heart of your application. It lives at [`src/prisma/contract.prisma`](src/prisma/contract.prisma) and describes your models.

## Configuration

[`prisma.config.ts`](prisma.config.ts) tells the CLI where your contract lives and how to connect to your database. It loads environment variables from `.env` automatically:

```typescript
import 'dotenv/config';
import { definePrismaConfig } from '@prisma/cli-engine';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

export default definePrismaConfig({
  orm: ormConfig({
    contract: './src/prisma/contract.prisma',
    db: {
      connection: process.env['DATABASE_URL']!,
    },
  }),
});
```

## Quick reference

### Commands

```bash
npx prisma contract emit       # Update contract.json and contract.d.ts
npx prisma db init             # Create tables in the database
npx prisma migration status    # Show migration status
```
