
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';

export function useOwnedKiosk() {
    const account = useCurrentAccount();

    const { data, isPending, error, refetch } = useSuiClientQuery('getOwnedObjects', {
        owner: account?.address || '',
        filter: {
            StructType: '0x2::kiosk::KioskOwnerCap'
        },
        options: {
            showContent: true,
        }
    }, {
        enabled: !!account
    });

    const kioskCap = data?.data?.[0];
    const kioskId = kioskCap?.data?.content?.dataType === 'moveObject'
        ? (kioskCap.data.content.fields as any).for
        : undefined;
    const kioskCapId = kioskCap?.data?.objectId;

    return {
        kioskId,
        kioskCapId,
        isLoading: isPending,
        error,
        refetch
    };
}
