import { Task, TaskStatus, PatternType } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { mistToSui } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { SubmitProofDialog } from './SubmitProofDialog';
import { Clock, ShieldCheck, Target, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { isInGracePeriod, getGracePeriodRemaining } from '@/utils/gracePeriod';

import { getTaskIcon, getTaskLabel } from '@/utils/taskType';
import { NETWORK } from '@/constants/chain';

interface TaskCardProps {
    task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
    // Helper to handle both Enum and String status
    const statusStr = String(task.status).toUpperCase();

    // Check grace period using timestamp_ms or created_at
    const createdT = task.timestamp_ms || task.created_at;
    const inGracePeriod = createdT ? isInGracePeriod(createdT) : false;

    // Override status if in grace period, but respect final states
    const isCompleted = statusStr === 'COMPLETED' || task.status === TaskStatus.COMPLETED;
    const isCancelled = statusStr === 'CANCELLED' || task.status === TaskStatus.CANCELLED;
    const isPending = !isCompleted && !isCancelled && (statusStr === 'PENDING' || task.status === TaskStatus.PENDING || inGracePeriod);
    const isActive = !isCompleted && !isCancelled && !inGracePeriod && (statusStr === 'ACTIVE' || task.status === TaskStatus.ACTIVE);
    const isAvailable = isActive;

    const [timeLeft, setTimeLeft] = useState<string>('Calculating...');

    const calculateTime = () => {
        if (isCompleted) return 'Completed';
        if (isCancelled) return 'Cancelled';

        // Use timestamp_ms (chain time) or created_at (DB time)
        if (!createdT) return 'Unlimited';

        // Check Grace Period (15 mins)
        if (isInGracePeriod(createdT)) {
            const remaining = getGracePeriodRemaining(createdT);
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            return `Starts in ${minutes}m ${seconds}s`;
        }

        // Active Period
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

        if (hours > 0) return `${hours}h ${minutes}m left`;
        return `${minutes}m left`;
    };

    useEffect(() => {
        setTimeLeft(calculateTime());
        const timer = setInterval(() => setTimeLeft(calculateTime()), 1000); // Update every second for grace period countdown
        return () => clearInterval(timer);
    }, [task.timestamp_ms, task.created_at, task.lock_duration_ms, isCompleted, isCancelled]);

    // Override status if in grace period
    // Override status if in grace period, but respect final states
    // Removed duplicate logic used for rendering badges.
    // The logic is now at the top of the component.

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
            display += `...`
        }

        if (task.suffix) {
            display += task.contains ? `...${task.suffix}` : `...${task.suffix}`;
        }

        // Fallback for legacy pattern field
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
        if (isCancelled || statusStr === 'CANCELLED' || task.status === TaskStatus.CANCELLED) return 'CANCELLED';
        if (isPending) return 'PENDING';
        if (isActive) return 'ACTIVE';
        return statusStr || 'UNKNOWN';
    };

    return (
        <Link href={`/task/${task.task_id}`} className="block w-full">
            <div className="flex items-center gap-4 p-3 bg-gray-900 border border-gray-800 rounded-lg hover:border-cyan-500/30 hover:bg-gray-900/80 transition-all duration-200 cursor-pointer group">
                {/* Type Icon */}
                {getTaskIcon({ taskType: task.task_type, targetType: task.target_type, className: "h-5 w-5" })}

                {/* Pattern */}
                <div className="flex-1 min-w-0">
                    <span className="font-mono text-sm font-bold text-white truncate block">
                        {renderPattern()}
                    </span>
                    <span className="text-[11px] text-gray-500">{getTaskLabel(task.task_type, task.target_type)}</span>
                </div>

                {/* Reward */}
                <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white">
                        {task.reward_amount ? mistToSui(task.reward_amount) : '0'}
                        <span className="text-[10px] text-yellow-500 ml-1">SUI</span>
                    </p>
                </div>

                {/* Status + Time */}
                <div className="flex flex-col items-center shrink-0 min-w-[80px]">
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
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
                        <Clock className="h-2.5 w-2.5" />
                        <span>{timeLeft}</span>
                    </div>
                </div>

                {/* Action */}
                {isAvailable && (
                    <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                        <SubmitProofDialog
                            taskId={task.task_id}
                            taskType={task.task_type || 0}
                            targetType={task.target_type || ''}
                        />
                    </div>
                )}

                {/* View on-chain for completed tasks */}
                {isCompleted && task.tx_digest && (
                    <a
                        href={`https://suiscan.xyz/${NETWORK}/tx/${task.tx_digest}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 shrink-0"
                    >
                        <ExternalLink className="h-3 w-3" />
                        View TX
                    </a>
                )}
            </div>
        </Link>
    );
}
