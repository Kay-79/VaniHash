import { Task } from '@/types';
import { TaskCard } from './TaskCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Zap } from 'lucide-react';

interface TaskListProps {
    tasks: Task[];
    loading?: boolean;
}

export function TaskList({ tasks, loading }: TaskListProps) {
    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border border-gray-700 rounded-lg">
                        <div className="space-y-2 w-full">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                        <Skeleton className="h-12 w-12 rounded-full" />
                    </div>
                ))}
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 bg-gray-900 rounded-full flex items-center justify-center mb-4 border border-gray-800">
                    <Zap className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-white mb-1">No Active Tasks</h3>
                <p className="text-sm text-gray-500 max-w-xs">There are currently no vanity address requests. Create one to get started!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
            {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
            ))}
        </div>
    );
}
