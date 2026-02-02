'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { isAdmin } from '@/constants/admin';

export default function AdminPage() {
    const account = useCurrentAccount();
    const userAddress = account?.address;
    const hasAdminAccess = isAdmin(userAddress);

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
