# Global Prisma Setup Guide

This project uses a **single global Prisma schema** located at `./prisma/schema.prisma` in the project root. This schema generates two separate Prisma Clients: one for the **Web** app and one for the **Indexer**.

## 1. Directory Structure

```text
/VaniHash
  ├── .env                  <-- Global env file (DATABASE_URL, DIRECT_URL)
  ├── prisma/
  │    └── schema.prisma    <-- Single source of truth
  ├── web/
  │    └── node_modules/    <-- Generates @prisma/client here
  └── indexer/
       └── node_modules/    <-- Generates @prisma/client here
```

## 2. Environment Variables

You can use the **existing `.env` files** in `web/` or `indexer/` instead of creating a duplicate one in the root.

To do this, use `dotenv-cli` to load the variables when running commands.

### Option A: Using `npx` (No setup required)
Run the command by pointing to your web environment file.
**Note:** Use `dotenv-cli` (not `dotenv`).

```bash
npx dotenv-cli -e web/.env -- npx prisma db push --accept-data-loss
```

### Option B: Root package.json (Recommended)
I have created a `package.json` in the root with shortcuts.

1.  **Install dependencies** (once):
    ```bash
    npm install
    ```

2.  **Reset Database (If Schema Changed Incompatibly)**
    If you get errors like "Identity column type..." or need a fresh start:
    ```bash
    npm run db:reset
    ```

3.  **Push DB changes** (Schema -> DB + Generate Clients):
    ```bash
    npm run db:push
    ```
    This automatically runs `prisma generate` which updates the clients in both `web/` and `indexer/`.

## 3. How to Run Prisma Commands

You should run all Prisma commands from the **ROOT directory** (`/WorkSpace/VaniHash`) using the scripts above.

### View Database (Studio)
```bash
npm run studio
```

## 4. Troubleshooting

**Error: "Environment variable not found: DIRECT_URL"**
- **Cause:** You are running `npx prisma` from the root, but don't have a `.env` file in the root.
- **Fix:** Copy `DATABASE_URL` and `DIRECT_URL` from `web/.env` or `indexer/.env` to a new `.env` file in the root.

**Error: "Could not find Prisma Schema"**
- **Cause:** You are running the command from inside `web/` or `indexer/`.
- **Fix:** `cd ..` to the project root and run the command there.

**Error: Types mismatch / Client not initialized**
- **Cause:** You updated the schema but didn't run `prisma generate`.
- **Fix:** Run `npx prisma generate` from the root.
