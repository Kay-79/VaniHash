import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Task } from '@/types';

export type UseFetchTasksOptions = {
    creator?: string;
    status?: string; // 'ALL' or comma strings
    limit?: number;
    type?: string;
};

export function useFetchTasks(options?: UseFetchTasksOptions) {
    const searchParams = useSearchParams();
    const search = searchParams.get('search');
    const minReward = searchParams.get('minReward');
    const maxReward = searchParams.get('maxReward');
    const itemType = options?.type || searchParams.get('itemType');

    const statusParam = searchParams.get('status') || options?.status;
    const creatorParam = options?.creator;
    const pageSize = options?.limit || 20;

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const offsetRef = useRef(0);
    const isFetchingRef = useRef(false); // Guard against double fetches

    // Reset when filters change
    const filterKey = `${search}-${statusParam}-${creatorParam}-${minReward}-${maxReward}-${itemType}`;

    const fetchTasks = useCallback(async (append = false) => {
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
                limit: (pageSize + 1).toString(), // Fetch one extra to check hasMore
                offset: offsetRef.current.toString()
            });
            if (search) query.set('search', search);
            if (statusParam && statusParam !== 'ALL') query.set('status', statusParam);
            if (creatorParam) query.set('creator', creatorParam);
            if (minReward) query.set('minReward', minReward);
            if (maxReward) query.set('maxReward', maxReward);
            if (itemType) query.set('itemType', itemType);

            const res = await fetch(`/api/tasks?${query.toString()}`);

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `API Error: ${res.status}`);
            }

            const data = await res.json() as Task[];
            if (!Array.isArray(data)) {
                throw new Error("Invalid API response: expected array");
            }

            // Check if there are more results
            const hasMoreResults = data.length > pageSize;
            const actualData = hasMoreResults ? data.slice(0, pageSize) : data;
            
            setHasMore(hasMoreResults);
            
            if (append) {
                setTasks(prev => [...prev, ...actualData]);
            } else {
                setTasks(actualData);
            }
            
            offsetRef.current += actualData.length;
            setError(null);
        } catch (e) {
            console.error("Failed to fetch tasks", e);
            setError(e as Error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            isFetchingRef.current = false;
        }
    }, [search, statusParam, creatorParam, pageSize, minReward, maxReward, itemType]);

    // Refetch when filters change
    useEffect(() => {
        setTasks([]);
        setHasMore(true);
        fetchTasks(false);
    }, [filterKey]);

    const loadMore = useCallback(() => {
        if (!isFetchingRef.current && hasMore) {
            fetchTasks(true);
        }
    }, [fetchTasks, hasMore]);

    const refetch = useCallback(() => {
        setTasks([]);
        setHasMore(true);
        offsetRef.current = 0;
        fetchTasks(false);
    }, [fetchTasks]);

    return { tasks, loading, loadingMore, error, hasMore, loadMore, refetch };
}
