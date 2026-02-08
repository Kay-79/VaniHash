import { ReactNode, useState } from 'react';
import { useBids } from '@/hooks/useBids';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { toast } from 'sonner';

interface BidModalProps {
    listingId: string;
    onSuccess?: () => void;
    children?: ReactNode;
}

export function BidModal({ listingId, onSuccess, children }: BidModalProps) {
    const { createBid, isPending } = useBids();
    const [amount, setAmount] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleBid = () => {
        if (!amount || isNaN(Number(amount))) return;

        // Convert to MIST (Assuming input is SUI)
        const amountMist = Number(amount) * 1_000_000_000;

        createBid(listingId, amountMist, (result) => {
            toast.success("Bid placed successfully!");
            setIsOpen(false);
            setAmount('');
            if (onSuccess) onSuccess();
        }, (err) => {
            toast.error("Bid failed: " + err.message);
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || <Button variant="outline">Place Bid / Bounty</Button>}
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
