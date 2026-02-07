import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateTask } from '@/hooks/useCreateTask';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { validatePattern } from '@/utils/validators';
import { Box, Package, Check, Info } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { UPGRADE_CAP_TYPE, SUI_GAS_TYPE_SHORT } from '@/utils/taskType';

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
    const [taskType, setTaskType] = useState<'object' | 'gas' | 'package'>('gas');
    const [targetType, setTargetType] = useState('0x2::coin::Coin<0x2::sui::SUI>');
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

        // Validate total pattern length (Sui object ID = 64 hex chars)
        const totalPatternLength = prefixPattern.length + suffixPattern.length + containsPattern.length;
        const maxLength = 64; // Sui object ID is 32 bytes = 64 hex characters
        if (totalPatternLength > maxLength) {
            toast.error(`Total pattern length (${totalPatternLength}) exceeds object ID length (${maxLength} hex chars)`);
            return;
        }

        // Validate contains is not already in prefix or suffix
        if (containsPattern && prefixPattern && prefixPattern.includes(containsPattern)) {
            toast.error('Contains pattern is already included in prefix');
            return;
        }
        if (containsPattern && suffixPattern && suffixPattern.includes(containsPattern)) {
            toast.error('Contains pattern is already included in suffix');
            return;
        }

        // Require bytecode for package tasks
        if (taskType === 'package' && bytecode.length === 0) {
            toast.error('Package bytecode is required for package mining tasks');
            return;
        }

        try {
            // Note: Current contract accepts task_type parameter
            // 0 = OBJECT (regular object mining)
            // 1 = PACKAGE (package ID mining)
            const lockDurationMs = Math.floor(Number(lockDurationHours) * 60 * 60 * 1000);

            // Determine final target type
            let finalTargetType = targetType;
            if (taskType === 'package') {
                finalTargetType = '0x2::package::UpgradeCap'; // Correct type for Package tasks
            } else if (taskType === 'gas') {
                finalTargetType = '0x2::coin::Coin<0x2::sui::SUI>'; // Fixed for Gas
            }

            await createTask(
                prefixPattern,
                suffixPattern,
                containsPattern,
                taskType === 'package' ? 1 : 0,  // task_type parameter (gas is also object type 0)
                reward,
                lockDurationMs,
                bytecode, // Pass bytecode
                finalTargetType, // Target Type
                (result) => {
                    toast.success(`Task created successfully!`);
                    if (onTaskCreated) onTaskCreated();
                    // Reset form
                    setPrefixPattern('');
                    setSuffixPattern('');
                    setContainsPattern('');
                    setLockDurationHours('24');
                    setTaskType('gas');
                    setTargetType('0x2::coin::Coin<0x2::sui::SUI>');
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
            <CardContent className="space-y-6">

                {/* Task Type Cards */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Label className="text-gray-400 block">Task Type</Label>
                        <Tooltip content="Choose valid mining typs.">
                            <Info className="w-4 h-4 text-gray-500 hover:text-white cursor-help" />
                        </Tooltip>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Package Selection */}
                        <div
                            onClick={() => {
                                setTaskType('package');
                                setTargetType('');
                            }}
                            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-white/5 ${taskType === 'package'
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-gray-800 bg-black/40'
                                }`}
                        >
                            {taskType === 'package' && (
                                <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-0.5">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            )}
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${taskType === 'package' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-800 text-gray-400'}`}>
                                    <Package className="w-5 h-5" />
                                </div>
                                <h3 className={`font-semibold ${taskType === 'package' ? 'text-white' : 'text-gray-300'}`}>Package ID</h3>
                            </div>
                            <p className="text-xs text-gray-500 leading-tight">
                                Mine a vanity Address for publishing Move packages.
                            </p>
                        </div>

                        {/* Gas Object Selection */}
                        <div
                            onClick={() => {
                                setTaskType('gas');
                                setTargetType(SUI_GAS_TYPE_SHORT);
                            }}
                            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-white/5 ${taskType === 'gas'
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-gray-800 bg-black/40'
                                }`}
                        >
                            {taskType === 'gas' && (
                                <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-0.5">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            )}
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${taskType === 'gas' ? 'bg-blue-500/20' : 'bg-gray-800'}`}>
                                    <img src="https://docs.sui.io/img/logo.svg" alt="Sui" className="w-5 h-5" />
                                </div>
                                <h3 className={`font-semibold ${taskType === 'gas' ? 'text-white' : 'text-gray-300'}`}>Gas Object</h3>
                            </div>
                            <p className="text-xs text-gray-500 leading-tight">
                                Mine a vanity ID for a standard SUI Gas Coin.
                            </p>
                        </div>

                        {/* Object Selection */}
                        <div
                            onClick={() => {
                                setTaskType('object');
                                setTargetType('');
                            }}
                            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-white/5 ${taskType === 'object'
                                ? 'border-cyan-500 bg-cyan-500/10'
                                : 'border-gray-800 bg-black/40'
                                }`}
                        >
                            {taskType === 'object' && (
                                <div className="absolute top-2 right-2 bg-cyan-500 rounded-full p-0.5">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            )}
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${taskType === 'object' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 text-gray-400'}`}>
                                    <Box className="w-5 h-5" />
                                </div>
                                <h3 className={`font-semibold ${taskType === 'object' ? 'text-white' : 'text-gray-300'}`}>Other Objects</h3>
                            </div>
                            <p className="text-xs text-gray-500 leading-tight">
                                Mine a vanity ID for any other Object (NFTs, etc).
                            </p>
                        </div>
                    </div>
                </div>

                {/* Target Type Input (Only for Object) */}
                {taskType === 'object' && (
                    <div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="targetType" className="text-gray-400">Target Object Type</Label>
                            <Tooltip content="The exact Move type (e.g. 0x2::coin::Coin<0x2::sui::SUI>) of the object being mined. Miners need this to validate their work.">
                                <Info className="w-4 h-4 text-gray-500 hover:text-white cursor-help" />
                            </Tooltip>
                        </div>
                        <Input
                            id="targetType"
                            value={targetType}
                            onChange={(e) => setTargetType(e.target.value)}
                            placeholder="e.g. 0x2::coin::Coin<0x2::sui::SUI>"
                            className="mt-1 bg-black/40 border-gray-800 text-white placeholder:text-gray-600 focus:ring-blue-500/50 font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            The full Move type of the object miners must create (e.g. for SUI Coin).
                        </p>
                    </div>
                )}

                {/* Bytecode Upload (Only for Package) */}
                {taskType === 'package' && (
                    <div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="bytecode" className="text-gray-400">Package Bytecode (.mv)</Label>
                            <Tooltip content="Upload the compiled Move bytecode (.mv) of your package. Miners use this to verify the hash generated by the package ID.">
                                <Info className="w-4 h-4 text-gray-500 hover:text-white cursor-help" />
                            </Tooltip>
                        </div>
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
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-400">
                            Add up to 3 patterns (one per type). The {taskType === 'package' ? 'Package ID' : 'ID'} must contain all specified patterns.
                        </p>
                        <div className={`text-xs font-mono px-2 py-1 rounded ${(prefixPattern.length + suffixPattern.length + containsPattern.length) > 64
                            ? 'bg-red-500/20 text-red-400'
                            : (prefixPattern.length + suffixPattern.length + containsPattern.length) > 48
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-gray-800 text-gray-400'
                            }`}>
                            {prefixPattern.length + suffixPattern.length + containsPattern.length}/64
                        </div>
                    </div>

                    {/* Prefix Pattern */}
                    <div>
                        <Label htmlFor="prefix" className="text-gray-400 flex items-center gap-2">
                            <span className="inline-block w-20">Prefix</span>
                            <span className="text-xs text-gray-500">(starts with)</span>
                            <Tooltip content="The vanity ID must START with this hex sequence (e.g. '0000').">
                                <Info className="w-4 h-4 text-gray-500 hover:text-white cursor-help ml-1" />
                            </Tooltip>
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
                    {/* Contains Pattern */}
                    <div>
                        <Label htmlFor="contains" className="text-gray-400 flex items-center gap-2">
                            <span className="inline-block w-20">Contains</span>
                            <span className="text-xs text-gray-500">(anywhere)</span>
                            <Tooltip content="The vanity ID must contain this hex sequence somewhere in the middle.">
                                <Info className="w-4 h-4 text-gray-500 hover:text-white cursor-help ml-1" />
                            </Tooltip>
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

                    {/* Suffix Pattern */}
                    <div>
                        <Label htmlFor="suffix" className="text-gray-400 flex items-center gap-2">
                            <span className="inline-block w-20">Suffix</span>
                            <span className="text-xs text-gray-500">(ends with)</span>
                            <Tooltip content="The vanity ID must END with this hex sequence (e.g. 'dead').">
                                <Info className="w-4 h-4 text-gray-500 hover:text-white cursor-help ml-1" />
                            </Tooltip>
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
                    <div className="flex items-center gap-2">
                        <Label htmlFor="lockDuration" className="text-gray-400">Lock Duration (Hours)</Label>
                        <Tooltip content="Tasks cannot be cancelled during this period. Ensures miners have guaranteed time to work without the task disappearing.">
                            <Info className="w-4 h-4 text-gray-500 hover:text-white cursor-help" />
                        </Tooltip>
                    </div>
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
