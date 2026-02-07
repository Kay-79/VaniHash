'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Cpu, Globe, Zap, Shield, Coins, BarChart3 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { FloatingHeader } from '@/components/layout/FloatingHeader';
import { Footer } from '@/components/layout/Footer';

export default function LandingPage() {
    const [stats, setStats] = useState({ minerReward: '0', marketVolume: '0', miners: '0', tasks: '0' });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const { clientX, clientY } = e;
            const x = clientX;
            const y = clientY;
            containerRef.current.style.setProperty('--mouse-x', `${x}px`);
            containerRef.current.style.setProperty('--mouse-y', `${y}px`);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        fetch('/api/stats/market')
            .then(res => res.json())
            .then(data => {
                setStats({
                    minerReward: (Number(data.totalMinerReward || 0) / 1e9).toFixed(0),
                    marketVolume: (Number(data.totalMarketVolume || 0) / 1e9).toFixed(0),
                    miners: (data.listedCount || 0).toString(),
                    tasks: data.tasksSolved ? data.tasksSolved.toString() : '1240'
                });
            })
            .catch(console.error);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div
            ref={containerRef}
            className="h-screen bg-[#020617] text-white selection:bg-cyan-500/30 font-sans overflow-y-auto snap-y snap-mandatory scroll-smooth perspective-1000 relative"
        >
            {/* Mouse Spotlight Effect */}
            <div
                className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 opacity-100"
                style={{
                    background: 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(6,182,212,0.10), transparent 40%)',
                }}
            />

            {/* Navbar - Floating Glass Pill */}
            <FloatingHeader />

            {/* Main Content */}
            <main className="relative">
                {/* Background Hashes (Random Mining Effect) - Scrolls with content */}
                <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
                    <BackgroundHashes />
                </div>

                {/* Section 1: Hero (Full Height, Snaps) */}
                <section className="h-screen w-full relative flex flex-col justify-center items-center overflow-hidden snap-start">
                    {/* ... (backgrounds omitted for brevity, they match existing) ... */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#020617] to-[#020617] z-0" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0 mix-blend-overlay" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />

                    <div className="container mx-auto px-6 relative z-10 text-center flex flex-col items-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-400 mb-8 animate-fade-in-up backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            FIRST VANITY ID PROTOCOL ON SUI
                        </div>

                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-gray-500 animate-float leading-[1.1]">
                            <ScrambleText text="Forge Your" className="block text-white" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                                <ScrambleText text="On-Chain Identity" />
                            </span>
                        </h1>

                        <p className="text-lg md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
                            The universal vanity mining protocol.
                            Mine custom IDs for <strong className="text-white font-semibold">any</strong> object, token, NFT, or package.
                            Trade your rare IDs instantly.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-2xl mx-auto">
                            <Link href="/tasks" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full h-14 px-10 text-lg bg-white text-black hover:bg-gray-100 font-bold border-none shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105 rounded-full">
                                    Start Mining
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <a href="https://youtu.be/SVllDADVxiE" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                                <Button variant="outline" size="lg" className="w-full h-14 px-10 text-lg border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 hover:text-white text-cyan-400 hover:border-cyan-500/50 backdrop-blur-md transition-all rounded-full">
                                    ▶ Watch Demo
                                </Button>
                            </a>
                            <Link href="/docs" className="w-full sm:w-auto">
                                <Button variant="outline" size="lg" className="w-full h-14 px-10 text-lg border-white/20 bg-white/5 hover:bg-white/10 hover:text-white text-white hover:border-white/40 backdrop-blur-md transition-all rounded-full">
                                    Read Docs
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Scroll Indicator */}
                    <div onClick={() => scrollToSection('features')} className="absolute bottom-0 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer z-20 group p-4">
                        <div className="flex flex-col items-center gap-3 text-gray-500 group-hover:text-cyan-400 transition-colors duration-300">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Explore</span>
                            <div className="w-6 h-10 rounded-full border-2 border-current flex justify-center p-1">
                                <div className="w-1 h-2 bg-current rounded-full animate-scroll-down" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Stats & Features (Full Height, Snaps) */}
                <section id="features" className="min-h-screen w-full relative flex flex-col justify-center py-20 bg-black/40 border-t border-white/5 snap-start">
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />

                    <div className="container mx-auto px-6 relative z-10 h-full flex flex-col justify-center">

                        {/* Title */}
                        <div className="text-center mb-12 mt-6">
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                                Power Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Web3 Identity</span>
                            </h2>
                            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                                The most advanced vanity Ids mining protocol, built for speed and universality.
                            </p>
                        </div>


                        {/* Stats - Glass Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 max-w-6xl mx-auto mb-20 w-full">
                            {[
                                { label: 'Total Mined', value: `${stats.minerReward} SUI`, icon: Coins, color: 'text-yellow-400' },
                                { label: 'Volume Trade', value: `${stats.marketVolume} SUI`, icon: BarChart3, color: 'text-green-400' },
                                { label: 'Active Miners', value: '120+', icon: Cpu, color: 'text-cyan-400' },
                                { label: 'Hashes / Sec', value: '4.2 GH/s', icon: Zap, color: 'text-orange-400' },
                                { label: 'Tasks Solved', value: `${stats.tasks}+`, icon: Shield, color: 'text-purple-400' },
                            ].map((stat, i) => (
                                <div key={i} className="group relative p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-cyan-500/30 transition-all duration-300 hover:-translate-y-1">
                                    <div className={`mb-3 p-3 rounded-2xl bg-white/5 w-fit ${stat.color} group-hover:scale-110 transition-transform`}>
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                    <div className="text-3xl font-black font-sans text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">{stat.value}</div>
                                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Features Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <FeatureCard
                                icon={<Cpu className="h-6 w-6 text-cyan-400" />}
                                title="Universal Mining"
                                description="Support all IDswrite on Sui."
                            />
                            <FeatureCard
                                icon={<Globe className="h-6 w-6 text-blue-500" />}
                                title="Liquid Marketplace"
                                description="Buy and sell rare IDs instantly."
                            />
                            <FeatureCard
                                icon={<Shield className="h-6 w-6 text-purple-400" />}
                                title="On-Chain Verify"
                                description="Trustless Proof of Work verification by smart contracts."
                            />
                            <FeatureCard
                                icon={<Zap className="h-6 w-6 text-yellow-400" />}
                                title="CPU/GPU Mining"
                                description="Support for CPU/GPU mining."
                            />
                        </div>


                    </div>
                </section>

                {/* Section: Demo Video */}
                <section id="demo" className="min-h-screen w-full relative flex flex-col justify-center items-center py-20 snap-start">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-[#020617] to-[#020617] z-0" />

                    <div className="container mx-auto px-6 relative z-10 text-center mt-6">
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                            See VaniHash in <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Action</span>
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto mb-12 text-lg">
                            Watch how easy it is to create custom vanity IDs for your Sui objects
                        </p>

                        {/* YouTube Embed */}
                        <div className="max-w-4xl mx-auto aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(6,182,212,0.2)]">
                            <iframe
                                width="100%"
                                height="100%"
                                src="https://www.youtube.com/embed/SVllDADVxiE"
                                title="VaniHash Demo"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="w-full h-full"
                            />
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="p-8 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/5 hover:border-cyan-500/30 transition-all hover:transform hover:-translate-y-1 group relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute inset-0 bg-cyan-500/5 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500" />
            <div className="mb-6 p-4 rounded-xl bg-gray-900 w-max border border-gray-800 group-hover:border-cyan-500/30 transition-colors relative z-10">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3 relative z-10">
                <ScrambleText text={title} />
            </h3>
            <p className="text-gray-400 leading-relaxed relative z-10">
                {description}
            </p>
        </div>
    );
}

