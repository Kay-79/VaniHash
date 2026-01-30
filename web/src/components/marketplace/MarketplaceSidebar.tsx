import { Input } from "@/components/ui/Input";
import { Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function MarketplaceSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // State for inputs
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
    
    // Status
    const status = searchParams.get('status') || 'ACTIVE';

    // Update URL helper
    const updateUrl = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(key, value);
        else params.delete(key);
        router.push(`${pathname}?${params.toString()}`);
    };

    // Debounce Search & Price updates
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (searchParams.get('search') || '')) updateUrl('search', search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (minPrice !== (searchParams.get('minPrice') || '')) updateUrl('minPrice', minPrice);
            if (maxPrice !== (searchParams.get('maxPrice') || '')) updateUrl('maxPrice', maxPrice);
        }, 500);
        return () => clearTimeout(timer);
    }, [minPrice, maxPrice]);

    return (
        <div className="w-72 border-r border-gray-800 h-[calc(100vh-80px)] overflow-y-auto bg-black/20 hidden md:block">
            <div className="p-4 space-y-6">
                
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                        placeholder="ID or Pattern..." 
                        className="pl-9 bg-gray-900/50 border-gray-800 focus:border-yellow-500 focus:ring-yellow-500/20" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Status Filter */}
                <div>
                    <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3 tracking-wider">Status</h3>
                    <div className="space-y-2">
                        <div 
                            onClick={() => updateUrl('status', 'ACTIVE')}
                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                                status === 'ACTIVE' 
                                ? 'bg-yellow-500/10 border-yellow-500/20' 
                                : 'border-transparent hover:bg-gray-800/50'
                            }`}
                        >
                            <div className={`h-2 w-2 rounded-full ${status === 'ACTIVE' ? 'bg-yellow-500' : 'bg-gray-600'}`} />
                            <span className={`text-sm font-medium ${status === 'ACTIVE' ? 'text-yellow-500' : 'text-gray-400'}`}>Listed</span>
                        </div>
                        <div 
                             onClick={() => updateUrl('status', 'SOLD')}
                             className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                                status === 'SOLD' 
                                ? 'bg-green-500/10 border-green-500/20' 
                                : 'border-transparent hover:bg-gray-800/50'
                            }`}
                        >
                            <div className={`h-2 w-2 rounded-full ${status === 'SOLD' ? 'bg-green-500' : 'bg-gray-600'}`} />
                            <span className={`text-sm font-medium ${status === 'SOLD' ? 'text-green-500' : 'text-gray-400'}`}>Sold</span>
                        </div>
                    </div>
                </div>

                {/* Price Filter */}
                <div>
                    <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3 tracking-wider">Price (SUI)</h3>
                    <div className="flex items-center gap-2">
                        <Input 
                            placeholder="Min" 
                            className="bg-gray-900/50 border-gray-800" 
                            type="number" 
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                        />
                        <span className="text-gray-600">-</span>
                        <Input 
                            placeholder="Max" 
                            className="bg-gray-900/50 border-gray-800" 
                            type="number"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                        />
                    </div>
                </div>

                {/* Attributes: Item Type */}
                <div>
                    <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3 tracking-wider">Item Type</h3>
                   <div className="space-y-1">
                        {['GasObject', 'Package', 'NFT'].map((type) => {
                             const isSelected = searchParams.get('itemType') === type;
                             return (
                                <div 
                                    key={type} 
                                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer text-sm transition-colors ${
                                        isSelected ? 'bg-yellow-500/10 text-yellow-500' : 'hover:bg-gray-800/30 text-gray-400'
                                    }`}
                                    onClick={() => updateUrl('itemType', isSelected ? null : type)}
                                >
                                    <span>{type}</span>
                                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />}
                                </div>
                            );
                        })}
                    </div>
                </div>

                 {/* Attributes: Pattern Length */}
                 <div>
                    <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3 tracking-wider mt-6">Pattern Length</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {['4', '5', '6', '7', '8+'].map((len) => {
                             const isSelected = searchParams.get('length') === len;
                             return (
                                <div 
                                    key={len} 
                                    className={`flex items-center justify-center p-2 rounded-md cursor-pointer text-sm border transition-colors ${
                                        isSelected 
                                        ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' 
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
