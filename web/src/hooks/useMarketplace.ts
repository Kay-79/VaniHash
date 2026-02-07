import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { MARKETPLACE_PACKAGE_ID, MARKETPLACE_CONFIG_ID, TRANSFER_POLICY_ID } from '@/constants/chain';

export function useMarketplace() {
    const account = useCurrentAccount();
    const client = useSuiClient();
    const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

    /**
     * List an item for sale (Escrow)
     * No Kiosk or TransferPolicy required
     */
    const list = (
        itemId: string,
        itemType: string,
        priceMist: string | number,
        onSuccess?: (result: any) => void,
        onError?: (error: any) => void
    ) => {
        if (!account) throw new Error("Wallet not connected");
        const tx = new Transaction();

        tx.moveCall({
            target: `${MARKETPLACE_PACKAGE_ID}::escrow::list`,
            typeArguments: [itemType],
            arguments: [
                tx.object(itemId),
                tx.pure.u64(priceMist),
            ],
        });

        signAndExecute({ transaction: tx }, { onSuccess, onError });
    };

    /**
     * Buy a listed item (Escrow)
     */
    const buy = (
        listingId: string,
        itemType: string,
        priceMist: string | number,
        onSuccess?: (result: any) => void,
        onError?: (error: any) => void
    ) => {
        if (!account) {
            onError?.(new Error("Wallet not connected"));
            return;
        }

        const priceNum = typeof priceMist === 'string' ? Number(priceMist) : priceMist;
        if (isNaN(priceNum) || priceNum <= 0) {
            onError?.(new Error("Invalid price"));
            return;
        }

        const tx = new Transaction();

        // Calculate payment with 2% fee
        const fee = Math.floor(priceNum * 2 / 100);
        const totalPayment = priceNum + fee;

        const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(totalPayment)]);

        const item = tx.moveCall({
            target: `${MARKETPLACE_PACKAGE_ID}::escrow::buy`,
            typeArguments: [itemType],
            arguments: [
                tx.object(listingId),
                payment,
                tx.object(MARKETPLACE_CONFIG_ID),
            ],
        });

        // Transfer item to buyer
        tx.transferObjects([item], tx.pure.address(account.address));

        signAndExecute({ transaction: tx }, { onSuccess, onError });
    };

    /**
     * Cancel a listing and reclaim item (Escrow)
     */
    const cancel = (
        listingId: string,
        itemType: string,
        onSuccess?: (result: any) => void,
        onError?: (error: any) => void
    ) => {
        if (!account) throw new Error("Wallet not connected");
        const tx = new Transaction();

        const item = tx.moveCall({
            target: `${MARKETPLACE_PACKAGE_ID}::escrow::cancel`,
            typeArguments: [itemType],
            arguments: [
                tx.object(listingId),
            ],
        });

        tx.transferObjects([item], tx.pure.address(account.address));

        signAndExecute({ transaction: tx }, { onSuccess, onError });
    };



    return {
        list,
        buy,
        cancel,
        isPending,
        isConnected: !!account
    };
}
