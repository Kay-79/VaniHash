import { Task, TaskStatus, PatternType } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { mistToSui } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { SubmitProofDialog } from './SubmitProofDialog';
import { Clock, ShieldCheck, Target } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TaskCardProps {
    task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
    const [timeLeft, setTimeLeft] = useState<string>('Calculating...');

    const calculateTime = () => {
        if (!task.creation_time || !task.lock_duration_ms) return 'Unlimited';
        const now = Date.now();
        const expiry = Number(task.creation_time) + Number(task.lock_duration_ms);
        const diff = expiry - now;

        if (diff <= 0) return 'Expired';
        
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        
        if (hours > 0) return `${hours}h ${minutes}m left`;
        return `${minutes}m left`;
    };

    useEffect(() => {
        setTimeLeft(calculateTime());
        const timer = setInterval(() => setTimeLeft(calculateTime()), 60000);
        return () => clearInterval(timer);
    }, [task.creation_time, task.lock_duration_ms]);

    // Helper to handle both Enum and String status
    const statusStr = String(task.status).toUpperCase();
    const isPending = statusStr === 'PENDING' || task.status === TaskStatus.PENDING;
    const isActive = statusStr === 'ACTIVE' || task.status === TaskStatus.ACTIVE;
    const isCompleted = statusStr === 'COMPLETED' || task.status === TaskStatus.COMPLETED;
    const isAvailable = isPending || isActive;

    const renderPattern = () => {
        const p = task.pattern || '';
        // Handle pattern_type safely if it's undefined
        if (task.pattern_type === PatternType.PREFIX) return `0x${p}...`;
        if (task.pattern_type === PatternType.SUFFIX) return `0x...${p}`;
        if (task.pattern_type === PatternType.CONTAINS) return `...${p}...`;
        return p;
    };

    const getStatusLabel = () => {
        if (isPending) return 'PENDING';
        if (isActive) return 'ACTIVE';
        if (isCompleted) return 'COMPLETED';
        if (statusStr === 'CANCELLED' || task.status === TaskStatus.CANCELLED) return 'CANCELLED';
        return statusStr || 'UNKNOWN';
    };

    return (
        <Card className="bg-gray-900 border-gray-800 hover:border-yellow-500/50 transition-all duration-300 group overflow-hidden relative">
            {/* Status Badge */}
            <div className="absolute top-3 right-3 z-10">
                <Badge variant={isAvailable ? "default" : "secondary"} className={
                    isAvailable 
                    ? "bg-green-500/10 text-green-400 border-green-500/20" 
                    : isCompleted 
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    : "bg-gray-800 text-gray-400"
                }>
                    {getStatusLabel()}
                </Badge>
            </div>

            <CardContent className="p-0">
                {/* Pattern Visual */}
                <div className="h-32 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative group-hover:from-gray-800 group-hover:to-gray-800/80 transition-all">
                    <div className="text-center z-10">
                        <div className="h-12 w-12 bg-black/50 rounded-lg flex items-center justify-center mx-auto mb-2 border border-gray-700 shadow-lg">
                            <Target className="h-6 w-6 text-yellow-500" />
                        </div>
                        <span className="font-mono text-xl font-bold text-white tracking-wider">
                            {renderPattern()}
                        </span>
                    </div>
                     {/* Background Grid Effect */}
                     <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                </div>

                {/* Details */}
                <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Target Type</p>
                            <div className="flex items-center gap-1.5 text-sm text-gray-300 bg-gray-800/50 px-2 py-1 rounded">
                                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                                {task?.target_type?.split('::').pop() ?? 'Unknown'}
                            </div>
                        </div>
                         <div className="text-right">
                             <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Reward</p>
                            <p className="text-lg font-bold text-white flex items-center justify-end gap-1">
                                {task.reward_amount ? mistToSui(task.reward_amount) : '0'} 
                                <span className="text-sm text-yellow-500 font-normal">SUI</span>
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>

             <CardFooter className="p-4 pt-0 flex items-center justify-between border-t border-gray-800/50 mt-2 bg-black/20">
                 <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{timeLeft}</span>
                 </div>
                 
                 {isAvailable ? (
                    <div onClick={(e) => e.stopPropagation()}>
                        <SubmitProofDialog taskId={task.task_id} />
                    </div>
                 ) : (
                    <span className="text-xs text-gray-600 italic">Task ended</span>
                 )}
            </CardFooter>
        </Card>
    );
}
