import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useSubmitProof } from '@/hooks/useSubmitProof';
import { toast } from 'sonner';

import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { normalizeSuiAddress } from '@mysten/sui/utils';
import { formatStruct } from '@/utils/formatters';
import { MINER_URL } from '@/constants/chain';

interface SubmitProofDialogProps {
    taskId: string;
    taskType: number;
    targetType: string;
    onSuccess?: () => void;
    children?: React.ReactNode;
}

export function SubmitProofDialog({ taskId, taskType, targetType, onSuccess, children }: SubmitProofDialogProps) {
    const [open, setOpen] = useState(false);
    const [objectId, setObjectId] = useState('');
    const { submitProof, isPending } = useSubmitProof();
    const client = useSuiClient();
    const account = useCurrentAccount();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!objectId) {
            toast.error("Please enter the Object ID or Package ID");
            return;
        }

        let targetId = objectId;

        // Validate and normalize input
        try {
            targetId = normalizeSuiAddress(objectId);
        } catch (e) {
            toast.error("Object ID must start with 0x");
            return;
        }

        // Auto-detect UpgradeCap if user provides Package ID
        if (Number(taskType) === 1 && account?.address) {
            const toastId = toast.loading("Checking for UpgradeCap...");
            try {
                const caps = await client.getOwnedObjects({
                    owner: account.address,
                    filter: { StructType: '0x2::package::UpgradeCap' },
                    options: { showContent: true }
                });

                const match = caps.data.find(obj => {
                    const content = obj.data?.content;
                    if (content?.dataType === 'moveObject') {
                        const fields = content.fields as any;
                        // For UpgradeCap, 'package' field holds the Package ID
                        return fields?.package === targetId;
                    }
                    return false;
                });

                if (match?.data?.objectId) {
                    toast.success("Found UpgradeCap for Package!", { id: toastId });
                    targetId = match.data.objectId;
                } else {
                    // Try to proceed anyway, maybe user input UpgradeCap ID directly?
                    // Or maybe we treat input as literal ID
                    toast.dismiss(toastId);
                }
            } catch (error) {
                console.error("Error finding UpgradeCap:", error);
                toast.dismiss(toastId);
            }
        }

        submitProof(
            taskId,
            targetId,
            taskType,
            targetType,
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
                {children || (
                    <Button size="sm" className="ml-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold border-none shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all hover:scale-105 rounded-full px-4">
                        Submit Proof
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Submit Vanity Object</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-blue-300 mb-2">📦 How to Mine</h4>
                        <div className="text-xs text-gray-300 space-y-2">
                            {Number(taskType) === 1 ? (
                                <>
                                    <p><strong>Package ID Mining</strong></p>
                                    <ol className="list-decimal list-inside space-y-1 ml-2">
                                        <li>Download the bytecode modules from the task page</li>
                                        <li>Use <a href={MINER_URL} target="_blank" className="underline hover:text-white">Sui Vanity Miner</a></li>
                                        <li>Mine and deploy with <code className="bg-gray-800 px-1 rounded">sui client publish</code></li>
                                        <li>Find the <strong>UpgradeCap</strong> object ID</li>
                                        <li>Submit the UpgradeCap object ID below</li>
                                    </ol>
                                </>
                            ) : (
                                <>
                                    <p><strong>Object Mining (Target: <span className="font-mono text-cyan-400 break-all">{formatStruct(targetType) || 'Any Object'}</span>)</strong></p>
                                    <ol className="list-decimal list-inside space-y-1 ml-2">
                                        <li>Create/mint an object of the required type</li>
                                        <li>Ensure the object ID matches the required pattern</li>
                                        <li>Submit the object ID below</li>
                                    </ol>
                                </>
                            )}
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
