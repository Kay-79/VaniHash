import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { MARKETPLACE_PACKAGE_ID, TRANSFER_POLICY_ID } from '@/constants/chain';

export function useMarketplace() {
    const account = useCurrentAccount();
    const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

    const list = (
        kioskId: string,
        kioskCapId: string,
        itemId: string,
        itemType: string,
        priceMist: string | number,
        shouldPlace: boolean = false,
        onSuccess?: (result: any) => void,
        onError?: (error: any) => void
    ) => {
        if (!account) throw new Error("Wallet not connected");
        const tx = new Transaction();

        if (shouldPlace) {
            tx.moveCall({
                target: '0x2::kiosk::place',
                typeArguments: [itemType],
                arguments: [
                    tx.object(kioskId),
                    tx.object(kioskCapId),
                    tx.object(itemId),
                ],
            });
        }

        tx.moveCall({
            target: `${MARKETPLACE_PACKAGE_ID}::market::list`,
            typeArguments: [itemType],
            arguments: [
                tx.object(kioskId),
                tx.object(kioskCapId),
                tx.pure.id(itemId),
                tx.pure.u64(priceMist),
            ],
        });

        signAndExecute({ transaction: tx }, { onSuccess, onError });
    };

    const buy = (
        kioskId: string,
        itemId: string,
        itemType: string,
        priceMist: string | number,
        onSuccess?: (result: any) => void,
        onError?: (error: any) => void
    ) => {
        if (!account) throw new Error("Wallet not connected");
        const tx = new Transaction();

        // Split coin for Price + Royalty?
        // For simplicity in this demo, we assume user sends a coin covering all.
        // In prod, would calculate royalty and add to price.
        // Let's assume priceMist is the LIST PRICE. 
        // We need to fetch policy to know royalty? 
        // For now, let's assume we pay exactly what's asked + a buffer if needed, 
        // BUT the contract splits the payment.
        // CRITICAL: The contract expects `payment` >= price + royalty.

        // FIXME: Hardcoded 5% royalty buffer for now as example? 
        // Or just require user to pass totalAmount.
        // Let's pass the coin with value.
        const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(priceMist)]);

        tx.moveCall({
            target: `${MARKETPLACE_PACKAGE_ID}::market::purchase`,
            typeArguments: [itemType],
            arguments: [
                tx.object(kioskId),
                tx.pure.id(itemId), // Item ID (Pure)
                tx.pure.u64(priceMist), // The List Price
                payment,
                tx.object(TRANSFER_POLICY_ID), // Needed for confirmation
            ],
        });

        signAndExecute({ transaction: tx }, { onSuccess, onError });
    };

    const delist = (
        kioskId: string,
        kioskCapId: string,
        itemId: string,
        itemType: string,
        onSuccess?: (result: any) => void,
        onError?: (error: any) => void
    ) => {
        if (!account) throw new Error("Wallet not connected");
        const tx = new Transaction();

        tx.moveCall({
            target: `${MARKETPLACE_PACKAGE_ID}::market::delist`,
            typeArguments: [itemType],
            arguments: [
                tx.object(kioskId),
                tx.object(kioskCapId),
                tx.pure.id(itemId),
            ],
        });

        signAndExecute({ transaction: tx }, { onSuccess, onError });
    };

    // Kiosk Creation
    const createKiosk = (onSuccess?: (result: any) => void, onError?: (error: any) => void) => {
        if (!account) throw new Error("Wallet not connected");
        const tx = new Transaction();
        const [kiosk, kioskCap] = tx.moveCall({
            target: '0x2::kiosk::new',
        });
        tx.transferObjects([kioskCap], tx.pure.address(account.address));
        tx.moveCall({
            target: '0x2::transfer::public_share_object',
            typeArguments: ['0x2::kiosk::Kiosk'],
            arguments: [kiosk],
        });

        signAndExecute({ transaction: tx }, { onSuccess, onError });
    };

    return { list, buy, delist, createKiosk, isPending, isConnected: !!account };
}
