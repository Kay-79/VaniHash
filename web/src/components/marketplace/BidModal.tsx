import { useState } from 'react';
import { useBids } from '@/hooks/useBids';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function BidModal({ itemType }: { itemType: string }) {
    const { createBid, isPending } = useBids();
    const [amount, setAmount] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleBid = () => {
        if (!amount || isNaN(Number(amount))) return;

        // Convert to MIST (Assuming input is SUI)
        const amountMist = Number(amount) * 1_000_000_000;

        createBid(itemType, amountMist, (result) => {
            console.log("Bid Created", result);
            setIsOpen(false);
            setAmount('');
        }, (err) => {
            console.error("Bid Failed", err);
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Place Bid / Bounty</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Place a Bid</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Bid Amount (SUI)</Label>
                        <Input
                            type="number"
                            placeholder="1.0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <Button
                        className="w-full"
                        onClick={handleBid}
                        disabled={isPending}
                    >
                        {isPending ? 'Signing...' : 'Confirm Bid'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
