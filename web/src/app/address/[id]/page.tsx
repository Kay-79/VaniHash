'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { User, Activity, CheckCircle2, Box } from 'lucide-react';

interface AddressStats {
    address: string;
    totalCreated: number;
    totalMined: number;
    recentListings: any[];
}

export default function AddressDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [stats, setStats] = useState<AddressStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchStats = async () => {
            try {
                const res = await fetch(`/api/address/${id}`);
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setStats(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [id]);

    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        </DashboardLayout>
    );

    if (!stats) return (
        <DashboardLayout>
             <div className="p-8 text-center text-red-400">Address not found</div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout activityMode="tasks">
            <div className="max-w-6xl mx-auto p-6 space-y-6">
                 {/* Header */}
                 <div className="flex items-center gap-4 bg-gray-900/50 p-6 rounded-xl border border-gray-800">
                    <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">Account</h1>
                        <p className="font-mono text-gray-400">{id}</p>
                    </div>
                 </div>

                 {/* Stats */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gray-900/50 border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Total Created</CardTitle>
                            <Box className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.totalCreated}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gray-900/50 border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Total Mined</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.totalMined}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gray-900/50 border-gray-800">
                         <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Active Listings</CardTitle>
                            <Activity className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.recentListings.length}</div>
                        </CardContent>
                    </Card>
                 </div>

                 {/* Tabs Placeholder for more history */}
                 <Card className="bg-gray-900/50 border-gray-800 min-h-[300px]">
                    <CardContent className="p-6 text-center text-gray-500">
                        <p>Detailed activity history coming soon...</p>
                    </CardContent>
                 </Card>
            </div>
        </DashboardLayout>
    );
}
