'use client';

import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MinerStats } from '@/components/miner/MinerStats';

function MinerContent() {
    return (
        <DashboardLayout activityMode="tasks">
            <div className="p-6 space-y-6">
                <h1 className="text-2xl font-bold text-white mb-6">Miner Dashboard</h1>
                <MinerStats />
            </div>
        </DashboardLayout>
    );
}

export default function MinerPage() {
    return (
        <Suspense fallback={
            <DashboardLayout activityMode="tasks">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-gray-400">Loading dashboard...</div>
                </div>
            </DashboardLayout>
        }>
            <MinerContent />
        </Suspense>
    );
}
