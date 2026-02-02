'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Clock } from 'lucide-react';
import { isInGracePeriod, getGracePeriodRemaining, formatTimeRemaining } from '@/utils/gracePeriod';

interface TaskStatusBadgeProps {
    status: string;
    createdAt: number | string;
    showCountdown?: boolean;
    onGracePeriodExpire?: () => void;
}

export function TaskStatusBadge({
    status,
    createdAt,
    showCountdown = true,
    onGracePeriodExpire
}: TaskStatusBadgeProps) {
    const [remaining, setRemaining] = useState(getGracePeriodRemaining(createdAt));
    // Force grace period check regardless of input status (unless Cancelled/Completed? Assuming Active/Pending are mostly affected)
    const inGracePeriod = isInGracePeriod(createdAt);

    useEffect(() => {
        if (!inGracePeriod) return;

        const interval = setInterval(() => {
            const newRemaining = getGracePeriodRemaining(createdAt);
            setRemaining(newRemaining);

            if (newRemaining === 0) {
                clearInterval(interval);
                if (onGracePeriodExpire) {
                    onGracePeriodExpire();
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [inGracePeriod, createdAt, onGracePeriodExpire]);

    // Display effective status: If in grace period -> PENDING.
    const effectiveStatus = inGracePeriod ? 'PENDING' : status;

    const getStatusColor = () => {
        switch (effectiveStatus) {
            case 'ACTIVE':
                return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'PENDING':
                return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'COMPLETED':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'CANCELLED':
                return 'bg-red-500/10 text-red-400 border-red-500/20';
            default:
                return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Badge variant="outline" className={getStatusColor()}>
                {effectiveStatus}
            </Badge>
            {inGracePeriod && showCountdown && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimeRemaining(remaining)}
                </span>
            )}
        </div>
    );
}
