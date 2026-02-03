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
                        placeholder="Search Task ID..."
                        className="pl-9 bg-gray-900/50 border-gray-800 focus:border-blue-500 focus:ring-blue-500/20"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Status Filter */}
                <div>
                    <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3 tracking-wider">Status</h3>
                    <div className="space-y-2">
                        {['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((s) => {
                            const currentStatuses = status ? status.split(',') : [];
                            const isSelected = currentStatuses.includes(s);

                            const handleToggle = () => {
                                // Single select logic: if selected, deselect; otherwise select only this one
                                updateUrl('status', isSelected ? null : s);
                            };

                            return (
                                <div
                                    key={s}
                                    className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${isSelected
                                        ? 'bg-blue-600/10 border-blue-500/30'
                                        : 'border-transparent hover:bg-gray-800/30'
                                        }`}
                                    onClick={handleToggle}
                                >
                                    <div className={`h-4 w-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-600'
                                        }`}>
                                        {isSelected && <div className="h-2 w-2 bg-white rounded-sm" />}
                                    </div>
                                    <span className={`text-sm font-medium ${isSelected ? 'text-blue-400' : 'text-gray-400'}`}>
                                        {s.charAt(0) + s.slice(1).toLowerCase()}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

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
                <div>
                    <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3 tracking-wider mt-6">Pattern Length</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {['4', '5', '6', '7', '8+'].map((len) => {
                            const isSelected = searchParams.get('length') === len;
                            return (
                                <div
                                    key={len}
                                    className={`flex items-center justify-center p-2 rounded-md cursor-pointer text-sm border transition-colors ${isSelected
                                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                        : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:border-gray-700'
                                        }`}
                                    onClick={() => updateUrl('length', isSelected ? null : len)}
                                >
                                    {len}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
