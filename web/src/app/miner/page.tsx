'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress'; // Need to create this or mock
import { Activity, Pickaxe, Coins, Server } from 'lucide-react';

export default function MinerPage() {
    return (
        <DashboardLayout>
            <div className="p-8 space-y-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Server className="h-8 w-8 text-green-500" />
                    Miner Monitor
                </h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-gray-900/50 border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Total Hashrate</CardTitle>
                            <Activity className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">45.2 MH/s</div>
                            <p className="text-xs text-green-500">+2.5% from last hour</p>
                        </CardContent>
                    </Card>
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
                     <Card className="bg-gray-900/50 border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Worker Status</CardTitle>
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">Active</div>
                            <p className="text-xs text-gray-500">3 Workers Online</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Graph Placeholder */}
                <Card className="bg-gray-900/50 border-gray-800 h-96 flex items-center justify-center">
                    <div className="text-center text-gray-600">
                        <Activity className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p>Hashrate Graph Visualization Placeholder</p>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
