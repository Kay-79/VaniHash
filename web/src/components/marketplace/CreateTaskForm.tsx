import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateTask } from '@/hooks/useCreateTask';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { validatePattern } from '@/utils/validators';

interface CreateTaskFormProps {
    onTaskCreated?: () => void;
}

export function CreateTaskForm({ onTaskCreated }: CreateTaskFormProps) {
    const { createTask, isPending, isConnected } = useCreateTask();

    // One pattern per type
    const [prefixPattern, setPrefixPattern] = useState('');
    const [suffixPattern, setSuffixPattern] = useState('');
    const [containsPattern, setContainsPattern] = useState('');
    const [reward, setReward] = useState('0.01');
    const [taskType, setTaskType] = useState<'object' | 'package'>('object');
    const [lockDurationHours, setLockDurationHours] = useState('24');
    const [bytecode, setBytecode] = useState<Uint8Array>(new Uint8Array());

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const buffer = await file.arrayBuffer();
                setBytecode(new Uint8Array(buffer));
            } catch (err) {
                toast.error('Failed to read file');
            }
        }
    };

    // Validation errors
    const [prefixError, setPrefixError] = useState('');
    const [suffixError, setSuffixError] = useState('');
    const [containsError, setContainsError] = useState('');

    const validateInput = (value: string, setError: (err: string) => void): boolean => {
        if (!value) {
            setError('');
            return true;
        }
        if (!validatePattern(value)) {
            setError('Only hex characters (0-9, a-f) allowed');
            return false;
        }
        setError('');
        return true;
    };

    const handleSubmit = async () => {
        // Collect patterns in order: prefix, suffix, contains
        const patterns: string[] = [];

        if (prefixPattern) {
            if (!validateInput(prefixPattern, setPrefixError)) return;
            patterns.push(prefixPattern);
        }
        if (suffixPattern) {
            if (!validateInput(suffixPattern, setSuffixError)) return;
            patterns.push(suffixPattern);
        }
        if (containsPattern) {
            if (!validateInput(containsPattern, setContainsError)) return;
            patterns.push(containsPattern);
        }

        if (patterns.length === 0) {
            toast.error('Please add at least one pattern');
            return;
        }

        try {
            // Note: Current contract accepts task_type parameter
            // 0 = OBJECT (regular object mining)
            // 1 = PACKAGE (package ID mining)
            const lockDurationMs = Math.floor(Number(lockDurationHours) * 60 * 60 * 1000);

            await createTask(
                prefixPattern,
                suffixPattern,
                containsPattern,
                taskType === 'package' ? 1 : 0,  // task_type parameter
                reward,
                lockDurationMs,
                bytecode, // Pass bytecode
                (result) => {
                    toast.success(`Task created successfully!`);
                    if (onTaskCreated) onTaskCreated();
                    // Reset form
                    setPrefixPattern('');
                    setSuffixPattern('');
                    setContainsPattern('');
                    setLockDurationHours('24');
                },
                (error) => {
                    toast.error("Failed to create task: " + (error as Error).message);
                }
            );
        } catch (e) {
            toast.error((e as Error).message);
        }
    };

    const hasAtLeastOnePattern = prefixPattern || suffixPattern || containsPattern;

    return (
        <Card className="w-full bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-xl text-white">Create New Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Task Type Selector */}
                <div>
                    <Label htmlFor="taskType" className="text-gray-400">Task Type</Label>
                    <select
                        id="taskType"
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value as 'object' | 'package')}
                        className="w-full mt-1 px-3 py-2 bg-black/40 border border-gray-800 rounded-md text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    >
                        <option value="object">Object ID (NFT, Coin, Gas Object, etc.)</option>
                        <option value="package">Package ID (Brand Identity)</option>
                    </select>
                </div>

                {/* Bytecode Upload (Only for Package) */}
                {taskType === 'package' && (
                    <div>
                        <Label htmlFor="bytecode" className="text-gray-400">Package Bytecode (.mv)</Label>
                        <Input
                            id="bytecode"
                            type="file"
                            accept=".mv,.bin"
                            onChange={handleFileChange}
                            className="mt-1 bg-black/40 border-gray-800 text-white file:bg-blue-900 file:text-white file:border-0 file:rounded-md file:px-2 file:py-1 hover:file:bg-blue-800"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Upload the compiled Move package bytecode to let miners know what logic to mine.
                        </p>
                    </div>
                )}

                <div className="space-y-3">
                    <p className="text-sm text-gray-400">
                        Add up to 3 patterns (one per type). The {taskType === 'package' ? 'Package ID' : 'object ID'} must contain all specified patterns.
                    </p>

                    {/* Prefix Pattern */}
                    <div>
                        <Label htmlFor="prefix" className="text-gray-400 flex items-center gap-2">
                            <span className="inline-block w-20">Prefix</span>
                            <span className="text-xs text-gray-500">(starts with)</span>
                        </Label>
                        <Input
                            id="prefix"
                            value={prefixPattern}
                            onChange={(e) => {
                                setPrefixPattern(e.target.value.toLowerCase());
                                validateInput(e.target.value, setPrefixError);
                            }}
                            placeholder="e.g. cafe, 0000"
                            className={`mt-1 bg-black/40 border-gray-800 text-white placeholder:text-gray-600 focus:ring-blue-500/50 font-mono ${prefixError ? 'border-red-500' : ''
                                }`}
                        />
                        {prefixError && <p className="text-red-500 text-xs mt-1">{prefixError}</p>}
                    </div>

                    {/* Suffix Pattern */}
                    <div>
                        <Label htmlFor="suffix" className="text-gray-400 flex items-center gap-2">
                            <span className="inline-block w-20">Suffix</span>
                            <span className="text-xs text-gray-500">(ends with)</span>
                        </Label>
                        <Input
                            id="suffix"
                            value={suffixPattern}
                            onChange={(e) => {
                                setSuffixPattern(e.target.value.toLowerCase());
                                validateInput(e.target.value, setSuffixError);
                            }}
                            placeholder="e.g. dead, ffff"
                            className={`mt-1 bg-black/40 border-gray-800 text-white placeholder:text-gray-600 focus:ring-blue-500/50 font-mono ${suffixError ? 'border-red-500' : ''
                                }`}
                        />
                        {suffixError && <p className="text-red-500 text-xs mt-1">{suffixError}</p>}
                    </div>

                    {/* Contains Pattern */}
                    <div>
                        <Label htmlFor="contains" className="text-gray-400 flex items-center gap-2">
                            <span className="inline-block w-20">Contains</span>
                            <span className="text-xs text-gray-500">(anywhere)</span>
                        </Label>
                        <Input
                            id="contains"
                            value={containsPattern}
                            onChange={(e) => {
                                setContainsPattern(e.target.value.toLowerCase());
                                validateInput(e.target.value, setContainsError);
                            }}
                            placeholder="e.g. 8888, beef"
                            className={`mt-1 bg-black/40 border-gray-800 text-white placeholder:text-gray-600 focus:ring-blue-500/50 font-mono ${containsError ? 'border-red-500' : ''
                                }`}
                        />
                        {containsError && <p className="text-red-500 text-xs mt-1">{containsError}</p>}
                    </div>
                </div>

                <div>
                    <Label htmlFor="reward" className="text-gray-400">Reward (SUI)</Label>
                    <Input
                        id="reward"
                        type="number"
                        step="0.1"
                        min="0.01"
                        value={reward}
                        onChange={(e) => setReward(e.target.value)}
                        className="mt-1 bg-black/40 border-gray-800 text-white placeholder:text-gray-600 focus:ring-blue-500/50"
                    />
                </div>

                <div>
                    <Label htmlFor="lockDuration" className="text-gray-400">Lock Duration (Hours)</Label>
                    <Input
                        id="lockDuration"
                        type="number"
                        min="24"
                        value={lockDurationHours}
                        onChange={(e) => setLockDurationHours(e.target.value)}
                        className="mt-1 bg-black/40 border-gray-800 text-white placeholder:text-gray-600 focus:ring-blue-500/50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Time during which the task cannot be cancelled (Min: 24h). Miners can start after 15m grace period.
                    </p>
                </div>

                <Button
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white"
                    disabled={!isConnected || isPending || !hasAtLeastOnePattern}
                    onClick={handleSubmit}
                >
                    {isPending ? 'Creating Task...' : 'Create Task'}
                </Button>

                {!isConnected && (
                    <p className="text-center text-xs text-red-400 mt-2">
                        Please connect your wallet first.
                    </p>
                )}

                {!hasAtLeastOnePattern && isConnected && (
                    <p className="text-center text-xs text-yellow-400 mt-2">
                        Add at least one pattern to create a task
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
