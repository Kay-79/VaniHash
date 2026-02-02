import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { PACKAGE_ID, MODULE_NAME } from '@/constants/chain';
import { suiToMist } from '@/utils/formatters';

export function useCreateTask() {
    const account = useCurrentAccount();
    const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

    const createTask = (
        patterns: string[],
        patternType: number,
        taskType: number,  // NEW: 0 = object, 1 = package
        rewardSui: string,
        onSuccess?: (result: any) => void,
        onError?: (error: any) => void
    ) => {
        if (!account) throw new Error("Wallet not connected");

        const tx = new Transaction();
        const rewardMist = suiToMist(rewardSui);
        const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(rewardMist)]);

        const encoder = new TextEncoder();

        // Convert each pattern to bytes and build vector<vector<u8>>
        const patternsBytes = patterns.map(pattern => {
            const bytes = encoder.encode(pattern);
            return Array.from(bytes);
        });

        // Serialize using BCS
        const serializedPatterns = bcs.vector(bcs.vector(bcs.u8())).serialize(patternsBytes);

        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE_NAME}::create_task`,
            arguments: [
                coin,
                tx.pure(serializedPatterns),
                tx.pure.u8(patternType),
                tx.pure.u8(taskType),  // NEW: task_type parameter
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
