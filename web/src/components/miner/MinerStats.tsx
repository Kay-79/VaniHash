import { Pickaxe, Coins, Server } from 'lucide-react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';

// Reusing the same Stat component design for consistency
interface StatProps {
    label: string;
    value: string;
    subValue?: string;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
}

function Stat({ label, value, subValue, icon, trend }: StatProps) {
    return (
        <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1 uppercase tracking-wide font-semibold">
                {icon}
                {label}
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-100 font-mono">{value}</span>
                {subValue && (
                    <span className={`text-xs ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-500'}`}>
                        {subValue}
                    </span>
                )}
            </div>
        </div>
    );
}

export function MinerStats() {
    const account = useCurrentAccount();
    const [stats, setStats] = useState({
        totalMined: 0,
        totalRewards: '0'
    });

    useEffect(() => {
        if (!account?.address) return;

        const fetchStats = async () => {
            try {
                const res = await fetch(`/api/stats/miner?address=${account.address}`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch miner stats:", error);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [account?.address]);

    const formatSui = (mist: string) => {
        if (!mist || mist === '0') return '0 SUI';
        const val = parseInt(mist) / 1000000000;
        return val.toLocaleString(undefined, { maximumFractionDigits: 4 }) + ' SUI';
    };

    if (!account) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4 bg-gray-900/40 border-b border-gray-800 backdrop-blur-sm">
            <Stat
                label="Total Mined"
                value={`${stats.totalMined} Items`}
                icon={<Pickaxe className="w-3.5 h-3.5 text-yellow-500" />}
            />
            <Stat
                label="Total Rewards"
                value={formatSui(stats.totalRewards)}
                icon={<Coins className="w-3.5 h-3.5 text-purple-500" />}
            />
            <Stat
                label="Hashrate"
                value="-"
                subValue="Coming Soon"
                icon={<Server className="w-3.5 h-3.5 text-green-500" />}
            />
            <Stat
                label="Status"
                value="Active"
                trend="up"
                icon={<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
            />
        </div>
    );
}
