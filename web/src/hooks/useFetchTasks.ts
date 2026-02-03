import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Task } from '@/types';

export type UseFetchTasksOptions = {
    creator?: string;
    status?: string; // 'ALL' or comma strings
    limit?: number;
};

export function useFetchTasks(options?: UseFetchTasksOptions) {
    const searchParams = useSearchParams();
    const search = searchParams.get('search');
    const minReward = searchParams.get('minReward');
    const maxReward = searchParams.get('maxReward');
    const length = searchParams.get('length');

    // Allow options to override URL params, but prioritize options if provided
    const statusParam = options?.status || searchParams.get('status');
    const creatorParam = options?.creator;

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({ limit: options?.limit?.toString() || '20' });
            if (search) query.set('search', search);
            if (statusParam && statusParam !== 'ALL') query.set('status', statusParam);
            if (creatorParam) query.set('creator', creatorParam);
            if (minReward) query.set('minReward', minReward);
            if (maxReward) query.set('maxReward', maxReward);
            if (length) query.set('length', length);

            const res = await fetch(`/api/tasks?${query.toString()}`);

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `API Error: ${res.status}`);
            }

            const data = await res.json() as Task[];
            if (!Array.isArray(data)) {
                throw new Error("Invalid API response: expected array");
            }

            setTasks(data);
            setError(null);
        } catch (e) {
            console.error("Failed to fetch tasks", e);
            setError(e as Error);
        } finally {
            setLoading(false);
        }
        // Memoize on primitive values, not the options object itself
    }, [search, statusParam, creatorParam, options?.limit, minReward, maxReward, length]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    return { tasks, loading, error, refetch: fetchTasks };
}
