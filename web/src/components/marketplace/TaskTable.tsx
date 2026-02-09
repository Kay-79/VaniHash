'use client';

import { Task, TaskStatus, PatternType } from '@/types';
import { mistToSui, shortenAddress } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Copy, Clock, Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { isInGracePeriod, getGracePeriodRemaining } from '@/utils/gracePeriod';
import { getTaskIcon, getTaskLabel } from '@/utils/taskType';
import { SubmitProofDialog } from './SubmitProofDialog';
import { Skeleton } from '@/components/ui/Skeleton';

interface TaskTableProps {
    tasks: Task[];
    loading?: boolean;
    loadingMore?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
}

function TaskRow({ task }: { task: Task }) {
    const router = useRouter();

    // Status logic from TaskCard
    const statusStr = String(task.status).toUpperCase();
    const createdT = task.timestamp_ms || task.created_at;
    const inGracePeriod = createdT ? isInGracePeriod(createdT) : false;

    const isCompleted = statusStr === 'COMPLETED' || task.status === TaskStatus.COMPLETED;
    const isCancelled = statusStr === 'CANCELLED' || task.status === TaskStatus.CANCELLED;
    const isPending = !isCompleted && !isCancelled && (statusStr === 'PENDING' || task.status === TaskStatus.PENDING || inGracePeriod);
    const isActive = !isCompleted && !isCancelled && !inGracePeriod && (statusStr === 'ACTIVE' || task.status === TaskStatus.ACTIVE);
    const isAvailable = isActive;

    const [timeLeft, setTimeLeft] = useState<string>('...');

    const calculateTime = () => {
        if (isCompleted) return 'Completed';
        if (isCancelled) return 'Cancelled';
        if (!createdT) return 'Unlimited';

        if (isInGracePeriod(createdT)) {
            const remaining = getGracePeriodRemaining(createdT);
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            return `Starts in ${minutes}m ${seconds}s`;
        }

        if (!task.lock_duration_ms) return 'Unlimited';

        const createdMs = typeof createdT === 'string' && /^\d+$/.test(createdT)
            ? parseInt(createdT)
            : new Date(createdT).getTime();

        const expiry = createdMs + Number(task.lock_duration_ms);
        const now = Date.now();
        const diff = expiry - now;

        if (diff <= 0) return 'Active';

        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);

        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m left`;
    };

    useEffect(() => {
        setTimeLeft(calculateTime());
        const timer = setInterval(() => setTimeLeft(calculateTime()), 1000);
        return () => clearInterval(timer);
    }, [task.timestamp_ms, task.created_at, task.lock_duration_ms, isCompleted, isCancelled]);

    const renderPattern = () => {
        let display = '';

        if (task.prefix) {
            display += `0x${task.prefix}`;
        } else {
            display += `0x`;
        }

        if (task.contains) {
            display += `...${task.contains}`;
        } else if (!task.prefix && !task.suffix) {
            display += `...`;
        } else if (task.prefix && task.suffix) {
            display += `...`;
        }

        if (task.suffix) {
            display += task.contains ? `...${task.suffix}` : `...${task.suffix}`;
        }

        // Legacy pattern field
        if (!task.prefix && !task.suffix && !task.contains && task.pattern) {
            const p = task.pattern;
            if (task.pattern_type === PatternType.PREFIX) return `0x${p}...`;
            if (task.pattern_type === PatternType.SUFFIX) return `0x...${p}`;
            if (task.pattern_type === PatternType.CONTAINS) return `...${p}...`;
            return p;
        }

        return display;
    };

    const getStatusLabel = () => {
        if (isCompleted) return 'COMPLETED';
        if (isCancelled) return 'CANCELLED';
        if (isPending) return 'PENDING';
        if (isActive) return 'ACTIVE';
        return statusStr || 'UNKNOWN';
    };

    const copyId = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(id);
        toast.success('ID copied');
    };

    return (
        <tr
            className="transition-colors cursor-pointer group bg-black/20 hover:bg-gray-800/30"
            onClick={() => router.push(`/task/${task.task_id}`)}
        >
            {/* Pattern */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-gray-800 flex items-center justify-center border border-gray-700">
                        {getTaskIcon({ taskType: task.task_type, targetType: task.target_type, className: "h-4 w-4 text-cyan-400" })}
                    </div>
                    <div>
                        <div className="font-mono text-sm font-medium text-gray-200">
                            {renderPattern()}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 group/id">
                            {getTaskLabel(task.task_type, task.target_type)}
                            <Copy
                                className="h-3 w-3 opacity-0 group-hover/id:opacity-100 cursor-pointer hover:text-white transition-all ml-1"
                                onClick={(e) => copyId(e, task.task_id)}
                            />
                        </div>
                    </div>
                </div>
            </td>

            {/* Reward */}
            <td className="px-4 py-3 text-right">
                <span className="font-mono font-bold text-white">
                    {task.reward_amount ? mistToSui(task.reward_amount) : '0'}
                </span>
                <span className="text-[10px] text-yellow-500 ml-1">SUI</span>
            </td>

            {/* Status */}
            <td className="px-4 py-3 text-center">
                <Badge variant={isAvailable ? "default" : "secondary"} className={
                    isActive
                        ? "bg-green-500/10 text-green-400 border-green-500/20 text-[10px] px-2 py-0.5"
                        : isPending
                            ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[10px] px-2 py-0.5"
                            : isCompleted
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] px-2 py-0.5"
                                : "bg-gray-800 text-gray-400 text-[10px] px-2 py-0.5"
                }>
                    {getStatusLabel()}
                </Badge>
            </td>

            {/* Time */}
            <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>{timeLeft}</span>
                </div>
            </td>

            {/* Creator */}
            <td className="px-4 py-3 text-right">
                <span className="text-cyan-500 hover:text-cyan-400 cursor-pointer font-mono text-xs">
                    {shortenAddress(task.creator)}
                </span>
            </td>

            {/* Action */}
            <td className="px-4 py-3 text-right">
                {isAvailable && (
                    <div onClick={(e) => e.stopPropagation()}>
                        <SubmitProofDialog
                            taskId={task.task_id}
                            taskType={task.task_type || 0}
                            targetType={task.target_type || ''}
                            isActive={isAvailable}
                        />
                    </div>
                )}
            </td>
        </tr>
    );
}

export function TaskTable({ tasks, loading, loadingMore, hasMore, onLoadMore }: TaskTableProps) {
    const loaderRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        if (!onLoadMore || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore) {
                    onLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        const currentRef = loaderRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [onLoadMore, hasMore, loadingMore]);

    if (loading) {
        return (
            <div className="w-full p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border border-gray-700 rounded-lg bg-gray-900/40">
                        <div className="space-y-2 w-full">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded" />
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
                <h3 className="text-lg font-medium text-white mb-1">No Tasks Found</h3>
                <p className="text-sm text-gray-500 max-w-xs">There are currently no vanity address requests matching your criteria.</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-900/50 border-b border-gray-800">
                    <tr>
                        <th className="px-4 py-3 font-medium tracking-wider">Pattern</th>
                        <th className="px-4 py-3 font-medium tracking-wider text-right">Reward</th>
                        <th className="px-4 py-3 font-medium tracking-wider text-center">Status</th>
                        <th className="px-4 py-3 font-medium tracking-wider text-center">Time</th>
                        <th className="px-4 py-3 font-medium tracking-wider text-right">Creator</th>
                        <th className="px-4 py-3 font-medium tracking-wider text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                    {tasks.map((task) => (
                        <TaskRow key={task.task_id} task={task} />
                    ))}
                </tbody>
            </table>
            
            {/* Lazy loading trigger */}
            <div ref={loaderRef} className="flex justify-center py-4">
                {loadingMore && (
                    <div className="flex items-center gap-2 text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading more...</span>
                    </div>
                )}
                {!hasMore && tasks.length > 0 && (
                    <span className="text-sm text-gray-500">No more tasks</span>
                )}
            </div>
        </div>
    );
}
