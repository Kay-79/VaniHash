import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { mistToSui, formatStruct, shortenAddress } from "@/utils/formatters";
import { useMarketplace } from "@/hooks/useMarketplace";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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

    const router = useRouter();

    const handleBuy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Parse type from event string "::marketplace::ItemListed<0x...>"
        // This is a bit hacky, ideally indexer stores inner type cleanly.
        // Format: ...ItemListed<TYPE>
        const match = listing.type.match(/\<(.+)\>/);
        if (!match) {
            toast.error("Could not determine item type");
            return;
        }
        const itemType = match[1];

        // The buy function expects: (kioskId, itemId, itemType, priceMist, onSuccess, onError)
        buy(
            listing.seller,      // kioskId (seller's kiosk)
            listing.listing_id,  // itemId
            itemType,            // itemType
            listing.price,       // priceMist
            () => {
                toast.success("Item bought successfully!");
                if (onBuySuccess) onBuySuccess();
            },
            (err) => toast.error("Failed to buy: " + err.message)
        );
    };

    const copyId = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        navigator.clipboard.writeText(listing.listing_id);
        toast.success("Listing ID copied");
    };

    return (
        <Card
            className="cursor-pointer hover:border-yellow-500/50 transition-all"
            onClick={() => router.push(`/item/${listing.listing_id}`)}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Listing
                </CardTitle>
                <div onClick={copyId} className="cursor-pointer hover:text-white transition-colors">
                    <Copy className="h-4 w-4 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{mistToSui(listing.price)} SUI</div>
                <p className="text-xs text-muted-foreground truncate">
                    Seller: {shortenAddress(listing.seller)}
                </p>
                <div className="mt-2">
                    <Badge variant="secondary" className="truncate max-w-full">
                        {formatStruct(listing.type.split('<')[1]?.replace('>', '') || listing.type)}
                    </Badge>
                </div>
            </CardContent>
            <CardFooter>
                <div className="flex gap-2 w-full">
                    <Button className="flex-1" onClick={handleBuy} disabled={isPending}>
                        {isPending ? "..." : "Buy"}
                    </Button>
                    <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={(e) => {
                            e.stopPropagation();
                            toast.info("Bidding not yet available");
                        }}
                    >
                        Bid
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
