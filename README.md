# VaniHash - Decentralized Vanity Task Marketplace

## Project Description
**VaniHash** is a decentralized **Task Marketplace** on the Sui blockchain where users can request custom **Vanity Object & Package IDs**, and miners compete to generate them.

Whether you need a cool address for a new Move Package (e.g., `0x00...cafe`) or a unique Object ID for a special NFT, VaniHash streamlines the process:
- **Creators** post **Tasks** specifying a desired prefix for their future Object or Package ID and a reward.
- **Miners** browse tasks, use their computational power to "mine" the correct ID (Proof-of-Work), and submit the result.
- **Delivery**: The creator receives the Object ID or Package ID at the desired Vanity Address.

This platform turns unit-generating work into a secure, tradable service for developers and collectors alike.

## Hackathon Track
**Category**: **Sui Track**
*Building an innovative application with great "Vibe" on Sui.*

## Features
- **Dual Vanity Support**: Request specific prefixes for both **Move Packages** and **General Objects**.
- **Decentralized Mining Protocol**: Miners perform Proof-of-Work to find the salt that generates the target ID.
- **Secure Submission**: Miners submit the solution on-chain to claim rewards.
- **Verifiable Results**: Smart contracts verify that the submitted salt produces the requested vanity pattern.
- **Real-Time Indexer**: Tracks tasks, mining solutions, and marketplace activity.

## Mining Tools
Miners can use our open-source CLI tool to discover tasks and generate proofs:
- **Sui ID Miner**: [https://github.com/Kay-79/sui-id-miner](https://github.com/Kay-79/sui-id-miner)
*(This tool is optimized for finding salts for VaniHash tasks)*

## Architecture
- **Smart Contracts**: Written in **Move 2024** (beta/stable edition), deployed on Sui Testnet.
- **Frontend**: **Next.js 16** (App Router), React 19, TypeScript, Tailwind CSS 4.
- **Indexer**: Node.js service using `@mysten/sui` SDK and Prisma/PostgreSQL to sync on-chain events.
- **Database**: PostgreSQL (managed via Prisma ORM) for off-chain data caching.

## Deployment & Installation

### Prerequisites
- Node.js (v20+)
- Sui Client CLI
- Supabase

### 1. Smart Contracts
Deploy the Move packages (found in `contracts/`):
```bash
cd contracts/vanihash/
sui move build
sui client publish --gas-budget 100000000

cd ../marketprice
sui move build
sui client publish --gas-budget 100000000
```

### 2. Root
Init
```bash
npm install
npx prisma generate
```

### 3. Frontend (Web)
Run the Next.js application:
```bash
cd web
npm install
# Set up .env
npm run dev
```
Access the app at `http://localhost:3000`.

### 4. Indexer
Run the event indexer:
```bash
cd indexer
npm install
# Set up .env
npm run start
```

## AI Tool Disclosure
This project was developed with the assistance of AI coding tools:
- **Tool**: Google Gemini / Antigravity Agent
- **Usage**: Used for code generation, architectural planning, debugging Move contracts, and optimizing React components.
- **Key Prompts**: "Refactor marketplace indexing", "Fix Move visibility error", "Implement vanilla CSS styling for components".

## Live Demo
Check out the live version here: [VaniHash Demo](https://vani-hash.vercel.app/)

## Open Source License
MIT License
