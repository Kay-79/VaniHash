'use client';

import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CreateTaskForm } from '@/components/marketplace/CreateTaskForm';

function CreateTaskContent() {
    return (
        <DashboardLayout activityMode="tasks" showActivity={false} showSidebar={false}>
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">Create New Task</h1>
                </div>
                <CreateTaskForm />
            </div>
        </DashboardLayout>
    );
}

export default function CreateTaskPage() {
    return (
        <Suspense fallback={
            <DashboardLayout activityMode="tasks" showSidebar={false}>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-gray-400">Loading form...</div>
                </div>
            </DashboardLayout>
        }>
            <CreateTaskContent />
        </Suspense>
    );
}
