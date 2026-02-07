
import { useState, useEffect } from 'react';
import { useMarketplace } from '@/hooks/useMarketplace';
import { INDEXER_URL, NETWORK } from '@/constants/chain';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ConnectButton, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { normalizeSuiAddress } from '@mysten/sui/utils';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ListingModalProps {
    itemId?: string; // Optional
    itemType?: string; // Optional
}

export function ListingModal({ itemId, itemType }: ListingModalProps) {

    const { list, isPending: isTxPending, isConnected } = useMarketplace();
    const suiClient = useSuiClient();
    const account = useCurrentAccount();

    const [price, setPrice] = useState('');
    const [targetItemId, setTargetItemId] = useState(itemId || '');
    const [targetItemType, setTargetItemType] = useState(itemType || '0x2::coin::Coin<0x2::sui::SUI>');
    const [isOpen, setIsOpen] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);


    const handleList = async () => {
        if (!isConnected || !price || !targetItemId || !targetItemType) return;
        if (isNaN(Number(price))) {
            toast.error("Invalid price");
            return;
        }

        setIsVerifying(true);
        const cleanId = targetItemId.trim();

        try {
            const objectInfo = await suiClient.getObject({
                id: cleanId,
                options: { showOwner: true }
            });

            if (objectInfo.error) {
                toast.error(`Object not found: ${cleanId}`);
                return;
            }

            const owner = objectInfo.data?.owner;

            if (!owner) {
                toast.error("Could not determine object owner");
                return;
            }

            if (typeof owner === 'object' && 'Shared' in owner) {
                toast.error("Cannot list Shared Objects");
                return;
            }

            if (owner === 'Immutable') {
                toast.error("Cannot list Immutable Objects");
                return;
            }

            const ownerAddress = owner && typeof owner === 'object' && 'AddressOwner' in owner ? owner.AddressOwner : null;

            if (!ownerAddress || normalizeSuiAddress(ownerAddress) !== normalizeSuiAddress(account?.address || '')) {
                toast.error("You don't own this object");
                return;
            }

            const priceMist = BigInt(Math.floor(Number(price) * 1_000_000_000)).toString();

            list(cleanId, targetItemType, priceMist, () => {
                toast.success("Listed successfully!");
                setIsOpen(false);
                setPrice('');
                setTargetItemId('');
            }, (err) => {
                console.error("Listing failed:", err);
                toast.error("Listing failed");
            });
        } catch (e) {
            console.error("Error:", e);
            toast.error("Error verifying object");
        } finally {
            setIsVerifying(false);
        }
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
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                                onClick={handleList}
                                disabled={isTxPending || isVerifying}
                            >
                                {isVerifying ? 'Verifying...' : isTxPending ? 'Signing...' : 'List for Sale'}
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
