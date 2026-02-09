import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { mistToSui, formatStruct, shortenAddress } from "@/utils/formatters";
import { useMarketplace } from "@/hooks/useMarketplace";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { BidModal } from "./BidModal";
import { ListingImage } from "./ListingImage";

interface Listing {
    listing_id: string;
    item_id?: string; // Added
    seller: string;
    price: string;
    image_url?: string | null;
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
        // Direct use of listing.type
        const itemType = listing.type;

        if (!itemType || !itemType.includes('::')) {
            toast.error("Invalid item type: " + listing.type);
            return;
        }

        // The buy function expects: (listingId, itemType, priceMist, onSuccess, onError)
        buy(
            listing.listing_id,  // listingId
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
        navigator.clipboard.writeText(listing.item_id || listing.listing_id);
        toast.success("Listing ID copied");
    };

    return (
        <Card
            className="cursor-pointer hover:border-yellow-500/50 transition-all"
            onClick={() => router.push(`/item/${listing.listing_id}`)}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold font-mono text-yellow-500 truncate" title={listing.item_id ? `Item ID: ${listing.item_id}` : `Listing ID: ${listing.listing_id}`}>
                    {shortenAddress(listing.item_id || listing.listing_id)}
                </CardTitle>
                <div onClick={copyId} className="cursor-pointer hover:text-white transition-colors">
                    <Copy className="h-4 w-4 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="w-full aspect-square bg-gray-900 rounded-md mb-4 overflow-hidden flex items-center justify-center border border-gray-800">
                    <ListingImage listing={listing} variant="card" />
                </div>
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
                    <div onClick={(e) => e.stopPropagation()}>
                        <BidModal listingId={listing.listing_id} onSuccess={onBuySuccess}>
                            <Button variant="secondary" className="w-full">
                                Bid
                            </Button>
                        </BidModal>
                    </div>

                </div>
            </CardFooter>
        </Card>
    );
}
