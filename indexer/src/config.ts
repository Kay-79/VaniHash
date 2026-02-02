
import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
    NETWORK: (process.env.SUI_NETWORK || 'testnet') as 'testnet' | 'mainnet' | 'devnet' | 'localnet',
    RPC_URL: process.env.SUI_RPC_URL, // Optional override

    // Core Packages
    VANIHASH_PACKAGE_ID: '0xc9fb95f018b757caaafef1c92d88f5c4f39d629a6801ff2afaa1faf2c5042b38',
    MARKETPLACE_PACKAGE_ID: process.env.MARKETPLACE_PACKAGE_ID || '0xc3c4f4175d0de34c312f8951bfdff743627a53597d1989e7d486019cb195ca3a', // Deployed on Testnet

    // Module Names
    MODULE_VANIHASH: 'vanihash',
    MODULE_MARKET: 'market',
    MODULE_BIDS: 'bids',

    // Indexer Settings
    POLL_INTERVAL_MS: 3000,
    ERROR_RETRY_MS: 60000,
};
