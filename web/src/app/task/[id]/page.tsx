'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'; // Should create or use skeleton
import { Task, TaskStatus, PatternType } from '@/types';
import { mistToSui } from '@/utils/formatters';
import { ShieldCheck, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { SubmitProofDialog } from '@/components/marketplace/SubmitProofDialog';

export default function TaskDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        const fetchTask = async () => {
            try {
                const res = await fetch(`/api/tasks/${id}`);
                if (!res.ok) throw new Error('Task not found');
                const data = await res.json();
                setTask(data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };
        fetchTask();
    }, [id]);

    if (loading) return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
            </DashboardLayout>
    );

    if (error || !task) return (
        <DashboardLayout>
            <div className="p-8 text-center text-red-400">Error: {error || 'Task not found'}</div>
        </DashboardLayout>
    );

    const isPending = task.status === TaskStatus.PENDING || String(task.status) === 'PENDING';
    const isActive = task.status === TaskStatus.ACTIVE || String(task.status) === 'ACTIVE';
    const isCompleted = task.status === TaskStatus.COMPLETED || String(task.status) === 'COMPLETED';

    return (
        <DashboardLayout activityMode="tasks">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">Task Details</h1>
                    <Badge variant="outline" className="text-sm">
                        ID: {task.task_id.slice(0, 6)}...{task.task_id.slice(-4)}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <Card className="md:col-span-2 bg-gray-900/50 border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-gray-400 text-sm uppercase tracking-wider">Target Pattern</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-8 bg-black/40 rounded-lg border border-gray-800 text-center">
                                <span className="text-4xl font-mono font-bold text-white break-all">
                                    {task.pattern}
                                </span>
                                <p className="mt-2 text-sm text-gray-500">
                                    Type: {task.pattern_type}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-gray-800/20 border border-gray-800">
                                    <h3 className="text-sm text-gray-400 mb-1">Reward</h3>
                                    <p className="text-2xl font-bold text-yellow-500">
                                        {mistToSui(task.reward_amount)} SUI
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-800/20 border border-gray-800">
                                    <h3 className="text-sm text-gray-400 mb-1">Status</h3>
                                    <div className="flex items-center gap-2">
                                        {isCompleted ? <CheckCircle2 className="text-green-500" /> : <Clock className="text-blue-500" />}
                                        <span className={`text-lg font-bold ${isCompleted ? 'text-green-500' : 'text-blue-500'}`}>
                                            {String(task.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Meta Info */}
                    <div className="space-y-6">
                        <Card className="bg-gray-900/50 border-gray-800">
                            <CardHeader>
                                <CardTitle className="text-white">Action</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(isPending || isActive) ? (
                                    <SubmitProofDialog taskId={task.task_id} />
                                ) : (
                                    <div className="p-4 bg-gray-800/50 rounded text-center text-gray-400">
                                        Task is not active
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="bg-gray-900/50 border-gray-800">
                            <CardContent className="pt-6 space-y-4">
                                <div>
                                    <span className="text-xs text-gray-500 uppercase">Creator</span>
                                    <p className="text-sm text-blue-400 truncate font-mono">{task.creator}</p>
                                </div>
                                {task.completer && (
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Completer</span>
                                        <p className="text-sm text-green-400 truncate font-mono">{task.completer}</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-xs text-gray-500 uppercase">Created</span>
                                    <p className="text-sm text-gray-300">
                                        {new Date(Number(task.created_at)).toLocaleDateString()}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
