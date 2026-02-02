import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, MODULE_NAME } from '@/constants/chain';

export function useSubmitProof() {
    const account = useCurrentAccount();
    const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

    const submitProof = (
        taskId: string,
        minedObjectId: string,
        onSuccess?: (result: any) => void,
        onError?: (error: any) => void
    ) => {
        if (!account) throw new Error("Wallet not connected");

        const tx = new Transaction();

        // Use generic type - the contract will accept any object with key + store
        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE_NAME}::submit_proof`,
            typeArguments: ['0x2::coin::Coin<0x2::sui::SUI>'], // Default type, contract accepts any T: key + store
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
