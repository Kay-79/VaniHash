
import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
    NETWORK: (process.env.SUI_NETWORK || 'testnet') as 'testnet' | 'mainnet' | 'devnet' | 'localnet',
    RPC_URL: process.env.SUI_RPC_URL, // Optional override

    // Core Packages
    VANIHASH_PACKAGE_ID: '0x0e9eeb64deb8b10b20de2b93b083b2a90f4e38004debdfe3b2f39384c8b08a74',
    MARKETPLACE_PACKAGE_ID: '0x5964616dbc4b9576f8ce622d939a2f6e0c3b01b9b583cbee98ca4a59766ec22d', // v4 simplified escrow only

    // Module Names
    MODULE_VANIHASH: 'vanihash',
    MODULE_MARKET: 'market',
    MODULE_BIDS: 'bids',
    MODULE_CONFIG: 'config',

    // Indexer Settings
    POLL_INTERVAL_MS: 30000,
    ERROR_RETRY_MS: 120000,
};
