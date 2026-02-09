import { mistToSui, formatStruct, shortenAddress } from "@/utils/formatters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Copy, ShoppingCart, Square, CheckSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMarketplace } from "@/hooks/useMarketplace";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import { ListingImage } from "./ListingImage";

interface Listing {
    listing_id: string;
    item_id: string;
    seller: string;
    price: string;
    image_url?: string | null;
    type: string;
    status: string;
    timestamp_ms: number;
}

interface ListingTableProps {
    listings: Listing[];
    onBuySuccess?: () => void;
    loadingMore?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
}

export function ListingTable({ listings, onBuySuccess, loadingMore, hasMore, onLoadMore }: ListingTableProps) {
    const { buy, cancel, isPending } = useMarketplace();
    const account = useCurrentAccount();
    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const loaderRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        if (!onLoadMore || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore) {
                    onLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        const currentRef = loaderRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [onLoadMore, hasMore, loadingMore]);

    const toggleSelection = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleBatchBuy = () => {
        // TODO: Implement batch buy functionality
        toast.info("Batch buying coming soon");
        /* 
        const itemsToBuy = listings
            .filter(l => selectedIds.has(l.listing_id))
            .map(l => {
                const match = l.type.match(/\<(.+)\>/);
                const itemType = match ? match[1] : l.type;
                return {
                    listingId: l.listing_id,
                    itemType,
                    priceMist: l.price
                };
            });

        if (itemsToBuy.length === 0) return;

        buyBatch(
            itemsToBuy,
            () => {
                toast.success(`Successfully bought ${itemsToBuy.length} items!`);
                setSelectedIds(new Set());
                if (onBuySuccess) onBuySuccess();
            },
            (err: Error) => toast.error("Failed to buy batch: " + err.message)
        );
        */
    };

    const handleBuy = (e: React.MouseEvent, listing: Listing) => {
        e.stopPropagation();
        // Parse type. Try to extract from <...> first (for backward compatibility), otherwise use as is.
        const match = listing.type.match(/<(.+)>/);
        const itemType = match ? match[1] : listing.type;

        if (!itemType || !itemType.includes('::')) {
            toast.error("Invalid item type");
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

    const copyId = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(id);
        toast.success("ID copied");
    };

    return (
        <div className="w-full relative min-h-[500px]">
            <div className="overflow-auto pb-20">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-900/50 border-b border-gray-800">
                        <tr>
                            <th className="w-10 px-4 py-3">
                                {/* Header Checkbox could go here for Select All */}
                            </th>
                            <th className="px-4 py-3 font-medium tracking-wider">Item</th>
                            <th className="px-4 py-3 font-medium tracking-wider text-right">Price</th>
                            <th className="px-4 py-3 font-medium tracking-wider text-right">Type</th>
                            <th className="px-4 py-3 font-medium tracking-wider text-right">Owner</th>
                            <th className="px-4 py-3 font-medium tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                        {listings.map((listing) => {
                            const isSelected = selectedIds.has(listing.listing_id);
                            return (
                                <tr
                                    key={listing.listing_id}
                                    className={`
                                        transition-colors cursor-pointer group 
                                        ${isSelected ? 'bg-yellow-500/10 hover:bg-yellow-500/20' : 'bg-black/20 hover:bg-gray-800/30'}
                                    `}
                                    onClick={() => router.push(`/item/${listing.listing_id}`)}
                                >
                                    <td className="px-4 py-3">
                                        <div
                                            className={`h-4 w-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${isSelected ? 'bg-yellow-500 border-yellow-500' : 'border-gray-600 group-hover:border-gray-400'
                                                }`}
                                            onClick={(e) => toggleSelection(e, listing.listing_id)}
                                        >
                                            {isSelected && <CheckSquare className="h-3 w-3 text-black" />}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded bg-gray-800 flex items-center justify-center border border-gray-700 overflow-hidden">
                                                <ListingImage listing={listing} variant="table" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-200">
                                                    {formatStruct(listing.type.split('<')[1]?.replace('>', '') || listing.type).split('::').pop()}
                                                </div>
                                                <div className="text-xs text-gray-500 font-mono flex items-center gap-1 group/id">
                                                    #{shortenAddress(listing.item_id || listing.listing_id)}
                                                    <Copy
                                                        className="h-3 w-3 opacity-0 group-hover/id:opacity-100 cursor-pointer hover:text-white transition-all"
                                                        onClick={(e) => copyId(e, listing.item_id || listing.listing_id)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-200">
                                        {mistToSui(listing.price)} SUI
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Badge variant="secondary" className="bg-gray-800 text-gray-300 font-mono text-xs">
                                            {(listing.type.match(/<(.+)>/)?.[1] || listing.type).split('::').pop()}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="text-yellow-500 hover:text-yellow-400 cursor-pointer font-mono text-xs">
                                            {shortenAddress(listing.seller)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {listing.seller === normalizeSuiAddress(account?.address || '') ? (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="h-8 border border-red-900 bg-red-900/20 hover:bg-red-900/40 text-red-400"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Parse type
                                                        const match = listing.type.match(/<(.+)>/);
                                                        const itemType = match ? match[1] : listing.type;

                                                        cancel(
                                                            listing.listing_id,
                                                            itemType,
                                                            () => toast.success("Item listing cancelled"),
                                                            (err) => toast.error("Cancel failed: " + err.message)
                                                        );
                                                    }}
                                                    disabled={isPending}
                                                >
                                                    {isPending ? '...' : 'Delist'}
                                                </Button>
                                            ) : (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        className="h-8 border border-gray-700 bg-transparent hover:bg-gray-800 text-gray-300"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toast.info("Bidding not yet available");
                                                        }}
                                                    >
                                                        Bid
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="h-8 bg-yellow-600 hover:bg-yellow-500 text-white border-none font-semibold px-4"
                                                        onClick={(e) => handleBuy(e, listing)}
                                                        disabled={isPending}
                                                    >
                                                        {isPending ? '...' : 'Buy'}
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Lazy loading trigger */}
            <div ref={loaderRef} className="flex justify-center py-4">
                {loadingMore && (
                    <div className="flex items-center gap-2 text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading more...</span>
                    </div>
                )}
                {!hasMore && listings.length > 0 && (
                    <span className="text-sm text-gray-500">No more items</span>
                )}
            </div>

            {/* Batch Action Bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-2 flex items-center gap-4 animate-in slide-in-from-bottom-5 z-50">
                    <div className="px-4 text-sm font-medium text-white flex items-center gap-2 border-r border-gray-700 pr-4">
                        <CheckSquare className="h-4 w-4 text-yellow-500" />
                        {selectedIds.size} Selected
                    </div>

                    <Button
                        onClick={handleBatchBuy}
                        disabled={isPending}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-9"
                    >
                        Buy {selectedIds.size} Items
                    </Button>

                    <Button
                        variant="outline"
                        className="border-gray-700 hover:bg-gray-800 text-gray-300 h-9"
                        onClick={() => toast.info("Batch bidding coming soon")}
                    >
                        Bid on {selectedIds.size}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-white h-9 w-9 p-0 rounded-full"
                        onClick={() => setSelectedIds(new Set())}
                    >
                        X
                    </Button>
                </div>
            )}
        </div>
    );
}
