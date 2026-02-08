'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Task, TaskStatus } from '@/types';
import { mistToSui, formatStruct, shortenAddress } from '@/utils/formatters';
import { AlertCircle, Copy, Cpu, Clock, ShieldCheck, User, Calendar, Coins, Hash, Box, Package, Download } from 'lucide-react';
import { SubmitProofDialog } from '@/components/marketplace/SubmitProofDialog';
import { TaskStatusBadge } from '@/components/marketplace/TaskStatusBadge';
import { shouldBeActive, isInGracePeriod, formatTimeRemaining, getGracePeriodRemaining } from '@/utils/gracePeriod';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useCancelTask } from '@/hooks/useCancelTask';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { getTaskIcon, getTaskLabel } from '@/utils/taskType';
import { NETWORK } from '@/constants/chain';

export default function TaskDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const account = useCurrentAccount();
    const client = useSuiClient();
    const { cancelTask, isPending: isCancelling } = useCancelTask();
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
        <DashboardLayout activityMode="tasks">
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            </div>
        </DashboardLayout>
    );

    if (error || !task) return (
        <DashboardLayout activityMode="tasks">
            <div className="p-12 text-center">
                <div className="p-4 rounded-full bg-red-500/10 text-red-400 w-fit mx-auto mb-4">
                    <AlertCircle className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Task Not Found</h2>
                <p className="text-gray-400">The task you are looking for does not exist or has been removed.</p>
            </div>
        </DashboardLayout>
    );

    const inGracePeriod = task.created_at ? isInGracePeriod(task.created_at) : false;

    // Override status if in grace period, but respect final states
    const isCompleted = task.status === TaskStatus.COMPLETED || String(task.status) === 'COMPLETED';
    const isCancelled = task.status === TaskStatus.CANCELLED || String(task.status) === 'CANCELLED';

    const isPending = !isCompleted && !isCancelled && (task.status === TaskStatus.PENDING || String(task.status) === 'PENDING' || inGracePeriod);
    const isActive = !isCompleted && !isCancelled && !inGracePeriod && (task.status === TaskStatus.ACTIVE || String(task.status) === 'ACTIVE' || shouldBeActive({ status: String(task.status), created_at: task.created_at || '' }));

    const isCreator = account?.address === task.creator;

    const handleCancel = () => {
        if (!task || !task.task_id) return;
        cancelTask(
            task.task_id,
            () => {
                toast.success("Task cancelled successfully");
                handleGracePeriodExpire(); // Refresh task data
            },
            (err) => toast.error("Failed to cancel: " + err.message)
        );
    };

    return (
        <DashboardLayout activityMode="tasks">
            <div className="max-w-5xl mx-auto p-6 space-y-8">

                {/* Header Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 p-8 shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Cpu className="h-64 w-64 text-cyan-500" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-3 py-1">
                                    Mining Task
                                </Badge>
                                <span className="text-gray-500 text-sm font-mono flex items-center gap-1">
                                    ID: {shortenAddress(task.task_id)}
                                    <Copy
                                        className="h-3 w-3 cursor-pointer hover:text-white transition-colors"
                                        onClick={() => {
                                            navigator.clipboard.writeText(task.task_id);
                                            toast.success("Task ID copied");
                                        }}
                                    />
                                </span>
                            </div>
                            <h1 className="text-4xl font-bold text-white tracking-tight mb-4">
                                Vanity <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Hash</span>
                            </h1>
                            <div className="flex items-center gap-4">
                                {task.created_at && (
                                    <TaskStatusBadge
                                        status={String(task.status)}
                                        createdAt={task.created_at}
                                        onGracePeriodExpire={handleGracePeriodExpire}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl p-4 border border-gray-800 flex items-center gap-4 min-w-[200px]">
                            <div className="p-3 rounded-full bg-yellow-500/10 text-yellow-500">
                                <Coins className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Reward</p>
                                <p className="text-3xl font-bold text-white tabular-nums">
                                    {mistToSui(task.reward_amount)} <span className="text-base font-normal text-gray-500">SUI</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grace Period Alert */}
                {inGracePeriod && task.created_at && (
                    <div className="rounded-xl border border-yellow-500/30 bg-yellow-900/10 p-4 flex items-start gap-4 animate-in slide-in-from-top-2">
                        <div className="p-2 rounded-full bg-yellow-500/20 text-yellow-500">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-yellow-400 font-semibold mb-1">Grace Period Active</h3>
                            <p className="text-sm text-gray-400">
                                This task is in a {formatTimeRemaining(getGracePeriodRemaining(task.created_at))} grace period.
                                It requires 3 confirmations (approx 3s) before becoming publicly mineable.
                                The creator can cancel it safely during this time.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content: Target Pattern */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="bg-black/30 border-gray-800 backdrop-blur-sm overflow-hidden h-full">
                            <CardHeader className="border-b border-gray-800/50 bg-gray-900/20">
                                <div className="flex items-center gap-2">
                                    <Hash className="h-5 w-5 text-purple-400" />
                                    <CardTitle>Target Pattern</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="p-8 bg-gray-950 rounded-2xl border border-gray-800 shadow-inner relative group">
                                    <div className="absolute top-4 right-4 text-xs font-mono text-gray-700">HEX PATTERN</div>
                                    <div className="flex flex-col gap-4 items-center justify-center min-h-[120px]">
                                        {task.prefix && (
                                            <div className="text-center">
                                                <span className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">Starts With</span>
                                                <span className="text-xl md:text-2xl font-mono font-bold text-white tracking-wider break-all drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                                    0x<span className="text-cyan-400">{task.prefix}</span>...
                                                </span>
                                            </div>
                                        )}
                                        {task.contains && (
                                            <div className="text-center">
                                                <span className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">Contains</span>
                                                <span className="text-xl md:text-2xl font-mono font-bold text-white tracking-wider break-all">
                                                    ...<span className="text-purple-400">{task.contains}</span>...
                                                </span>
                                            </div>
                                        )}
                                        {task.suffix && (
                                            <div className="text-center">
                                                <span className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">Ends With</span>
                                                <span className="text-xl md:text-2xl font-mono font-bold text-white tracking-wider break-all drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                                    ...<span className="text-cyan-400">{task.suffix}</span>
                                                </span>
                                            </div>
                                        )}

                                        {!task.prefix && !task.contains && !task.suffix && task.pattern && (
                                            <span className="text-xl md:text-2xl font-mono font-bold text-white break-all">
                                                {task.pattern}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 p-4 rounded-xl bg-gray-900/40 border border-gray-800 flex items-center gap-3">
                                        <div className="h-10 w-10 flex items-center justify-center">
                                            {getTaskIcon({ taskType: task.task_type, targetType: task.target_type, className: "w-6 h-6" })}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-xs text-gray-500 uppercase">
                                                {getTaskLabel(task.task_type, task.target_type)}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-mono text-gray-300 truncate">
                                                    {task.task_type === 1 ? 'Upgrade Cap' :
                                                        task.target_type ? formatStruct(task.target_type) : 'Standard Object'}
                                                </p>
                                                {(task.target_type || task.task_type === 1) && (
                                                    <Copy
                                                        className="h-3 w-3 text-gray-600 hover:text-white cursor-pointer flex-shrink-0"
                                                        onClick={() => {
                                                            const textToCopy = task.task_type === 1
                                                                ? '0x2::package::UpgradeCap'
                                                                : (task.target_type || "");
                                                            navigator.clipboard.writeText(textToCopy);
                                                            toast.success("Type copied");
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bytecode Download for Package Tasks */}
                                    {task.task_type === 1 && (
                                        <Button
                                            variant="secondary"
                                            className="flex-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 py-3"
                                            onClick={async () => {
                                                const toastId = toast.loading("Fetching bytecode from chain...");
                                                try {
                                                    // Fetch the object from chain to get the bytecode
                                                    const obj = await client.getObject({
                                                        id: task.task_id,
                                                        options: { showContent: true }
                                                    });

                                                    if (!obj.data || !obj.data.content || obj.data.content.dataType !== 'moveObject') {
                                                        throw new Error("Failed to fetch task object content");
                                                    }

                                                    const fields = obj.data.content.fields as any;
                                                    const bytecodeBytes = fields.bytecode; // vector<u8>

                                                    if (!bytecodeBytes || !Array.isArray(bytecodeBytes)) {
                                                        throw new Error("Bytecode field not found or invalid");
                                                    }

                                                    // Convert bytes to JSON string
                                                    const jsonString = new TextDecoder().decode(new Uint8Array(bytecodeBytes));

                                                    // Parse JSON: ["base64...", "base64..."]
                                                    let modules: string[] = [];
                                                    try {
                                                        const parsed = JSON.parse(jsonString);
                                                        if (Array.isArray(parsed)) {
                                                            modules = parsed;
                                                        } else {
                                                            modules = [jsonString];
                                                        }
                                                    } catch (e) {
                                                        modules = [jsonString];
                                                    }

                                                    // For multiple modules, zip them
                                                    const JSZip = (await import('jszip')).default;
                                                    const zip = new JSZip();

                                                    modules.forEach((modBase64, index) => {
                                                        const byteCharacters = atob(modBase64);
                                                        const byteNumbers = new Array(byteCharacters.length);
                                                        for (let i = 0; i < byteCharacters.length; i++) {
                                                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                                                        }
                                                        const byteArray = new Uint8Array(byteNumbers);
                                                        zip.file(`module_${index}.mv`, byteArray);
                                                    });

                                                    const content = await zip.generateAsync({ type: "blob" });
                                                    const url = URL.createObjectURL(content);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `package_modules_${shortenAddress(task.task_id)}.zip`;
                                                    a.click();
                                                    URL.revokeObjectURL(url);

                                                    toast.dismiss(toastId);
                                                    toast.success('Modules downloaded as ZIP!');

                                                } catch (err) {
                                                    console.error(err);
                                                    toast.dismiss(toastId);
                                                    toast.error("Failed to download: " + (err as Error).message);
                                                }
                                            }}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Download Modules
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar: Actions & Meta */}
                    <div className="space-y-6">
                        {/* Action Card */}
                        <Card className="bg-gray-900/60 border-gray-800 backdrop-blur-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-green-400" />
                                    Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isCreator ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-yellow-900/10 border border-yellow-500/20 rounded-lg text-center">
                                            <h4 className="text-yellow-500 font-medium mb-1">Creator Controls</h4>
                                            <p className="text-xs text-gray-500 mb-4">
                                                {inGracePeriod
                                                    ? "Grace period active. You can safely remove this task."
                                                    : "Task is active. Waiting for miners."}
                                            </p>

                                            {inGracePeriod ? (
                                                <Button
                                                    variant="destructive"
                                                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50"
                                                    onClick={handleCancel}
                                                    disabled={isCancelling}
                                                >
                                                    {isCancelling ? "Cancelling..." : "Cancel Task"}
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="secondary"
                                                    className="w-full bg-gray-800 text-gray-500 cursor-not-allowed"
                                                    disabled
                                                >
                                                    Cannot Cancel (Active)
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ) : isActive ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-green-900/10 border border-green-500/20 rounded-lg text-center">
                                            <p className="text-sm text-green-400 mb-3 font-medium">Mine this Vanity Hash</p>
                                            <SubmitProofDialog
                                                taskId={task.task_id}
                                                taskType={task.task_type || 0}
                                                targetType={task.target_type || ''}
                                                onSuccess={fetchTask}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 bg-gray-800/30 rounded-lg text-center text-gray-500 border border-gray-800/50">
                                        {inGracePeriod ? 'Waiting for grace period...' : 'Task is not active'}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Details Card */}
                        <Card className="bg-gray-900/40 border-gray-800">
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-blue-500/10 text-blue-400">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs text-gray-500 uppercase">Creator</p>
                                        <p className="text-sm font-mono text-gray-300 truncate" title={task.creator || ''}>
                                            {shortenAddress(task.creator)}
                                        </p>
                                    </div>
                                </div>

                                {task.completer && (
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded bg-green-500/10 text-green-400">
                                            <ShieldCheck className="h-4 w-4" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-xs text-gray-500 uppercase">Completer</p>
                                            <p className="text-sm font-mono text-gray-300 truncate" title={task.completer}>
                                                {shortenAddress(task.completer)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Transaction Link for Completed Tasks */}
                                {isCompleted && task.tx_digest && (
                                    <a
                                        href={`https://suiscan.xyz/${NETWORK}/tx/${task.tx_digest}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors group"
                                    >
                                        <div className="p-2 rounded bg-blue-500/20 text-blue-400">
                                            <Hash className="h-4 w-4" />
                                        </div>
                                        <div className="overflow-hidden flex-1">
                                            <p className="text-xs text-gray-500 uppercase">Transaction</p>
                                            <p className="text-sm font-mono text-blue-400 group-hover:text-blue-300 truncate">
                                                {shortenAddress(task.tx_digest)}
                                            </p>
                                        </div>
                                        <Copy className="h-4 w-4 text-gray-500 group-hover:text-white" />
                                    </a>
                                )}

                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-gray-700/30 text-gray-400">
                                        <Calendar className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Created</p>
                                        <p className="text-sm text-gray-300">
                                            {task.created_at && new Date(task.created_at).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
