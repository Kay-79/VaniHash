
import { useState, useEffect } from 'react';
import { useMarketplace } from '@/hooks/useMarketplace';
import { INDEXER_URL, NETWORK } from '@/constants/chain';
import { useOwnedKiosk } from '@/hooks/useOwnedKiosk';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ConnectButton, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ListingModalProps {
    itemId?: string; // Optional
    itemType?: string; // Optional
}

export function ListingModal({ itemId, itemType }: ListingModalProps) {
    const { list, createKiosk, isPending: isTxPending, isConnected } = useMarketplace();
    const { kioskId, kioskCapId, isLoading: isKioskLoading, refetch: refetchKiosk } = useOwnedKiosk();
    const suiClient = useSuiClient();
    const account = useCurrentAccount();

    const [price, setPrice] = useState('');
    const [targetItemId, setTargetItemId] = useState(itemId || '');
    const [targetItemType, setTargetItemType] = useState(itemType || '0x2::coin::Coin<0x2::sui::SUI>');
    const [isOpen, setIsOpen] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    // Update state if props change when modal opens
    useEffect(() => {
        if (isOpen) {
            if (itemId) setTargetItemId(itemId);
            if (itemType) setTargetItemType(itemType);
        }
    }, [isOpen, itemId, itemType]);

    const handleCreateKiosk = () => {
        createKiosk(() => {
            console.log("Kiosk Created!");
            setTimeout(refetchKiosk, 2000); // Refresh kiosk after delay
        }, (err) => {
            console.error("Kiosk Creation Failed", err);
        });
    };

    const handleList = async () => {
        if (!isConnected || !kioskId || !kioskCapId) return;
        if (!price || isNaN(Number(price))) return;
        if (!targetItemId || !targetItemType) return;

        setIsVerifying(true);
        const cleanId = targetItemId.trim();
        let shouldPlace = false;

        try {
            // Pre-check Ownership
            const objectInfo = await suiClient.getObject({
                id: cleanId,
                options: { showOwner: true }
            });

            if (objectInfo.error) {
                console.error("GetObject Error:", objectInfo.error);
                toast.error(`Object not found on ${NETWORK} or invalid ID: ${cleanId}`);
                return;
            }

            const owner = objectInfo.data?.owner;
            const ownerAddress = owner && typeof owner === 'object' && 'AddressOwner' in owner ? owner.AddressOwner : null;
            const objectOwner = owner && typeof owner === 'object' && 'ObjectOwner' in owner ? owner.ObjectOwner : null;

            // If in Kiosk (Owned by Kiosk Object)
            if (objectOwner === kioskId) {
                // Good to list, already placed
                shouldPlace = false;
            }
            // If owned by User (AddressOwner matches Wallet)
            else if (ownerAddress === account?.address) {
                // Owned by user, needs to be placed first
                shouldPlace = true;
            }
            // If NOT owned by either
            else {
                toast.error("You do not own this object!");
                return;
            }

        } catch (e) {
            console.error("Verification failed", e);
            toast.error("Failed to verify object ownership");
            return;
        } finally {
            setIsVerifying(false); // ALWAYS reset verification state
        }


        // Convert to MIST
        const priceMist = Number(price) * 1_000_000_000;

        list(kioskId, kioskCapId, cleanId, targetItemType, priceMist, shouldPlace, (result) => {
            console.log("Listed Successfully", result);
            toast.success("Item listed successfully!");
            setIsOpen(false);
            setPrice('');
        }, (err) => {
            console.error("Listing Failed", err);
            toast.error(shouldPlace
                ? "Failed to place & list item. Check console."
                : "Listing failed. Ensure item is in your Kiosk.");
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-md hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-200 border-0"
                    size="sm"
                >
                    List for Sale
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>List Item for Sale</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {!isConnected ? (
                        <div className="flex flex-col gap-2 items-center py-4">
                            <Label className="text-red-400 mb-2">Wallet not connected</Label>
                            <ConnectButton />
                        </div>
                    ) : isKioskLoading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="animate-spin text-yellow-500" />
                        </div>
                    ) : !kioskId ? (
                        <div className="flex flex-col gap-4 text-center">
                            <p className="text-sm text-gray-400">
                                You need a Sui Kiosk to list items. It's a one-time setup.
                            </p>
                            <Button onClick={handleCreateKiosk} disabled={isTxPending}>
                                {isTxPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Create Kiosk
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label>Item ID</Label>
                                <Input
                                    placeholder="0x..."
                                    value={targetItemId}
                                    onChange={(e) => setTargetItemId(e.target.value)}
                                    className="font-mono text-sm"
                                    onBlur={async () => {
                                        if (!targetItemId || targetItemId.length < 10) return;
                                        setIsVerifying(true);
                                        try {
                                            const obj = await suiClient.getObject({
                                                id: targetItemId,
                                                options: { showType: true, showContent: true }
                                            });
                                            if (obj.data?.type) {
                                                setTargetItemType(obj.data.type);
                                                toast.success("Object found: " + obj.data.type.split('::').pop());
                                            }
                                        } catch (e) {
                                            toast.error("Invalid Object ID");
                                        } finally {
                                            setIsVerifying(false);
                                        }
                                    }}
                                />
                            </div>

                            {/* Auto-detected Type Display */}
                            {targetItemType && (
                                <div className="p-3 bg-gray-900/50 border border-gray-800 rounded-md text-xs">
                                    <span className="text-gray-500 block mb-1">Detected Type:</span>
                                    <code className="text-blue-400 break-all">{targetItemType}</code>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>Listing Price (SUI)</Label>
                                <Input
                                    type="number"
                                    placeholder="10.0"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                />
                            </div>

                            <Button
                                className="w-full"
                                onClick={handleList}
                                disabled={isTxPending || isVerifying}
                            >
                                {isVerifying ? 'Verifying...' : isTxPending ? 'Signing...' : 'Confirm Listing'}
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
