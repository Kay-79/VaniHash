import { Badge } from "@/components/ui/Badge";

export function MarketplaceHeader() {
    return (
        <div className="flex items-center justify-between p-4 bg-black/40 border-b border-gray-800 backdrop-blur-md sticky top-0 z-10">
            {/* Stats Bar */}
            <div className="flex items-center gap-8 bg-gray-900/50 px-6 py-2 rounded-xl border border-gray-800 w-full justify-around">
                <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Floor Price</p>
                    <p className="text-lg font-bold text-white">45.5 SUI</p>
                </div>
                <div className="w-px h-8 bg-gray-800" />
                <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Top Bid</p>
                    <p className="text-lg font-bold text-blue-400">42.0 SUI</p>
                </div>
                <div className="w-px h-8 bg-gray-800" />
                <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase font-semibold">24h Volume</p>
                    <p className="text-lg font-bold text-white">1,205 SUI</p>
                </div>
                <div className="w-px h-8 bg-gray-800" />
                <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Listed</p>
                    <p className="text-lg font-bold text-white">142 (2.4%)</p>
                </div>
            </div>
        </div>
    );
}
