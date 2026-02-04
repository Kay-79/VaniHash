'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Cpu, Globe, Zap, Shield, Coins, BarChart3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { GlobalHeader } from '@/components/layout/GlobalHeader';

export default function LandingPage() {
    const [stats, setStats] = useState({ volume: '0', miners: '0', tasks: '0' });

    useEffect(() => {
        fetch('/api/stats/market')
            .then(res => res.json())
            .then(data => {
                setStats({
                    volume: (Number(data.volume24h || 0) / 1e9).toFixed(0),
                    miners: (data.listedCount || 0).toString(), // Using listed as proxy or replace with real miner count if avail
                    tasks: '1240' // Mock or fetch real
                });
            })
            .catch(console.error);
    }, []);

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-cyan-500/30 font-sans">
            {/* Navbar (Simplified for Landing) */}
            <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-md">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img
                            src="/logo.png"
                            alt="VaniHash Logo"
                            className="h-8 w-8 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                        />
                        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            VaniHash
                        </span>
                    </div>

                    <div className="flex items-center gap-6">
                        <Link href="/marketplace" className="text-sm font-medium text-gray-400 hover:text-cyan-400 transition-colors">
                            Marketplace
                        </Link>
                        <Link href="https://github.com/Kay-79/VaniHash" target="_blank" className="text-sm font-medium text-gray-400 hover:text-cyan-400 transition-colors">
                            GitHub
                        </Link>
                        <Link href="/marketplace">
                            <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold border-none shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-105">
                                Launch App
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main>
                <section className="relative pt-32 pb-20 overflow-hidden">
                    {/* Background Effects */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

                    <div className="container mx-auto px-6 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-cyan-400 mb-8 animate-fade-in-up">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            Live on Sui Testnet
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500 leading-tight">
                            Forge Your <br />
                            <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">On-Chain Identity</span>
                        </h1>

                        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                            The first decentralized marketplace for Vanity IDs on Sui.
                            Mine custom object addresses, trade generic patterns, and own your presence locally and globally.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/marketplace">
                                <Button size="lg" className="h-12 px-8 text-base bg-cyan-500 hover:bg-cyan-400 text-black font-bold border-none shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all hover:scale-105 w-full sm:w-auto">
                                    Start Mining
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="https://docs.sui.io" target="_blank">
                                <Button variant="outline" size="lg" className="h-12 px-8 text-base border-gray-700 hover:bg-white/5 text-gray-300 w-full sm:w-auto">
                                    Read Docs
                                </Button>
                            </Link>
                        </div>

                        {/* Stats Bar */}
                        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                            {[
                                { label: 'Total Volume', value: `${stats.volume} SUI`, icon: Coins },
                                { label: 'Active Miners', value: '120+', icon: Cpu },
                                { label: 'Hashes / Sec', value: '4.2 MH/s', icon: Zap },
                                { label: 'Tasks Solved', value: '1,240+', icon: Shield },
                            ].map((stat, i) => (
                                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm flex flex-col items-center justify-center group hover:bg-white/10 transition-colors cursor-default">
                                    <div className="mb-2 p-2 rounded-full bg-cyan-500/10 text-cyan-400 group-hover:first:text-cyan-300">
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                    <div className="text-2xl font-bold font-mono text-white">{stat.value}</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Feature Grid */}
                <section className="py-24 bg-black/40 border-t border-white/5">
                    <div className="container mx-auto px-6">
                        <div className="grid md:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={<Cpu className="h-8 w-8 text-cyan-400" />}
                                title="GPU-Accelerated Mining"
                                description="Leverage your hardware to mine vanity patterns. Our optimized CUDA kernels ensure maximum hashrate for finding rare addresses."
                            />
                            <FeatureCard
                                icon={<Globe className="h-8 w-8 text-blue-500" />}
                                title="Global Marketplace"
                                description="Trade your mined IDs instantly. Buy gas objects with specific prefixes or sell your lucky numbers to the highest bidder."
                            />
                            <FeatureCard
                                icon={<Shield className="h-8 w-8 text-purple-400" />}
                                title="Trustless Verification"
                                description="Fully decentralized. Smart contracts verify every Proof of Work on-chain before unlocking rewards. No centralized servers."
                            />
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-12 border-t border-white/5 bg-[#020617]">
                    <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
                        <div className="flex items-center gap-2 mb-4 md:mb-0">
                            <img src="/logo.png" alt="Logo" className="h-6 w-6 rounded opacity-80" />
                            <span>&copy; 2026 VaniHash. All rights reserved.</span>
                        </div>
                        <div className="flex gap-6">
                            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
                            <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="p-8 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/5 hover:border-cyan-500/30 transition-all hover:transform hover:-translate-y-1 group">
            <div className="mb-6 p-4 rounded-xl bg-gray-900 w-fit border border-gray-800 group-hover:border-cyan-500/30 transition-colors">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-gray-400 leading-relaxed">
                {description}
            </p>
        </div>
    );
}
