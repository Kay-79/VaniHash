const MIST_PER_SUI = 1_000_000_000;

export function mistToSui(mist: number | string): string {
    return (Number(mist) / MIST_PER_SUI).toFixed(2);
}

export function suiToMist(sui: number | string): number {
    return Math.floor(Number(sui) * MIST_PER_SUI);
}

export function shortenAddress(address: string, start = 6, end = 4): string {
    if (!address) return '';
    return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function truncatePattern(pattern: string, maxLength = 20): string {
    if (pattern.length <= maxLength) return pattern;
    return `${pattern.slice(0, maxLength)}...`;
}
