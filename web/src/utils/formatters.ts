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

export function formatStruct(type: string): string {
    if (!type) return '';
    return type
        .replace(/0x0+([1-9a-fA-F][0-9a-fA-F]*)/g, '0x$1') // 0x0...02 -> 0x2
        .replace(/00+([1-9a-fA-F][0-9a-fA-F]*)/g, '0x$1'); // 00...02 -> 0x2
}
