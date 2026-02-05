import { useState, useEffect, useCallback } from 'react';
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

    // Allow options to override URL params, but prioritize options if provided
    // Prioritize URL param 'status', then options.status, then default 'ALL' or 'ACTIVE,PENDING'?
    // Logic: options?.status is derived from tab. If tab is active, we use options.
    // If we want sidebar to filter within tab, we need to merge or prioritize.
    // Current usage: fetchOptions passes status based on tab.
    // If we want sidebar filters to apply, we should probably allow URL status to refine or override.
    // However, tabs fundamentally change status scope (Market vs History).
    // Let's keep existing prioritization: options.status dominates if present (for tabs), 
    // BUT sidebar tries to set URL status. 
    // Issue: If I'm on "Market" (status=ACTIVE,PENDING), and I click "Completed" in sidebar, URL becomes ?status=COMPLETED.
    // If logic uses options.status, URL is ignored.
    // Fix: We should probably let URL override if present, OR merge. 
    // For now, mirroring Listing logic: URL > Option > Default.
    // BUT this might break tabs if tab doesn't update URL. 
    // Tabs in page.tsx use local state `activeTab` which sets `fetchOptions`.
    // If I click sidebar filter, URL changes. Hook sees URL. 
    // If `fetchOptions` is passed, it overrides URL in current code: `options?.status || searchParams`.
    // We want URL to WIN if specific filter is set? 
    // Actually, `activeTab` logic in Page doesn't set URL. 
    // So if I click sidebar, URL `status` is set.
    // If I switch tabs, `fetchOptions` changes.
    // Complex. Let's stick to simple itemType addition first, and maybe refine status if needed. 
    // User asked for Item Type primarily.
    
    // Status Logic for Tasks:
    const statusParam = searchParams.get('status') || options?.status;
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

            setTasks(data);
            setError(null);
        } catch (e) {
            console.error("Failed to fetch tasks", e);
            setError(e as Error);
        } finally {
            setLoading(false);
        }
    }, [search, statusParam, creatorParam, options?.limit, minReward, maxReward, itemType]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    return { tasks, loading, error, refetch: fetchTasks };
}
