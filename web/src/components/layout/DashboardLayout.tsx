import { ReactNode } from "react";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { MarketplaceSidebar } from "@/components/marketplace/MarketplaceSidebar";
import { ActivityFeed } from "@/components/marketplace/ActivityFeed";

interface DashboardLayoutProps {
    children: ReactNode;
    showSidebar?: boolean;
    showActivity?: boolean;
    activityMode?: 'market' | 'tasks';
}

export function DashboardLayout({ 
    children, 
    showSidebar = true, 
    showActivity = true,
    activityMode = 'market'
}: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans flex flex-col">
            <GlobalHeader />
            
            <div className="flex flex-1 overflow-hidden h-[calc(100vh-73px)]">
                {/* Left Sidebar */}
                {showSidebar && <MarketplaceSidebar />}

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-black/10 relative">
                    {children}
                </main>

                {/* Right Activity Feed */}
                {showActivity && <ActivityFeed mode={activityMode} />}
            </div>
        </div>
    );
}
