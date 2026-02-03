import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { VANIHASH_PACKAGE_ID, MODULE_NAME } from '@/constants/chain';

export function useCancelTask() {
    const account = useCurrentAccount();
    const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

    const cancelTask = (
        taskId: string,
        onSuccess?: (result: any) => void,
        onError?: (error: any) => void
    ) => {
        if (!account) throw new Error("Wallet not connected");

        const tx = new Transaction();

        tx.moveCall({
            target: `${VANIHASH_PACKAGE_ID}::${MODULE_NAME}::cancel_task`,
            arguments: [
                tx.object(taskId),
                tx.object('0x6'), // Clock
            ],
            typeArguments: ['0x2::coin::Coin<0x2::sui::SUI>'],
        });

        signAndExecute(
            { transaction: tx },
            {
                onSuccess,
                onError,
            }
        );
    };

    return { cancelTask, isPending, isConnected: !!account };
}
