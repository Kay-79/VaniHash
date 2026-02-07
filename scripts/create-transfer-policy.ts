/**
 * Script to create a TransferPolicy for Kiosk marketplace
 * 
 * Usage:
 *   npx ts-node scripts/create-transfer-policy.ts
 * 
 * This creates a TransferPolicy for a specific item type (e.g., SUI Coin)
 * and outputs the TransferPolicy ID to use in your config.
 */

import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const NETWORK = 'testnet';
const ITEM_TYPE = '0x2::coin::Coin<0x2::sui::SUI>'; // Change this for different item types

async function main() {
    // Load keypair from environment or use default
    const privateKey = process.env.SUI_PRIVATE_KEY;
    if (!privateKey) {
        console.error('Please set SUI_PRIVATE_KEY environment variable');
        console.log('\nExample:');
        console.log('  export SUI_PRIVATE_KEY="your_private_key_here"');
        console.log('  npx ts-node scripts/create-transfer-policy.ts');
        process.exit(1);
    }

    const keypair = Ed25519Keypair.fromSecretKey(privateKey);
    const client = new SuiClient({ url: getFullnodeUrl(NETWORK) });

    console.log('Creating TransferPolicy for:', ITEM_TYPE);
    console.log('Address:', keypair.toSuiAddress());

    const tx = new Transaction();

    // Create default TransferPolicy (no rules)
    const [policy, cap] = tx.moveCall({
        target: '0x2::transfer_policy::default',
        typeArguments: [ITEM_TYPE],
    });

    // Share the policy so anyone can use it for purchases
    tx.moveCall({
        target: '0x2::transfer::public_share_object',
        typeArguments: ['0x2::transfer_policy::TransferPolicy<' + ITEM_TYPE + '>'],
        arguments: [policy],
    });

    // Transfer the cap to yourself (you'll need it to add rules later)
    tx.transferObjects([cap], tx.pure.address(keypair.toSuiAddress()));

    try {
        const result = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
            options: {
                showObjectChanges: true,
            },
        });

        console.log('\n✅ TransferPolicy created successfully!');
        console.log('Transaction digest:', result.digest);
        console.log('\nCreated objects:');

        result.objectChanges?.forEach((change: any) => {
            if (change.type === 'created') {
                console.log(`  - ${change.objectType}: ${change.objectId}`);
                if (change.objectType.includes('TransferPolicy<')) {
                    console.log('\n📝 Update your chain.ts with:');
                    console.log(`export const TRANSFER_POLICY_ID = '${change.objectId}';`);
                }
            }
        });
    } catch (error) {
        console.error('Failed to create TransferPolicy:', error);
    }
}

main();
