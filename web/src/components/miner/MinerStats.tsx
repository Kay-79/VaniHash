import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Pickaxe, Coins, Server } from 'lucide-react';

export function MinerStats() {
    return (
        <div className="space-y-6 mb-8">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Server className="h-6 w-6 text-green-500" />
                Miner Monitor
            </h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total Mined</CardTitle>
                        <Pickaxe className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">128 Items</div>
                        <p className="text-xs text-gray-500">Lifetime total</p>
                    </CardContent>
                </Card>
                <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">SUI Earned</CardTitle>
                        <Coins className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">1,240.5</div>
                        <p className="text-xs text-green-500">~ $2,000 USD</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
