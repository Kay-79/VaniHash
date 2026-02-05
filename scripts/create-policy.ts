import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import dotenv from 'dotenv';

dotenv.config();

// CONFIGURATION
const NETWORK = 'testnet';
// The Marketplace Package ID where royalty_rule is defined
const MARKETPLACE_PACKAGE_ID = '0x782da4a3113f28bc9be9ff86ea766d08827eb3855d0069b5d86d2c4494b78e5d';
const ROYALTY_RULE_TYPE = `${MARKETPLACE_PACKAGE_ID}::royalty_rule::Rule`;
const ROYALTY_AMOUNT_BPS = 100; // 1%
const BENEFICIARY_ADDRESS = '0x32ff5fdf9cb8be86dd9be6d5904717a1348b3917bc270305745e08123981ec30'; // Admin

const args = process.argv.slice(2);
const ITEM_TYPE = args[0];

if (!ITEM_TYPE) {
    console.error('Usage: npx tsx scripts/create-policy.ts <ITEM_TYPE>');
    console.error('Example: npx tsx scripts/create-policy.ts 0x2::sui::SUI');
    process.exit(1);
}

if (!process.env.PRIVATE_KEY) {
    console.error('Error: PRIVATE_KEY not found in .env file.');
    process.exit(1);
}

async function main() {
    // Initialize Client
    const client = new SuiClient({ url: getFullnodeUrl(NETWORK) });

    // Initialize Signer
    let keypair;
    const privateKey = process.env.PRIVATE_KEY;
    if (privateKey.startsWith('suiprivkey')) {
        const { secretKey } = decodeSuiPrivateKey(privateKey);
        keypair = Ed25519Keypair.fromSecretKey(secretKey);
    } else {
        // Assume hex or other format (legacy)
        console.error('Please use a suiprivkey format PRIVATE_KEY');
        process.exit(1);
    }

    const sender = keypair.toSuiAddress();
    console.log(`Using wallet: ${sender}`);
    console.log(`Creating Transfer Policy for type: ${ITEM_TYPE}`);

    const tx = new Transaction();

    // 1. Create Policy
    // returns [Policy, PolicyCap]
    const [policy, policyCap] = tx.moveCall({
        target: '0x2::transfer_policy::new',
        typeArguments: [ITEM_TYPE],
        arguments: [
            tx.object('0x6'), // Kiosk Publisher (needs Publisher object?)
            // WAIT - transfer_policy::new requires a Publisher object.
            // "pub: &Publisher"
            // The user must have a Publisher object for the type T.
            // If T is NOT their module, they cannot create a policy for it?
            // CORRECT. Only the publisher of the module T can create a TransferPolicy for T.

            // If the user wants to trade generic items (like SUI), a policy might already exist.
            // If the user deployed 'vanihash', they have the Publisher for 'vanihash'.
        ],
    });

    // ... This approach assumes the user is the publisher. 
    // If they are not the publisher, they cannot create a policy.
    // If they are testing with their own dummy NFT, they need the Publisher ID.
}

// Check constraints before proceeding:
// To create a TransferPolicy for type T, you need the Publisher object for T.
// If the user is trying to trade random items, they need to find the existing policy.
// If the user is trying to trade THEIR items, they need their Publisher object ID.

main();
