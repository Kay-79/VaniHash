'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Trophy, Medal, Zap, Diamond, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

// Mock Data
const MINERS = [
    { rank: 1, address: '0x123...456', hashrate: '1.2 GH/s', totalMined: 450, rewards: '5,200 SUI' },
    { rank: 2, address: '0xabc...def', hashrate: '850 MH/s', totalMined: 320, rewards: '3,800 SUI' },
    { rank: 3, address: '0x789...012', hashrate: '600 MH/s', totalMined: 210, rewards: '2,100 SUI' },
];

const TRADERS = [
    { rank: 1, address: '0xtrd...001', volume: '45,000 SUI', itemsBought: 120, itemsSold: 85 },
    { rank: 2, address: '0xtrd...002', volume: '32,500 SUI', itemsBought: 80, itemsSold: 60 },
    { rank: 3, address: '0xtrd...003', volume: '18,200 SUI', itemsBought: 45, itemsSold: 30 },
];

const CREATORS = [
    { rank: 1, address: '0xcrt...999', tasksCreated: 50, sUISpent: '12,000 SUI' },
    { rank: 2, address: '0xcrt...888', tasksCreated: 35, sUISpent: '8,500 SUI' },
    { rank: 3, address: '0xcrt...777', tasksCreated: 20, sUISpent: '4,000 SUI' },
];

export default function LeaderboardPage() {
    const [activeTab, setActiveTab] = useState<'miners' | 'traders' | 'creators'>('miners');

    return (
        <DashboardLayout showSidebar={false} showActivity={false}>
            <div className="container mx-auto py-10 px-4 max-w-5xl">
                <div className="flex flex-col items-center mb-12">
                    <h1 className="text-4xl font-extrabold text-white mb-4 flex items-center gap-3">
                        <Trophy className="h-10 w-10 text-yellow-500" />
                        Leaderboard
                    </h1>
                    <p className="text-gray-400 text-center max-w-xl">
                        Top performers across the VaniHash ecosystem. Rankings update every epoch.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-10">
                    <div className="bg-gray-900/80 p-1.5 rounded-xl border border-gray-800 flex gap-2">
                        <Button 
                            variant={activeTab === 'miners' ? 'secondary' : 'ghost'}
                            onClick={() => setActiveTab('miners')}
                            className={activeTab === 'miners' ? 'bg-gray-800 text-yellow-500' : 'text-gray-400'}
                        >
                            <Zap className="mr-2 h-4 w-4" /> Top Miners
                        </Button>
                        <Button 
                            variant={activeTab === 'traders' ? 'secondary' : 'ghost'}
                            onClick={() => setActiveTab('traders')}
                            className={activeTab === 'traders' ? 'bg-gray-800 text-blue-500' : 'text-gray-400'}
                        >
                            <DollarSign className="mr-2 h-4 w-4" /> Top Traders
                        </Button>
                        <Button 
                            variant={activeTab === 'creators' ? 'secondary' : 'ghost'}
                            onClick={() => setActiveTab('creators')}
                            className={activeTab === 'creators' ? 'bg-gray-800 text-purple-500' : 'text-gray-400'}
                        >
                            <Diamond className="mr-2 h-4 w-4" /> Top Creators
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <Card className="bg-black/40 border-gray-800 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-xl text-white">
                            {activeTab === 'miners' && "Hashrate Champions"}
                            {activeTab === 'traders' && "Volume Leaders"}
                            {activeTab === 'creators' && "Top Spenders"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-800 text-xs uppercase text-gray-500">
                                        <th className="px-6 py-4 font-semibold">Rank</th>
                                        <th className="px-6 py-4 font-semibold">Address</th>
                                        {activeTab === 'miners' && (
                                            <>
                                                <th className="px-6 py-4 font-semibold">Hashrate</th>
                                                <th className="px-6 py-4 font-semibold">Mined</th>
                                                <th className="px-6 py-4 font-semibold text-right">Rewards</th>
                                            </>
                                        )}
                                        {activeTab === 'traders' && (
                                            <>
                                                <th className="px-6 py-4 font-semibold">Volume</th>
                                                <th className="px-6 py-4 font-semibold">Bought</th>
                                                <th className="px-6 py-4 font-semibold text-right">Sold</th>
                                            </>
                                        )}
                                        {activeTab === 'creators' && (
                                            <>
                                                <th className="px-6 py-4 font-semibold">Tasks Created</th>
                                                <th className="px-6 py-4 font-semibold text-right">SUI Spent</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {(activeTab === 'miners' ? MINERS : activeTab === 'traders' ? TRADERS : CREATORS).map((item: any) => (
                                        <tr key={item.rank} className="group hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                {item.rank === 1 ? (
                                                    <Medal className="h-6 w-6 text-yellow-500" />
                                                ) : item.rank === 2 ? (
                                                    <Medal className="h-6 w-6 text-gray-400" />
                                                ) : item.rank === 3 ? (
                                                    <Medal className="h-6 w-6 text-amber-700" />
                                                ) : (
                                                    <span className="text-gray-500 font-mono text-lg">#{item.rank}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-full bg-gradient-to-tr ${
                                                        item.rank === 1 ? 'from-yellow-500 to-orange-500' : 'from-gray-700 to-gray-600'
                                                    }`} />
                                                    <span className="font-mono text-gray-300 group-hover:text-white transition-colors">
                                                        {item.address}
                                                    </span>
                                                    {item.rank <= 3 && (
                                                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20 py-0 text-[10px]">
                                                            PRO
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            {activeTab === 'miners' && (
                                                <>
                                                    <td className="px-6 py-4 text-white font-medium">{item.hashrate}</td>
                                                    <td className="px-6 py-4 text-gray-400">{item.totalMined}</td>
                                                    <td className="px-6 py-4 text-right text-green-400 font-bold">{item.rewards}</td>
                                                </>
                                            )}
                                            {activeTab === 'traders' && (
                                                <>
                                                    <td className="px-6 py-4 text-white font-medium">{item.volume}</td>
                                                    <td className="px-6 py-4 text-gray-400">{item.itemsBought}</td>
                                                    <td className="px-6 py-4 text-right text-gray-400">{item.itemsSold}</td>
                                                </>
                                            )}
                                            {activeTab === 'creators' && (
                                                <>
                                                    <td className="px-6 py-4 text-white font-medium">{item.tasksCreated}</td>
                                                    <td className="px-6 py-4 text-right text-purple-400 font-bold">{item.sUISpent}</td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