function ScrambleText({ text, className = "" }: { text: string, className?: string }) {
    const [display, setDisplay] = useState(text);
    const chars = "0123456789abcdef";

    const scramble = () => {
        let iterations = 0;
        let velocity = 0.1; // Start slow
        const acceleration = 0.05; // Accelerate each frame

        const interval = setInterval(() => {
            setDisplay(
                text.split("")
                    .map((letter, index) => {
                        if (index < iterations) {
                            return text[index];
                        }
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join("")
            );

            if (iterations >= text.length) {
                clearInterval(interval);
            }

            iterations += velocity;
            velocity += acceleration;
        }, 20); // Base tick rate
    };

    return (
        <span className={className} onMouseEnter={scramble}>
            {display}
        </span>
    );
}

function BackgroundHashes() {
    const [particles, setParticles] = useState<{ id: number, top: number, left: number, delay: number }[]>([]);

    useEffect(() => {
        // Generate a pool of 100 candidate positions (10x10 grid) to ensure good distribution
        const candidates = [];
        for (let i = 0; i < 100; i++) {
            const row = Math.floor(i / 10);
            const col = i % 10;
            candidates.push({
                top: (row * 10) + Math.random() * 10, // 10% vertical slots with jitter
                left: (col * 10) + Math.random() * 10, // 10% horizontal slots with jitter
            });
        }

        // Shuffle and pick 30
        const selected = candidates
            .sort(() => Math.random() - 0.5)
            .slice(0, 30)
            .map((pos, i) => ({
                id: i,
                top: pos.top,
                left: pos.left,
                delay: Math.random() * 5
            }));

        setParticles(selected);
    }, []);

    const refs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const chars = "0123456789abcdef";
        let animationFrameId: number;
        let lastTime = 0;

        const animate = (time: number) => {
            // Global throttle: only check updates every 50ms to save CPU
            if (time - lastTime > 50) {
                lastTime = time;
                refs.current.forEach(el => {
                    // Randomly update only ~10% of particles per tick to keep it light but active
                    if (el && Math.random() > 0.9) {
                        let h = '0x';
                        for (let j = 0; j < 8; j++) h += chars[Math.floor(Math.random() * 16)];
                        el.innerText = h;
                    }
                });
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return (
        <>
            {particles.map((p, i) => (
                <div
                    key={p.id}
                    ref={el => { refs.current[i] = el; }}
                    className="absolute font-mono text-[10px] text-cyan-500/40 animate-pulse"
                    style={{
                        top: `${p.top}%`,
                        left: `${p.left}%`,
                        animationDelay: `${p.delay}s`,
                        opacity: 0.6,
                        willChange: 'opacity' // Hint to browser for composition optimization
                    }}
                >
                    0x00000000
                </div>
            ))}
        </>
    );
}
