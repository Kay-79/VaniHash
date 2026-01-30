import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { mistToSui } from "@/utils/formatters";
import { useMarketplace } from "@/hooks/useMarketplace";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface Listing {
    listing_id: string;
    seller: string;
    price: string;
    type: string;
    status: string;
    timestamp_ms: number;
}

interface ListingCardProps {
    listing: Listing;
    onBuySuccess?: () => void;
}

export function ListingCard({ listing, onBuySuccess }: ListingCardProps) {
    const { buy, isPending } = useMarketplace();

    const handleBuy = () => {
        // Parse type from event string "::marketplace::ItemListed<0x...>"
        // This is a bit hacky, ideally indexer stores inner type cleanly.
        // Format: ...ItemListed<TYPE>
        const match = listing.type.match(/<(.+)>/);
        if (!match) {
            toast.error("Could not determine item type");
            return;
        }
        const itemType = match[1];

        buy(
            listing.listing_id,
            itemType,
            listing.price,
            () => {
                toast.success("Item bought successfully!");
                if (onBuySuccess) onBuySuccess();
            },
            (err) => toast.error("Failed to buy: " + err.message)
        );
    };

    const copyId = () => {
        navigator.clipboard.writeText(listing.listing_id);
        toast.success("Listing ID copied");
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Listing
                </CardTitle>
                <div onClick={copyId} className="cursor-pointer">
                    <Copy className="h-4 w-4 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{mistToSui(listing.price)} SUI</div>
                <p className="text-xs text-muted-foreground truncate">
                    Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                </p>
                <div className="mt-2">
                    <Badge variant="secondary" className="truncate max-w-full">
                        {listing.type.split('<')[1]?.replace('>', '') || 'Unknown Item'}
                    </Badge>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handleBuy} disabled={isPending}>
                    {isPending ? " buying..." : "Buy Now"}
                </Button>
            </CardFooter>
        </Card>
    );
}
