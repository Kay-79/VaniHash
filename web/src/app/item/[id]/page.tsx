'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { mistToSui } from '@/utils/formatters';
import { ShoppingCart, User, Tag, Clock, Coins } from 'lucide-react';
import { useMarketplace } from '@/hooks/useMarketplace';
import { useOwnedKiosk } from '@/hooks/useOwnedKiosk';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { normalizeSuiAddress } from '@mysten/sui/utils';
import { toast } from 'sonner';
import { BidModal } from '@/components/marketplace/BidModal';
import { useBids } from '@/hooks/useBids';
import { SUI_GAS_OBJECT_LOGO } from '@/constants/chain';
import { ListingImage } from '@/components/marketplace/ListingImage';

interface Listing {
    listing_id: string;
    item_id?: string | null; // Added
    seller: string;

    price: string;
    image_url?: string | null;
    type: string;
    status: string;
    timestamp_ms: number;
    tx_digest?: string;
    bids?: Bid[];
}

interface Bid {
    bid_id: string;
    bidder: string;
    amount: string;
    status: string;
    timestamp_ms: number;
}

export default function ItemDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { buy, cancel, isPending } = useMarketplace();
    const { acceptBid, cancelBid, isPending: isBidPending } = useBids();
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const [coinBalance, setCoinBalance] = useState<string | null>(null);
    const [packageId, setPackageId] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        const fetchListing = async () => {
            try {
                const res = await fetch(`/api/listings/${id}`);
                if (!res.ok) throw new Error('Listing not found');
                const data = await res.json();
                setListing(data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };
        fetchListing();
    }, [id]);

    useEffect(() => {
        if (!listing) return;

        const fetchItemDetails = async () => {
            try {
                const object = await suiClient.getObject({
                    id: listing.listing_id,
                    options: { showContent: true },
                });

                if (object.data?.content?.dataType === 'moveObject') {
                    const fields = object.data.content.fields as any;

                    // Extract wrapped item info if available - (using listing.item_id from API now)


                    // Extract specific fields from wrapped item
                    if (fields?.item?.fields) {
                        const itemFields = fields.item.fields;
                        if (itemFields.balance) {
                            setCoinBalance(itemFields.balance);
                        }
                        if (itemFields.package) {
                            setPackageId(itemFields.package);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to fetch item details:', err);
            }
        };

        fetchItemDetails();
    }, [listing, suiClient]);




    const handleBuy = () => {
        if (!listing) {
            toast.error("Invalid listing data");
            return;
        }
        // Direct use of listing.type as it is already the inner type T
        const itemType = listing.type;

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
                window.location.reload();
            },
            (err) => toast.error("Failed to buy: " + err.message)
        );
    };

    const isOwner = listing && account?.address && normalizeSuiAddress(listing.seller) === normalizeSuiAddress(account.address);

    const handleCancel = () => {
        if (!listing) return;
        // Direct use of listing.type
        const itemType = listing.type;

        cancel(
            listing.listing_id,
            itemType,
            () => {
                toast.success("Item listing cancelled");
                window.location.reload();
            },
            (err: any) => toast.error("Cancel failed: " + err.message)
        );
    };

    const handleAcceptBid = (bid: Bid) => {
        if (!listing) return;
        acceptBid(listing.listing_id, bid.bid_id, listing.type, () => {
            toast.success("Bid accepted!");
            window.location.reload();
        }, (err: any) => toast.error(err.message));
    };

    const handleCancelBid = (bid: Bid) => {
        cancelBid(bid.bid_id, () => {
            toast.success("Bid cancelled!");
            window.location.reload();
        }, (err: any) => toast.error(err.message));
    };

    if (loading) return (
        <DashboardLayout showSidebar={false} showActivity={false}>
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        </DashboardLayout>
    );

    if (error || !listing) return (
        <DashboardLayout showSidebar={false} showActivity={false}>
            <div className="p-8 text-center text-red-400">Error: {error || 'Listing not found'}</div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout showSidebar={false} showActivity={false}>
            <div className="max-w-6xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" className="pl-0 hover:bg-transparent text-gray-500 hover:text-white" onClick={() => window.history.back()}>
                        &larr; Back
                    </Button>
                    <Badge variant="outline" className="text-sm border-gray-700 text-gray-400">
                        {listing?.type.split('<')[1]?.replace(/>/g, '').split('::').pop() || 'Unknown'}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Visual / Main Image - Left Side (5 cols) */}
                    <div className="lg:col-span-5">
                        <Card className="bg-gray-900/30 border-gray-800 overflow-hidden aspect-square flex items-center justify-center relative group">
                            {listing?.type?.includes('0x2::sui::SUI') && !listing.image_url ? (
                                <div className="flex flex-col items-center gap-3">
                                    <img src={SUI_GAS_OBJECT_LOGO} alt="SUI" className="w-24 h-24" />
                                    <span className="text-gray-400 font-medium text-lg">SUI Coin</span>
                                    {coinBalance && (
                                        <div className="flex items-center gap-2 mt-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                            <Coins className="h-5 w-5 text-blue-400" />
                                            <span className="text-xl font-bold text-white">{mistToSui(coinBalance)}</span>
                                            <span className="text-blue-400 font-medium">SUI</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <ListingImage listing={listing} variant="default" />
                            )}
                        </Card>

                        {/* Item Object ID */}
                        {listing?.item_id ? (
                            <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                                <p className="text-xs text-gray-500 uppercase mb-1">Item Object ID</p>
                                <p className="font-mono text-sm text-yellow-500 break-all select-all">{listing.item_id}</p>
                            </div>
                        ) : (
                            <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                                <p className="text-xs text-gray-500 uppercase mb-1">Object ID (Ref)</p>
                                <p className="font-mono text-sm text-yellow-500 break-all select-all">{listing?.listing_id}</p>
                            </div>
                        )}

                        {/* Listing Ref (Secondary) */}
                        {listing?.item_id && (
                            <div className="mt-2 p-4 bg-gray-900/30 rounded-lg border border-gray-800/50">
                                <p className="text-xs text-gray-500 uppercase mb-1">Listing Ref</p>
                                <p className="font-mono text-xs text-gray-400 break-all select-all">{listing?.listing_id}</p>
                            </div>
                        )}

                        {/* Package ID for UpgradeCap */}
                        {packageId && (
                            <div className="mt-2 p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
                                <p className="text-xs text-purple-400 uppercase mb-1">📦 Package ID</p>
                                <p className="font-mono text-sm text-purple-300 break-all select-all">{packageId}</p>
                            </div>
                        )}
                    </div>

                    {/* Details - Right Side (7 cols) */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* Price Card */}
                        <Card className="bg-gray-900/60 border-gray-800 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <div className="flex flex-col gap-2">
                                    <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Current Price</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black text-white tracking-tight">{mistToSui(listing.price)}</span>
                                        <span className="text-xl text-yellow-500 font-bold">SUI</span>
                                    </div>
                                </div>

                                {listing.status === 'SOLD' ? (
                                    <div className="mt-8 flex flex-col gap-3 w-full">
                                        <Button disabled className="w-full bg-gray-800 text-gray-400 cursor-not-allowed font-bold h-11 text-base">
                                            Item Sold
                                        </Button>
                                        {listing.tx_digest && (
                                            <a
                                                href={`https://suiscan.xyz/testnet/tx/${listing.tx_digest}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-center text-sm text-blue-400 hover:text-blue-300 hover:underline flex items-center justify-center gap-2"
                                            >
                                                View Transaction ↗
                                            </a>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-8 flex gap-4">
                                        {isOwner ? (
                                            <Button
                                                size="lg"
                                                variant="destructive"
                                                className="flex-1 border border-red-900 bg-red-900/20 hover:bg-red-900/40 text-red-500 font-bold h-11 text-base"
                                                onClick={handleCancel}
                                                disabled={isPending || listing.status !== 'ACTIVE'}
                                            >
                                                {isPending ? 'Processing...' : 'Cancel Listing'}
                                            </Button>
                                        ) : (
                                            <>
                                                <Button
                                                    size="lg"
                                                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-11 text-base"
                                                    onClick={handleBuy}
                                                    disabled={isPending || listing.status !== 'ACTIVE'}
                                                >
                                                    <ShoppingCart className="mr-2 h-5 w-5" />
                                                    {isPending ? 'Processing...' : 'Purchase Now'}
                                                </Button>
                                                <BidModal listingId={listing.listing_id} onSuccess={() => window.location.reload()}>
                                                    <Button size="lg" variant="secondary" className="flex-1 font-bold h-11 text-base">
                                                        Place Bid
                                                    </Button>
                                                </BidModal>
                                            </>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="bg-gray-900/40 border-gray-800 p-4">
                                <span className="text-gray-500 text-xs uppercase block mb-1">Seller</span>
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500"></div>
                                    <span className="text-blue-400 font-mono text-sm truncate" title={listing.seller}>
                                        {listing.seller.slice(0, 8)}...{listing.seller.slice(-8)}
                                    </span>
                                </div>
                            </Card>

                            <Card className="bg-gray-900/40 border-gray-800 p-4">
                                <span className="text-gray-500 text-xs uppercase block mb-1">Listed</span>
                                <div className="flex items-center gap-2 text-gray-300">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-sm font-medium">
                                        {new Date(Number(listing.timestamp_ms)).toLocaleDateString()}
                                    </span>
                                </div>
                            </Card>
                        </div>

                        {/* Attributes (Placeholder for now) */}
                        <Card className="bg-gray-900/40 border-gray-800">
                            <CardHeader>
                                <CardTitle className="text-gray-400 text-sm uppercase">Attributes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary" className="bg-gray-800 text-gray-300 hover:bg-gray-700">Type: {listing.type.split('::').pop()?.replace(/>/g, '')}</Badge>
                                    <Badge variant="secondary" className="bg-gray-800 text-gray-300 hover:bg-gray-700">Status: {listing.status}</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Bids */}
                        <Card className="bg-gray-900/40 border-gray-800">
                            <CardHeader>
                                <CardTitle className="text-gray-400 text-sm uppercase">Offers</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {listing.bids && listing.bids.length > 0 ? (
                                    <div className="space-y-3">
                                        {listing.bids.map((bid) => (
                                            <div key={bid.bid_id} className="flex justify-between items-center p-3 bg-gray-900 rounded border border-gray-800">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-mono">{mistToSui(bid.amount)} SUI</span>
                                                    <span className="text-xs text-gray-500">
                                                        From: {normalizeSuiAddress(bid.bidder).slice(0, 6)}...{normalizeSuiAddress(bid.bidder).slice(-4)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {bid.status === 'ACTIVE' && isOwner && (
                                                        <Button size="sm" onClick={() => handleAcceptBid(bid)} disabled={isBidPending}>Accept</Button>
                                                    )}
                                                    {bid.status === 'ACTIVE' && account?.address && normalizeSuiAddress(bid.bidder) === normalizeSuiAddress(account.address) && (
                                                        <Button size="sm" variant="destructive" onClick={() => handleCancelBid(bid)} disabled={isBidPending}>Cancel</Button>
                                                    )}
                                                    <Badge
                                                        variant={bid.status === 'ACTIVE' ? 'default' : 'secondary'}
                                                        className={bid.status === 'ACTIVE' ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'}
                                                    >
                                                        {bid.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">No offers yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
