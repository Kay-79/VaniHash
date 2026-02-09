
import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
    NETWORK: (process.env.SUI_NETWORK || 'testnet') as 'testnet' | 'mainnet' | 'devnet' | 'localnet',
    RPC_URL: process.env.SUI_RPC_URL, // Optional override

    // Core Packages
    VANIHASH_PACKAGE_ID: '0x000000042204842d5b4c86afecf71c92bcb7367badda77a19dd154f8e5bcbe01',
    MARKETPLACE_PACKAGE_ID: '0x955c025740a9ff1565b9fde3190f565dfed3d1b3e5822433e66024e93671b41d', // v5 simplified escrow only (deletes listings)

    // Module Names
    MODULE_VANIHASH: 'vanihash',
    MODULE_MARKET: 'market',
    MODULE_BIDS: 'bids',
    MODULE_CONFIG: 'config',

    // Indexer Settings
    POLL_INTERVAL_MS: 20000,
    ERROR_RETRY_MS: 120000,
};
