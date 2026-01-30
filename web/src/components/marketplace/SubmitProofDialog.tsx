import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useSubmitProof } from '@/hooks/useSubmitProof';
import { toast } from 'sonner';

interface SubmitProofDialogProps {
    taskId: string;
    onSuccess?: () => void;
}

export function SubmitProofDialog({ taskId, onSuccess }: SubmitProofDialogProps) {
    const [open, setOpen] = useState(false);
    const [objectId, setObjectId] = useState('');
    const [objectType, setObjectType] = useState('0x2::coin::Coin<0x2::sui::SUI>');
    const { submitProof, isPending } = useSubmitProof();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!objectId) {
            toast.error("Please enter the Object ID");
            return;
        }

        submitProof(
            taskId,
            objectId,
            objectType,
            () => {
                toast.success("Proof submitted successfully!");
                setOpen(false);
                setObjectId('');
                if (onSuccess) onSuccess();
            },
            (err) => {
                toast.error("Failed to submit proof: " + err.message);
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="ml-2 border-blue-500 text-blue-400 hover:bg-blue-900/20">
                    Submit Proof
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Submit Mined Proof</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div>
                        <Label htmlFor="objectId">Mined Object ID (Proof)</Label>
                        <Input 
                            id="objectId" 
                            placeholder="0x..." 
                            value={objectId}
                            onChange={(e) => setObjectId(e.target.value)}
                            className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            The ID of the object that matches the task pattern.
                        </p>
                    </div>
                    
                    <div>
                        <Label htmlFor="objectType">Object Type (Optional)</Label>
                        <Input 
                            id="objectType" 
                            placeholder="e.g. 0x2::coin::Coin<0x2::sui::SUI>" 
                            value={objectType}
                            onChange={(e) => setObjectType(e.target.value)}
                            className="mt-1 font-mono text-xs"
                        />
                    </div>

                    <Button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700">
                        {isPending ? 'Submitting...' : 'Confirm Submission'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
