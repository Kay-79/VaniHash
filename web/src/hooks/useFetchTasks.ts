import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Task } from '@/types';

export function useFetchTasks() {
    const searchParams = useSearchParams();
    const search = searchParams.get('search');

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({ limit: '20' });
            if (search) query.set('search', search);

            const res = await fetch(`/api/tasks?${query.toString()}`);
            const data = await res.json() as Task[];
            setTasks(data);
            setError(null);
        } catch (e) {
            console.error("Failed to fetch tasks", e);
            setError(e as Error);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    return { tasks, loading, error, refetch: fetchTasks };
}
