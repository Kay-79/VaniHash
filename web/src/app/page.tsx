'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CreateTaskForm } from '@/components/marketplace/CreateTaskForm';
import { TaskList } from '@/components/marketplace/TaskList';
import { useFetchTasks } from '@/hooks/useFetchTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function Home() {
  const { tasks, loading, refetch } = useFetchTasks();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Create Task Section */}
        <Card className="bg-gray-900/50 border-gray-800">
             <CardHeader>
                <CardTitle className="text-xl text-white">Create New Task</CardTitle>
             </CardHeader>
             <CardContent>
                <CreateTaskForm onTaskCreated={() => {
                    setTimeout(refetch, 2000);
                }} />
             </CardContent>
        </Card>

        {/* Task Feed */}
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Active Job Requests</h2>
                <button 
                    onClick={refetch} 
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                    Refresh List
                </button>
            </div>
            
            <div className="bg-gray-900/30 rounded-lg p-1">
                 <TaskList tasks={tasks} loading={loading} />
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
