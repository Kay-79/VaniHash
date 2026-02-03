import { Activity, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from 'next/link';

interface ActivityFeedProps {
    mode?: 'market' | 'tasks';
}

interface ActivityItem {
    id: string;
    type: string;
    item: string;
    price: string;
    timestamp: number;
    address: string;
}

export function ActivityFeed({ mode = 'market' }: ActivityFeedProps) {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const res = await fetch(`/api/activity?mode=${mode}&limit=10`);
                if (res.ok) {
                    const data = await res.json();
                    setActivities(data);
                }
            } catch (error) {
                console.error("Failed to fetch activity:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, [mode]);

    const formatPrice = (mist: string) => {
        const val = parseInt(mist) / 1000000000;
        return val.toLocaleString(undefined, { maximumFractionDigits: 4 });
    };

    return (
        <div className="w-80 border-l border-gray-800 h-[calc(100vh-80px)] overflow-y-auto bg-black/20 hidden xl:block">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-black/40 backdrop-blur-sm z-10">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-400" />
                    {mode === 'market' ? 'Market Activity' : 'Task Updates'}
                </h3>
            </div>

            <div className="divide-y divide-gray-800/50">
                {activities.map((act, i) => (
                    <div key={i} className="p-4 hover:bg-white/5 transition-colors cursor-pointer group">
                        <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${act.type === 'SALE' || act.type === 'TASK_COMPLETED' ? 'bg-green-500/20 text-green-400' :
                                act.type === 'LIST' || act.type === 'TASK_CREATED' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-purple-500/20 text-purple-400'
                                }`}>
                                {act.type === 'SALE' ? 'SOLD' :
                                    act.type === 'LIST' ? 'LISTED' :
                                        act.type === 'TASK_CREATED' ? 'NEW TASK' :
                                            act.type === 'TASK_COMPLETED' ? 'COMPLETED' : 'WORKER'}
                            </span>
                            <span className="text-xs text-gray-500">
                                {act.timestamp ? formatDistanceToNow(act.timestamp) + ' ago' : 'Recently'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="h-10 w-10 rounded bg-gray-800 flex items-center justify-center text-xs text-gray-500">
                                {mode === 'market' ? 'IMG' : 'JOB'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <Link href={mode === 'market' ? `/listing/${act.item}` : `/task/${act.item}`} className="block truncate text-sm font-medium text-gray-300 group-hover:text-white transition-colors hover:underline">
                                    {act.item}
                                </Link>

                                {act.price && act.price !== '0' && (
                                    <p className="text-sm font-bold text-white">
                                        {formatPrice(act.price)} SUI
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {activities.length === 0 && !loading && (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        No activity yet
                    </div>
                )}
            </div>
        </div>
    );
}
