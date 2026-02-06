import { Task, TaskStatus, PatternType } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { mistToSui } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { SubmitProofDialog } from './SubmitProofDialog';
import { Clock, ShieldCheck, Target } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { isInGracePeriod, getGracePeriodRemaining } from '@/utils/gracePeriod';

import { getTaskLabel } from '@/utils/taskType';

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
        <Link href={`/task/${task.task_id}`} className="block h-full w-full">
            <Card className="h-full flex flex-col bg-gray-900 border-gray-800 hover:border-yellow-500/50 transition-all duration-300 group overflow-hidden relative cursor-pointer">
                {/* Status Badge */}
                <div className="absolute top-2 right-2 z-10">
                    <Badge variant={isAvailable ? "default" : "secondary"} className={
                        isActive
                            ? "bg-green-500/10 text-green-400 border-green-500/20 text-[10px] px-2 py-0"
                            : isPending
                                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[10px] px-2 py-0"
                                : isCompleted
                                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] px-2 py-0"
                                    : "bg-gray-800 text-gray-400 text-[10px] px-2 py-0"
                    }>
                        {getStatusLabel()}
                    </Badge>
                </div>

                <CardContent className="p-0 flex-1 flex flex-col">
                    {/* Pattern Visual */}
                    <div className="h-24 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative group-hover:from-gray-800 group-hover:to-gray-800/80 transition-all">
                        <div className="text-center z-10 flex flex-col items-center">
                            <div className="h-8 w-8 bg-black/50 rounded-lg flex items-center justify-center mb-1 border border-gray-700 shadow-lg">
                                <Target className="h-4 w-4 text-yellow-500" />
                            </div>
                            <span className="font-mono text-base font-bold text-white tracking-wider truncate max-w-[180px]">
                                {renderPattern()}
                            </span>
                        </div>
                        {/* Background Grid Effect */}
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                    </div>

                    {/* Details */}
                    <div className="p-3 space-y-2 flex-1">
                        <div className="flex justify-between items-center bg-gray-900/50 p-2 rounded-lg border border-gray-800">
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded bg-gray-800 text-gray-400">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-xs text-gray-300 font-medium">{getTaskLabel(task.task_type, task.target_type)}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-white flex items-center gap-1">
                                    {task.reward_amount ? mistToSui(task.reward_amount) : '0'}
                                    <span className="text-[10px] text-yellow-500 font-normal uppercase">SUI</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-3 pt-0 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                        <Clock className="h-3 w-3" />
                        <span>{timeLeft}</span>
                    </div>

                    {isAvailable ? (
                        <div onClick={(e) => e.stopPropagation()} className="scale-90 origin-right">
                            <SubmitProofDialog taskId={task.task_id} />
                        </div>
                    ) : isPending ? (
                        <span className="text-[10px] text-yellow-500 italic">Starting soon</span>
                    ) : (
                        <span className="text-[10px] text-gray-600 italic">Task ended</span>
                    )}
                </CardFooter>
            </Card>
        </Link>
    );
}
