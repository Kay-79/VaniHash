import { Coins, BarChart3, Tag, TrendingUp, Layers } from "lucide-react";

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
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 p-4 bg-gray-900/40 border-b border-gray-800 backdrop-blur-sm">
            <Stat 
                label="Floor Price" 
                value="10 SUI" 
                icon={<Coins className="w-3.5 h-3.5" />}
                trend="neutral"
            />
             <Stat 
                label="Top Bid" 
                value="8.5 SUI" 
                icon={<TrendingUp className="w-3.5 h-3.5" />}
            />
            <Stat 
                label="1D Volume" 
                value="1.2k SUI" 
                subValue="+12%"
                icon={<BarChart3 className="w-3.5 h-3.5" />}
                trend="up"
            />
             <Stat 
                label="Avg Sale" 
                value="12.5 SUI" 
                icon={<TrendingUp className="w-3.5 h-3.5" />}
            />
            <Stat 
                label="Listed" 
                value="142" 
                subValue="2.4%"
                icon={<Tag className="w-3.5 h-3.5" />}
            />
        </div>
    );
}
