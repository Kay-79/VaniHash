'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CreateTaskForm } from '@/components/marketplace/CreateTaskForm';
import { TaskList } from '@/components/marketplace/TaskList';
import { useFetchTasks } from '@/hooks/useFetchTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LayoutGrid, List, ArrowUpDown, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { MinerStats } from '@/components/miner/MinerStats';

export default function Home() {
  const { tasks, loading, refetch } = useFetchTasks();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'time' | 'reward'>('time');
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status') || 'ALL';

  const handleStatusChange = (newStatus: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newStatus && newStatus !== 'ALL') {
          params.set('status', newStatus);
      } else {
          params.delete('status');
      }
      router.replace(`${pathname}?${params.toString()}`);
  };

  // Sorting Logic
  const sortedTasks = [...tasks].sort((a, b) => {
      if (sortBy === 'reward') {
          return parseFloat(b.reward_amount) - parseFloat(a.reward_amount);
      }
      // Default time (assuming id or created_at logic, using ID as proxy for now since created_at might be missing in mock/simple type)
      // Ideally use b.created_at - a.created_at if available.
      // If tasks come from contract, higher ID usually means newer.
      return Number(b.id) - Number(a.id); 
  });

  return (
    <DashboardLayout activityMode="tasks">
      <div className="p-6 space-y-6">
        {/* Miner Stats Section */}
        <MinerStats />

        {/* Create Task Section */}
        <CreateTaskForm onTaskCreated={() => {
            setTimeout(refetch, 2000);
        }} />

        {/* Task Feed */}
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                <h2 className="text-xl font-bold text-white">Active Job Requests</h2>
                
                <div className="flex items-center gap-3">
                    {/* Status Filter */}
                    <div className="flex items-center gap-2 bg-gray-900/50 p-1 rounded-lg border border-gray-800">
                        <Filter className="h-4 w-4 text-gray-500 ml-2" />
                        <select 
                            value={statusFilter}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="bg-transparent text-sm text-gray-300 border-none focus:ring-0 cursor-pointer pr-4 uppercase"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="ACTIVE">Active</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>

                    {/* Sort Control */}
                    <div className="flex items-center gap-2 bg-gray-900/50 p-1 rounded-lg border border-gray-800">
                        <ArrowUpDown className="h-4 w-4 text-gray-500 ml-2" />
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'time' | 'reward')}
                            className="bg-transparent text-sm text-gray-300 border-none focus:ring-0 cursor-pointer pr-8"
                        >
                            <option value="time">Newest</option>
                            <option value="reward">Highest Reward</option>
                        </select>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 bg-gray-900/50 p-1 rounded-lg border border-gray-800">
                        <Button 
                            variant={viewMode === 'grid' ? "secondary" : "ghost"} 
                            size="sm" 
                            className={`h-8 w-8 p-0 ${viewMode === 'grid' ? 'bg-gray-800 text-blue-500' : 'text-gray-500'}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant={viewMode === 'list' ? "secondary" : "ghost"} 
                            size="sm" 
                            className={`h-8 w-8 p-0 ${viewMode === 'list' ? 'bg-gray-800 text-blue-500' : 'text-gray-500'}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>

                    <button 
                        onClick={refetch} 
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors ml-2"
                    >
                        Refresh
                    </button>
                </div>
            </div>
            
            <div className="bg-gray-900/30 rounded-lg p-1">
                 <TaskList tasks={sortedTasks} loading={loading} viewMode={viewMode} />
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
