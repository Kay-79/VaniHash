import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Task } from '@/types';

export function useFetchTasks() {
    const searchParams = useSearchParams();
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({ limit: '20' });
            if (search) query.set('search', search);
            if (status && status !== 'ALL') query.set('status', status);

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
    }, [search, status]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    return { tasks, loading, error, refetch: fetchTasks };
}
