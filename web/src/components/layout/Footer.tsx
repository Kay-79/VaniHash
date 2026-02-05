'use client';

import Link from 'next/link';

export function Footer() {
    return (
        <footer className="w-full border-t border-white/5 bg-[#020617] relative z-10">
            <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center text-gray-600 text-sm">
                <p>&copy; 2026 VaniHash Protocol.</p>
                <div className="flex gap-6 mt-4 md:mt-0">
                    <Link href="#" className="hover:text-cyan-400 transition-colors">Privacy</Link>
                    <Link href="#" className="hover:text-cyan-400 transition-colors">Terms</Link>
                    <Link href="#" className="hover:text-cyan-400 transition-colors">Twitter</Link>
                </div>
            </div>
        </footer>
    );
}
