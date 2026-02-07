import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { MARKETPLACE_PACKAGE_ID, MARKETPLACE_CONFIG_ID, TRANSFER_POLICY_ID } from '@/constants/chain';

export function useBids() {
    const account = useCurrentAccount();
    const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

    /**
     * Create a bid on a listed item
     */
    const createBid = (
        listingId: string,
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
            arguments: [
                payment,
                tx.object(listingId),
            ],
        });

        signAndExecute({ transaction: tx }, { onSuccess, onError });
    };

    /**
     * Cancel a bid
     */
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
     * Accept a bid on a listing
     * 1. Cancel listing to get item back
     * 2. Accept bid with item
     * 3. Transfer item to bidder
     */
    const acceptBid = (
        listingId: string,
        bidId: string,
        itemType: string,
        onSuccess?: (result: any) => void,
        onError?: (error: any) => void
    ) => {
        if (!account) throw new Error("Wallet not connected");
        const tx = new Transaction();

        // 1. Cancel Listing -> Retrieve Item
        const item = tx.moveCall({
            target: `${MARKETPLACE_PACKAGE_ID}::escrow::cancel`,
            typeArguments: [itemType],
            arguments: [
                tx.object(listingId),
            ],
        });

        // 2. Accept Bid -> Get Item (ref) and Bidder Address
        // Note: accept_bid returns (item, bidder)
        const [transferredItem, bidder] = tx.moveCall({
            target: `${MARKETPLACE_PACKAGE_ID}::bids::accept_bid`,
            typeArguments: [itemType],
            arguments: [
                tx.object(bidId),
                item,
                tx.object(MARKETPLACE_CONFIG_ID),
            ],
        });

        // 3. Transfer Item to Bidder
        tx.transferObjects([transferredItem], bidder);

        signAndExecute({ transaction: tx }, { onSuccess, onError });
    };

    return { createBid, cancelBid, acceptBid, isPending, isConnected: !!account };
}
