import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, MODULE_NAME } from '@/constants/chain';
import { suiToMist } from '@/utils/formatters';

export function useCreateTask() {
    const account = useCurrentAccount();
    const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

    const createTask = (
        pattern: string,
        patternType: number,
        rewardSui: string,
        onSuccess?: (result: any) => void,
        onError?: (error: any) => void
    ) => {
        if (!account) throw new Error("Wallet not connected");

        const tx = new Transaction();
        const rewardMist = suiToMist(rewardSui);
        const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(rewardMist)]);
        
        const encoder = new TextEncoder();
        const patternBytes = encoder.encode(pattern);

        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE_NAME}::create_task`,
            arguments: [
                coin,
                tx.pure.vector('u8', Array.from(patternBytes)),
                tx.pure.u8(patternType),
                // difficulty removed
                tx.pure.u64(86400000), // 24h Lock
                tx.object('0x6'), // Clock
            ],
            typeArguments: ['0x2::coin::Coin<0x2::sui::SUI>'], // Hardcoded for now per user flow
        });

        signAndExecute(
            { transaction: tx },
            {
                onSuccess,
                onError,
            }
        );
    };

    return { createTask, isPending, isConnected: !!account };
}
