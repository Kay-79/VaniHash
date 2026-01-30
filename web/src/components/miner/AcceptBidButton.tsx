import { useBids } from '@/hooks/useBids';
import { Button } from '@/components/ui/Button';

interface AcceptBidButtonProps {
    kioskId: string;
    kioskCapId: string;
    itemId: string;
    bidId: string;
    itemType: string;
    amountSui: number;
}

export function AcceptBidButton({
    kioskId,
    kioskCapId,
    itemId,
    bidId,
    itemType,
    amountSui
}: AcceptBidButtonProps) {
    const { acceptBid, isPending } = useBids();

    const handleAccept = () => {
        acceptBid(kioskId, kioskCapId, itemId, bidId, itemType, (res) => {
            console.log("Bid Accepted", res);
        }, (err) => {
            console.error("Accept Failed", err);
        });
    };

    return (
        <Button
            onClick={handleAccept}
            disabled={isPending}
            variant="default"
            size="sm"
        >
            {isPending ? 'Processing...' : `Accept ${amountSui} SUI Bid`}
        </Button>
    );
}
