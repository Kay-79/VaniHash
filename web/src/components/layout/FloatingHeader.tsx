'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useRouter, usePathname } from 'next/navigation';

export function FloatingHeader() {
    const router = useRouter();
    const pathname = usePathname();

    const handleFeaturesClick = () => {
        if (pathname === '/') {
            const element = document.getElementById('features');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            router.push('/#features');
        }
    };

    return (
        <header className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="bg-[#020617]/70 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 shadow-[0_0_30px_rgba(37,99,235,0.2)] pointer-events-auto flex items-center gap-8 animate-fade-in-down">
                <div className="flex items-center gap-2 mr-4">
                    <img src="/logo.png" alt="VaniHash" className="h-8 w-8 rounded-lg shadow-lg" />
                    <span className="text-lg font-bold tracking-tight text-white">VaniHash</span>
                </div>
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
                    <button onClick={handleFeaturesClick} className="hover:text-cyan-400 transition-colors cursor-pointer">Features</button>
                    <Link href="/tasks" className="hover:text-cyan-400 transition-colors">Tasks</Link>
                    <Link href="/marketplace" className="hover:text-cyan-400 transition-colors">Market</Link>
                    {/* <Link href="https://github.com/Kay-79/VaniHash" target="_blank" className="hover:text-cyan-400 transition-colors">GitHub</Link> */}
                    <Link href="/docs" className="hover:text-cyan-400 transition-colors">Docs</Link>
                </nav>
                <div className="pl-4 border-l border-white/10">
                    <Link href="/tasks">
                        <Button size="sm" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold border-none shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105 rounded-full px-6">
                            Launch App
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}

