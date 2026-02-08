import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { VANIHASH_PACKAGE_ID, MODULE_NAME, VANIHASH_FEE_VAULT_ID } from '@/constants/chain';

export function useSubmitProof() {
    const account = useCurrentAccount();
    const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

    const submitProof = (
        taskId: string,
        minedObjectId: string,
        taskType: number,
        objectType: string,
        onSuccess?: (result: any) => void,
        onError?: (error: any) => void
    ) => {
        if (!account) throw new Error("Wallet not connected");

        const tx = new Transaction();

        // 0 = Object, 1 = Package
        const isPackage = Number(taskType) === 1;
        const functionName = isPackage ? 'submit_package_proof' : 'submit_proof';
        // For Object tasks, pass the object type. For Package tasks, no type arg needed (UpgradeCap is specific)
        const typeArguments = isPackage ? [] : [objectType || '0x2::coin::Coin<0x2::sui::SUI>'];

        console.log(`Submitting Proof: ${functionName}, Type: ${typeArguments}, ID: ${minedObjectId}`);

        tx.moveCall({
            target: `${VANIHASH_PACKAGE_ID}::${MODULE_NAME}::${functionName}`,
            typeArguments,
            arguments: [
                tx.object(taskId),
                tx.object(minedObjectId),
                tx.object(VANIHASH_FEE_VAULT_ID), // FeeVault
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
