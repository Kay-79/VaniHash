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
    const { submitProof, isPending } = useSubmitProof();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!objectId) {
            toast.error("Please enter the Object ID");
            return;
        }

        // Validate object ID format (0x + hex chars)
        if (!objectId.startsWith('0x')) {
            toast.error("Object ID must start with 0x");
            return;
        }

        submitProof(
            taskId,
            objectId,
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
                <Button size="sm" className="ml-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold border-none shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all hover:scale-105 rounded-full px-4">
                    Submit Proof
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Submit Vanity Object</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-blue-300 mb-2">📦 How to Mine Vanity Objects</h4>
                        <div className="text-xs text-gray-300 space-y-2">
                            <p><strong>Option 1: Package ID Mining</strong></p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                                <li>Deploy a Move package with <code className="bg-gray-800 px-1 rounded">sui client publish</code></li>
                                <li>Find the <strong>UpgradeCap</strong> object ID from "Created Objects"</li>
                                <li>Submit the UpgradeCap object ID below</li>
                            </ol>
                            <p className="mt-2"><strong>Option 2: Any Object</strong></p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                                <li>Create/mint any object (coin, NFT, etc.)</li>
                                <li>Check if the object ID matches the pattern</li>
                                <li>Submit the object ID below</li>
                            </ol>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="objectId">Vanity Object ID</Label>
                        <Input
                            id="objectId"
                            placeholder="0x..."
                            value={objectId}
                            onChange={(e) => setObjectId(e.target.value)}
                            className="mt-1 font-mono"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            The object ID that matches the task pattern
                        </p>
                    </div>

                    <Button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700">
                        {isPending ? 'Submitting...' : 'Submit Proof & Claim Reward'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
