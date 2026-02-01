import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function AdminPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-white mb-8">Admin Dashboard</h1>

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
