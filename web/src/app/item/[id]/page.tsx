'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { mistToSui } from '@/utils/formatters';
import { ShoppingCart, User, Tag, Clock } from 'lucide-react';
import { useMarketplace } from '@/hooks/useMarketplace';
import { useOwnedKiosk } from '@/hooks/useOwnedKiosk';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { normalizeSuiAddress } from '@mysten/sui/utils';
import { toast } from 'sonner';

listing_id: string;
seller: string;
kiosk_id: string | null;
price: string;
image_url ?: string | null;
type: string;
status: string;
timestamp_ms: number;
}

export default function ItemDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { buy, delist, isPending } = useMarketplace();
    const { kioskId, kioskCapId } = useOwnedKiosk();
    const account = useCurrentAccount();

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

    const handleBuy = () => {
        if (!listing || !listing.kiosk_id) {
            toast.error("Invalid listing data (missing kiosk ID)");
            return;
        }
        const match = listing.type.match(/\<(.+)\>/);
        if (!match) {
            toast.error("Could not determine item type");
            return;
        }
        const itemType = match[1];

        // The buy function expects: (kioskId, itemId, itemType, priceMist, onSuccess, onError)
        buy(
            listing.kiosk_id,     // kioskId (actual Kiosk ID)
            listing.listing_id,  // itemId
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

    const handleDelist = () => {
        if (!listing || !kioskId || !kioskCapId) return;
        const match = listing.type.match(/<(.+)>/);
        const itemType = match ? match[1] : listing.type;

        delist(
            kioskId,
            kioskCapId,
            listing.listing_id,
            itemType,
            () => {
                toast.success("Item delisted successfully");
                window.location.reload();
            },
            (err) => toast.error("Delist failed: " + err.message)
        );
    };

    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        </DashboardLayout>
    );

    if (error || !listing) return (
        <DashboardLayout>
            <div className="p-8 text-center text-red-400">Error: {error || 'Listing not found'}</div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout activityMode="market">
            <div className="max-w-6xl mx-auto p-6 space-y-8">
                {/* Header / Breadcrumb-ish */}
                <div className="flex flex-col gap-2">
                    <Button variant="ghost" className="pl-0 w-fit hover:bg-transparent text-gray-500 hover:text-white" onClick={() => window.history.back()}>
                        &larr; Back to Market
                    </Button>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h1 className="text-2xl md:text-3xl font-bold font-mono text-yellow-500 tracking-tight break-all">
                            {listing?.listing_id}
                        </h1>
                        <Badge variant="outline" className="w-fit text-sm border-gray-700 text-gray-400">
                            Type: {listing?.type.split('<')[1]?.replace('>', '').split('::').pop() || 'Unknown'}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Visual / Main Image - Left Side (5 cols) */}
                    <div className="lg:col-span-5">
                        <Card className="bg-black/40 border-gray-800 overflow-hidden aspect-square flex items-center justify-center relative group">
                            {listing?.image_url ? (
                                <img
                                    src={listing.image_url}
                                    alt="NFT"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            ) : (
                                <div className="text-center">
                                    <Tag className="h-24 w-24 text-gray-700 mx-auto mb-4" />
                                    <span className="text-gray-600 font-mono">No Preview</span>
                                </div>
                            )}
                        </Card>
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

                                <div className="mt-8 flex gap-4">
                                    {isOwner ? (
                                        <Button
                                            size="lg"
                                            variant="destructive"
                                            className="flex-1 border border-red-900 bg-red-900/20 hover:bg-red-900/40 text-red-500 font-bold h-11 text-base"
                                            onClick={handleDelist}
                                            disabled={isPending || listing.status !== 'ACTIVE'}
                                        >
                                            {isPending ? 'Processing...' : 'Cancel Listing'}
                                        </Button>
                                    ) : (
                                        <Button
                                            size="lg"
                                            className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-11 text-base"
                                            onClick={handleBuy}
                                            disabled={isPending || listing.status !== 'ACTIVE'}
                                        >
                                            <ShoppingCart className="mr-2 h-5 w-5" />
                                            {isPending ? 'Processing...' : 'Purchase Now'}
                                        </Button>
                                    )}
                                </div>
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
                                    <Badge variant="secondary" className="bg-gray-800 text-gray-300 hover:bg-gray-700">Type: {listing.type.split('::').pop()?.replace('>', '')}</Badge>
                                    <Badge variant="secondary" className="bg-gray-800 text-gray-300 hover:bg-gray-700">Status: {listing.status}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
