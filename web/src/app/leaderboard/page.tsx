'use client';


import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Trophy, Medal, Zap, Diamond, DollarSign, Coins, Pickaxe, Crown } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';



// ... (imports remain same)
import { useEffect, useState } from 'react';
// ...

export default function LeaderboardPage() {
    const [activeTab, setActiveTab] = useState<'miners' | 'traders' | 'creators'>('miners');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/stats/leaderboard?type=${activeTab}&limit=10`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error("Failed to fetch leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeTab]);

    const formatSui = (mist: string) => {
        if (!mist) return '0 SUI';
        const val = parseInt(mist) / 1000000000;
        return val.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' SUI';
    };

    return (
        <DashboardLayout showSidebar={false} showActivity={false}>
            <div className="container mx-auto py-10 px-4 max-w-5xl">
                {/* ... Header & Tabs ... */}

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
                            <Diamond className="mr-2 h-4 w-4" /> Top Spenders
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <Card className="bg-black/40 border-gray-800 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-xl text-white">
                            {activeTab === 'miners' && "Mining Leaders"}
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
                                                <th className="px-6 py-4 font-semibold">Mined</th>
                                                <th className="px-6 py-4 font-semibold text-right">Rewards</th>
                                            </>
                                        )}
                                        {activeTab === 'traders' && (
                                            <>
                                                <th className="px-6 py-4 font-semibold">Volume</th>
                                                <th className="px-6 py-4 font-semibold">Bought</th>
                                            </>
                                        )}
                                        {activeTab === 'creators' && (
                                            <>
                                                <th className="px-6 py-4 font-semibold">Actions</th>
                                                <th className="px-6 py-4 font-semibold text-right">SUI Spent</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {loading ? (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading leaderboard...</td></tr>
                                    ) : data.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No data found</td></tr>
                                    ) : data.map((item: any, index: number) => (
                                        <tr key={item.address} className="group hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                {index + 1 === 1 ? (
                                                    <Medal className="h-6 w-6 text-yellow-500" />
                                                ) : index + 1 === 2 ? (
                                                    <Medal className="h-6 w-6 text-gray-400" />
                                                ) : index + 1 === 3 ? (
                                                    <Medal className="h-6 w-6 text-amber-700" />
                                                ) : (
                                                    <span className="text-gray-500 font-mono text-lg">#{index + 1}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white mr-3">
                                                        {index + 1}
                                                    </div>
                                                    <Link href={`/address/${item.address}`} className="text-blue-400 hover:text-blue-300 transition-colors font-mono">
                                                        {item.address.slice(0, 6)}...{item.address.slice(-4)}
                                                    </Link>
                                                </div>
                                            </td>
                                            {activeTab === 'miners' && (
                                                <>
                                                    <td className="px-6 py-4 text-gray-400">{Number(item.totalMined)}</td>
                                                    <td className="px-6 py-4 text-right text-green-400 font-bold">{formatSui(item.totalRewards)}</td>
                                                </>
                                            )}
                                            {activeTab === 'traders' && (
                                                <>
                                                    <td className="px-6 py-4 text-white font-medium">{formatSui(item.volume)}</td>
                                                    <td className="px-6 py-4 text-gray-400">{Number(item.itemsBought)}</td>
                                                </>
                                            )}
                                            {activeTab === 'creators' && (
                                                <>
                                                    <td className="px-6 py-4 text-white font-medium">{Number(item.tasksCreated)}</td>
                                                    <td className="px-6 py-4 text-right text-purple-400 font-bold">{formatSui(item.sUISpent)}</td>
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
