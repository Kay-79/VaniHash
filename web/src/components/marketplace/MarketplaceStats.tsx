import { Coins, BarChart3, Tag, TrendingUp, Layers } from "lucide-react";
import { useEffect, useState } from "react";

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

export function MarketplaceStats() {
    const [stats, setStats] = useState({
        floorPrice: '0',
        topBid: '0',
        volume24h: '0',
        avgSale: '0',
        listedCount: 0,
        volumeChange: 0,
        listedChange: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/stats/market');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch market stats:", error);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const formatSui = (mist: string) => {
        if (!mist || mist === '0') return '0 SUI';
        const val = parseInt(mist) / 1000000000;
        // Check if value is small
        if (val > 0 && val < 0.01) return '< 0.01 SUI';
        // Check if value is large
        if (val > 1000) return (val / 1000).toFixed(1) + 'k SUI';
        return val.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' SUI';
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 p-4 bg-gray-900/40 border-b border-gray-800 backdrop-blur-sm">
            <Stat
                label="Floor Price"
                value={formatSui(stats.floorPrice)}
                icon={<Coins className="w-3.5 h-3.5" />}
                trend="neutral"
            />
            <Stat
                label="Top Bid"
                value={stats.topBid === '0' ? '-' : formatSui(stats.topBid)}
                icon={<TrendingUp className="w-3.5 h-3.5" />}
            />
            <Stat
                label="1D Volume"
                value={formatSui(stats.volume24h)}
                subValue={stats.volumeChange > 0 ? `+${stats.volumeChange}%` : `${stats.volumeChange}%`}
                icon={<BarChart3 className="w-3.5 h-3.5" />}
                trend={stats.volumeChange > 0 ? 'up' : stats.volumeChange < 0 ? 'down' : 'neutral'}
            />
            <Stat
                label="Avg Sale"
                value={formatSui(stats.avgSale)}
                icon={<TrendingUp className="w-3.5 h-3.5" />}
            />
            <Stat
                label="Listed"
                value={stats.listedCount.toString()}
                subValue={stats.listedChange > 0 ? `+${stats.listedChange}%` : `${stats.listedChange}%`}
                icon={<Tag className="w-3.5 h-3.5" />}
            />
        </div>
    );
}
