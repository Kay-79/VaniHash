'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Task, TaskStatus } from '@/types';
import { mistToSui } from '@/utils/formatters';
import { AlertCircle } from 'lucide-react';
import { SubmitProofDialog } from '@/components/marketplace/SubmitProofDialog';
import { TaskStatusBadge } from '@/components/marketplace/TaskStatusBadge';
import { shouldBeActive, isInGracePeriod, formatTimeRemaining, getGracePeriodRemaining } from '@/utils/gracePeriod';
import { useCurrentAccount } from '@mysten/dapp-kit';

export default function TaskDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const account = useCurrentAccount();
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    useEffect(() => {
        if (!id) return;
        fetchTask();
    }, [id]);

    const handleGracePeriodExpire = () => {
        fetchTask();
    };

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
    const isActive = task.status === TaskStatus.ACTIVE || String(task.status) === 'ACTIVE' || shouldBeActive({ status: String(task.status), created_at: task.created_at || '' });
    const isCompleted = task.status === TaskStatus.COMPLETED || String(task.status) === 'COMPLETED';
    const inGracePeriod = isPending && task.created_at && isInGracePeriod(task.created_at);

    const isCreator = account?.address === task.creator;

    return (
        <DashboardLayout activityMode="tasks">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">Task Details</h1>
                    <Badge variant="outline" className="text-sm">
                        ID: {task.task_id.slice(0, 6)}...{task.task_id.slice(-4)}
                    </Badge>
                </div>

                {/* Grace Period Warning */}
                {inGracePeriod && task.created_at && (
                    <Card className="bg-yellow-900/20 border-yellow-500/30">
                        <CardContent className="p-4 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-semibold text-yellow-400">Grace Period Active</h3>
                                <p className="text-xs text-gray-300 mt-1">
                                    This task is in a {formatTimeRemaining(getGracePeriodRemaining(task.created_at))} grace period.
                                    The creator can still cancel it. It will become active automatically after the grace period expires.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

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
                                    {task.created_at && (
                                        <TaskStatusBadge
                                            status={String(task.status)}
                                            createdAt={task.created_at}
                                            onGracePeriodExpire={handleGracePeriodExpire}
                                        />
                                    )}
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
                                {isCreator ? (
                                    <div className="p-4 bg-yellow-900/20 rounded text-center border border-yellow-500/20">
                                        <h4 className="text-yellow-500 font-medium mb-1">You created this task</h4>
                                        <p className="text-xs text-gray-400">
                                            {inGracePeriod
                                                ? "You can cancel this task during the grace period."
                                                : "Waiting for miners to submit proof."}
                                        </p>
                                        {/* TODO: Add Cancel Button logic here if needed */}
                                    </div>
                                ) : isActive ? (
                                    <SubmitProofDialog taskId={task.task_id} onSuccess={fetchTask} />
                                ) : (
                                    <div className="p-4 bg-gray-800/50 rounded text-center text-gray-400">
                                        {inGracePeriod ? 'Waiting for grace period...' : 'Task is not active'}
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
                                        {task.created_at && new Date(Number(task.created_at)).toLocaleDateString()}
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
