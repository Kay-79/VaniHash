
import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
    NETWORK: (process.env.SUI_NETWORK || 'testnet') as 'testnet' | 'mainnet' | 'devnet' | 'localnet',
    RPC_URL: process.env.SUI_RPC_URL, // Optional override

    // Core Packages
    VANIHASH_PACKAGE_ID: '0x0e9eeb64deb8b10b20de2b93b083b2a90f4e38004debdfe3b2f39384c8b08a74',
    MARKETPLACE_PACKAGE_ID: '0x092c8f782c515c27076fdc0a275df04711b14e39e9f8b2089e2f9855876ca18f', // Deployed on Testnet

    // Module Names
    MODULE_VANIHASH: 'vanihash',
    MODULE_MARKET: 'market',
    MODULE_BIDS: 'bids',

    // Indexer Settings
    POLL_INTERVAL_MS: 3000,
    ERROR_RETRY_MS: 60000,
};
