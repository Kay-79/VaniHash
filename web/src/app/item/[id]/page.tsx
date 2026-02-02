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
import { toast } from 'sonner';

interface Listing {
    listing_id: string;
    seller: string;
    price: string;
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
    const { buy, isPending } = useMarketplace();

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
        if (!listing) return;
        const match = listing.type.match(/\<(.+)\>/);
        if (!match) {
            toast.error("Could not determine item type");
            return;
        }
        const itemType = match[1];

        // The buy function expects: (kioskId, itemId, itemType, priceMist, onSuccess, onError)
        // For now, using listing_id as both kioskId and itemId (adjust based on your data structure)
        buy(
            listing.seller,      // kioskId (seller's kiosk)
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
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">Item Details</h1>
                    <Badge variant="outline" className="text-sm">
                        ID: {listing.listing_id.slice(0, 6)}...{listing.listing_id.slice(-4)}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Visual / Main */}
                    <Card className="bg-gray-900 border-gray-800 flex items-center justify-center min-h-[300px]">
                        <div className="text-center">
                            <Tag className="h-24 w-24 text-yellow-500 mx-auto mb-4 opacity-80" />
                            <h2 className="text-xl font-mono text-white break-all px-8">
                                {listing.type.split('<')[1]?.replace('>', '') || 'Unknown Item'}
                            </h2>
                        </div>
                    </Card>

                    {/* Details */}
                    <div className="space-y-6">
                        <Card className="bg-gray-900/50 border-gray-800">
                            <CardHeader>
                                <CardTitle className="text-gray-400 text-sm uppercase">Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-black/20 rounded">
                                    <span className="text-gray-500 flex items-center gap-2"><User className="h-4 w-4" /> Seller</span>
                                    <span className="text-blue-400 font-mono text-sm truncate max-w-[150px]">{listing.seller}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-black/20 rounded">
                                    <span className="text-gray-500 flex items-center gap-2"><Clock className="h-4 w-4" /> Listed At</span>
                                    <span className="text-gray-300 text-sm">
                                        {new Date(Number(listing.timestamp_ms)).toLocaleDateString()}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gray-900/50 border-gray-800">
                            <CardContent className="p-6">
                                <p className="text-sm text-gray-500 mb-1">Price</p>
                                <p className="text-3xl font-bold text-white mb-6">
                                    {mistToSui(listing.price)} <span className="text-yellow-500 text-lg">SUI</span>
                                </p>
                                <Button
                                    size="lg"
                                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
                                    onClick={handleBuy}
                                    disabled={isPending || listing.status !== 'ACTIVE'}
                                >
                                    <ShoppingCart className="mr-2 h-5 w-5" />
                                    {isPending ? 'Processing...' : 'Buy Now'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
