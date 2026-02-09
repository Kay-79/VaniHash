import { ConnectModal, useCurrentAccount, useDisconnectWallet, useResolveSuiNSName } from '@mysten/dapp-kit';
import { Button } from '@/components/ui/Button';
import { shortenAddress } from '@/utils/formatters';
import { LogOut, Wallet } from 'lucide-react';
import { useState } from 'react';

export function WalletConnect() {
    const account = useCurrentAccount();
    const { mutate: disconnect } = useDisconnectWallet();
    const { data: suiNS } = useResolveSuiNSName(account?.address);

    // Simple dropdown state
    const [isOpen, setIsOpen] = useState(false);

    // Close dropdown when clicking outside (simple implementation)
    // In a real app with more time, we'd use a proper popover library or a click-outside hook
    // For now, we'll just use a simple toggle and maybe a backdrop if needed, or just rely on the toggle.
    // Actually, a click outside listener is better.

    // Let's stick to a simple toggle for this iteration as requested "drop some options"
    // To make it robust without adding files, I'll add a simple backdrop div when open.

    if (!account) {
        return (
            <ConnectModal
                trigger={
                    <Button variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium">
                        <Wallet className="w-4 h-4 mr-2" />
                        Connect Wallet
                    </Button>
                }
            />
        );
    }

    const displayName = suiNS || shortenAddress(account.address, 4, 4);

    return (
        <div className="relative">
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <Button
                variant="default"
                onClick={() => setIsOpen(!isOpen)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium relative z-50 data-[state=open]:bg-yellow-600"
                data-state={isOpen ? 'open' : 'closed'}
            >
                <span className="w-2 h-2 rounded-full bg-black/50 mr-2" />
                {displayName}
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md bg-gray-950 border border-gray-800 shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-3 py-2 border-b border-gray-900 mb-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Connected Account</p>
                        <p className="text-sm font-medium text-gray-300 truncate font-mono mt-1">{shortenAddress(account.address, 4, 4)}</p>
                    </div>

                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(account.address);
                            setIsOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-900 transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                        Copy Address
                    </button>

                    <button
                        onClick={() => {
                            disconnect();
                            setIsOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors flex items-center gap-2"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Disconnect
                    </button>
                </div>
            )}
        </div>
    );
}
