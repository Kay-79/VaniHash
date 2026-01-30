'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Badge } from "@/components/ui/Badge";
import { WalletConnect } from '@/components/ui/WalletConnect';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

export function GlobalHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (term) {
            params.set('search', term);
        } else {
            params.delete('search');
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    const isActive = (path: string) => pathname === path;

    return (
        <div className="flex items-center justify-between px-6 py-4 bg-black/90 border-b border-gray-800 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-8">
                 {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 group-hover:animate-pulse" />
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        VaniHash 
                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[10px] px-1.5 py-0">
                            BETA
                        </Badge>
                    </h1>
                </Link>

                {/* Nav Links */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
                    <Link 
                        href="/" 
                        className={cn("transition-colors hover:text-white", isActive('/') ? "text-yellow-500 font-bold" : "")}
                    >
                        Tasks
                    </Link>
                    <Link 
                        href="/marketplace" 
                        className={cn("transition-colors hover:text-white", isActive('/marketplace') ? "text-yellow-500 font-bold" : "")}
                    >
                        Trading
                    </Link>
                    <Link 
                        href="/leaderboard" 
                        className={cn("transition-colors hover:text-white", isActive('/leaderboard') ? "text-yellow-500 font-bold" : "")}
                    >
                        Leaderboard
                    </Link>
                </nav>
            </div>

            {/* Search & Wallet */}
            <div className="flex items-center gap-4">
                <div className="relative hidden lg:block w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                        placeholder="Search collections, tasks..." 
                        className="pl-9 bg-gray-900 border-gray-800 focus:border-yellow-500 focus:ring-yellow-500/20 h-9" 
                        defaultValue={searchParams.get('search') || ''}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
                <WalletConnect />
            </div>
        </div>
    );
}
