import { Activity } from "lucide-react";


interface ActivityFeedProps {
    mode?: 'market' | 'tasks';
}

export function ActivityFeed({ mode = 'market' }: ActivityFeedProps) {
    // Mock data for Market/Trading
    const marketActivities = [
        { type: 'SALE', item: '0xabc...123', price: '45.0', time: '2m ago' },
        { type: 'LIST', item: '0xdef...456', price: '60.5', time: '5m ago' },
        { type: 'LIST', item: '0x789...012', price: '120.0', time: '12m ago' },
        { type: 'SALE', item: '0x345...678', price: '32.1', time: '1h ago' },
    ];

    // Mock data for Tasks/Miner
    const taskActivities = [
        { type: 'TASK_CREATED', item: 'Task #1293', price: '150.0', time: '1m ago' },
        { type: 'WORKER_START', item: 'Worker #882', price: '-', time: '3m ago' },
        { type: 'TASK_COMPLETED', item: 'Task #1288', price: '200.0', time: '8m ago' },
        { type: 'WORKER_START', item: 'Worker #991', price: '-', time: '15m ago' },
    ];

    const activities = mode === 'market' ? marketActivities : taskActivities;

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
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                act.type === 'SALE' || act.type === 'TASK_COMPLETED' ? 'bg-green-500/20 text-green-400' : 
                                act.type === 'LIST' || act.type === 'TASK_CREATED' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-purple-500/20 text-purple-400'
                            }`}>
                                {act.type === 'SALE' ? 'SOLD' : 
                                 act.type === 'LIST' ? 'LISTED' :
                                 act.type === 'TASK_CREATED' ? 'NEW TASK' :
                                 act.type === 'TASK_COMPLETED' ? 'COMPLETED' : 'WORKER'}
                            </span>
                            <span className="text-xs text-gray-500">{act.time}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="h-10 w-10 rounded bg-gray-800 flex items-center justify-center text-xs text-gray-500">
                                {mode === 'market' ? 'IMG' : 'JOB'}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                                    {act.item}
                                </p>
                                {mode === 'market' && (
                                    <p className="text-sm font-bold text-white">
                                        {act.price} SUI
                                    </p>
                                )}
                                {mode === 'tasks' && act.price !== '-' && (
                                     <p className="text-sm font-bold text-white">
                                        {act.price} HASH
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
