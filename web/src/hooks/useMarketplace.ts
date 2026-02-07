import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { MARKETPLACE_PACKAGE_ID, MARKETPLACE_CONFIG_ID, TRANSFER_POLICY_ID } from '@/constants/chain';

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

    /**
     * Buy an item from a kiosk using the new TransferPolicy-aware purchase function.
     * 
     * The new contract returns (Item, TransferRequest) which the PTB must handle:
     * 1. Satisfy all policy rules (royalty, floor price, etc.)
     * 2. Call confirm_request
     * 3. Transfer item to buyer
     * 
     * NOTE: This implementation handles the common royalty rule case.
     * For collections with other rules, use purchaseWithPolicy.ts for full dynamic handling.
     */
    const buy = (
        kioskId: string,
        itemId: string,
        itemType: string,
        priceMist: string | number,
        royaltyBp: number = 0, // Royalty in basis points (500 = 5%)
        onSuccess?: (result: any) => void,
        onError?: (error: any) => void
    ) => {
        if (!account) throw new Error("Wallet not connected");
        const tx = new Transaction();

        const priceNum = typeof priceMist === 'string' ? parseInt(priceMist) : priceMist;

        // Calculate payments: price + 2% marketplace fee + royalty
        const marketplaceFee = Math.floor(priceNum * 2 / 100);
        const royaltyAmount = Math.floor(priceNum * royaltyBp / 10000);
        const totalPayment = priceNum + marketplaceFee + royaltyAmount;

        const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(totalPayment)]);

        // Call marketplace::market::purchase
        // Returns: (item: T, request: TransferRequest<T>)
        const [item, transferRequest] = tx.moveCall({
            target: `${MARKETPLACE_PACKAGE_ID}::market::purchase`,
            typeArguments: [itemType],
            arguments: [
                tx.object(kioskId),
                tx.pure.id(itemId),
                tx.pure.u64(priceNum),
                payment,
                tx.object(TRANSFER_POLICY_ID),
                tx.object(MARKETPLACE_CONFIG_ID),
            ],
        });

        // If royalty exists, pay it
        if (royaltyBp > 0) {
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

        // Confirm the transfer request (consume hot potato)
        tx.moveCall({
            target: '0x2::transfer_policy::confirm_request',
            typeArguments: [itemType],
            arguments: [
                tx.object(TRANSFER_POLICY_ID),
                transferRequest,
            ],
        });

        // Transfer item to buyer
        tx.transferObjects([item], tx.pure.address(account.address));

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
