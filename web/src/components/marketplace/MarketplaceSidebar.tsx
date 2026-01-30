import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Search } from "lucide-react";

export function MarketplaceSidebar() {
    return (
        <div className="w-72 border-r border-gray-800 h-[calc(100vh-80px)] overflow-y-auto bg-black/20 hidden md:block">
            <div className="p-4 space-y-6">
                
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                        placeholder="ID or Pattern..." 
                        className="pl-9 bg-gray-900/50 border-gray-800 focus:border-yellow-500 focus:ring-yellow-500/20" 
                    />
                </div>

                {/* Status Filter */}
                <div>
                    <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3 tracking-wider">Status</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 cursor-pointer">
                            <div className="h-2 w-2 rounded-full bg-yellow-500" />
                            <span className="text-sm font-medium text-yellow-500">Listed</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors">
                            <div className="h-2 w-2 rounded-full bg-gray-600" />
                            <span className="text-sm font-medium text-gray-400">Sold</span>
                        </div>
                    </div>
                </div>

                {/* Price Filter */}
                <div>
                    <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3 tracking-wider">Price (SUI)</h3>
                    <div className="flex items-center gap-2">
                        <Input placeholder="Min" className="bg-gray-900/50 border-gray-800" type="number" />
                        <span className="text-gray-600">-</span>
                        <Input placeholder="Max" className="bg-gray-900/50 border-gray-800" type="number" />
                    </div>
                </div>

                 {/* Attributes Placeholder */}
                 <div>
                    <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3 tracking-wider">Attributes</h3>
                    <div className="space-y-1">
                        {['Pattern Type', 'Length', 'Difficulty'].map((attr) => (
                            <div key={attr} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-800/30 cursor-pointer text-sm text-gray-400">
                                <span>{attr}</span>
                                <span className="text-gray-600">+</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
