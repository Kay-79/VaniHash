import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

export interface Listing {
    listing_id: string;
    seller: string;
    price: string;
    type: string;
    status: string;
    timestamp_ms: number;
}

export type UseFetchListingsOptions = {
    limit?: number;
    status?: string;
    type?: string;
};

export function useFetchListings(options?: UseFetchListingsOptions) {
    const searchParams = useSearchParams();
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const itemType = options?.type || searchParams.get('itemType');

    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchListings = useCallback(async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({ limit: options?.limit?.toString() || '20' });
            if (search) query.set('search', search);
            if (minPrice) query.set('minPrice', minPrice);
            if (maxPrice) query.set('maxPrice', maxPrice);
            if (itemType) query.set('itemType', itemType);

            // Default to ACTIVE if not specified (though api defaults too)
            // Prioritize URL param 'status', then options.status, then default 'ACTIVE'
            const statusParam = searchParams.get('status') || options?.status || 'ACTIVE';
            query.set('status', statusParam);

            const res = await fetch(`/api/listings?${query.toString()}`);

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `API Error: ${res.status}`);
            }

            const data = await res.json() as Listing[];
            if (!Array.isArray(data)) {
                throw new Error("Invalid API response: expected array");
            }

            setListings(data);
            setError(null);
        } catch (e) {
            console.error("Failed to fetch listings", e);
            setError(e as Error);
        } finally {
            setLoading(false);
        }
    }, [search, minPrice, maxPrice, itemType, options?.limit, options?.status, searchParams]);

    useEffect(() => {
        fetchListings();
    }, [fetchListings]);

    return { listings, loading, error, refetch: fetchListings };
}
