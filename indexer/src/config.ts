
import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
    NETWORK: (process.env.SUI_NETWORK || 'testnet') as 'testnet' | 'mainnet' | 'devnet' | 'localnet',
    RPC_URL: process.env.SUI_RPC_URL, // Optional override

    // Core Packages
    VANIHASH_PACKAGE_ID: '0x0e9eeb64deb8b10b20de2b93b083b2a90f4e38004debdfe3b2f39384c8b08a74',
    MARKETPLACE_PACKAGE_ID: '0x3cf0ec9e9c6850ff18178b455faa93e104bdfae0b3cbe8e1f5b6e38d1f099620', // New version with TransferPolicy support

    // Module Names
    MODULE_VANIHASH: 'vanihash',
    MODULE_MARKET: 'market',
    MODULE_BIDS: 'bids',
    MODULE_CONFIG: 'config',

    // Indexer Settings
    POLL_INTERVAL_MS: 30000,
    ERROR_RETRY_MS: 120000,
};
