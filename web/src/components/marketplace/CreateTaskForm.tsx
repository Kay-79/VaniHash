import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateTask } from '@/hooks/useCreateTask';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PatternInput } from './PatternInput';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { useFetchTasks } from '@/hooks/useFetchTasks'; // Actually passing callback from parent is better.

interface CreateTaskFormProps {
    onTaskCreated?: () => void;
}

export function CreateTaskForm({ onTaskCreated }: CreateTaskFormProps) {
    const { createTask, isPending, isConnected } = useCreateTask();
    
    const [pattern, setPattern] = useState('');
    const [patternType, setPatternType] = useState('0');
    const [reward, setReward] = useState('1');

    const handleSubmit = async () => {
        if (!pattern) return;
        
        try {
            await createTask(
                pattern, 
                Number(patternType), 
                reward,
                (result) => {
                    toast.success("Task created successfully!");
                    if (onTaskCreated) onTaskCreated();
                    // Reset form optional
                    setPattern('');
                },
                (error) => {
                    toast.error("Failed to create task: " + (error as Error).message);
                }
            );
        } catch (e) {
            toast.error((e as Error).message);
        }
    };

    return (
        <Card className="w-full bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-xl text-white">Create New Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <PatternInput 
                        label="Pattern (Hex String)"
                        id="pattern"
                        placeholder="e.g. cafe, 8888" 
                        value={pattern}
                        onValidChange={(val) => setPattern(val)}
                        className="mt-1"
                        style={{ color: 'white' }}
                    />
                </div>

                <div>
                    <Label htmlFor="type" className="text-gray-400">Pattern Type</Label>
                    <Select 
                        id="type"
                        value={patternType}
                        onChange={(e) => setPatternType(e.target.value)}
                        className="mt-1 bg-black/40 border-gray-800 text-white focus:ring-blue-500/50"
                    >
                        <option value="0" className="bg-gray-900 text-white">Prefix (Starts with)</option>
                        <option value="1" className="bg-gray-900 text-white">Suffix (Ends with)</option>
                        <option value="2" className="bg-gray-900 text-white">Contains</option>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="reward" className="text-gray-400">Reward (SUI)</Label>
                    <Input 
                        id="reward"
                        type="number" 
                        step="0.1"
                        value={reward}
                        onChange={(e) => setReward(e.target.value)}
                        className="mt-1 bg-black/40 border-gray-800 text-white placeholder:text-gray-600 focus:ring-blue-500/50"
                    />
                </div>

                <Button 
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white" 
                    disabled={!isConnected || isPending || !pattern}
                    onClick={handleSubmit}
                >
                    {isPending ? 'Creating Task...' : 'Create Task'}
                </Button>
                
                {!isConnected && (
                    <p className="text-center text-xs text-red-400 mt-2">
                        Please connect your wallet first.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
