'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { isAdmin } from '@/constants/admin';
import { useAdminFees } from '@/hooks/useAdminFees';
import { Button } from '@/components/ui/Button';
import { Wallet, ArrowDownCircle, Info } from 'lucide-react';

export default function AdminPage() {
    const account = useCurrentAccount();
    const userAddress = account?.address;
    const hasAdminAccess = isAdmin(userAddress);

    const { feeVaultBalance, marketBeneficiary, withdrawFees, loading: withdrawing } = useAdminFees();

    const formatSui = (mist: string) => {
        const val = Number(BigInt(mist)) / 1e9;
        return val.toLocaleString(undefined, { maximumFractionDigits: 9 }) + ' SUI';
    };

    if (!account) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8 flex items-center justify-center">
                <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm max-w-md">
                    <CardContent className="p-8 text-center">
                        <h2 className="text-2xl font-bold text-white mb-4">Admin Access Required</h2>
                        <p className="text-gray-400 mb-6">Please connect your wallet to access the admin dashboard.</p>
                        <p className="text-sm text-gray-500">Only authorized administrators can access this page.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!hasAdminAccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8 flex items-center justify-center">
                <Card className="bg-gray-900/50 border-red-900/50 backdrop-blur-sm max-w-md">
                    <CardContent className="p-8 text-center">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">Unauthorized Access</h2>
                        <p className="text-gray-400 mb-4">You do not have permission to access the admin dashboard.</p>
                        <p className="text-sm text-gray-500 font-mono break-all">Your address: {userAddress}</p>
                        <p className="text-xs text-gray-600 mt-4">Contact the administrator if you believe this is an error.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
                    <div className="text-sm text-gray-400">
                        Admin: <span className="text-green-400 font-mono">{userAddress?.slice(0, 8)}...{userAddress?.slice(-6)}</span>
                    </div>
                </div>

                {/* Fee Management */}
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Wallet className="h-6 w-6 text-yellow-500" /> Fee Management
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {/* Task Fees */}
                    <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center justify-between">
                                Task Fees
                                <span className="text-xs font-normal text-gray-500 bg-gray-800 px-2 py-1 rounded">FeeVault</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-6">
                                <span className="text-gray-400 text-sm">Vault Balance</span>
                                <div className="text-3xl font-bold text-green-400 font-mono mt-1">{formatSui(feeVaultBalance)}</div>
                            </div>
                            <Button
                                onClick={withdrawFees}
                                disabled={withdrawing || BigInt(feeVaultBalance) === BigInt(0)}
                                className="w-full"
                                variant="outline"
                            >
                                <ArrowDownCircle className="mr-2 h-4 w-4" />
                                {withdrawing ? 'Withdrawing...' : 'Withdraw All Fees'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Market Fees */}
                    <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center justify-between">
                                Marketplace Fees
                                <span className="text-xs font-normal text-gray-500 bg-gray-800 px-2 py-1 rounded">Auto-Distribute</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-start gap-3 mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-300">
                                    Marketplace fees (2%) are automatically distributed to the beneficiary address immediately upon each sale.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <span className="text-gray-400 text-sm">Current Beneficiary</span>
                                <div className="bg-black/40 p-3 rounded font-mono text-sm break-all text-gray-300 border border-gray-800">
                                    {marketBeneficiary || "Loading..."}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

                    <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="text-gray-400 text-sm mb-2">Total Tasks</div>
                            <div className="text-3xl font-bold text-white">-</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="text-gray-400 text-sm mb-2">Active Tasks</div>
                            <div className="text-3xl font-bold text-green-400">-</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="text-gray-400 text-sm mb-2">Completed Tasks</div>
                            <div className="text-3xl font-bold text-blue-400">-</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="text-gray-400 text-sm mb-2">Total Rewards</div>
                            <div className="text-3xl font-bold text-yellow-400">- SUI</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Task Management */}
                <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl text-white">Task Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-gray-400 text-center py-12">
                            <p>Task management features coming soon...</p>
                            <p className="text-sm mt-2">This will include task filtering, search, and admin controls.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
