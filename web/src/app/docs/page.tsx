'use client';

import { FloatingHeader } from "@/components/layout/FloatingHeader";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Cpu, Globe, Shield, Terminal, Zap, Info, HelpCircle, ArrowRight, BookOpen, Layers, Hammer, Coins } from "lucide-react";
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState('intro');
    const observer = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        // Options for the observer
        const options = {
            root: null, // viewport
            rootMargin: '-20% 0px -70% 0px', // Active when element is near the top
            threshold: 0
        };

        observer.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, options);

        // Sections to observe
        const sections = ['intro', 'how-it-works', 'mining', 'marketplace', 'tokenomics', 'faq'];
        
        sections.forEach((id) => {
            const element = document.getElementById(id);
            if (element && observer.current) {
                observer.current.observe(element);
            }
        });

        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-cyan-500/30 font-sans">
            <FloatingHeader />

            <div className="relative">
                {/* Background Noise/Gradient */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0 mix-blend-overlay" />
                <div className="fixed top-0 left-0 right-0 h-[500px] bg-cyan-500/5 blur-[120px] pointer-events-none z-0" />

                <main className="container mx-auto px-6 py-12 max-w-7xl relative z-10">

                    {/* Page Header */}
                    <div className="text-center mb-16 space-y-4">
                        <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/5 px-3 py-1 mb-4">
                            Documentation
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4">
                            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">VaniHash</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            The comprehensive guide to the first Universal Vanity Mining Protocol on Sui.
                            Mine, Trade, and Verify customized On-Chain IDs.
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Sidebar Navigation */}
                        <aside className="lg:w-64 flex-shrink-0 hidden lg:block">
                            <div className="sticky top-28 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Contents</h3>
                                <nav className="space-y-1">
                                    {[
                                        { id: 'intro', label: 'Introduction', icon: Info },
                                        { id: 'how-it-works', label: 'How It Works', icon: Layers },
                                        { id: 'mining', label: 'Mining Guide', icon: Hammer },
                                        { id: 'marketplace', label: 'Marketplace', icon: Globe },
                                        { id: 'tokenomics', label: 'Rewards & Tasks', icon: Coins },
                                        { id: 'faq', label: 'FAQ', icon: HelpCircle },
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                setActiveSection(item.id);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === item.id
                                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            {item.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </aside>

                        {/* Main Content Area */}
                        <div className="flex-1 space-y-20">

                            {/* Introduction */}
                            <section id="intro" className="scroll-mt-32">
                                <Card className="bg-white/[0.02] border-white/10 backdrop-blur-sm">
                                    <CardHeader>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400"><BookOpen className="h-6 w-6" /></div>
                                            <CardTitle className="text-2xl">What is VaniHash?</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6 text-gray-300 leading-relaxed">
                                        <p>
                                            VaniHash is a decentralized protocol on the Sui network that allows users to mine customized Object IDs (addresses) for any digital asset.
                                            Just like "vanity plates" for cars, VaniHash lets you generate unique, recognizable, and rare addresses for your Sui Objects, Packages, and Accounts.
                                        </p>
                                        <div className="grid md:grid-cols-2 gap-4 mt-6">
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                                <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Cpu className="h-4 w-4 text-purple-400" /> Proof of Work</h4>
                                                <p className="text-sm">Uses genuine computational work (hashing) to discover rare IDs, ensuring fairness and value.</p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                                <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Globe className="h-4 w-4 text-blue-400" /> Universal Support</h4>
                                                <p className="text-sm">Mine IDs for anything: Coins, NFTs, Smart Contract Packages, or Kiosk items.</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </section>

                            {/* How It Works */}
                            <section id="how-it-works" className="scroll-mt-32">
                                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                                    <Layers className="h-8 w-8 text-cyan-400" />
                                    How It Works
                                </h2>
                                <div className="space-y-6 text-gray-300">
                                    <p>
                                        On Sui, everything is an object, and every object has a unique ID (UID). These IDs are typically random 32-byte hex strings (e.g., 0x4a2...).
                                    </p>
                                    <p>
                                        VaniHash utilizes a technique called <strong>Salted Hashing</strong>. By repeatedly modifying a "salt" value during object creation, miners can search for a hash that matches a desired pattern (e.g., starting with <code>0x0000...</code> or <code>0xdeadbeef...</code>).
                                    </p>
                                    <Card className="bg-black/40 border-white/10">
                                        <CardContent className="pt-6">
                                            <ol className="relative border-l border-gray-800 ml-4 space-y-8">
                                                <li className="mb-4 ml-6">
                                                    <span className="absolute flex items-center justify-center w-8 h-8 bg-cyan-900 rounded-full -left-4 ring-4 ring-black">
                                                        <span className="text-cyan-400 font-bold">1</span>
                                                    </span>
                                                    <h3 className="flex items-center mb-1 text-lg font-semibold text-white">Select Target</h3>
                                                    <p className="mb-4 text-base font-normal text-gray-400">Choose what you want to mine: a new Package, a Coin, or a generic Object.</p>
                                                </li>
                                                <li className="mb-4 ml-6">
                                                    <span className="absolute flex items-center justify-center w-8 h-8 bg-cyan-900 rounded-full -left-4 ring-4 ring-black">
                                                        <span className="text-cyan-400 font-bold">2</span>
                                                    </span>
                                                    <h3 className="flex items-center mb-1 text-lg font-semibold text-white">Mine (Search)</h3>
                                                    <p className="mb-4 text-base font-normal text-gray-400">Your device calculates millions of hashes per second to find a salt that produces your desired prefix.</p>
                                                </li>
                                                <li className="ml-6">
                                                    <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-900 rounded-full -left-4 ring-4 ring-black">
                                                        <span className="text-blue-400 font-bold">3</span>
                                                    </span>
                                                    <h3 className="flex items-center mb-1 text-lg font-semibold text-white">Claim & Verify</h3>
                                                    <p className="text-base font-normal text-gray-400">Submit the proof to the blockchain. The Smart Contract verifies the work and mints the object with the rare ID.</p>
                                                </li>
                                            </ol>
                                        </CardContent>
                                    </Card>
                                </div>
                            </section>

                            {/* Mining Guide */}
                            <section id="mining" className="scroll-mt-32">
                                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                                    <Hammer className="h-8 w-8 text-yellow-500" />
                                    Mining Guide
                                </h2>

                                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl mb-6 text-yellow-200 text-sm flex gap-3 items-start">
                                    <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <strong>Prerequisites:</strong>
                                        <ul className="list-disc pl-4 mt-1 space-y-1 text-yellow-100/80">
                                            <li><span className="font-semibold text-white">Rust & Cargo</span> installed.</li>
                                            <li><span className="font-semibold text-white">OpenCL Drivers</span> installed (for GPU acceleration).</li>
                                        </ul>
                                    </div>
                                </div>

                                <Tabs defaultValue="gui" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 mb-6">
                                        <TabsTrigger value="gui">GUI Mode (Visual)</TabsTrigger>
                                        <TabsTrigger value="cli">CLI Mode (Terminal)</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="gui" className="space-y-4">
                                        <Card className="bg-white/[0.02] border-white/10">
                                            <CardContent className="pt-6 space-y-6">
                                                <div>
                                                    <h3 className="text-lg font-bold text-white mb-2">1. Start the Mining Server</h3>
                                                    <p className="text-gray-400 mb-3">The user interface needs a local server to handle the heavy computational work (hashing).</p>
                                                    <div className="bg-black/50 rounded-lg p-4 font-mono text-sm border border-gray-800">
                                                        <p className="text-green-400">git clone https://github.com/Kay-79/sui-id-miner.git</p>
                                                        <p className="text-green-400">cd sui-id-miner/cli</p>
                                                        <p className="text-gray-500 my-2"># Start server with GPU support</p>
                                                        <p className="text-green-400">cargo run --release --features gpu -- --server</p>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h3 className="text-lg font-bold text-white mb-2">2. Connect the UI</h3>
                                                    <p className="text-gray-400 mb-3">
                                                        Once the server is running on <code className="bg-white/10 px-1 rounded text-cyan-400">localhost:5173</code>, you can use the hosted Interface.
                                                    </p>
                                                    <div className="flex flex-col sm:flex-row gap-4">
                                                        <Link href="https://sui-id-miner.vercel.app/" target="_blank">
                                                            <Button className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold">
                                                                Open Web Interface <ArrowRight className="ml-2 h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <div className="text-sm text-gray-500 flex items-center">
                                                            (Or run the `app` folder locally with `npm run dev`)
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                                    <h4 className="font-bold text-white mb-2">How to use:</h4>
                                                    <ol className="list-decimal pl-4 space-y-1 text-gray-400 text-sm">
                                                        <li>Click <strong>Connect</strong> in the top right of the UI.</li>
                                                        <li>Select <strong>Mode</strong> (Package, Gas, etc.).</li>
                                                        <li>Fill in your configuration (Sender, Desired Prefix).</li>
                                                        <li>Click <strong>Start Mining</strong>.</li>
                                                    </ol>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="cli" className="space-y-4">
                                        <Card className="bg-white/[0.02] border-white/10">
                                            <CardContent className="pt-6 space-y-6">
                                                <p className="text-gray-300">
                                                    Run the miner directly from your terminal. Only effective if you have a GPU setup.
                                                </p>

                                                <div>
                                                    <h4 className="font-bold text-cyan-400 mb-2 font-mono text-sm">Mining a Package ID (e.g. 0xcafe...)</h4>
                                                    <div className="bg-black/50 rounded-lg p-4 font-mono text-sm border border-gray-800 overflow-x-auto">
                                                        <p className="text-gray-500 mb-1"># Prepare your Move package first</p>
                                                        <p className="text-white mb-2">sui move build</p>
                                                        <p className="text-gray-500 mb-1"># Run the miner</p>
                                                        <p className="text-green-400">
                                                            cargo run --release --features gpu -- package \<br />
                                                            &nbsp;&nbsp;--prefix cafe \<br />
                                                            &nbsp;&nbsp;--module ./build/MyPackage/bytecode_modules \<br />
                                                            &nbsp;&nbsp;--sender 0xYourAddress \<br />
                                                            &nbsp;&nbsp;--gas-object 0xGasCoinId \<br />
                                                            &nbsp;&nbsp;--gpu
                                                        </p>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="font-bold text-cyan-400 mb-2 font-mono text-sm">Mining Gas Coin IDs</h4>
                                                    <div className="bg-black/50 rounded-lg p-4 font-mono text-sm border border-gray-800 overflow-x-auto">
                                                        <p className="text-gray-500 mb-1"># Split a coin into vanity coins</p>
                                                        <p className="text-green-400">
                                                            cargo run --release --features gpu -- gas \<br />
                                                            &nbsp;&nbsp;--prefix abcd \<br />
                                                            &nbsp;&nbsp;--split-amounts 1000000000 \<br />
                                                            &nbsp;&nbsp;--sender 0xYourAddress \<br />
                                                            &nbsp;&nbsp;--gas-object 0xGasCoinId \<br />
                                                            &nbsp;&nbsp;--gpu
                                                        </p>
                                                    </div>
                                                </div>

                                                <Link href="https://github.com/Kay-79/sui-id-miner/blob/main/GUIDE.md" target="_blank">
                                                    <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 text-white hover:text-white">
                                                        View Full CLI Documentation
                                                    </Button>
                                                </Link>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </section>

                            {/* Marketplace */}
                            <section id="marketplace" className="scroll-mt-32">
                                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                                    <Globe className="h-8 w-8 text-blue-500" />
                                    Marketplace
                                </h2>
                                <p className="text-gray-300 mb-6">
                                    Rare IDs are valuable digital assets. The VaniHash Marketplace is a trustless, non-custodial platform to trade these assets.
                                </p>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <Card className="bg-white/[0.02] border-white/10 hover:border-cyan-500/30 transition-all">
                                        <CardHeader>
                                            <CardTitle className="text-lg text-white">Listings</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-gray-400 text-sm">
                                                Sellers can list their mined objects for sale in SUI. Listings are secured by Sui Kiosk, ensuring asset safety.
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-white/[0.02] border-white/10 hover:border-cyan-500/30 transition-all">
                                        <CardHeader>
                                            <CardTitle className="text-lg text-white">Bounties</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-gray-400 text-sm">
                                                Buyers can create "Tasks" (Bounties) requesting specific ID patterns. Miners can fulfill these request to earn the reward automatically.
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-white/[0.02] border-white/10 hover:border-cyan-500/30 transition-all">
                                        <CardHeader>
                                            <CardTitle className="text-lg text-white">Trustless</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-gray-400 text-sm">
                                                All trades are atomic. You either get the item or keep your money. No middlemen.
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </section>

                            {/* Rewards & Tasks */}
                            <section id="tokenomics" className="scroll-mt-32">
                                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                                    <Coins className="h-8 w-8 text-yellow-400" />
                                    Rewards & Tasks
                                </h2>
                                <Card className="bg-white/[0.02] border-white/10">
                                    <CardContent className="pt-6 space-y-6">
                                        <p className="text-gray-300">
                                            VaniHash empowers a decentralized economy where miners are rewarded for finding rare IDs requested by the community.
                                        </p>
                                        
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                                                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                                    <Shield className="h-5 w-5 text-green-400" />
                                                    For Buyers (Creators)
                                                </h3>
                                                <ul className="space-y-2 text-sm text-gray-400">
                                                    <li>• Request specific vanity patterns (e.g., <code>0x0000...</code>).</li>
                                                    <li>• Set a bounty reward in SUI.</li>
                                                    <li>• Smart contact holds funds securely until the task is solved.</li>
                                                </ul>
                                            </div>

                                            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                                                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                                    <Hammer className="h-5 w-5 text-yellow-500" />
                                                    For Miners (Workers)
                                                </h3>
                                                <ul className="space-y-2 text-sm text-gray-400">
                                                    <li>• Browse active tasks on the dashboard.</li>
                                                    <li>• Run the miner to find the matching salt.</li>
                                                    <li>• Submit proof to claim the bounty instantly.</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-blue-200 text-sm">
                                            <strong>Fair Distribution:</strong> No pre-mine, no ICO. All rewards come directly from peer-to-peer marketplace activity.
                                        </div>
                                    </CardContent>
                                </Card>
                            </section>

                            {/* FAQ */}
                            <section id="faq" className="scroll-mt-32">
                                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                                    <HelpCircle className="h-8 w-8 text-purple-400" />
                                    FAQ
                                </h2>
                                <div className="space-y-4">
                                    {[
                                        { q: "Is it safe?", a: "Yes. VaniHash is a non-custodial protocol. We never touch your private keys. All logic is verified on-chain." },
                                        { q: "What is a 'Zero' address?", a: "Addresses starting with many zeros (e.g. 0x0000...) are considered rare and prestigious, similar to low-digit license plates." },
                                        { q: "Does mining cost gas?", a: "Hashing is done off-chain (locally). You only pay gas fees when you submit a successful find to claim it." },
                                        { q: "Can I mine for existing coins?", a: "You cannot change the ID of an existing object. You can only mine IDs for new objects at the moment of creation/wrapping." },
                                    ].map((faq, i) => (
                                        <Card key={i} className="bg-white/[0.02] border-white/10">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base text-white">{faq.q}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-gray-400 text-sm">{faq.a}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </section>

                            <div className="pt-20 border-t border-white/10 text-center">
                                <h3 className="text-xl font-bold text-white mb-6">Ready to start?</h3>
                                <Link href="/tasks">
                                    <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-none rounded-full px-8 text-lg font-bold shadow-lg shadow-cyan-500/20">
                                        Launch App
                                    </Button>
                                </Link>
                            </div>



                    </div>
                    </div>
                </main>
            </div>
            
            <Footer />
        </div>
    );
}
