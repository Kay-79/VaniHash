import { useState } from 'react';
import { useMarketplace } from '@/hooks/useMarketplace';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

interface ListingModalProps {
    kioskId: string;
    kioskCapId: string;
    itemId?: string; // Optional
    itemType?: string; // Optional
}

export function ListingModal({ kioskId, kioskCapId, itemId, itemType }: ListingModalProps) {
    const { list, isPending } = useMarketplace();
    const [price, setPrice] = useState('');
    const [targetItemId, setTargetItemId] = useState(itemId || '');
    const [targetItemType, setTargetItemType] = useState(itemType || '0x...::vanihash::Fossil');
    const [isOpen, setIsOpen] = useState(false);

    const handleList = () => {
        if (!price || isNaN(Number(price))) return;
        if (!targetItemId || !targetItemType) return;

        // Convert to MIST
        const priceMist = Number(price) * 1_000_000_000;

        list(kioskId, kioskCapId, targetItemId, targetItemType, priceMist, (result) => {
            console.log("Listed Successfully", result);
            setIsOpen(false);
            setPrice('');
        }, (err) => {
            console.error("Listing Failed", err);
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">List for Sale</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>List Item for Sale</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Item ID</Label>
                        <Input
                            placeholder="0x..."
                            value={targetItemId}
                            onChange={(e) => setTargetItemId(e.target.value)}
                        // If passed as prop, maybe disable editing? Or allow user to correct?
                        // Let's allow editing for flexibility as requested.
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Item Type (e.g. 0x...::module::Type)</Label>
                        <Input
                            placeholder="0x...::module::Type"
                            value={targetItemType}
                            onChange={(e) => setTargetItemType(e.target.value)}
                        />
                    </div>
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
                        disabled={isPending}
                    >
                        {isPending ? 'Signing...' : 'Confirm Listing'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
