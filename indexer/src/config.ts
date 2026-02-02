
import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
    NETWORK: (process.env.SUI_NETWORK || 'testnet') as 'testnet' | 'mainnet' | 'devnet' | 'localnet',
    RPC_URL: process.env.SUI_RPC_URL, // Optional override

    // Core Packages
    VANIHASH_PACKAGE_ID: process.env.VANIHASH_PACKAGE_ID || "0xe3f6f3093c6ccf962161bd7be3baf6b2ef8d6c608bb90d6fda4d83047b24d759",
    MARKETPLACE_PACKAGE_ID: process.env.MARKETPLACE_PACKAGE_ID || '0xc3c4f4175d0de34c312f8951bfdff743627a53597d1989e7d486019cb195ca3a', // Deployed on Testnet

    // Module Names
    MODULE_VANIHASH: 'vanihash',
    MODULE_MARKET: 'market',
    MODULE_BIDS: 'bids',

    // Indexer Settings
    POLL_INTERVAL_MS: 3000,
    ERROR_RETRY_MS: 60000,
};
