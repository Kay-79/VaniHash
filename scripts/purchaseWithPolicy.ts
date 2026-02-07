/**
 * Example: Purchase with Dynamic TransferPolicy Rule Handling
 * 
 * This script demonstrates how to:
 * 1. Call the marketplace purchase function (returns TransferRequest)
 * 2. Fetch and identify TransferPolicy rules
 * 3. Satisfy rules dynamically in the PTB
 * 4. Call confirm_request to complete the transfer
 */

import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

// =============================================================================
// Configuration - Replace with your actual values
// =============================================================================

const MARKETPLACE_PACKAGE_ID = '0xYOUR_MARKETPLACE_PACKAGE_ID';
const MARKETPLACE_CONFIG_ID = '0xYOUR_MARKETPLACE_CONFIG_OBJECT_ID';
const ROYALTY_RULE_PACKAGE_ID = '0xYOUR_ROYALTY_RULE_PACKAGE_ID'; // If using custom royalty rule

// =============================================================================
// Types
// =============================================================================

interface PolicyRule {
    type: string;
    packageId: string;
    moduleName: string;
    ruleName: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse rule type strings from TransferPolicy dynamic fields
 * Rule types are stored as: {package_id}::{module}::{RuleStruct}
 */
function parseRuleType(ruleType: string): PolicyRule | null {
    // Match format: 0x...::module::StructName
    const match = ruleType.match(/^(0x[a-fA-F0-9]+)::(\w+)::(\w+)$/);
    if (!match) return null;

    return {
        type: ruleType,
        packageId: match[1],
        moduleName: match[2],
        ruleName: match[3],
    };
}

/**
 * Fetch TransferPolicy rules from the blockchain
 */
async function fetchPolicyRules(
    client: SuiClient,
    policyId: string
): Promise<PolicyRule[]> {
    const policy = await client.getObject({
        id: policyId,
        options: { showContent: true },
    });

    if (!policy.data?.content || policy.data.content.dataType !== 'moveObject') {
        throw new Error('Failed to fetch policy');
    }

    // Get dynamic fields (rules) from the policy
    const dynamicFields = await client.getDynamicFields({
        parentId: policyId,
    });

    const rules: PolicyRule[] = [];

    for (const field of dynamicFields.data) {
        // Rule types are stored as dynamic field names
        const parsed = parseRuleType(field.name.type);
        if (parsed) {
            rules.push(parsed);
        }
    }

    return rules;
}

// =============================================================================
// Main Purchase Function with Dynamic Rule Handling
// =============================================================================

export async function purchaseWithDynamicRules(params: {
    client: SuiClient;
    kioskId: string;
    itemId: string;
    itemType: string;
    policyId: string;
    priceInMist: bigint;
    buyerAddress: string;
}): Promise<Transaction> {
    const { client, kioskId, itemId, itemType, policyId, priceInMist, buyerAddress } = params;

    // 1. Fetch policy rules
    const rules = await fetchPolicyRules(client, policyId);
    console.log('TransferPolicy rules found:', rules.map(r => `${r.moduleName}::${r.ruleName}`));

    // 2. Build the PTB
    const tx = new Transaction();

    // Calculate total payment: price + 2% marketplace fee
    const marketplaceFee = priceInMist * 2n / 100n;
    const totalPayment = priceInMist + marketplaceFee;

    // Split payment from gas coin
    const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(totalPayment)]);

    // 3. Call marketplace::market::purchase
    // Returns: (item: T, request: TransferRequest<T>)
    const [item, transferRequest] = tx.moveCall({
        target: `${MARKETPLACE_PACKAGE_ID}::market::purchase`,
        typeArguments: [itemType],
        arguments: [
            tx.object(kioskId),          // kiosk
            tx.pure.id(itemId),          // item_id
            tx.pure.u64(priceInMist),    // price
            payment,                      // payment (includes marketplace fee)
            tx.object(policyId),         // policy
            tx.object(MARKETPLACE_CONFIG_ID), // marketplace_config
        ],
    });

    // 4. Satisfy each policy rule dynamically
    for (const rule of rules) {
        switch (rule.ruleName) {
            case 'Rule': // Common royalty rule naming
                // Determine if this is a royalty rule
                if (rule.moduleName === 'royalty_rule') {
                    // Calculate royalty amount (fetch from policy or estimate)
                    // For safety, we over-estimate and let the contract handle it
                    const royaltyEstimate = priceInMist * 10n / 100n; // 10% max estimate
                    const [royaltyPayment] = tx.splitCoins(tx.gas, [tx.pure.u64(royaltyEstimate)]);

                    tx.moveCall({
                        target: `${rule.packageId}::${rule.moduleName}::pay`,
                        typeArguments: [itemType],
                        arguments: [
                            tx.object(policyId),      // policy
                            transferRequest,           // request (mutable)
                            royaltyPayment,            // payment
                        ],
                    });
                }
                break;

            case 'FloorPriceRule':
                // Floor price rules typically just need the request passed through
                // They check the price paid, which is already in the request
                tx.moveCall({
                    target: `${rule.packageId}::${rule.moduleName}::prove`,
                    typeArguments: [itemType],
                    arguments: [
                        tx.object(policyId),
                        transferRequest,
                    ],
                });
                break;

            case 'KioskLockRule':
                // Kiosk lock rule requires locking item in buyer's kiosk
                // This is more complex - requires buyer kiosk setup
                console.warn('KioskLockRule detected - buyer must have a kiosk. Skipping auto-handling.');
                break;

            default:
                console.warn(`Unknown rule: ${rule.moduleName}::${rule.ruleName}. Manual handling may be required.`);
        }
    }

    // 5. Confirm the transfer request (consume hot potato)
    tx.moveCall({
        target: '0x2::transfer_policy::confirm_request',
        typeArguments: [itemType],
        arguments: [
            tx.object(policyId),
            transferRequest,
        ],
    });

    // 6. Transfer item to buyer
    tx.transferObjects([item], tx.pure.address(buyerAddress));

    return tx;
}

// =============================================================================
// Usage Example
// =============================================================================

async function main() {
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });

    const tx = await purchaseWithDynamicRules({
        client,
        kioskId: '0x...', // Seller's kiosk
        itemId: '0x...',  // Item to purchase
        itemType: '0xPACKAGE::module::ItemType',
        policyId: '0x...', // TransferPolicy for this item type
        priceInMist: 1_000_000_000n, // 1 SUI
        buyerAddress: '0x...', // Buyer's address
    });

    console.log('Transaction built successfully!');
    console.log('Sign and execute with your wallet...');

    // Use with dapp-kit:
    // signAndExecute({ transaction: tx });
}

// Uncomment to run:
// main().catch(console.error);
