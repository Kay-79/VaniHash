import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID } from '@/constants/chain';

export function useMarketplace() {
    const account = useCurrentAccount();
    const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

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
            target: `${PACKAGE_ID}::marketplace::list`,
            typeArguments: [itemType],
            arguments: [
                tx.object(itemId),
                tx.pure.u64(priceMist),
            ],
        });

        signAndExecute({ transaction: tx }, { onSuccess, onError });
    };

    const buy = (
        listingId: string,
        itemType: string,
        priceMist: string | number,
        onSuccess?: (result: any) => void,
        onError?: (error: any) => void
    ) => {
        if (!account) throw new Error("Wallet not connected");
        const tx = new Transaction();
        
        const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceMist)]);

        tx.moveCall({
            target: `${PACKAGE_ID}::marketplace::buy`,
            typeArguments: [itemType],
            arguments: [
                tx.object(listingId),
                coin,
            ],
        });

        signAndExecute({ transaction: tx }, { onSuccess, onError });
    };

    const delist = (
        listingId: string,
        itemType: string,
        onSuccess?: (result: any) => void,
        onError?: (error: any) => void
    ) => {
        if (!account) throw new Error("Wallet not connected");
        const tx = new Transaction();

        tx.moveCall({
            target: `${PACKAGE_ID}::marketplace::delist`,
            typeArguments: [itemType],
            arguments: [
                tx.object(listingId),
            ],
        });

        signAndExecute({ transaction: tx }, { onSuccess, onError });
    };

    const buyBatch = (
        items: { listingId: string; itemType: string; priceMist: string | number }[],
        onSuccess?: (result: any) => void,
        onError?: (error: any) => void
    ) => {
        if (!account) throw new Error("Wallet not connected");
        if (items.length === 0) return;

        const tx = new Transaction();
        
        items.forEach((item) => {
            const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(item.priceMist)]);
            tx.moveCall({
                target: `${PACKAGE_ID}::marketplace::buy`,
                typeArguments: [item.itemType],
                arguments: [
                    tx.object(item.listingId),
                    coin,
                ],
            });
        });

        signAndExecute({ transaction: tx }, { onSuccess, onError });
    };

    return { list, buy, buyBatch, delist, isPending, isConnected: !!account };
}
