import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { PACKAGE_ID, MODULE_NAME } from '@/constants/chain';
import { suiToMist } from '@/utils/formatters';

export function useCreateTask() {
    const account = useCurrentAccount();
    const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

    const createTask = (
        prefix: string,
        suffix: string,
        contains: string,
        taskType: number,  // 0 = object, 1 = package
        rewardSui: string,
        onSuccess?: (result: any) => void,
        onError?: (error: any) => void
    ) => {
        if (!account) throw new Error("Wallet not connected");

        const tx = new Transaction();
        const rewardMist = suiToMist(rewardSui);
        const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(rewardMist)]);

        const encoder = new TextEncoder();

        // Helper to convert string to bytes or empty array
        const toBytes = (str: string) => str ? Array.from(encoder.encode(str)) : [];

        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE_NAME}::create_task`,
            arguments: [
                coin,
                tx.pure(bcs.vector(bcs.u8()).serialize(toBytes(prefix))),
                tx.pure(bcs.vector(bcs.u8()).serialize(toBytes(suffix))),
                tx.pure(bcs.vector(bcs.u8()).serialize(toBytes(contains))),
                tx.pure.u8(taskType),  // task_type
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
