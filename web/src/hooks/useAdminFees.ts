import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useEffect, useState } from "react";
import { VANIHASH_FEE_VAULT_ID, VANIHASH_PACKAGE_ID, ADMIN_CAP_ID, MODULE_NAME, MARKETPLACE_CONFIG_ID } from "@/constants/chain";

export function useAdminFees() {
    const account = useCurrentAccount();
    const client = useSuiClient();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

    const [feeVaultBalance, setFeeVaultBalance] = useState<string>('0');
    const [marketBeneficiary, setMarketBeneficiary] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [isAdminCapOwner, setIsAdminCapOwner] = useState(false);

    // Check if user owns AdminCap
    useEffect(() => {
        if (!account) return;
        const checkAdmin = async () => {
            // Retrieve objects owned by user to find AdminCap
            // Note: This might need pagination if user has many objects. 
            // Better approach: verify against known AdminCap ID if available, or just check type.
            // The contract says AdminCap is transferred to deployer.
            // Let's check if the user owns an object of type `${VANIHASH_PACKAGE_ID}::admin::AdminCap`

            try {
                const { data } = await client.getOwnedObjects({
                    owner: account.address,
                    filter: {
                        StructType: `${VANIHASH_PACKAGE_ID}::admin::AdminCap`
                    }
                });
                setIsAdminCapOwner(data.length > 0);
            } catch (e) {
                console.error("Failed to check AdminCap ownership", e);
            }
        };
        checkAdmin();
    }, [account, client]);

    // Fetch FeeVault Balance and Market Beneficiary
    const fetchData = async () => {
        try {
            // Fetch Vault
            const vaultObj = await client.getObject({
                id: VANIHASH_FEE_VAULT_ID,
                options: { showContent: true }
            });

            if (vaultObj.data?.content?.dataType === 'moveObject') {
                const fields = vaultObj.data.content.fields as any;
                setFeeVaultBalance(fields.balance || '0');
            }

            // Fetch Market Config
            const configObj = await client.getObject({
                id: MARKETPLACE_CONFIG_ID,
                options: { showContent: true }
            });

            if (configObj.data?.content?.dataType === 'moveObject') {
                const fields = configObj.data.content.fields as any;
                setMarketBeneficiary(fields.beneficiary || '');
            }

        } catch (e) {
            console.error("Failed to fetch admin data", e);
        }
    };

    useEffect(() => {
        fetchData();
    }, [client]);

    const withdrawFees = async () => {
        if (!account || !isAdminCapOwner) return;

        // We need the ID of the AdminCap object owned by the user
        const { data } = await client.getOwnedObjects({
            owner: account.address,
            filter: {
                StructType: `${VANIHASH_PACKAGE_ID}::admin::AdminCap`
            }
        });

        if (data.length === 0) {
            console.error("No AdminCap found");
            return;
        }

        const adminCapId = data[0].data?.objectId;

        const tx = new Transaction();
        tx.moveCall({
            target: `${VANIHASH_PACKAGE_ID}::${MODULE_NAME}::withdraw_fees`,
            arguments: [
                tx.object(adminCapId!),
                tx.object(VANIHASH_FEE_VAULT_ID)
            ]
        });

        setLoading(true);
        signAndExecuteTransaction({
            transaction: tx,
        }, {
            onSuccess: () => {
                fetchData(); // Refresh balance
                setLoading(false);
            },
            onError: (e) => {
                console.error("Withdraw failed", e);
                setLoading(false);
            }
        });
    };

    return {
        feeVaultBalance,
        marketBeneficiary,
        isAdminCapOwner,
        loading,
        withdrawFees,
        refresh: fetchData
    };
}
