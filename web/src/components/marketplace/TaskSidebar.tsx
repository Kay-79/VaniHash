import { Input } from "@/components/ui/Input";
import { Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function TaskSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // State for inputs
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [minReward, setMinReward] = useState(searchParams.get('minReward') || '');
    const [maxReward, setMaxReward] = useState(searchParams.get('maxReward') || '');

    // Status
    const status = searchParams.get('status') || '';

    // Update URL helper
    const updateUrl = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(key, value);
        else params.delete(key);
        router.push(`${pathname}?${params.toString()}`);
    };

    // Debounce Search & Reward updates
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (searchParams.get('search') || '')) updateUrl('search', search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (minReward !== (searchParams.get('minReward') || '')) updateUrl('minReward', minReward);
            if (maxReward !== (searchParams.get('maxReward') || '')) updateUrl('maxReward', maxReward);
        }, 500);
        return () => clearTimeout(timer);
    }, [minReward, maxReward]);

    return (
        <div className="w-72 border-r border-gray-800 h-[calc(100vh-80px)] overflow-y-auto bg-black/20 hidden md:block">
            <div className="p-4 space-y-6">

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search ID, Type or Pattern..."
                        className="pl-9 bg-gray-900/50 border-gray-800 focus:border-blue-500 focus:ring-blue-500/20"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Reward Filter */}

                {/* Reward Filter */}
                <div>
                    <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3 tracking-wider">Reward (SUI)</h3>
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Min"
                            className="bg-gray-900/50 border-gray-800"
                            type="number"
                            value={minReward}
                            onChange={(e) => setMinReward(e.target.value)}
                        />
                        <span className="text-gray-600">-</span>
                        <Input
                            placeholder="Max"
                            className="bg-gray-900/50 border-gray-800"
                            type="number"
                            value={maxReward}
                            onChange={(e) => setMaxReward(e.target.value)}
                        />
                    </div>
                </div>

                {/* Task Type / Difficulty attributes could go here */}
                {/* Attributes: Item Type */}
                <div>
                    <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3 tracking-wider mt-6">Item Type</h3>
                    <div className="space-y-1">
                        {['GasObject', 'Package', 'NFT'].map((type) => {
                            const isSelected = searchParams.get('itemType') === type;
                            return (
                                <div
                                    key={type}
                                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer text-sm transition-colors ${isSelected
                                        ? 'bg-blue-500/10 text-blue-500'
                                        : 'hover:bg-gray-800/30 text-gray-400'
                                        }`}
                                    onClick={() => updateUrl('itemType', isSelected ? null : type)}
                                >
                                    <span>{type}</span>
                                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
