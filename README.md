# VaniHash - Decentralized Vanity Task Marketplace

## Project Description
**VaniHash** is a decentralized **Task Marketplace** on the Sui blockchain where users can request custom vanity Object IDs, and miners compete to generate them.

Unlike traditional vanity address generators where you mine for yourself, VaniHash creates a wildly efficient economy around "Vibs":
- **Creators** post **Tasks** specifying a desired prefix (e.g., `0xcafe...`) and a reward.
- **Miners** browse these tasks, use their computational power to "mine" the matching Salt/ID (Proof-of-Work), and submit the proof.
- **Trade**: The mined vanity objects can be traded or transferred securely on the VaniHash marketplace.

This platform turns computational work into a tradable asset, creating a liquid market for simplified, human-readable, or "vibey" Sui Object IDs.

## Hackathon Track
**Category**: **Sui Track**
*Building an innovative application with great "Vibe" on Sui.*

## Features
- **Task Creation**: Users create on-chain requests for specific vanity prefixes alongside a bounty.
- **Decentralized Mining**: Miners discover tasks and perform Proof-of-Work off-chain to find the matching salt.
- **Secure Exchange**: Smart contracts ensure the mined object satisfies the requirement before releasing rewards.
- **Marketplace**: A secondary market to trade the generated Vanity NFTs/Objects.
- **Real-Time Indexer**: Tracks new tasks, mining progress, and marketplace listings instantly.

## Architecture
- **Smart Contracts**: Written in **Move 2024** (beta/stable edition), deployed on Sui Testnet.
- **Frontend**: **Next.js 16** (App Router), React 19, TypeScript, Tailwind CSS 4.
- **Indexer**: Node.js service using `@mysten/sui` SDK and Prisma/PostgreSQL to sync on-chain events.
- **Database**: PostgreSQL (managed via Prisma ORM) for off-chain data caching.

## Deployment & Installation

### Prerequisites
- Node.js (v20+)
- Sui Client CLI
- PostgreSQL Database

### 1. Smart Contracts
Deploy the Move packages (found in `contracts/`):
```bash
cd contracts
sui move build
sui client publish --gas-budget 100000000
```

### 2. Frontend (Web)
Run the Next.js application:
```bash
cd web
npm install
# Set up .env.local with your SUI_NETWORK and other vars
npm run dev
```
Access the app at `http://localhost:3000`.

### 3. Indexer
Run the event indexer:
```bash
cd indexer
npm install
# Ensure DATABASE_URL is set in .env
npm run start
```

## AI Tool Disclosure
This project was developed with the assistance of AI coding tools:
- **Tool**: Google Gemini / Antigravity Agent
- **Usage**: Used for code generation, architectural planning, debugging Move contracts, and optimizing React components.
- **Key Prompts**: "Refactor marketplace indexing", "Fix Move visibility error", "Implement vanilla CSS styling for components".

## Live Demo
Check out the live version here: [VaniHash Demo](https://vanihash-demo-placeholder.vercel.app/)
*(Please update this link with the actual deployment URL)*

## Open Source License
MIT License
