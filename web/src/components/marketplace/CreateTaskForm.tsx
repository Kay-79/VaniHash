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
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Hire a Miner</CardTitle>
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
                    />
                </div>

                <div>
                    <Label htmlFor="type">Pattern Type</Label>
                    <Select 
                        id="type"
                        value={patternType}
                        onChange={(e) => setPatternType(e.target.value)}
                        className="mt-1"
                    >
                        <option value="0">Prefix (Starts with)</option>
                        <option value="1">Suffix (Ends with)</option>
                        <option value="2">Contains</option>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="reward">Reward (SUI)</Label>
                    <Input 
                        id="reward"
                        type="number" 
                        step="0.1"
                        value={reward}
                        onChange={(e) => setReward(e.target.value)}
                        className="mt-1"
                    />
                </div>

                <Button 
                    className="w-full mt-4" 
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
