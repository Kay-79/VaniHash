import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, MODULE_NAME } from '@/constants/chain';

export function useSubmitProof() {
    const account = useCurrentAccount();
    const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

    const submitProof = (
        taskId: string,
        minedObjectId: string,
        objectType: string,
        onSuccess?: (result: any) => void,
        onError?: (error: any) => void
    ) => {
        if (!account) throw new Error("Wallet not connected");

        const tx = new Transaction();

        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE_NAME}::submit_proof`,
            typeArguments: [objectType],
            arguments: [
                tx.object(taskId),
                tx.object(minedObjectId),
                tx.object('0x6'), // Clock
            ],
        });

        signAndExecute(
            { transaction: tx },
            {
                onSuccess,
                onError,
            }
        );
    };

    return { submitProof, isPending, isConnected: !!account };
}
