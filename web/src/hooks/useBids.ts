import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { MARKETPLACE_PACKAGE_ID, TRANSFER_POLICY_ID } from '@/constants/chain';

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

    const acceptBid = (
        kioskId: string,
        kioskCapId: string,
        itemId: string,
        bidId: string,
        itemType: string,
        onSuccess?: (result: any) => void,
        onError?: (error: any) => void
    ) => {
        if (!account) throw new Error("Wallet not connected");
        const tx = new Transaction();

        tx.moveCall({
            target: `${MARKETPLACE_PACKAGE_ID}::bids::accept_bid`,
            typeArguments: [itemType],
            arguments: [
                tx.object(bidId), // Pass the Bid object
                tx.object(kioskId), // Seller's Kiosk
                tx.object(kioskCapId), // Seller's Cap
                tx.object(itemId),
                tx.object(TRANSFER_POLICY_ID),
            ],
        });

        signAndExecute({ transaction: tx }, { onSuccess, onError });
    };

    return { createBid, acceptBid, isPending, isConnected: !!account };
}
