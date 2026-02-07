import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { MARKETPLACE_PACKAGE_ID, MARKETPLACE_CONFIG_ID, TRANSFER_POLICY_ID } from '@/constants/chain';

export function useBids() {
    const account = useCurrentAccount();
    const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

    const createBid = (
        itemsType: string, // The T in create_bid<T>
        amountMist: string | number,
        onSuccess?: (result: any) => void,
        onError?: (error: any) => void
    ) => {
        if (!account) throw new Error("Wallet not connected");
        const tx = new Transaction();

        // Provide Coin<SUI>
        const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(amountMist)]);

        tx.moveCall({
            target: `${MARKETPLACE_PACKAGE_ID}::bids::create_bid`,
            typeArguments: [itemsType],
            arguments: [
                payment,
                tx.object(TRANSFER_POLICY_ID), // The Policy ID determines the collection "Target"
            ],
        });

        signAndExecute({ transaction: tx }, { onSuccess, onError });
    };

    const cancelBid = (
        bidId: string,
        onSuccess?: (result: any) => void,
        onError?: (error: any) => void
    ) => {
        if (!account) throw new Error("Wallet not connected");
        const tx = new Transaction();

        tx.moveCall({
            target: `${MARKETPLACE_PACKAGE_ID}::bids::cancel_bid`,
            arguments: [
                tx.object(bidId),
            ],
        });

        signAndExecute({ transaction: tx }, { onSuccess, onError });
    };

    /**
     * Accept a bid - returns (Item, TransferRequest, bidderAddress)
     * 
     * The PTB must:
     * 1. Satisfy all policy rules (royalty, etc.)
     * 2. Call confirm_request
     * 3. Transfer item to bidder
     * 4. Withdraw proceeds from kiosk
     */
    const acceptBid = (
        kioskId: string,
        kioskCapId: string,
        itemId: string,
        bidId: string,
        itemType: string,
        bidderAddress: string,
        royaltyBp: number = 0, // Royalty in basis points
        bidAmount: string | number,
        onSuccess?: (result: any) => void,
        onError?: (error: any) => void
    ) => {
        if (!account) throw new Error("Wallet not connected");
        const tx = new Transaction();

        // Call accept_bid - returns (item, request, bidder)
        const [item, transferRequest] = tx.moveCall({
            target: `${MARKETPLACE_PACKAGE_ID}::bids::accept_bid`,
            typeArguments: [itemType],
            arguments: [
                tx.object(bidId),      // Bid object
                tx.object(kioskId),    // Seller's Kiosk
                tx.object(kioskCapId), // Seller's Cap
                tx.pure.id(itemId),
                tx.object(TRANSFER_POLICY_ID),
                tx.object(MARKETPLACE_CONFIG_ID),
            ],
        });

        // If royalty exists, pay it from seller (deducted from proceeds)
        if (royaltyBp > 0) {
            const bidAmountNum = typeof bidAmount === 'string' ? parseInt(bidAmount) : bidAmount;
            const royaltyAmount = Math.floor(bidAmountNum * royaltyBp / 10000);
            const [royaltyPayment] = tx.splitCoins(tx.gas, [tx.pure.u64(royaltyAmount)]);
            tx.moveCall({
                target: `${MARKETPLACE_PACKAGE_ID}::royalty_rule::pay`,
                typeArguments: [itemType],
                arguments: [
                    tx.object(TRANSFER_POLICY_ID),
                    transferRequest,
                    royaltyPayment,
                ],
            });
        }

        // Confirm the transfer request
        tx.moveCall({
            target: '0x2::transfer_policy::confirm_request',
            typeArguments: [itemType],
            arguments: [
                tx.object(TRANSFER_POLICY_ID),
                transferRequest,
            ],
        });

        // Transfer item to bidder
        tx.transferObjects([item], tx.pure.address(bidderAddress));

        // Withdraw proceeds from kiosk to seller
        const [proceeds] = tx.moveCall({
            target: '0x2::kiosk::withdraw',
            arguments: [
                tx.object(kioskId),
                tx.object(kioskCapId),
                tx.pure.option('u64', null), // Withdraw all
            ],
        });
        tx.transferObjects([proceeds], tx.pure.address(account.address));

        signAndExecute({ transaction: tx }, { onSuccess, onError });
    };

    return { createBid, cancelBid, acceptBid, isPending, isConnected: !!account };
}
