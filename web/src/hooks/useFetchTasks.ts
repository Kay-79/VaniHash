import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types';
import { INDEXER_URL } from '@/constants/chain';

export function useFetchTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${INDEXER_URL}/tasks?limit=20`);
            const data = await res.json() as Task[];
            setTasks(data);
            setError(null);
        } catch (e) {
            console.error("Failed to fetch tasks", e);
            setError(e as Error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    return { tasks, loading, error, refetch: fetchTasks };
}
