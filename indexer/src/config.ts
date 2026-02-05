
import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
    NETWORK: (process.env.SUI_NETWORK || 'testnet') as 'testnet' | 'mainnet' | 'devnet' | 'localnet',
    RPC_URL: process.env.SUI_RPC_URL, // Optional override

    // Core Packages
    VANIHASH_PACKAGE_ID: '0x0e9eeb64deb8b10b20de2b93b083b2a90f4e38004debdfe3b2f39384c8b08a74',
    MARKETPLACE_PACKAGE_ID: '0x782da4a3113f28bc9be9ff86ea766d08827eb3855d0069b5d86d2c4494b78e5d', // Deployed on Testnet

    // Module Names
    MODULE_VANIHASH: 'vanihash',
    MODULE_MARKET: 'market',
    MODULE_BIDS: 'bids',

    // Indexer Settings
    POLL_INTERVAL_MS: 3000,
    ERROR_RETRY_MS: 60000,
};
