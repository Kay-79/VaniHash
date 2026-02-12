import { Activity, Hammer } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from 'next/link';
import { getTaskIcon, getTaskLabel } from '@/utils/taskType';
import { SubmitProofDialog } from './SubmitProofDialog';
import { Button } from "@/components/ui/Button";
import { ListingImage } from "./ListingImage";
import { isInGracePeriod } from '@/utils/gracePeriod';

interface ActivityFeedProps {
    mode?: 'market' | 'tasks';
}

interface ActivityItem {
    id: string;
    type: string;
    item: string;
    price: string;
    image_url?: string;
    timestamp: number;
    address: string;
    task_type?: number; // 0 = Object, 1 = Package
    target_type?: string;
    listing_type?: string; // The actual object type for market listings
    listingId?: string; // Added for linking
    prefix?: string;
    suffix?: string;
    contains?: string;
}

export function ActivityFeed({ mode = 'market' }: ActivityFeedProps) {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        setActivities([]); // Clear previous activities to avoid showing wrong data during transition
        setLoading(true); // Ensure loading state is active
        fetchActivity();
    }, [mode]);

    const formatPrice = (mist: string) => {
        const val = parseInt(mist) / 1000000000;
        return val.toLocaleString(undefined, { maximumFractionDigits: 4 });
    };

    const renderPattern = (act: ActivityItem) => {
        let display = '';
        if (act.prefix) display += `0x${act.prefix}`;
        else display += `0x`;

        if (act.contains) display += `...${act.contains}`;
        else if (!act.prefix && !act.suffix) display += `...`;
        else if (act.prefix && act.suffix) display += `...`

        if (act.suffix) display += act.contains ? `...${act.suffix}` : `...${act.suffix}`;

        return display;
    };

    return (
        <div className="w-80 border-l border-gray-800 h-full overflow-y-auto bg-black/20 hidden xl:block scrollbar-hide">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-black/40 backdrop-blur-sm z-10">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-400" />
                    {mode === 'market' ? 'Market Activity' : 'Task Updates'}
                </h3>
            </div>

            <div className="divide-y divide-gray-800/50">
                {activities.map((act, i) => {
                    const isTask = mode === 'tasks';
                    const isTaskActive = isTask && act.type === 'TASK_CREATED';

                    return (
                        <div key={i} className="p-4 hover:bg-white/5 transition-colors cursor-pointer group relative">
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${act.type === 'SALE' || act.type === 'TASK_COMPLETED' ? 'bg-green-500/20 text-green-400' :
                                    act.type === 'LIST' || act.type === 'TASK_CREATED' ? 'bg-blue-500/20 text-blue-400' :
                                        act.type === 'DELIST' ? 'bg-red-500/20 text-red-400' :
                                            'bg-purple-500/20 text-purple-400'
                                    }`}>
                                    {act.type === 'SALE' ? 'SOLD' :
                                        act.type === 'LIST' ? 'LISTED' :
                                            act.type === 'DELIST' ? 'DELISTED' :
                                                act.type === 'TASK_CREATED' ? 'NEW TASK' :
                                                    act.type === 'TASK_COMPLETED' ? 'COMPLETED' : 'WORKER'}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {act.timestamp ? formatDistanceToNow(act.timestamp) + ' ago' : 'Recently'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                                <div className="h-10 w-10 rounded bg-gray-800 flex items-center justify-center text-xs text-gray-500 overflow-hidden border border-gray-700 shrink-0">
                                    {mode === 'tasks' ? (
                                        getTaskIcon({ taskType: act.task_type, targetType: act.target_type, className: "w-5 h-5" })
                                    ) : (
                                        <ListingImage
                                            listing={{
                                                image_url: act.image_url,
                                                type: act.listing_type || act.target_type || '',
                                                item_id: act.item
                                            }}
                                            variant="table"
                                        />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    {isTask ? (
                                        <div className="flex flex-col gap-0.5">
                                            <Link href={`/task/${act.item}`} className="block text-sm font-mono font-bold text-white group-hover:text-blue-400 transition-colors break-all whitespace-normal">
                                                {renderPattern(act) || 'Pattern'}
                                            </Link>
                                            <span className="text-[10px] text-gray-400 truncate">
                                                {getTaskLabel(act.task_type, act.target_type)}
                                            </span>
                                        </div>
                                    ) : (
                                        <Link href={mode === 'market' ? `/item/${act.listingId || act.item}` : `/task/${act.item}`} className="block text-sm font-medium text-gray-300 group-hover:text-white transition-colors hover:underline break-all whitespace-normal">
                                            {act.item}
                                        </Link>
                                    )}

                                    <div className="flex items-center justify-between gap-2 mt-1">
                                        {act.price && act.price !== '0' && (
                                            <p className="text-xs font-bold text-gray-300">
                                                {formatPrice(act.price)} SUI
                                            </p>
                                        )}

                                        {isTaskActive && !isInGracePeriod(act.timestamp) && (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <SubmitProofDialog
                                                    taskId={act.item}
                                                    taskType={act.task_type || 0}
                                                    targetType={act.target_type || ''}
                                                    isActive={true}
                                                    onSuccess={fetchActivity}
                                                >
                                                    <Button variant="ghost" size="sm" className="h-5 px-2 text-[10px] bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:text-green-300 border border-green-500/20">
                                                        <Hammer className="w-3 h-3 mr-1" />
                                                        Submit
                                                    </Button>
                                                </SubmitProofDialog>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {activities.length === 0 && !loading && (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        No activity yet
                    </div>
                )}
            </div>
        </div>
    );
}
