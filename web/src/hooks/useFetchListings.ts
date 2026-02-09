import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export interface Listing {
    listing_id: string;
    item_id: string;
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
    const statusParam = searchParams.get('status') || options?.status || 'ACTIVE';
    const pageSize = options?.limit || 20;

    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const offsetRef = useRef(0);
    const isFetchingRef = useRef(false); // Guard against double fetches

    // Reset key when filters change
    const filterKey = `${search}-${statusParam}-${minPrice}-${maxPrice}-${itemType}`;

    const fetchListings = useCallback(async (append = false) => {
        // Prevent concurrent fetches
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;

        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            offsetRef.current = 0;
        }

        try {
            const query = new URLSearchParams({ 
                limit: (pageSize + 1).toString(),
                offset: offsetRef.current.toString(),
                status: statusParam
            });
            if (search) query.set('search', search);
            if (minPrice) query.set('minPrice', minPrice);
            if (maxPrice) query.set('maxPrice', maxPrice);
            if (itemType) query.set('itemType', itemType);

            const res = await fetch(`/api/listings?${query.toString()}`);

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `API Error: ${res.status}`);
            }

            const data = await res.json() as Listing[];
            if (!Array.isArray(data)) {
                throw new Error("Invalid API response: expected array");
            }

            // Check if there are more results
            const hasMoreResults = data.length > pageSize;
            const actualData = hasMoreResults ? data.slice(0, pageSize) : data;
            
            setHasMore(hasMoreResults);
            
            if (append) {
                setListings(prev => [...prev, ...actualData]);
            } else {
                setListings(actualData);
            }
            
            offsetRef.current += actualData.length;
            setError(null);
        } catch (e) {
            console.error("Failed to fetch listings", e);
            setError(e as Error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            isFetchingRef.current = false;
        }
    }, [search, minPrice, maxPrice, itemType, statusParam, pageSize]);

    // Refetch when filters change
    useEffect(() => {
        setListings([]);
        setHasMore(true);
        fetchListings(false);
    }, [filterKey]);

    const loadMore = useCallback(() => {
        if (!isFetchingRef.current && hasMore) {
            fetchListings(true);
        }
    }, [fetchListings, hasMore]);

    const refetch = useCallback(() => {
        setListings([]);
        setHasMore(true);
        offsetRef.current = 0;
        fetchListings(false);
    }, [fetchListings]);

    return { listings, loading, loadingMore, error, hasMore, loadMore, refetch };
}
