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

        const priceNum = typeof priceMist === 'string' ? parseInt(priceMist) : priceMist;
        const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(priceNum)]);

        // Use direct kiosk purchase (no transfer policy for fungible items like Coin)
        // For NFTs with transfer policy, you would use the marketplace wrapper
        const [item, request] = tx.moveCall({
            target: '0x2::kiosk::purchase',
            typeArguments: [itemType],
            arguments: [
                tx.object(kioskId),
                tx.pure.id(itemId),
                payment,
            ],
        });

        // For items without transfer policy (like Coin), confirm with empty policy
        // This returns the TransferRequest which we need to handle
        // For simple purchases without royalty rules, we can just transfer the item
        tx.transferObjects([item], tx.pure.address(account.address));

        // Return the request to owner (it will fail if there's a policy requirement)
        // For production, fetch and use actual policy
        tx.moveCall({
            target: '0x2::transfer_policy::confirm_request',
            typeArguments: [itemType],
            arguments: [
                tx.object(TRANSFER_POLICY_ID),
                request,
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
